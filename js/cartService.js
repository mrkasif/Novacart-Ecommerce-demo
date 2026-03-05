import { getProducts } from "./productService.js";

const CART_KEY = "ecommerce_cart_v1";

function normalizeCartShape(value) {
  if (!value || typeof value !== "object") return { items: [] };
  const sourceItems = Array.isArray(value.items) ? value.items : [];

  const seen = new Map();
  sourceItems.forEach((item) => {
    if (!item || typeof item.id !== "string") return;
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    seen.set(item.id, (seen.get(item.id) || 0) + Math.floor(quantity));
  });

  return {
    items: [...seen.entries()].map(([id, quantity]) => ({ id, quantity }))
  };
}

function migrateLegacyCart(value) {
  if (!Array.isArray(value)) return normalizeCartShape(value);

  const seen = new Map();
  value.forEach((item) => {
    if (!item || typeof item.productId !== "string") return;
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    seen.set(item.productId, (seen.get(item.productId) || 0) + Math.floor(quantity));
  });

  return {
    items: [...seen.entries()].map(([id, quantity]) => ({ id, quantity }))
  };
}

function readCartState() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return { items: [] };

  try {
    const parsed = JSON.parse(raw);
    return migrateLegacyCart(parsed);
  } catch {
    return { items: [] };
  }
}

function writeCartState(cartState) {
  const normalized = normalizeCartShape(cartState);
  localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: normalized }));
  return normalized;
}

function persistCartState(cartState) {
  const normalized = normalizeCartShape(cartState);
  localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getCart() {
  const cart = readCartState();
  return persistCartState(cart);
}

export function getCartItems() {
  return getCart().items;
}

export function addToCart(id, quantity = 1) {
  const nextQty = Math.max(1, Math.floor(Number(quantity) || 1));
  const cart = readCartState();
  const existing = cart.items.find((item) => item.id === id);

  if (existing) {
    existing.quantity += nextQty;
  } else {
    cart.items.push({ id, quantity: nextQty });
  }

  return writeCartState(cart);
}

export function removeFromCart(id) {
  const cart = readCartState();
  const next = {
    items: cart.items.filter((item) => item.id !== id)
  };
  return writeCartState(next);
}

export function updateCartQuantity(id, quantity) {
  const nextQty = Math.floor(Number(quantity) || 0);
  if (nextQty <= 0) return removeFromCart(id);

  const cart = readCartState();
  const target = cart.items.find((item) => item.id === id);
  if (!target) return writeCartState(cart);

  target.quantity = Math.max(1, nextQty);
  return writeCartState(cart);
}

export function clearCart() {
  return writeCartState({ items: [] });
}

export async function getDetailedCartItems() {
  const [cart, products] = [getCart(), await getProducts()];
  return cart.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) return null;
      return {
        id: item.id,
        quantity: item.quantity,
        product,
        lineTotal: product.price * item.quantity
      };
    })
    .filter(Boolean);
}

export function calculateCartTotals(detailedItems, couponCode = "") {
  const subtotal = detailedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 1999 || subtotal === 0 ? 0 : 99;
  const discount = couponCode.trim().toUpperCase() === "NOVA10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount + shipping);
  const quantity = detailedItems.reduce((sum, item) => sum + item.quantity, 0);

  return { quantity, subtotal, shipping, discount, total };
}
