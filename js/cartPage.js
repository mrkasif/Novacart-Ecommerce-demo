import { calculateCartTotals, getDetailedCartItems, removeFromCart, updateCartQuantity } from "./cartService.js";
import { getProducts } from "./productService.js";
import {
  attachProductCardInteractions,
  formatCurrency,
  renderProductCard,
  setupUiEnhancements,
  showToast,
  updateCartBadge
} from "./ui.js";

let couponCode = "";

function renderTotals(totals) {
  document.querySelector("#subtotal").textContent = formatCurrency(totals.subtotal);
  document.querySelector("#shipping").textContent = formatCurrency(totals.shipping);
  document.querySelector("#discount").textContent = `- ${formatCurrency(totals.discount)}`;
  document.querySelector("#total").textContent = formatCurrency(totals.total);
}

function quantityStepper(id, quantity, max) {
  return `
    <div class="stepper">
      <button data-action="decrement" data-id="${id}" type="button">-</button>
      <input data-action="qty" data-id="${id}" class="qty-input" type="number" min="1" max="${max}" value="${quantity}">
      <button data-action="increment" data-id="${id}" type="button">+</button>
    </div>
  `;
}

function setDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  document.querySelector("#delivery-date").textContent = `Estimated delivery: ${date.toDateString()}`;
}

function bindCartActions(container) {
  container.querySelectorAll("[data-action='remove']").forEach((button) => {
    button.onclick = () => {
      removeFromCart(button.dataset.id);
      showToast("Item removed", "error");
    };
  });

  container.querySelectorAll("[data-action='qty']").forEach((input) => {
    input.onchange = () => {
      updateCartQuantity(input.dataset.id, Number(input.value || 1));
    };
  });

  container.querySelectorAll("[data-action='increment']").forEach((button) => {
    button.onclick = () => {
      const input = container.querySelector(`[data-action='qty'][data-id='${button.dataset.id}']`);
      updateCartQuantity(button.dataset.id, Math.min(Number(input.max), Number(input.value) + 1));
    };
  });

  container.querySelectorAll("[data-action='decrement']").forEach((button) => {
    button.onclick = () => {
      const input = container.querySelector(`[data-action='qty'][data-id='${button.dataset.id}']`);
      updateCartQuantity(button.dataset.id, Math.max(1, Number(input.value) - 1));
    };
  });
}

function bindCoupon(items) {
  const input = document.querySelector("#coupon-code");
  const applyButton = document.querySelector("#apply-coupon");
  const message = document.querySelector("#coupon-message");

  applyButton.onclick = () => {
    couponCode = input.value.trim();
    const totals = calculateCartTotals(items, couponCode);
    renderTotals(totals);
    const valid = couponCode.toUpperCase() === "NOVA10";
    message.className = `state ${valid ? "ok" : "error"}`;
    message.textContent = valid ? "✓ Coupon applied: 10% off." : "Invalid coupon code.";
    showToast(valid ? "Coupon applied" : "Coupon invalid", valid ? "success" : "error");
  };
}

function renderRecommendations(items, products) {
  const used = new Set(items.map((item) => item.id));
  const recommendations = products.filter((product) => !used.has(product.id)).slice(0, 4);
  const root = document.querySelector("#cart-recommendations");
  root.innerHTML = recommendations.map(renderProductCard).join("");
  attachProductCardInteractions(root);
}

async function initCartPage() {
  updateCartBadge();
  const main = document.querySelector("#cart-main");
  const container = document.querySelector("#cart-items");
  const checkoutBtn = document.querySelector("#checkout-btn");
  const estimate = document.querySelector("#shipping-estimate");
  const [items, products] = await Promise.all([getDetailedCartItems(), getProducts()]);

  if (!items.length) {
    main.classList.add("cart-empty");
    container.innerHTML = `
      <article class="empty-cart reveal">
        <img src="../public/images/empty-cart.svg" alt="Empty cart illustration">
        <h3>Your cart is empty</h3>
        <p>Add products to continue with checkout.</p>
        <a href="./products.html" class="btn btn-primary">Continue Shopping</a>
      </article>
    `;
    document.querySelector("#cart-recommendations").innerHTML = "";
    renderTotals({ subtotal: 0, shipping: 0, discount: 0, total: 0 });
    checkoutBtn.setAttribute("aria-disabled", "true");
    checkoutBtn.classList.add("btn-disabled");
    estimate.textContent = "Shipping is calculated at checkout.";
    document.querySelector("#delivery-date").textContent = "";
    setupUiEnhancements();
    return;
  }

  main.classList.remove("cart-empty");
  checkoutBtn.removeAttribute("aria-disabled");
  checkoutBtn.classList.remove("btn-disabled");
  setDeliveryDate();

  container.innerHTML = items
    .map(
      (item) => `
        <article class="cart-item reveal">
          <img src="${item.product.image}" alt="${item.product.name}" class="cart-thumb">
          <div>
            <h3>${item.product.name}</h3>
            <p class="state">Variant: Standard</p>
            <p>${formatCurrency(item.product.price)}</p>
          </div>
          ${quantityStepper(item.id, item.quantity, item.product.stock)}
          <strong class="line-total">${formatCurrency(item.lineTotal)}</strong>
          <button class="btn btn-ghost remove-btn" data-action="remove" data-id="${item.id}" type="button">Remove</button>
        </article>
      `
    )
    .join("");

  bindCartActions(container);
  const totals = calculateCartTotals(items, couponCode);
  renderTotals(totals);
  estimate.textContent =
    totals.shipping === 0 ? "You qualify for free shipping." : "Add more items for free shipping over Rs. 1,999.";
  bindCoupon(items);
  renderRecommendations(items, products);
  setupUiEnhancements();
}

document.addEventListener("DOMContentLoaded", initCartPage);
window.addEventListener("cart:updated", initCartPage);
