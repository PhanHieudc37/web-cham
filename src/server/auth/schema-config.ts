import "server-only";

import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

// Shared by the schema generator and seed; HTTP authentication comes in Phase 3.
export const authOptions = {
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  plugins: [admin()],
} satisfies Parameters<typeof betterAuth>[0];

export const auth = betterAuth(authOptions);
