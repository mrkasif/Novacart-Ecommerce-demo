import { getProducts } from "./productService.js";
import { attachProductCardInteractions, formatCurrency, renderProductCard, setupUiEnhancements, updateCartBadge } from "./ui.js";

let allProducts = [];
let debounceTimer = null;

const state = {
  categories: ["all"],
  minPrice: 0,
  maxPrice: 10000,
  rating: 0,
  stockOnly: false,
  search: "",
  sort: "default",
  topCategory: "all"
};

function isNewArrival(product) {
  return ["p007", "p008", "p006"].includes(product.id);
}

function isSale(product) {
  return (product.discountPercent || ((product.price % 7) + 18)) >= 24;
}

function byTopCategory(product) {
  if (state.topCategory === "all") return true;
  if (state.topCategory === "new") return isNewArrival(product);
  if (state.topCategory === "sale") return isSale(product);
  return product.category === state.topCategory;
}

function getFilteredProducts() {
  let list = allProducts.filter((product) => {
    const categoryMatch = state.categories.includes("all") || state.categories.includes(product.category);
    const priceMatch = product.price >= state.minPrice && product.price <= state.maxPrice;
    const ratingMatch = Number(product.rating) >= state.rating;
    const stockMatch = !state.stockOnly || product.stock > 0;
    const searchMatch =
      !state.search || `${product.name} ${product.description}`.toLowerCase().includes(state.search.toLowerCase());
    return categoryMatch && priceMatch && ratingMatch && stockMatch && searchMatch && byTopCategory(product);
  });

  if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (state.sort === "rating-desc") list = [...list].sort((a, b) => b.rating - a.rating);
  if (state.sort === "newest") list = [...list].sort((a, b) => (isNewArrival(b) ? 1 : 0) - (isNewArrival(a) ? 1 : 0));
  return list;
}

function updateResultsCount(filtered) {
  document.querySelector("#results-count").textContent = `Showing ${filtered.length} of ${allProducts.length} products`;
}

function renderGrid(products) {
  const grid = document.querySelector("#products-grid");
  if (!products.length) {
    grid.innerHTML = `<p class="state">No products found for selected filters.</p>`;
    updateResultsCount(products);
    return;
  }
  grid.innerHTML = products.map(renderProductCard).join("");
  attachProductCardInteractions(grid);
  updateResultsCount(products);
}

function applyFilters() {
  renderGrid(getFilteredProducts());
  updateFilterCount();
}

function updateFilterCount() {
  let count = 0;
  if (!state.categories.includes("all")) count += 1;
  if (state.minPrice > 0 || state.maxPrice < 10000) count += 1;
  if (state.rating > 0) count += 1;
  if (state.stockOnly) count += 1;
  if (state.topCategory !== "all") count += 1;
  document.querySelector("#active-filter-count").textContent = count;
}

function bindTopCategories() {
  document.querySelectorAll("[data-top-category]").forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll("[data-top-category]").forEach((entry) => entry.classList.remove("active"));
      button.classList.add("active");
      state.topCategory = button.dataset.topCategory;
      applyFilters();
    };
  });
}

