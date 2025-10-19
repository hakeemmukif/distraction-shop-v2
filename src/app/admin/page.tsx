'use client';

import { useState, useEffect } from 'react';
import ProductModal from '@/components/admin/ProductModal';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  images: {
    image_1?: string;
    image_2?: string;
    image_3?: string;
  };
  sizes: Array<{ size: string; stock: number }>;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'home' | 'skate_shop' | 'preloved'>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      await fetchProducts();
      alert('Product created successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    }
  };

  const handleEditProduct = async (data: any) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      await fetchProducts();
      alert('Product updated successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      await fetchProducts();
      alert('Product deleted successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">Products</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setCategory('home')}
          className={`px-4 py-2 font-medium transition-colors ${
            category === 'home'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setCategory('skate_shop')}
          className={`px-4 py-2 font-medium transition-colors ${
            category === 'skate_shop'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Skate Shop
        </button>
        <button
          onClick={() => setCategory('preloved')}
          className={`px-4 py-2 font-medium transition-colors ${
            category === 'preloved'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Preloved
        </button>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No products found</p>
          <p className="text-sm">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* Product Image */}
                <div className="w-24 h-24 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {product.images.image_1 ? (
                    <img
                      src={product.images.image_1}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black">{product.name}</h3>
                  <p className="text-xl font-bold text-black mt-1">
                    RM {(product.price / 100).toFixed(2)}
                  </p>
                  {product.sizes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.sizes.map((size, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded ${
                            size.stock > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {size.size}: {size.stock}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsEditModalOpen(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
        title="Create New Product"
      />

      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleEditProduct}
        initialData={editingProduct ? {
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price / 100,
          category: editingProduct.category as 'home' | 'skate_shop' | 'preloved',
          images: editingProduct.images,
          sizes: editingProduct.sizes,
        } : undefined}
        title="Edit Product"
      />
    </div>
  );
}
