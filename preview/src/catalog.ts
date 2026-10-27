export type Color = { name: string; code: string; hex: string };
export type Product = {
  id: string; name: string; category: "tops" | "bottoms" | "accessories";
  price: number; priceLabel: string; previousLabel?: string; sale?: string;
  colors: Color[]; sizes: string[]; isNew?: boolean; isBest?: boolean; soldOut?: boolean;
  shape: "tee" | "shirt" | "hoodie" | "pants" | "shorts" | "bag";
};

const black = { name: "Đen", code: "black", hex: "#242424" };
const cream = { name: "Kem", code: "cream", hex: "#E4DECF" };
const gray = { name: "Xám", code: "gray", hex: "#91918D" };
const brown = { name: "Nâu", code: "brown", hex: "#82725E" };
const sage = { name: "Xanh rêu", code: "sage", hex: "#7C8573" };

// Illustrative catalog only. No orders, payments, inventory, or quotes use this data.
export const products: Product[] = [
  { id: "boxy-tee", name: "Áo thun Boxy Essential", category: "tops", price: 159000, priceLabel: "159.000₫", previousLabel: "199.000₫", sale: "−20%", colors: [black, cream, sage], sizes: ["S", "M", "L", "XL"], isBest: true, shape: "tee" },
  { id: "relaxed-shirt", name: "Sơ mi Relaxed Fit", category: "tops", price: 279000, priceLabel: "279.000₫", colors: [cream, gray], sizes: ["S", "M", "L", "XL"], isNew: true, isBest: true, shape: "shirt" },
  { id: "wide-pants", name: "Quần Wide Leg Everyday", category: "bottoms", price: 329000, priceLabel: "329.000₫", colors: [brown, black, cream], sizes: ["S", "M", "L"], isBest: true, shape: "pants" },
  { id: "daily-tote", name: "Túi Daily Tote", category: "accessories", price: 129000, priceLabel: "129.000₫", colors: [cream, black], sizes: ["Freesize"], isBest: true, shape: "bag" },
  { id: "studio-hoodie", name: "Hoodie Studio Oversize", category: "tops", price: 399000, priceLabel: "399.000₫", colors: [gray, brown, black], sizes: ["S", "M", "L", "XL"], isNew: true, shape: "hoodie" },
  { id: "weekend-shorts", name: "Quần short Weekend", category: "bottoms", price: 189000, priceLabel: "189.000₫", previousLabel: "229.000₫", sale: "−17%", colors: [sage, black, cream], sizes: ["S", "M", "L"], isNew: true, shape: "shorts" },
  { id: "clean-tee", name: "Áo thun Clean Line", category: "tops", price: 149000, priceLabel: "149.000₫", colors: [cream, gray], sizes: ["S", "M", "L", "XL"], isNew: true, shape: "tee" },
  { id: "straight-pants", name: "Quần Straight Form", category: "bottoms", price: 299000, priceLabel: "299.000₫", colors: [black, brown], sizes: ["S", "M", "L", "XL"], shape: "pants" },
  { id: "earth-shirt", name: "Sơ mi Earth Tone", category: "tops", price: 259000, priceLabel: "259.000₫", previousLabel: "319.000₫", sale: "−19%", colors: [sage, brown], sizes: ["S", "M", "L"], shape: "shirt" },
  { id: "city-tote", name: "Túi City Carry", category: "accessories", price: 159000, priceLabel: "159.000₫", colors: [black, brown], sizes: ["Freesize"], shape: "bag" },
  { id: "soft-hoodie", name: "Hoodie Soft Silhouette", category: "tops", price: 359000, priceLabel: "359.000₫", colors: [cream, sage], sizes: ["S", "M", "L", "XL"], shape: "hoodie" },
  { id: "offday-shorts", name: "Quần short Off Day", category: "bottoms", price: 179000, priceLabel: "179.000₫", colors: [gray, black], sizes: ["S", "M", "L"], soldOut: true, shape: "shorts" },
];

export const categoryLabels: Record<string, string> = { all: "Tất cả sản phẩm", tops: "Áo", bottoms: "Quần", accessories: "Phụ kiện", new: "New Arrival", best: "Best Seller", sale: "Sale" };
export const productImage = (product: Product, color = product.colors[0]) => `./assets/${product.id}-${color.code}.svg`;
export const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
