'use client';

import Image from 'next/image';
import { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void;
  onRemove: (productId: string, size: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
        <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">RM {item.price.toFixed(2)}</p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.productId, item.size, item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600"
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.productId, item.size, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            +
          </button>
          <button
            onClick={() => onRemove(item.productId, item.size)}
            className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-medium text-gray-900">
          RM {subtotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
