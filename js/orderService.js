import { addToCart } from "./cartService.js";

const ORDER_KEY = "ecommerce_orders_v1";

function readOrders() {
  const raw = localStorage.getItem(ORDER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  return orders;
}

export function getOrders() {
  return readOrders();
}

export function saveOrder(order) {
  const orders = readOrders();
  const next = [
    {
      ...order,
      createdAt: order.createdAt || new Date().toISOString()
    },
    ...orders
  ];
  return writeOrders(next);
}

export function reorder(order) {
  order.items.forEach((item) => addToCart(item.id, item.quantity));
}
