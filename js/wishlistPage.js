import { addToCart } from "./cartService.js";
import { formatCurrency, setupUiEnhancements, showToast, updateCartBadge } from "./ui.js";
import { getWishlist, toggleWishlist } from "./wishlistService.js";

function emojiForCategory(category) {
  if (category === "clothing") return "&#128085;";
  if (category === "footwear") return "&#128095;";
  if (category === "electronics") return "&#127911;";
  if (category === "accessories") return "&#8986;";
  return "&#128717;";
}

function emptyState() {
  return `
    <article class="wishlist-empty">
      <div class="wishlist-empty-icon">&#9825;</div>
      <h3>Your wishlist is empty</h3>
      <p>Heart a product to save it here</p>
      <a class="btn btn-primary" href="./products.html">Shop Now</a>
    </article>
  `;
}

function renderWishlistItems() {
  const items = getWishlist();
  const root = document.querySelector("#wishlist-grid");

  if (!items.length) {
    root.innerHTML = emptyState();
    return;
  }

  root.innerHTML = items
    .map(
      (product) => `
        <article class="wishlist-card">
          <div class="wishlist-emoji">${emojiForCategory(product.category)}</div>
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${formatCurrency(product.price, product.currency || "INR")}</p>
          </div>
          <button class="btn btn-primary" data-add="${product.id}" type="button">Add to Cart</button>
          <button class="btn btn-ghost remove-btn" data-remove="${product.id}" type="button">Remove</button>
        </article>
      `
    )
    .join("");

  root.querySelectorAll("[data-add]").forEach((button) => {
    button.onclick = () => {
      addToCart(button.dataset.add, 1);
      updateCartBadge();
      showToast("Item added to cart", "success");
    };
  });

  root.querySelectorAll("[data-remove]").forEach((button) => {
    button.onclick = () => {
      const product = items.find((item) => item.id === button.dataset.remove);
      if (!product) return;
      toggleWishlist(product);
      renderWishlistItems();
      showToast("Removed from wishlist", "error");
    };
  });
}

async function initWishlistPage() {
  updateCartBadge();
  renderWishlistItems();
  window.addEventListener("wishlist:updated", renderWishlistItems);
  await setupUiEnhancements();
}

initWishlistPage();
