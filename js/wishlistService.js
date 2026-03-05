let wishlist = [];

function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;
  if (typeof product.id !== "string" || !product.id.trim()) return null;
  return {
    id: product.id,
    name: typeof product.name === "string" ? product.name : "",
    image: product.image || "",
    price: Number(product.price) || 0,
    currency: product.currency || "INR",
    category: product.category || ""
  };
}

function getStore() {
  const root = window;
  if (!root.__novacartWishlist) root.__novacartWishlist = wishlist;
  wishlist = root.__novacartWishlist;
  return wishlist;
}

function emit(next) {
  window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: next }));
}

export function getWishlist() {
  return [...getStore()];
}

export function isWishlisted(id) {
  return getStore().some((item) => item.id === id);
}

export function setWishlist(next) {
  const clean = Array.isArray(next)
    ? next.map(normalizeProduct).filter(Boolean).filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index)
    : [];
  wishlist = clean;
  window.__novacartWishlist = wishlist;
  emit(getWishlist());
  return getWishlist();
}

export function toggleWishlist(product) {
  const entry = normalizeProduct(product);
  if (!entry) return getWishlist();
  const current = getStore();
  const exists = current.some((item) => item.id === entry.id);
  if (exists) return setWishlist(current.filter((item) => item.id !== entry.id));
  if (!entry.name && !entry.image && !entry.price) return getWishlist();
  return setWishlist([...current, entry]);
}

export function clearWishlist() {
  return setWishlist([]);
}
