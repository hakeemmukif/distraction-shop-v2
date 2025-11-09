// In-memory storage for shop override state
// Resets when server restarts
let shopOverride: boolean | null = null;

export function getShopOverride(): boolean | null {
  return shopOverride;
}

export function setShopOverride(value: boolean | null): void {
  shopOverride = value;
}
