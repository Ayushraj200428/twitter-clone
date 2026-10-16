import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import { ENV } from "./env.js";

// initialize Arcjet with security rules
export const aj = arcjet({
  key: ENV.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    // shield protects your app from common attacks e.g. SQL injection, XSS, CSRF attacks
    shield({ mode: "LIVE" }),

    // bot detection - DRY_RUN so mobile app clients are not incorrectly blocked
    // React Native / Expo axios requests don't have browser User-Agents
    detectBot({
      mode: "DRY_RUN",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),

    // rate limiting with token bucket algorithm
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // tokens added per interval
      interval: 10,  // interval in seconds
      capacity: 15,  // maximum tokens in bucket
    }),
  ],
});