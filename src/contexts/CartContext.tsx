'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CartItem, Cart } from '@/types/cart';

const CART_STORAGE_KEY = 'distraction-shop-cart';

interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string, size: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    itemCount: 0,
    total: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Calculate totals helper
  const calculateTotals = useCallback((items: CartItem[]) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { itemCount, total };
  }, []);

  // Add item to cart
  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (cartItem) => cartItem.productId === item.productId && cartItem.size === item.size
      );

      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        // Item already exists, increase quantity
        newItems = [...prevCart.items];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = existingItem.quantity + (item.quantity || 1);

        // Check stock limit
        if (newQuantity > existingItem.stock) {
          return prevCart;
        }

        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };
      } else {
        // New item
        const quantity = item.quantity || 1;

        // Check stock limit
        if (quantity > item.stock) {
          return prevCart;
        }

        newItems = [
          ...prevCart.items,
          {
            ...item,
            quantity,
          },
        ];
      }

      const { itemCount, total } = calculateTotals(newItems);

      return {
        items: newItems,
        itemCount,
        total,
      };
    });
  }, [calculateTotals]);

  // Remove item from cart
  const removeItem = useCallback((productId: string, size: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => !(item.productId === productId && item.size === size)
      );
      const { itemCount, total } = calculateTotals(newItems);

      return {
        items: newItems,
        itemCount,
        total,
      };
    });
  }, [calculateTotals]);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId, size);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => {
        if (item.productId === productId && item.size === size) {
          // Check stock limit
          if (quantity > item.stock) {
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });

      const { itemCount, total } = calculateTotals(newItems);

      return {
        items: newItems,
        itemCount,
        total,
      };
    });
  }, [calculateTotals, removeItem]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart({
      items: [],
      itemCount: 0,
      total: 0,
    });
  }, []);

  // Get item from cart
  const getItem = useCallback((productId: string, size: string) => {
    return cart.items.find(
      (item) => item.productId === productId && item.size === size
    );
  }, [cart.items]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItem,
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
