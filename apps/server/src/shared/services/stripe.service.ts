/**
 * Stripe Service
 * Stripe API ile iletişim — ödeme oturumu, portal, müşteri yönetimi
 */

import Stripe from "stripe";
import { env } from "../../config/env";
import { logger } from "../../shared/utils/logger";

// ──────── Stripe Instance ────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripeInstance: any = null;

function getStripe(): any {
  if (!stripeInstance) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY tanımlı değil");
    }
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

/**
 * Stripe yapılandırılmış mı kontrol eder
 */
export function isStripeConfigured(): boolean {
  return !!(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID);
}

// ──────── Müşteri Yönetimi ────────

/**
 * Stripe müşterisi oluştur veya mevcut olanı döndür
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string> {
  const stripe = getStripe();

  if (existingCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(existingCustomerId);
      if (!existing.deleted) return existingCustomerId;
    } catch {
      // Müşteri bulunamadı, yeni oluştur
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  logger.info({ userId, customerId: customer.id }, "Stripe müşteri oluşturuldu");
  return customer.id;
}

// ──────── Checkout Session ────────

/**
 * Premium abonelik için Stripe Checkout Session oluşturur
 */
export async function createCheckoutSession(
  customerId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) {
    throw new Error("Checkout session URL oluşturulamadı");
  }

  logger.info({ userId, sessionId: session.id }, "Checkout session oluşturuldu");
  return session.url;
}

// ──────── Customer Portal ────────

/**
 * Müşteri portalı oturumu oluşturur (abonelik yönetimi, iptal, kart güncelleme)
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ──────── Webhook İmza Doğrulama ────────

/**
 * Stripe webhook imzasını doğrular
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): unknown {
  const stripe = getStripe();

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET tanımlı değil");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
