import "server-only";

export const sampleCategories = [
  { name: "ÁO", slug: "ao", children: [{ name: "Áo thun", slug: "ao-thun" }, { name: "Áo sơ mi", slug: "ao-so-mi" }, { name: "Áo polo", slug: "ao-polo" }, { name: "Áo khoác / Hoodie", slug: "ao-khoac" }] },
  { name: "QUẦN & VÁY", slug: "quan-vay", children: [{ name: "Quần dài", slug: "quan-dai" }, { name: "Quần short", slug: "quan-short" }, { name: "Chân váy", slug: "chan-vay" }] },
  { name: "PHỤ KIỆN", slug: "phu-kien", children: [{ name: "Túi", slug: "tui" }, { name: "Mũ", slug: "mu" }] },
];

const categories = ["ao-thun", "ao-so-mi", "ao-polo", "ao-khoac", "quan-dai", "quan-short", "chan-vay", "ao-thun", "ao-so-mi", "ao-polo", "quan-dai", "quan-short"];
const names = ["Áo thun mẫu 01", "Áo sơ mi mẫu 02", "Áo polo mẫu 03", "Áo khoác mẫu 04", "Quần dài mẫu 05", "Quần short mẫu 06", "Chân váy mẫu 07", "Áo thun mẫu 08", "Áo sơ mi mẫu 09", "Áo polo mẫu 10", "Quần dài mẫu 11", "Quần short mẫu 12"];
const prices = [129000, 199000, 229000, 399000, 299000, 179000, 189000, 149000, 219000, 239000, 329000, 169000];
const colors = [
  { name: "Đen", code: "den", hex: "#111111" }, { name: "Trắng", code: "trang", hex: "#FFFFFF" },
  { name: "Be", code: "be", hex: "#D8C8B8" }, { name: "Xám", code: "xam", hex: "#808080" },
];

export const sampleProducts = names.map((name, index) => ({
  name, code: `SAMPLE${String(index + 1).padStart(2, "0")}`, slug: `san-pham-mau-${String(index + 1).padStart(2, "0")}`,
  categorySlug: categories[index], price: prices[index], compareAtPrice: index < 3 ? prices[index] + 50000 : null,
  isBestSeller: index < 4, isNew: index >= 4 && index < 8,
  colors: colors.slice(0, (index % 4) + 1), sizes: ["S", "M", "L", "XL"].slice(0, (index % 3) + 2),
  stock: index === 11 ? 0 : index === 9 ? 1 : index === 10 ? 3 : 20,
}));
