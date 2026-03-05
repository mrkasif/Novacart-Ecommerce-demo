const DATA_SOURCE = "../data/products.json";
const USE_API = false;
const API_BASE = "/api/products";

let productCache = null;

async function fetchProductsFromJson() {
  const response = await fetch(DATA_SOURCE);
  if (!response.ok) {
    throw new Error(`Failed to load products.json (${response.status})`);
  }
  return response.json();
}

async function fetchProductsFromApi() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to load API products (${response.status})`);
  }
  return response.json();
}

async function loadProducts() {
  if (productCache) return productCache;
  const products = USE_API ? await fetchProductsFromApi() : await fetchProductsFromJson();
  productCache = products;
  return productCache;
}

export async function getProducts() {
  return loadProducts();
}

export async function getProductById(id) {
  const products = await loadProducts();
  return products.find((product) => product.id === id) || null;
}

export async function getCategories() {
  const products = await loadProducts();
  return [...new Set(products.map((product) => product.category))];
}

export async function getFeaturedProducts(limit = 4) {
  const products = await loadProducts();
  return products.slice(0, limit);
}

export function filterAndSortProducts(products, { search = "", category = "all", sort = "default" }) {
  const normalizedSearch = search.trim().toLowerCase();

  let next = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const haystack = `${product.name} ${product.description}`.toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  if (sort === "price-asc") {
    next = [...next].sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    next = [...next].sort((a, b) => b.price - a.price);
  }

  return next;
}
