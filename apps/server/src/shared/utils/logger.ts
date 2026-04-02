/**
 * Pino logger instance
 * console.log yerine bu logger kullanılmalıdır
 */

import pino from "pino";

export const logger = pino({
  level: process.env["NODE_ENV"] === "production" ? "info" : "debug",
  transport:
    process.env["NODE_ENV"] !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: {
    env: process.env["NODE_ENV"],
    service: "notcast-server",
  },
});
