import { addToCart, getCartItems } from "./cartService.js";
import { getProducts } from "./productService.js";
import { getWishlist, toggleWishlist } from "./wishlistService.js";

export function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function discountFor(product) {
  const base = Number(product.price) || 0;
  const pct = product.discountPercent || ((base % 7) + 18);
  const original = Math.round(base / (1 - pct / 100));
  return { pct, original, sale: base };
}

function starMarkup(value) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(value) || 0)));
  return `${"&#9733;".repeat(rating)}${"&#9734;".repeat(5 - rating)}`;
}

export function showToast(message, type = "info") {
  let root = document.querySelector("#toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 260);
  }, 3000);
}

export function updateCartBadge() {
  const count = getCartItems().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    const prev = Number(badge.textContent || "0");
    badge.textContent = count;
    if (prev !== count) {
      badge.classList.remove("badge-pop");
      requestAnimationFrame(() => badge.classList.add("badge-pop"));
    }
  });
}

function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll("[data-wishlist-count]").forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count ? "inline-grid" : "none";
  });
}

function renderWishlistCards(products, root) {
  const items = getWishlist();
  if (!items.length) {
    root.innerHTML = `
      <article class="wishlist-empty">
        <div class="wishlist-empty-icon">&#9825;</div>
        <h3>Your wishlist is empty</h3>
        <p>Heart a product to save it here</p>
        <a class="btn btn-primary" href="./products.html">Shop Now</a>
      </article>
    `;
    return;
  }

  root.innerHTML = items
    .map((product) => {
      const pricing = discountFor(product);
      return `
        <article class="wishlist-card">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h4>${product.name}</h4>
            <p class="price-pop">${formatCurrency(pricing.sale)}</p>
          </div>
          <button class="btn btn-primary" data-wish-move="${product.id}" type="button">Add to Cart</button>
          <button class="btn btn-ghost remove-btn" data-wish-remove="${product.id}" type="button">Remove</button>
        </article>
      `;
    })
    .join("");

  root.querySelectorAll("[data-wish-move]").forEach((button) => {
    button.onclick = () => {
      addToCart(button.dataset.wishMove, 1);
      updateCartBadge();
      showToast("Item added to cart", "success");
    };
  });

  root.querySelectorAll("[data-wish-remove]").forEach((button) => {
    button.onclick = () => {
      toggleWishlist({ id: button.dataset.wishRemove });
      renderWishlistCards(products, root);
      showToast("Removed from wishlist", "error");
    };
  });
}

async function ensureHeaderEnhancements() {
  const header = document.querySelector(".site-header");
  const nav = header?.querySelector("nav");
  if (!header || !nav || header.dataset.enhanced === "1") return;
  header.dataset.enhanced = "1";

  const mobileBtn = document.createElement("button");
  mobileBtn.className = "mobile-menu-btn";
  mobileBtn.type = "button";
  mobileBtn.textContent = "\u2630";
  header.insertBefore(mobileBtn, nav);

  const links = [...nav.querySelectorAll("a")];
  const cartLink = links.find((link) => link.getAttribute("href")?.includes("cart.html"));

  const searchLink = document.createElement("a");
  searchLink.href = "./products.html";
  searchLink.className = "nav-icon";
  searchLink.textContent = "\ud83d\udd0d";
  if (cartLink) nav.insertBefore(searchLink, cartLink);
  else nav.appendChild(searchLink);

  const wishButton = document.createElement("button");
  wishButton.className = "nav-wishlist-btn";
  wishButton.type = "button";
  wishButton.innerHTML = `&#10084;<span class="badge badge-red" data-wishlist-count>0</span>`;
  if (cartLink) nav.insertBefore(wishButton, cartLink);
  else nav.appendChild(wishButton);

  const profileWrap = document.createElement("div");
  profileWrap.className = "profile-menu";
  profileWrap.innerHTML = `
    <button class="profile-btn" type="button" aria-label="Account Menu">&#128100;</button>
    <div class="profile-dropdown">
      <a href="./profile.html">My Profile</a>
      <a href="./orders.html">My Orders</a>
      <a href="./wishlist.html">Wishlist</a>
      <a href="./profile.html#addresses">Addresses</a>
      <a href="#" data-action="logout">Log Out</a>
    </div>
  `;
  nav.appendChild(profileWrap);

  const drawer = document.createElement("aside");
  drawer.className = "mobile-drawer";
  drawer.innerHTML = `
    <a href="./index.html">Home</a>
    <a href="./products.html">Shop</a>
    <a href="./wishlist.html">Wishlist</a>
    <a href="./orders.html">Orders</a>
    <a href="./profile.html">Profile</a>
    <a href="./cart.html">Cart</a>
  `;
  document.body.appendChild(drawer);

  const wishlistDrawer = document.createElement("aside");
  wishlistDrawer.className = "wishlist-drawer";
  wishlistDrawer.innerHTML = `
    <div class="wishlist-drawer-head">
      <h3>Wishlist</h3>
      <button type="button" class="btn btn-ghost" id="close-wishlist-drawer">Close</button>
    </div>
    <div id="wishlist-drawer-items" class="wishlist-drawer-items"></div>
  `;
  document.body.appendChild(wishlistDrawer);

  const products = await getProducts();
  const renderDrawer = () => {
    updateWishlistBadge();
    renderWishlistCards(products, wishlistDrawer.querySelector("#wishlist-drawer-items"));
  };

  mobileBtn.onclick = () => drawer.classList.toggle("open");
  wishButton.onclick = () => {
    wishlistDrawer.classList.toggle("open");
    renderDrawer();
  };
  wishlistDrawer.querySelector("#close-wishlist-drawer").onclick = () => wishlistDrawer.classList.remove("open");

  profileWrap.querySelector(".profile-btn").onclick = () => profileWrap.classList.toggle("open");
  profileWrap.querySelector("[data-action='logout']").onclick = (event) => {
    event.preventDefault();
    showToast("Logged out (simulated)", "warn");
  };
  document.addEventListener("click", (event) => {
    if (!profileWrap.contains(event.target)) profileWrap.classList.remove("open");
  });

  window.addEventListener("wishlist:updated", () => {
    updateWishlistBadge();
    if (wishlistDrawer.classList.contains("open")) renderDrawer();
  });

  updateWishlistBadge();
}

