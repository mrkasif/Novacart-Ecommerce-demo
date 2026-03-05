import { addAddress, deleteAddress, getProfile, saveProfile } from "./profileService.js";
import { setupUiEnhancements, showToast, updateCartBadge } from "./ui.js";

function renderAddresses() {
  const profile = getProfile();
  const root = document.querySelector("#addresses-list");
  if (!profile.addresses.length) {
    root.innerHTML = `<p class="state">No saved addresses.</p>`;
    return;
  }

  root.innerHTML = profile.addresses
    .map(
      (address) => `
        <article class="address-item">
          <p>${address.text}</p>
          <button class="btn btn-ghost" data-delete="${address.id}" type="button">Delete</button>
        </article>
      `
    )
    .join("");

  root.querySelectorAll("[data-delete]").forEach((button) => {
    button.onclick = () => {
      deleteAddress(button.dataset.delete);
      renderAddresses();
      showToast("Address removed", "error");
    };
  });
}

function initProfilePage() {
  updateCartBadge();
  const profile = getProfile();
  document.querySelector("#name").value = profile.name || "";
  document.querySelector("#email").value = profile.email || "";
  document.querySelector("#phone").value = profile.phone || "";
  document.querySelector("#avatar-preview").src = profile.avatar || "../public/images/empty-cart.svg";

  document.querySelector("#avatar-input").onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector("#avatar-preview").src = reader.result;
      saveProfile({ avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  document.querySelector("#save-profile").onclick = () => {
    saveProfile({
      name: document.querySelector("#name").value.trim(),
      email: document.querySelector("#email").value.trim(),
      phone: document.querySelector("#phone").value.trim()
    });
    showToast("Profile updated", "success");
  };

  document.querySelector("#add-address").onclick = () => {
    const addressInput = document.querySelector("#new-address");
    const value = addressInput.value.trim();
    if (!value) return;
    addAddress(value);
    addressInput.value = "";
    renderAddresses();
    showToast("Address added", "success");
  };

  renderAddresses();
  setupUiEnhancements();
}

initProfilePage();
