/**
 * Payment route'ları
 * /api/payments prefix'i ile kullanılır
 */

import { Router } from "express";
import express from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  createCheckoutHandler,
  createPortalHandler,
  getSubscriptionHandler,
  stripeWebhookHandler,
} from "./payment.controller";

export const paymentsRouter = Router();

// Webhook — raw body gerektirir, JSON parse edilmemiş olmalı
// Bu yüzden express.json() middleware'inden ÖNCE tanımlanır
paymentsRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

// Diğer route'lar auth gerektirir
paymentsRouter.use(requireAuth);

paymentsRouter.post("/checkout", createCheckoutHandler);
paymentsRouter.post("/portal", createPortalHandler);
paymentsRouter.get("/subscription", getSubscriptionHandler);
