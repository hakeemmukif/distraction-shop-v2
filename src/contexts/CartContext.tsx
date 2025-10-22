'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart, CartItem, CartContextType } from '@/types/cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'distraction-cart';

const getInitialCart = (): Cart => {
  if (typeof window === 'undefined') {
    return { items: [], lastUpdated: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }

  return { items: [], lastUpdated: new Date().toISOString() };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(getInitialCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [cart, isClient]);

  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      // Check if item already exists (same product and size)
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.productId === newItem.productId && item.size === newItem.size
      );

      let updatedItems: CartItem[];

      if (existingItemIndex > -1) {
        // Item exists, check stock before increasing quantity
        const existingItem = prevCart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;

        // Validate stock if available
        if (existingItem.stock !== undefined && newQuantity > existingItem.stock) {
          console.warn(
            `Cannot add more of ${existingItem.name}. Only ${existingItem.stock} available.`
          );
          return prevCart; // Don't update if exceeds stock
        }

        updatedItems = prevCart.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: newQuantity } : item
        );
      } else {
        // New item, add to cart
        updatedItems = [...prevCart.items, { ...newItem, quantity: 1 }];
      }

      return {
        items: updatedItems,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const removeItem = (productId: string, size: string | null) => {
    setCart((prevCart) => ({
      items: prevCart.items.filter(
        (item) => !(item.productId === productId && item.size === size)
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateQuantity = (productId: string, size: string | null, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }

    setCart((prevCart) => {
      const item = prevCart.items.find(
        (i) => i.productId === productId && i.size === size
      );

      // Validate stock if available
      if (item && item.stock !== undefined && quantity > item.stock) {
        console.warn(`Cannot set quantity to ${quantity}. Only ${item.stock} available.`);
        return prevCart; // Don't update if exceeds stock
      }

      return {
        items: prevCart.items.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity }
            : item
        ),
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      lastUpdated: new Date().toISOString(),
    });
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
