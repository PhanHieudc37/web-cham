import type { ProductInput } from "@/lib/validation/product";
export type CategoryAdminDTO = { id: string; parentId: string | null; name: string; slug: string; imageUrl: string | null; imagePath: string | null; isActive: boolean; sortOrder: number; productCount: number };
export type ProductListItemDTO = { id: string; name: string; code: string; slug: string; imageUrl: string | null; categoryName: string; price: number; compareAtPrice: number | null; stock: number; status: "draft" | "active" | "archived"; updatedAt: string };
export type ProductOptionsDTO = { categories: CategoryAdminDTO[]; collections: { id: string; title: string }[]; sizeCharts: { id: string; name: string; columns: string[]; rows: string[][]; note: string | null }[] };
export type ProductEditorDTO = { values: ProductInput; publishedAt: string | null };
export type StockMovementDTO = { id: string; variant: string; delta: number; stockAfter: number; reason: string; orderId: string | null; orderCode: string | null; actorName: string | null; note: string | null; createdAt: string };
