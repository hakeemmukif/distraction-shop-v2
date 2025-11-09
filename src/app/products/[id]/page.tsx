'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        setProduct(data);

        // Set default size if available
        if (data.sizes && data.sizes.length > 0) {
          const firstAvailable = data.sizes.find((s: any) => s.available);
          if (firstAvailable) {
            setSelectedSize(firstAvailable.label);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-500 mb-8">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/home"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const formattedPrice = `RM ${(product.price / 100).toFixed(2)}`;
  const inStock = product.sizes
    ? product.sizes.some((size) => size.available)
    : true;

  const handleAddToCart = () => {
    if (!product) return;

    // Get stock for selected size
    let stock = 999; // Default stock if no sizes
    if (product.sizes && product.sizes.length > 0) {
      const selectedSizeData = product.sizes.find((s) => s.label === selectedSize);
      if (selectedSizeData) {
        stock = selectedSizeData.stock;
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price / 100, // Convert from cents to dollars
      size: selectedSize || 'One Size',
      image: product.images[0],
      stock,
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/home" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.images[selectedImage]}
                  alt={`${product.name} - View ${selectedImage + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Thumbnail Navigation */}
              <div className="grid grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-gray-900'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-2xl font-bold text-gray-900">{formattedPrice}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-gray-900 mb-3">Select Size</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size.label}
                        onClick={() => size.available && setSelectedSize(size.label)}
                        disabled={!size.available}
                        className={`py-3 px-4 text-sm font-medium border rounded-lg transition-all ${
                          selectedSize === size.label
                            ? 'bg-gray-900 text-white border-gray-900'
                            : size.available
                            ? 'bg-white text-gray-900 border-gray-300 hover:border-gray-900'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="space-y-4 pt-4">
                {inStock ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
                    className="w-full py-4 px-6 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {product.sizes && product.sizes.length > 0 && !selectedSize
                      ? 'Select a size'
                      : 'Add to Cart'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 px-6 bg-red-600 text-white font-medium rounded-lg cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}

                <Link
                  href="/home"
                  className="block w-full text-center py-4 px-6 border border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Product Details */}
              <div className="border-t pt-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4">Product Details</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Category: {product.category === 'home' ? 'Distraction SHOP' : product.category === 'skate_shop' ? 'Skate Shop' : 'Preloved'}</li>
                  <li>Currency: MYR (Malaysian Ringgit)</li>
                  {inStock && <li className="text-green-600 font-medium">In Stock</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
