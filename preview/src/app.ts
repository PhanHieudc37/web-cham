import { normalize, productImage, products } from "./catalog.js";
import { setupCart } from "./cart.js";
import { closeDialogs, element, openDialog, setupDialogs } from "./dialogs.js";
import { icon } from "./icons.js";
import { showProduct } from "./product.js";
import { aboutView, homeView, listingView } from "./views.js";

let previousPage = "#home";
let lastContent = "";
function updateListingParameter(name: string, value: string) {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  if (value) params.set(name, value); else params.delete(name);
  history.replaceState(null, "", `#shop?${params}`);
  render();
}

function render() {
  const [page, search] = (location.hash.slice(1) || "home").split("?");
  const params = new URLSearchParams(search);
  const main = element<HTMLElement>("#main");
  if (page.startsWith("product/")) {
    if (!main.innerHTML) main.innerHTML = homeView();
    const product = products.find((item) => item.id === page.slice(8));
    if (product) { showProduct(product); return; }
    main.innerHTML = '<section class="about container"><h1>Không tìm thấy sản phẩm mẫu</h1><a class="button primary" href="#shop">XEM TẤT CẢ</a></section>';
  } else {
    closeDialogs();
    previousPage = location.hash || "#home";
    const content = page === "shop" ? listingView(params.get("category") ?? "all", params.get("q") ?? "", params.get("sort") ?? "featured", params.get("instock") === "1") : page === "about" ? aboutView() : homeView();
    main.innerHTML = content;
    if (lastContent !== page) window.scrollTo({ top: 0, behavior: "instant" });
    lastContent = page;
    document.querySelector("#sort")?.addEventListener("change", (event) => {
      if (event.target instanceof HTMLSelectElement) { updateListingParameter("sort", event.target.value); element<HTMLElement>("#sort").focus(); }
    });
    document.querySelector("#availability")?.addEventListener("change", (event) => {
      if (event.target instanceof HTMLInputElement) { updateListingParameter("instock", event.target.checked ? "1" : ""); element<HTMLElement>("#availability").focus(); }
    });
  }
  document.title = page === "shop" ? "Sản phẩm mẫu | Cham.stu" : page === "about" ? "Về bản xem thử | Cham.stu" : "Cham.stu — Bản xem thử giao diện";
}

function searchResults() {
  const query = element<HTMLInputElement>("#search-input").value.trim();
  const matches = query.length >= 2 ? products.filter((product) => normalize(query).split(/\s+/).every((word) => normalize(product.name).includes(word))).slice(0, 6) : [];
  element("#search-results").innerHTML = query.length < 2 ? '<p class="search-hint">Gợi ý: áo thun, sơ mi, quần, túi.<br>Nhập ít nhất 2 ký tự để tìm sản phẩm mẫu.</p>' : matches.length ? matches.map((product) => `<a class="search-item" href="#product/${product.id}"><img src="${productImage(product)}" width="64" height="64" alt=""><div><strong>${product.name}</strong><span>${product.priceLabel}</span></div><span>↗</span></a>`).join("") : '<p class="search-hint">Không tìm thấy sản phẩm phù hợp.<br>Thử từ khóa khác nhé.</p>';
}

setupDialogs();
setupCart();
for (const [selector, name] of [["#menu-button", "menu"], ["#search-button", "search"], ["#bag-icon", "bag"]]) element(selector).innerHTML = icon(name);
document.querySelectorAll<HTMLElement>("[data-close]").forEach((button) => button.innerHTML = icon("close"));
element("#year").textContent = String(new Date().getFullYear());
element("#menu-button").addEventListener("click", () => openDialog("menu-dialog"));
element("#review-button").addEventListener("click", () => openDialog("review-dialog"));
element("#search-button").addEventListener("click", () => {
  searchResults(); openDialog("search-dialog"); element<HTMLInputElement>("#search-input").focus();
});
element("#search-input").addEventListener("input", searchResults);
element("#search-input").addEventListener("keydown", (event) => {
  if (event instanceof KeyboardEvent && event.key === "Enter") {
    closeDialogs(); location.hash = `shop?q=${encodeURIComponent(element<HTMLInputElement>("#search-input").value.trim())}`;
  }
});
element<HTMLDialogElement>("#product-dialog").addEventListener("close", () => {
  if (location.hash.startsWith("#product/")) history.replaceState(null, "", previousPage);
});
element("#menu-dialog").querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDialogs));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") (document.activeElement as HTMLElement | null)?.closest(".shop-menu")?.querySelector<HTMLElement>(".shop-trigger")?.blur();
});
window.addEventListener("hashchange", render);
render();
