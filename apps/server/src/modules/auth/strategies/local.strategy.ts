/**
 * Passport Local Strategy
 * E-posta + şifre doğrulaması
 */

import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { findUserByEmail } from "../../../modules/users/user.repository";
import { AppError } from "../../../shared/utils/errors";

export const localStrategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      const user = await findUserByEmail(email);

      if (!user) {
        return done(null, false, { message: "E-posta veya şifre hatalı" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return done(null, false, { message: "E-posta veya şifre hatalı" });
      }

      return done(null, user);
    } catch (err) {
      return done(AppError.internal());
    }
  }
);