function bindSidebar() {
  const sidebar = document.querySelector("#shop-sidebar");
  document.querySelector("#open-filters").onclick = () => sidebar.classList.add("open");
  document.querySelector("#close-filters").onclick = () => sidebar.classList.remove("open");

  const categories = ["all", "clothing", "footwear", "accessories", "electronics"];
  const pillsRoot = document.querySelector("#category-pills");
  pillsRoot.innerHTML = categories
    .map(
      (category) =>
        `<button class="pill-btn ${category === "all" ? "active" : ""}" data-category-pill="${category}" type="button">${
          category === "all" ? "All" : category[0].toUpperCase() + category.slice(1)
        }</button>`
    )
    .join("");

  pillsRoot.querySelectorAll("[data-category-pill]").forEach((button) => {
    button.onclick = () => {
      const value = button.dataset.categoryPill;
      if (value === "all") {
        state.categories = ["all"];
        pillsRoot.querySelectorAll(".pill-btn").forEach((entry) => entry.classList.remove("active"));
        button.classList.add("active");
      } else {
        pillsRoot.querySelector("[data-category-pill='all']").classList.remove("active");
        button.classList.toggle("active");
        const selected = [...pillsRoot.querySelectorAll(".pill-btn.active")]
          .map((entry) => entry.dataset.categoryPill)
          .filter((entry) => entry !== "all");
        state.categories = selected.length ? selected : ["all"];
        if (state.categories.includes("all")) {
          pillsRoot.querySelector("[data-category-pill='all']").classList.add("active");
        }
      }
      applyFilters();
    };
  });

  const minSlider = document.querySelector("#price-min");
  const maxSlider = document.querySelector("#price-max");
  const minLabel = document.querySelector("#price-min-label");
  const maxLabel = document.querySelector("#price-max-label");
  const rangeWrap = document.querySelector("#range-wrap");
  const updateRangeFill = () => {
    const low = (state.minPrice / 10000) * 100;
    const high = (state.maxPrice / 10000) * 100;
    rangeWrap.style.setProperty("--from", `${low}%`);
    rangeWrap.style.setProperty("--to", `${high}%`);
  };
  const syncPrice = () => {
    state.minPrice = Math.min(Number(minSlider.value), Number(maxSlider.value));
    state.maxPrice = Math.max(Number(minSlider.value), Number(maxSlider.value));
    minLabel.textContent = state.minPrice.toLocaleString("en-IN");
    maxLabel.textContent = state.maxPrice.toLocaleString("en-IN");
    updateRangeFill();
    applyFilters();
  };
  minSlider.oninput = syncPrice;
  maxSlider.oninput = syncPrice;
  updateRangeFill();

  document.querySelectorAll(".rating-btn").forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll(".rating-btn").forEach((entry) => entry.classList.remove("active"));
      button.classList.add("active");
      state.rating = Number(button.dataset.rating);
      applyFilters();
    };
  });

  const stockToggle = document.querySelector("#stock-toggle");
  stockToggle.onclick = () => {
    state.stockOnly = !state.stockOnly;
    stockToggle.classList.toggle("on", state.stockOnly);
    applyFilters();
  };

  document.querySelector("#clear-filters").onclick = () => {
    state.categories = ["all"];
    state.minPrice = 0;
    state.maxPrice = 10000;
    state.rating = 0;
    state.stockOnly = false;
    state.search = "";
    state.sort = "default";
    state.topCategory = "all";

    document.querySelector("#search").value = "";
    document.querySelector("#sort").value = "default";
    minSlider.value = "0";
    maxSlider.value = "10000";
    minLabel.textContent = "0";
    maxLabel.textContent = "10,000";
    updateRangeFill();
    pillsRoot.querySelectorAll(".pill-btn").forEach((entry) => {
      entry.classList.toggle("active", entry.dataset.categoryPill === "all");
    });
    document.querySelectorAll(".rating-btn").forEach((entry) => {
      entry.classList.toggle("active", entry.dataset.rating === "0");
    });
    stockToggle.classList.remove("on");
    document.querySelectorAll("[data-top-category]").forEach((entry) => {
      entry.classList.toggle("active", entry.dataset.topCategory === "all");
    });
    renderSuggestions("");
    applyFilters();
  };
}

function renderSuggestions(query) {
  const root = document.querySelector("#search-suggestions");
  if (!query.trim()) {
    root.innerHTML = "";
    return;
  }

  const matches = allProducts
    .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);

  if (!matches.length) {
    root.innerHTML = `<p class="state search-empty">No matches found</p>`;
    return;
  }

  root.innerHTML = matches
    .map(
      (product) => `
        <a href="./product.html?id=${product.id}" class="suggestion-item">
          <img src="${product.image}" alt="${product.name}">
          <span>${product.name}</span>
          <strong>${formatCurrency(product.price)}</strong>
        </a>
      `
    )
    .join("");
}

function bindSearch() {
  const input = document.querySelector("#search");
  input.oninput = () => {
    state.search = input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderSuggestions(input.value);
      applyFilters();
    }, 300);
  };

  input.onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = document.querySelector(".suggestion-item");
      if (first) window.location.href = first.getAttribute("href");
    }
  };
}

function bindSort() {
  document.querySelector("#sort").onchange = (event) => {
    state.sort = event.target.value;
    applyFilters();
  };
}

async function initProductsPage() {
  updateCartBadge();
  window.addEventListener("cart:updated", updateCartBadge);
  window.addEventListener("wishlist:updated", applyFilters);
  allProducts = await getProducts();

  bindTopCategories();
  bindSidebar();
  bindSearch();
  bindSort();
  applyFilters();
  await setupUiEnhancements();
}

initProductsPage().catch((error) => {
  document.querySelector("#products-grid").innerHTML = `<p class="state">${error.message}</p>`;
});
