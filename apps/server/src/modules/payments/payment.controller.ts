/**
 * Payment Controller
 * Stripe Checkout, Portal ve Webhook endpoint'leri
 */

import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  isStripeConfigured,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from "../../shared/services/stripe.service";
import { updateUser } from "../users/user.repository";
import { AppError } from "../../shared/utils/errors";
import { logger } from "../../shared/utils/logger";
import { env } from "../../config/env";

// ──────── Checkout ────────

/**
 * POST /api/payments/checkout
 * Premium abonelik için ödeme sayfası oluşturur
 */
export async function createCheckoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;

    if (!isStripeConfigured()) {
      return next(AppError.badRequest("Ödeme sistemi henüz yapılandırılmamış"));
    }

    if (user.role === "PREMIUM" || user.role === "ADMIN") {
      return next(AppError.badRequest("Zaten Premium üyesiniz"));
    }

    // Stripe customer oluştur / bul
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name,
      user.stripeCustomerId
    );

    // stripeCustomerId'yi kaydet
    if (user.stripeCustomerId !== customerId) {
      await updateUser(user.id, { stripeCustomerId: customerId });
    }

    const frontendUrl = env.FRONTEND_URL;
    const checkoutUrl = await createCheckoutSession(
      customerId,
      user.id,
      `${frontendUrl}/settings?session=success`,
      `${frontendUrl}/pricing?session=canceled`
    );

    res.json({ success: true, data: { url: checkoutUrl } });
  } catch (err) {
    next(err);
  }
}

// ──────── Portal ────────

/**
 * POST /api/payments/portal
 * Stripe Customer Portal (abonelik yönetimi) URL'si döndürür
 */
export async function createPortalHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;

    if (!user.stripeCustomerId) {
      return next(AppError.badRequest("Henüz bir aboneliğiniz yok"));
    }

    const portalUrl = await createPortalSession(
      user.stripeCustomerId,
      `${env.FRONTEND_URL}/settings`
    );

    res.json({ success: true, data: { url: portalUrl } });
  } catch (err) {
    next(err);
  }
}

// ──────── Abonelik Durumu ────────

/**
 * GET /api/payments/subscription
 * Kullanıcının aktif aboneliğini döndürür
 */
export async function getSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: {
        hasActiveSubscription: !!subscription,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── Webhook ────────

/**
 * POST /api/payments/webhook
 * Stripe webhook'ları — raw body gerektirir
 */
export async function stripeWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    res.status(400).json({ error: "Stripe signature eksik" });
    return;
  }

  let event: { type: string; id: string; data: { object: Record<string, unknown> } };
  try {
    event = constructWebhookEvent(req.body as Buffer, signature) as unknown as typeof event;
  } catch (err) {
    logger.warn({ err }, "Stripe webhook imza doğrulama hatası");
    res.status(400).json({ error: "Webhook signature geçersiz" });
    return;
  }

  logger.info({ type: event.type, id: event.id }, "Stripe webhook alındı");

  try {
    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(obj);
        break;
      case "invoice.paid":
        await handleInvoicePaid(obj);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(obj);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(obj);
        break;
      default:
        logger.debug({ type: event.type }, "İşlenmeyen webhook event tipi");
    }
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Webhook işleme hatası");
  }

  // Stripe'a her zaman 200 döndür
  res.json({ received: true });
}

// ──────── Webhook Handlers ────────

/* eslint-disable @typescript-eslint/no-explicit-any */

async function handleCheckoutCompleted(session: Record<string, any>): Promise<void> {
  const userId = session["metadata"]?.["userId"] as string | undefined;
  if (!userId) {
    logger.warn("Checkout session'da userId bulunamadı");
    return;
  }

  const subscriptionId = session["subscription"] as string;
  if (!subscriptionId) return;

  // Kullanıcıyı PREMIUM yap
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: UserRole.PREMIUM,
      monthlyCredits: 999,
      stripeCustomerId: session["customer"] as string,
    },
  });

  logger.info({ userId, subscriptionId }, "Kullanıcı PREMIUM'a yükseltildi");
}

