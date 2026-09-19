export const store = {
  brand: process.env.NEXT_PUBLIC_STORE_NAME || "Nesto",
  location: process.env.NEXT_PUBLIC_STORE_LOCATION || "Set delivery location",
  eta: process.env.NEXT_PUBLIC_STORE_ETA || "10–15 min",
  deliveryThreshold: Number(process.env.NEXT_PUBLIC_DELIVERY_THRESHOLD || 199)
};
