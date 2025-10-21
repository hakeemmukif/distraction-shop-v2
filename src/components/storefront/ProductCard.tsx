'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Product } from '@/types/product';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format price (cents to display currency)
  const formattedPrice = `RM ${(product.price / 100).toFixed(2)}`;

  // Determine if product is in stock
  const inStock = product.sizes
    ? product.sizes.some((size) => size.available)
    : true;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Front image (default) */}
        <Image
          src={product.images[0]}
          alt={`${product.name} - Front view`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-opacity duration-300 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Back image (on hover) */}
        <Image
          src={product.images[1]}
          alt={`${product.name} - Back view`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Out of stock badge */}
        {!inStock && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm font-bold text-gray-900">{formattedPrice}</p>

        {/* Available sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.sizes.map((size) => (
              <span
                key={size.label}
                className={`text-xs px-2 py-0.5 rounded ${
                  size.available
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-400 line-through'
                }`}
              >
                {size.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
