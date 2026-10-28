import type { AdminRole } from "@/lib/auth";
export type AdminUserDTO = { id: string; name: string; email: string; role: AdminRole; banned: boolean; createdAt: string };
