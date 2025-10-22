'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { useEffect } from 'react';

export default function CartModal() {
  const { cart, itemCount, totalPrice, isCartOpen, closeCart, removeItem, updateQuantity } = useCart();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const formattedTotal = `RM ${(totalPrice / 100).toFixed(2)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-4">Add some items to get started!</p>
              <button
                onClick={closeCart}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => {
                const itemTotal = item.price * item.quantity;
                const formattedPrice = `RM ${(item.price / 100).toFixed(2)}`;
                const formattedItemTotal = `RM ${(itemTotal / 100).toFixed(2)}`;

                return (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      {item.size && (
                        <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
                      )}
                      <p className="text-sm text-gray-700 mt-1">{formattedPrice}</p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <span className="text-gray-600">-</span>
                        </button>
                        <span className="text-sm font-medium text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          aria-label="Increase quantity"
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                        >
                          <span className="text-gray-600">+</span>
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.size)}
                          className="ml-auto text-xs text-red-600 hover:text-red-700 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formattedItemTotal}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Shipping Notice */}
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Free shipping within Malaysia</span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{formattedTotal}</span>
            </div>

            {/* Checkout Button */}
            <button
              className="w-full py-3 px-6 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => {
                closeCart();
                // TODO: Navigate to checkout (will be implemented in Phase 6)
                alert('Checkout functionality coming soon!');
              }}
            >
              Proceed to Checkout
            </button>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
