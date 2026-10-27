import { categoryLabels, productImage, type Product } from "./catalog.js";
import { addToCart } from "./cart.js";
import { element, openDialog } from "./dialogs.js";
import { icon } from "./icons.js";

export function showProduct(product: Product) {
  let selectedColor = product.colors[0];
  let selectedSize = "";
  element("#product-content").innerHTML = `<div class="product-detail-image"><img id="detail-image" src="${productImage(product)}" alt="Minh họa ${product.name} màu ${selectedColor.name}" width="800" height="800"><span class="illustration-label">MINH HỌA THIẾT KẾ / ${product.colors.length} MÀU</span></div><div class="product-detail-copy"><span class="eyebrow">${categoryLabels[product.category]} / THE EVERYDAY EDIT</span><h2 id="product-title">${product.name}</h2><p class="detail-code">MẪU / ${product.id.toUpperCase()}</p><div class="detail-price ${product.sale ? "sale-price" : ""}">${product.priceLabel} ${product.previousLabel ? `<del>${product.previousLabel}</del>` : ""}</div><p class="sample-note">Giá và hình ảnh minh họa, chưa mở bán.</p><fieldset class="color-field"><legend>Màu sắc: <strong id="selected-color">${selectedColor.name}</strong></legend><div class="detail-colors">${product.colors.map((color, index) => `<button class="color-swatch ${index === 0 ? "selected" : ""}" type="button" style="--swatch:${color.hex}" data-color="${color.code}" aria-label="Màu ${color.name}" aria-pressed="${index === 0}"></button>`).join("")}</div></fieldset><fieldset class="size-field"><legend>Kích thước <span>Chọn để thử giao diện</span></legend><div class="size-options">${product.sizes.map((size) => `<button type="button" data-size="${size}" aria-pressed="false" ${product.soldOut ? "disabled" : ""}>${size}</button>`).join("")}</div></fieldset><p id="selection-error" class="selection-error" role="alert"></p><button class="button primary add-button" id="add-sample" ${product.soldOut ? "disabled" : ""}>${product.soldOut ? "MẪU ĐANG HẾT HÀNG" : `THÊM VÀO GIỎ MẪU ${icon("plus")}`}</button><p class="sample-guarantee">${icon("check")} Chỉ thử giao diện, không phát sinh đơn hàng.</p><details open><summary>MÔ TẢ BẢN MẪU <span>+</span></summary><p>Mẫu minh họa phom dáng ${product.shape === "bag" ? "túi" : "trang phục"} trong tông màu trung tính. Tên, ảnh và thông số sẽ được thay bằng sản phẩm thật của shop.</p></details><details><summary>BẢNG SIZE <span>+</span></summary><p>Chưa có số đo thật. Chủ shop sẽ cập nhật trước khi mở bán.</p></details><details><summary>CHÍNH SÁCH MUA HÀNG <span>+</span></summary><p>Bản xem thử không nhận đơn, thanh toán hoặc thông tin khách hàng. Chính sách bán hàng sẽ được công bố khi shop xác nhận.</p></details></div>`;
  element("#product-content").querySelectorAll<HTMLButtonElement>("[data-color]").forEach((button) => button.addEventListener("click", () => {
    const color = product.colors.find((item) => item.code === button.dataset.color);
    if (!color) return;
    selectedColor = color;
    const image = element<HTMLImageElement>("#detail-image");
    image.src = productImage(product, color);
    image.alt = `Minh họa ${product.name} màu ${color.name}`;
    element("#selected-color").textContent = color.name;
    element("#product-content").querySelectorAll<HTMLButtonElement>("[data-color]").forEach((other) => {
      other.classList.toggle("selected", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
  }));
  element("#product-content").querySelectorAll<HTMLButtonElement>("[data-size]").forEach((button) => button.addEventListener("click", () => {
    selectedSize = button.dataset.size ?? "";
    element("#selection-error").textContent = "";
    element("#product-content").querySelectorAll<HTMLButtonElement>("[data-size]").forEach((other) => {
      other.classList.toggle("selected", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
  }));
  element("#add-sample").addEventListener("click", () => {
    if (!selectedSize) {
      element("#selection-error").textContent = "Vui lòng chọn kích thước để thêm vào giỏ mẫu.";
      element<HTMLButtonElement>("[data-size]").focus();
      return;
    }
    addToCart(product, selectedColor, selectedSize);
  });
  openDialog("product-dialog");
}
