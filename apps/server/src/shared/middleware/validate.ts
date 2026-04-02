/**
 * Zod şema validasyon middleware'i
 * Request body, query ve params'ı otomatik olarak validate eder
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@notcast/shared";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const error = result.error as ZodError;
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Validasyon hatası",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      });
      return;
    }

    req[target] = result.data;
    next();
  };
}
