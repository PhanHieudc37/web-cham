import { products, productImage, type Product, type Color } from "./catalog.js";
import { element, openDialog } from "./dialogs.js";

type CartLine = { product: Product; color: Color; size: string };
const lines: CartLine[] = [];

export function renderCart() {
  const badge = element<HTMLElement>("#cart-count");
  badge.textContent = String(lines.length);
  badge.hidden = lines.length === 0;
  element("#cart-title-count").textContent = `(${lines.length})`;
  element("#cart-content").innerHTML = lines.length ? lines.map((line, index) => `<article class="cart-line"><a href="#product/${line.product.id}" data-cart-product><img src="${productImage(line.product, line.color)}" width="100" height="100" alt="${line.product.name}"></a><div><a href="#product/${line.product.id}" data-cart-product>${line.product.name}</a><p>${line.color.name} / ${line.size}</p><span>${line.product.priceLabel} <small>giá minh họa</small></span><button class="remove-line" data-remove="${index}" aria-label="Xóa ${line.product.name} khỏi giỏ mẫu">Xóa</button></div></article>`).join("") : '<div class="empty-state"><span class="empty-symbol">⌑</span><h3>Giỏ mẫu của bạn đang trống</h3><p>Một bản phối mới đang chờ bạn.<br>Hãy thử thêm một sản phẩm yêu thích.</p><button class="underlined-link" id="empty-continue">KHÁM PHÁ SẢN PHẨM ↗</button></div>';
  element("#cart-content").querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((button) => button.addEventListener("click", () => {
    lines.splice(Number(button.dataset.remove), 1);
    renderCart();
    element<HTMLElement>("#status").textContent = "Đã xóa sản phẩm khỏi giỏ mẫu";
    element<HTMLElement>("#cart-dialog [data-close]").focus();
  }));
  element("#cart-content").querySelectorAll<HTMLAnchorElement>("[data-cart-product]").forEach((link) => link.addEventListener("click", () => element<HTMLDialogElement>("#cart-dialog").close()));
  document.querySelector("#empty-continue")?.addEventListener("click", continueShopping);
}

function continueShopping() {
  element<HTMLDialogElement>("#cart-dialog").close();
  if (!lines.length) location.hash = "shop";
}

export function addToCart(product: Product, color: Color, size: string) {
  if (!products.includes(product) || !product.colors.includes(color) || !product.sizes.includes(size) || product.soldOut) return;
  if (!lines.some((line) => line.product.id === product.id && line.color.code === color.code && line.size === size)) lines.push({ product, color, size });
  renderCart();
  openDialog("cart-dialog");
  element("#status").textContent = `${product.name}, ${color.name}, size ${size} đã được thêm vào giỏ mẫu`;
}

export function setupCart() {
  renderCart();
  element("#cart-button").addEventListener("click", () => openDialog("cart-dialog"));
  element("#continue-shopping").addEventListener("click", continueShopping);
}
