import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/constants";
import type { Settings } from "@/lib/validation/settings";

export type ImageDTO = { url: string; alt: string };
export type ProductCardDTO = {
  id: string; slug: string; name: string; price: number; compareAtPrice: number | null; discountPercent: number | null;
  image: ImageDTO | null; hoverImage: ImageDTO | null; colors: { name: string; hex: string }[]; isNew: boolean; isSoldOut: boolean;
};
export type ProductDetailDTO = ProductCardDTO & {
  code: string; description: string; material: string | null; fit: string | null; care: string[];
  category: { name: string; slug: string; parent: { name: string; slug: string } | null };
  images: (ImageDTO & { id: string; colorId: string | null })[];
  colorOptions: { id: string; name: string; code: string; hex: string }[]; sizes: string[];
  variants: { id: string; colorId: string; size: string; sku: string; available: boolean; maxQuantity: number; lowStockCount: number | null }[];
  sizeChart: { name: string; columns: string[]; rows: string[][]; note: string | null } | null;
  seo: { title: string; description: string };
};
export type ListingDTO = {
  title: string; description: string | null; bannerUrl: string | null;
  breadcrumb: { label: string; href: string }[]; subcategories: { name: string; slug: string }[];
  facets: { sizes: string[]; colors: { code: string; name: string; hex: string }[] };
  products: ProductCardDTO[]; total: number; page: number; totalPages: number;
};
export type CartQuoteDTO = {
  lines: { variantId: string; productId: string; slug: string; name: string; colorName: string; size: string; image: ImageDTO | null;
    unitPrice: number; compareAtPrice: number | null; requestedQuantity: number; quantity: number; maxQuantity: number; lineTotal: number;
    issue: null | "UNAVAILABLE" | "OUT_OF_STOCK" | "QUANTITY_REDUCED" }[];
  itemCount: number; subtotal: number; discountAmount: number; shippingFee: number; total: number;
  freeShip: { eligible: boolean; remainingItems: number | null; remainingAmount: number | null }; discount: null;
};
export type PublicSettingsDTO = Pick<Settings, "shop" | "social" | "announcements" | "policies" | "returnPolicySummary" | "shipping" | "legal" | "seo"> & { bankTransferEnabled: boolean };
export type OrderItemDTO = { id: string; productId: string | null; productSlug: string; productName: string; colorName: string; size: string; sku: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number };
export type OrderEventDTO = { id: string; type: string; fromStatus: OrderStatus | null; toStatus: OrderStatus | null; message: string | null; createdAt: string };
export type OrderPublicDTO = {
  code: string; createdAt: string; status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus;
  customerName: string; customerPhone: string; items: OrderItemDTO[]; total: number; carrier: string | null; trackingCode: string | null;
  cancelReason: string | null; events: OrderEventDTO[];
};
export type OrderSuccessDTO = OrderPublicDTO & { customerEmail: string | null; province: string; ward: string; addressLine: string;
  subtotal: number; discountAmount: number; shippingFee: number; bank: Settings["bank"] | null };
export type OrderAdminDetailDTO = OrderSuccessDTO & { id: string; adminNote: string | null; note: string | null; paidAt: string | null };
export type OrderAdminListItemDTO = Pick<OrderAdminDetailDTO, "id" | "code" | "createdAt" | "customerName" | "customerPhone" | "total" | "status" | "paymentMethod" | "paymentStatus"> & { itemCount: number };
