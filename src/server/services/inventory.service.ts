import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import type { inventoryInputSchema } from "@/lib/validation/order-admin";
import { getDatabase, type Database } from "@/server/db/client";
import { productVariants, stockMovements } from "@/server/db/schema";
import { AppError } from "@/server/errors";

export async function adjustInventory(input: z.output<typeof inventoryInputSchema>, actorId: string, db: Database = getDatabase()) {
  const delta = input.newStock - input.expectedStock;
  return db.transaction(async (transaction) => {
    const [variant] = await transaction.update(productVariants).set({ stock: sql`${productVariants.stock} + ${delta}`, updatedAt: new Date() })
      .where(and(eq(productVariants.id, input.variantId), sql`${productVariants.stock} + ${delta} >= 0`)).returning({ id: productVariants.id, stock: productVariants.stock });
    if (!variant) throw new AppError("CONFLICT", "Tồn kho đã thay đổi hoặc không đủ để điều chỉnh, vui lòng tải lại.");
    await transaction.insert(stockMovements).values({ variantId: variant.id, delta, stockAfter: variant.stock, reason: "manual", actorId, note: input.note || null });
    return { variantId: variant.id, stock: variant.stock };
  });
}
