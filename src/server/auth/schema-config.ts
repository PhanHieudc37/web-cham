import "server-only";

import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { defaultRoles, userAc } from "better-auth/plugins/admin/access";

// Shared schema/seed options; runtime authentication is configured in auth.ts.
export const authOptions = {
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  plugins: [admin({ roles: { ...defaultRoles, staff: userAc } })],
} satisfies Parameters<typeof betterAuth>[0];

export const auth = betterAuth(authOptions);
