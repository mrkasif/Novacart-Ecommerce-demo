import { reorder } from "./orderService.js";
import { getOrders } from "./orderService.js";
import { formatCurrency, setupUiEnhancements, showToast, updateCartBadge } from "./ui.js";

function statusClass(status) {
  const map = {
    Processing: "status-processing",
    Shipped: "status-shipped",
    Delivered: "status-delivered",
    Cancelled: "status-cancelled"
  };
  return map[status] || "status-processing";
}

function timeline(status) {
  const steps = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const index = Math.max(0, steps.findIndex((step) => step === status));
  return steps
    .map((step, stepIndex) => `<span class="${stepIndex <= index ? "active" : ""}">${step}</span>`)
    .join("");
}

function renderOrder(order) {
  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h3>${order.orderId}</h3>
          <p class="state">${new Date(order.createdAt).toDateString()}</p>
        </div>
        <span class="status ${statusClass(order.status)}">${order.status}</span>
      </div>
      <div class="thumb-strip">${order.items.map((item) => `<img src="${item.image}" alt="${item.name}">`).join("")}</div>
      <p class="state">Total: <strong>${formatCurrency(order.total)}</strong></p>
      <button class="btn btn-ghost" data-toggle="${order.orderId}" type="button">View Details</button>
      <button class="btn btn-primary" data-reorder="${order.orderId}" type="button">Reorder</button>
      <div class="order-details" id="details-${order.orderId}">
        <ul>
          ${order.items.map((item) => `<li>${item.name} x ${item.quantity}</li>`).join("")}
        </ul>
        <p>Shipping: ${order.shipping.address}</p>
        <div class="timeline">${timeline(order.status)}</div>
      </div>
    </article>
  `;
}

function initOrdersPage() {
  updateCartBadge();
  const orders = getOrders();
  const root = document.querySelector("#orders-list");

  if (!orders.length) {
    root.innerHTML = `<article class="empty-cart"><h3>No orders yet</h3></article>`;
    setupUiEnhancements();
    return;
  }

  root.innerHTML = orders.map(renderOrder).join("");
  root.querySelectorAll("[data-toggle]").forEach((button) => {
    button.onclick = () => {
      document.querySelector(`#details-${button.dataset.toggle}`).classList.toggle("open");
    };
  });

  root.querySelectorAll("[data-reorder]").forEach((button) => {
    button.onclick = () => {
      const order = orders.find((entry) => entry.orderId === button.dataset.reorder);
      reorder(order);
      updateCartBadge();
      showToast("Items added to cart", "success");
    };
  });

  setupUiEnhancements();
}

initOrdersPage();
