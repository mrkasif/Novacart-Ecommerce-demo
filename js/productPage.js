import { addToCart } from "./cartService.js";
import { getProductById, getProducts } from "./productService.js";
import { toggleWishlist } from "./wishlistService.js";
import {
  attachProductCardInteractions,
  formatCurrency,
  renderProductCard,
  setupUiEnhancements,
  showToast,
  updateCartBadge
} from "./ui.js";

function getProductId() {
  return new URLSearchParams(window.location.search).get("id");
}

function starMarkup(value) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(value) || 0)));
  return `${"&#9733;".repeat(rating)}${"&#9734;".repeat(5 - rating)}`;
}

function reviewsMarkup(product) {
  const mocks = [
    { name: "Aarav S.", date: "Mar 1, 2026", text: "Premium quality and true to size.", rating: 5 },
    { name: "Riya M.", date: "Feb 21, 2026", text: "Fast delivery and clean packaging.", rating: 4 },
    { name: "Dev P.", date: "Feb 8, 2026", text: "Great value for price.", rating: 5 }
  ];
  return mocks
    .map(
      (review) => `
        <article class="review-card">
          <h4>${review.name}</h4>
          <p class="state">${review.date}</p>
          <p class="stars">${starMarkup(review.rating)}</p>
          <p>${review.text}</p>
        </article>
      `
    )
    .join("");
}

function renderTabs(product) {
  const tabsRoot = document.querySelector("#reviews-wrap");
  tabsRoot.innerHTML = `
    <section class="section reveal">
      <div class="tab-row">
        <button class="btn btn-ghost tab-btn active" data-tab="description" type="button">Description</button>
        <button class="btn btn-ghost tab-btn" data-tab="specifications" type="button">Specifications</button>
        <button class="btn btn-ghost tab-btn" data-tab="reviews" type="button">Reviews</button>
      </div>
      <div class="tab-panel" id="tab-description">${product.description}</div>
      <div class="tab-panel hidden" id="tab-specifications">
        ${Object.entries(product.specifications || {})
          .map(([key, value]) => `<p><span>${key}</span><strong>${value}</strong></p>`)
          .join("")}
      </div>
      <div class="tab-panel hidden review-grid" id="tab-reviews">${reviewsMarkup(product)}</div>
    </section>
  `;

  tabsRoot.querySelectorAll(".tab-btn").forEach((button) => {
    button.onclick = () => {
      tabsRoot.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      tabsRoot.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
      button.classList.add("active");
      tabsRoot.querySelector(`#tab-${button.dataset.tab}`).classList.remove("hidden");
    };
  });
}

function renderProduct(product) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length > 0 ? product.gallery : [product.image];
  const root = document.querySelector("#product-detail");
  root.innerHTML = `
    <div class="detail-media">
      <img src="${gallery[0]}" alt="${product.name}" class="detail-image" id="main-image">
      <div class="thumb-row">
        ${gallery
          .map(
            (img, idx) =>
              `<button class="thumb ${idx === 0 ? "thumb-active" : ""}" data-image="${img}" type="button">
                <img src="${img}" alt="${product.name} preview ${idx + 1}">
              </button>`
          )
          .join("")}
      </div>
    </div>
    <div class="detail-content">
      <span class="chip">${product.category}</span>
      <h1>${product.name}</h1>
      <p class="rating-row"><span class="stars">${starMarkup(product.rating)}</span><span>${product.rating} (${product.reviewCount})</span></p>
      <p class="price">${formatCurrency(product.price, product.currency)}</p>
      <p class="meta-line">SKU: ${product.sku}</p>
      <p class="meta-line">${product.deliveryEstimate}</p>
      ${
        product.sizes?.length
          ? `<label class="field-label">Size
              <select id="size" class="size-select">${product.sizes
                .map((size) => `<option value="${size}">${size}</option>`)
                .join("")}</select>
            </label>`
          : ""
      }
      <label class="field-label">Quantity
        <input id="qty" type="number" min="1" max="${product.stock}" value="1" class="qty-input">
      </label>
      <div class="cta-row">
        <button id="add-to-cart" class="btn btn-primary btn-large" type="button">Add to Cart</button>
        <button id="add-to-wishlist" class="btn btn-ghost btn-large" type="button">Add to Wishlist</button>
      </div>
      <p id="feedback" class="state"></p>
    </div>
  `;

  root.querySelector("#add-to-cart").onclick = () => {
    const quantity = Math.max(1, Math.min(product.stock, Number(root.querySelector("#qty").value || 1)));
    addToCart(product.id, quantity);
    updateCartBadge();
    root.querySelector("#feedback").textContent = "Added to cart.";
    showToast("Item added to cart", "success");
  };

  root.querySelector("#add-to-wishlist").onclick = () => {
    toggleWishlist(product.id);
    showToast("Wishlist updated", "warn");
  };

  root.querySelectorAll(".thumb").forEach((thumb) => {
    thumb.onclick = () => {
      root.querySelector("#main-image").src = thumb.dataset.image;
      root.querySelectorAll(".thumb").forEach((el) => el.classList.remove("thumb-active"));
      thumb.classList.add("thumb-active");
    };
  });
}

async function renderRelated(productId, category) {
  const products = await getProducts();
  const root = document.querySelector("#related-products");
  const related = products.filter((product) => product.id !== productId && product.category === category).slice(0, 4);
  root.innerHTML = related.length ? related.map(renderProductCard).join("") : `<p class="state">No related products.</p>`;
  attachProductCardInteractions(root);
}

async function initProductPage() {
  updateCartBadge();
  window.addEventListener("cart:updated", updateCartBadge);
  const id = getProductId();
  if (!id) return;

  const product = await getProductById(id);
  if (!product) {
    document.querySelector("#product-detail").innerHTML = `<p class="state">Product not found.</p>`;
    return;
  }

  renderProduct(product);
  renderTabs(product);
  await renderRelated(product.id, product.category);
  setupUiEnhancements();
}

initProductPage().catch((error) => {
  document.querySelector("#product-detail").innerHTML = `<p class="state">${error.message}</p>`;
});