export function renderProductCard(product) {
  const wished = getWishlist().some((item) => item.id === product.id);
  const pricing = discountFor(product);
  return `
    <article class="product-card reveal">
      <span class="discount-badge">-${pricing.pct}%</span>
      <button
        class="wish-btn ${wished ? "active" : ""}"
        data-action="wishlist"
        data-id="${product.id}"
        data-name="${product.name}"
        data-image="${product.image}"
        data-price="${product.price}"
        data-currency="${product.currency || "INR"}"
        data-category="${product.category || ""}"
        type="button"
      >${wished ? "&#10084;" : "&#9825;"}</button>
      <a href="./product.html?id=${encodeURIComponent(product.id)}" class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      </a>
      <div class="product-content">
        <span class="chip">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="rating-row">
          <span class="stars">${starMarkup(product.rating)}</span>
          <span>${product.reviewCount}</span>
        </p>
        <div class="price-stack">
          <span class="old-price">${formatCurrency(pricing.original, product.currency)}</span>
          <strong class="price-pop">${formatCurrency(pricing.sale, product.currency)}</strong>
          <span class="discount-text">${pricing.pct}% OFF</span>
        </div>
        <button class="btn btn-primary add-cart-inline" data-action="add" data-id="${product.id}" type="button">Add to Cart</button>
      </div>
    </article>
  `;
}

export function attachProductCardInteractions(scope = document) {
  scope.querySelectorAll("[data-action='add']").forEach((button) => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.onclick = () => {
      addToCart(button.dataset.id, 1);
      updateCartBadge();
      showToast("Item added to cart", "success");
    };
  });

  scope.querySelectorAll("[data-action='wishlist']").forEach((button) => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.onclick = () => {
      const next = toggleWishlist({
        id: button.dataset.id,
        name: button.dataset.name,
        image: button.dataset.image,
        price: Number(button.dataset.price),
        currency: button.dataset.currency,
        category: button.dataset.category
      });
      const active = next.some((item) => item.id === button.dataset.id);
      button.classList.toggle("active", active);
      button.innerHTML = active ? "&#10084;" : "&#9825;";
      showToast(active ? "Saved to wishlist" : "Removed from wishlist", "warn");
      updateWishlistBadge();
    };
  });
}

export async function setupUiEnhancements() {
  document.documentElement.style.scrollBehavior = "smooth";
  await ensureHeaderEnhancements();

  document.querySelectorAll(".btn").forEach((btn) => {
    if (btn.dataset.rippleReady === "1") return;
    btn.dataset.rippleReady = "1";
    btn.addEventListener("click", (event) => {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const rect = btn.getBoundingClientRect();
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    if (el.dataset.revealReady === "1") return;
    el.dataset.revealReady = "1";
    observer.observe(el);
  });

  document.querySelectorAll(".faq-item button").forEach((btn) => {
    if (btn.dataset.faqReady === "1") return;
    btn.dataset.faqReady = "1";
    btn.onclick = () => btn.closest(".faq-item").classList.toggle("open");
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = `${new Date().getFullYear()}`;
}
