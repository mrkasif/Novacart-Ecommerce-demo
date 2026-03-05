import { getCategories, getFeaturedProducts } from "./productService.js";
import { attachProductCardInteractions, renderProductCard, setupUiEnhancements, updateCartBadge } from "./ui.js";

async function initHomePage() {
  updateCartBadge();
  window.addEventListener("cart:updated", updateCartBadge);

  const featuredEl = document.querySelector("#featured-products");
  const categoriesEl = document.querySelector("#category-preview");

  try {
    const [featured, categories] = await Promise.all([getFeaturedProducts(4), getCategories()]);
    featuredEl.innerHTML = featured.map(renderProductCard).join("");
    attachProductCardInteractions(featuredEl);
    categoriesEl.innerHTML = categories
      .map(
        (category) =>
          `<a href="./products.html?category=${encodeURIComponent(category)}" class="category-tile">${category}</a>`
      )
      .join("");
    setupUiEnhancements();
  } catch (error) {
    featuredEl.innerHTML = `<p class="state">${error.message}</p>`;
    categoriesEl.innerHTML = `<p class="state">Could not load categories.</p>`;
  }
}

setupUiEnhancements();
initHomePage();
