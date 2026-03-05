const PROFILE_KEY = "ecommerce_profile_v1";

const DEFAULT_PROFILE = {
  avatar: "",
  name: "Guest User",
  email: "guest@novacart.in",
  phone: "",
  addresses: []
};

function readProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : []
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function getProfile() {
  return writeProfile(readProfile());
}

export function saveProfile(nextData) {
  const current = getProfile();
  return writeProfile({ ...current, ...nextData });
}

export function addAddress(address) {
  const current = getProfile();
  const next = [...current.addresses, { id: `addr-${Date.now()}`, text: address }];
  return saveProfile({ addresses: next });
}

export function deleteAddress(id) {
  const current = getProfile();
  return saveProfile({ addresses: current.addresses.filter((address) => address.id !== id) });
}
