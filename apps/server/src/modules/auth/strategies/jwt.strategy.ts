/**
 * Passport JWT Strategy
 * Authorization header'dan Bearer token doğrulaması
 */

import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "../../../config/env";
import { findUserById } from "../../../modules/users/user.repository";

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
    ignoreExpiration: false,
  },
  async (payload: JwtPayload, done) => {
    try {
      const user = await findUserById(payload.sub);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
);
