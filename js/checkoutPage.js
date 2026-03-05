import { calculateCartTotals, clearCart, getDetailedCartItems } from "./cartService.js";
import { saveOrder } from "./orderService.js";
import { placeOrder } from "./checkoutService.js";
import { formatCurrency, setupUiEnhancements, showToast, updateCartBadge } from "./ui.js";

function getShippingData(form) {
  const formData = new FormData(form);
  return {
    name: formData.get("name")?.toString() || "",
    address: formData.get("address")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    email: formData.get("email")?.toString() || ""
  };
}

function renderSummary(items, totals) {
  const list = document.querySelector("#order-items");
  list.innerHTML = items
    .map(
      (item) => `
        <li>
          <span>${item.product.name} x ${item.quantity}</span>
          <strong>${formatCurrency(item.lineTotal)}</strong>
        </li>
      `
    )
    .join("");

  document.querySelector("#summary-total").textContent = formatCurrency(totals.total);
}

function renderErrors(errors) {
  const errorsEl = document.querySelector("#checkout-errors");
  const messages = Object.values(errors);
  if (messages.length === 0) {
    errorsEl.innerHTML = "";
    return;
  }
  errorsEl.innerHTML = messages.map((msg) => `<p>${msg}</p>`).join("");
}

async function initCheckoutPage() {
  updateCartBadge();
  const form = document.querySelector("#checkout-form");
  const successEl = document.querySelector("#checkout-success");

  const items = await getDetailedCartItems();
  const totals = calculateCartTotals(items);
  renderSummary(items, totals);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    successEl.textContent = "";

    const shipping = getShippingData(form);
    const paymentMethod = new FormData(form).get("paymentMethod")?.toString() || "";

    const result = await placeOrder({
      shipping,
      paymentMethod,
      items,
      totals
    });

    if (!result.success) {
      renderErrors(result.errors);
      showToast("Checkout failed", "error");
      return;
    }

    renderErrors({});
    saveOrder({
      orderId: result.orderId,
      status: "Processing",
      shipping,
      paymentMethod,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        name: item.product.name,
        image: item.product.image,
        price: item.product.price
      })),
      total: totals.total
    });
    clearCart();
    updateCartBadge();
    form.reset();
    successEl.textContent = `${result.message} Order ID: ${result.orderId}`;
    showToast("Order placed successfully", "success");
  });
}

setupUiEnhancements();
initCheckoutPage();
