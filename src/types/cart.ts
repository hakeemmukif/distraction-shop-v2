export type CartItem = {
  productId: string;
  priceId: string;
  name: string;
  price: number; // cents
  size: string | null; // null if no size
  quantity: number;
  image: string; // First image from product
  stock?: number; // Available stock for this size
};

export type Cart = {
  items: CartItem[];
  lastUpdated: string;
};

export type CartContextType = {
  cart: Cart;
  itemCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};
