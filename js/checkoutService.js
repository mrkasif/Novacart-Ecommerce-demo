function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone.replace(/\D/g, ""));
}

export function validateCheckoutData({ shipping, paymentMethod, items }) {
  const errors = {};

  if (!shipping.name?.trim()) errors.name = "Name is required.";
  if (!shipping.address?.trim()) errors.address = "Address is required.";
  if (!isValidPhone(shipping.phone || "")) errors.phone = "Enter a valid 10-digit phone number.";
  if (!isValidEmail(shipping.email || "")) errors.email = "Enter a valid email address.";
  if (!paymentMethod) errors.paymentMethod = "Select a payment method.";
  if (!items || items.length === 0) errors.items = "Your cart is empty.";

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export async function placeOrder({ shipping, paymentMethod, items, totals }) {
  const validation = validateCheckoutData({ shipping, paymentMethod, items });
  if (!validation.isValid) return { success: false, errors: validation.errors };

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    success: true,
    orderId: `ORD-${Date.now()}`,
    message: "Order confirmed (simulated).",
    summary: {
      shipping,
      paymentMethod,
      itemCount: items.length,
      totals
    }
  };
}
