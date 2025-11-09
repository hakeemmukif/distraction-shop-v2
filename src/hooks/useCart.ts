'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, Cart } from '@/types/cart';

const CART_STORAGE_KEY = 'distraction-shop-cart';

export function useCart() {
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
    console.log('useCart addItem called with:', item);

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

        console.log('Existing item found, new quantity:', newQuantity, 'stock:', existingItem.stock);

        // Check stock limit
        if (newQuantity > existingItem.stock) {
          console.warn('Stock limit exceeded for existing item');
          return prevCart;
        }

        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };
      } else {
        // New item
        const quantity = item.quantity || 1;

        console.log('Adding new item - quantity:', quantity, 'stock:', item.stock);

        // Check stock limit
        if (quantity > item.stock) {
          console.warn('Stock limit exceeded for new item - quantity:', quantity, 'stock:', item.stock);
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

      console.log('Cart updated - items:', newItems.length, 'itemCount:', itemCount, 'total:', total);

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

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
  };
}