async function handleInvoicePaid(invoice: Record<string, any>): Promise<void> {
  const customerId = invoice["customer"] as string;
  if (!customerId) return;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  const paymentIntentId = (invoice["payment_intent"] as string) ?? `inv_${invoice["id"]}`;

  await prisma.transaction.upsert({
    where: { stripePaymentId: paymentIntentId },
    update: {
      status: "succeeded",
      invoiceUrl: (invoice["hosted_invoice_url"] as string) ?? null,
    },
    create: {
      userId: user.id,
      stripePaymentId: paymentIntentId,
      amount: invoice["amount_paid"] as number,
      currency: invoice["currency"] as string,
      status: "succeeded",
      description: `Premium abonelik ödemesi`,
      invoiceUrl: (invoice["hosted_invoice_url"] as string) ?? null,
    },
  });

  // Abonelik kaydını güncelle/oluştur
  const stripeSubscriptionId = invoice["subscription"] as string;
  if (stripeSubscriptionId) {
    const lines = invoice["lines"] as { data?: Array<{ period?: { start?: number; end?: number }; price?: { id?: string }; description?: string }> } | undefined;
    const firstLine = lines?.data?.[0];
    const periodStart = firstLine?.period?.start;
    const periodEnd = firstLine?.period?.end;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId },
      update: {
        status: "ACTIVE",
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(),
      },
      create: {
        userId: user.id,
        stripeSubscriptionId,
        stripePriceId: firstLine?.price?.id ?? env.STRIPE_PRICE_ID,
        status: "ACTIVE",
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(),
      },
    });
  }

  // Kullanıcıyı PREMIUM'da tut ve kredilerini sıfırla
  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: UserRole.PREMIUM,
      monthlyCredits: 999,
      creditsUsed: 0,
      creditsResetAt: new Date(),
    },
  });

  logger.info({ userId: user.id, amount: invoice["amount_paid"] }, "Fatura ödendi, abonelik güncellendi");
}

async function handleSubscriptionUpdated(subscription: Record<string, any>): Promise<void> {
  const userId = subscription["metadata"]?.["userId"] as string | undefined;

  const statusMap: Record<string, "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE" | "TRIALING"> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    incomplete: "INCOMPLETE",
    trialing: "TRIALING",
  };

  const stripeStatus = subscription["status"] as string;
  const items = subscription["items"] as { data?: Array<{ price?: { id?: string } }> } | undefined;

  try {
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription["id"] as string },
      update: {
        status: statusMap[stripeStatus] ?? "ACTIVE",
        cancelAtPeriodEnd: subscription["cancel_at_period_end"] as boolean,
        canceledAt: subscription["canceled_at"] ? new Date((subscription["canceled_at"] as number) * 1000) : null,
        currentPeriodStart: new Date((subscription["current_period_start"] as number) * 1000),
        currentPeriodEnd: new Date((subscription["current_period_end"] as number) * 1000),
      },
      create: {
        userId: userId ?? "",
        stripeSubscriptionId: subscription["id"] as string,
        stripePriceId: items?.data?.[0]?.price?.id ?? "",
        status: statusMap[stripeStatus] ?? "ACTIVE",
        cancelAtPeriodEnd: subscription["cancel_at_period_end"] as boolean,
        currentPeriodStart: new Date((subscription["current_period_start"] as number) * 1000),
        currentPeriodEnd: new Date((subscription["current_period_end"] as number) * 1000),
      },
    });
  } catch (err) {
    logger.warn({ err, subscriptionId: subscription["id"] }, "Abonelik DB güncelleme hatası");
  }

  if (stripeStatus === "past_due" && userId) {
    logger.warn({ userId }, "Abonelik ödeme gecikti (past_due)");
  }
}

async function handleSubscriptionDeleted(subscription: Record<string, any>): Promise<void> {
  const customerId = subscription["customer"] as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription["id"] as string },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  } catch {
    // Kayıt yoksa sorun değil
  }

  // Kullanıcıyı FREE'ye düşür
  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: UserRole.FREE,
      monthlyCredits: 3,
      creditsUsed: 0,
    },
  });

  logger.info({ userId: user.id }, "Abonelik iptal edildi, kullanıcı FREE'ye düşürüldü");
}
