'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CloudinaryUpload from './CloudinaryUpload';

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1, 'Price must be at least RM 1').max(100000),
  category: z.enum(['home', 'skate_shop', 'preloved']),
  images: z.object({
    image_1: z.string().url(),
    image_2: z.string().url(),
    image_3: z.string().url(),
  }),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1),
        stock: z.number().min(0).max(9999),
      })
    )
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
}

export default function ProductForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState(initialData?.images);
  const [sizes, setSizes] = useState<Array<{ size: string; stock: number }>>(
    initialData?.sizes || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    if (!images) {
      alert('Please upload 3 product images');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...data,
        images,
        sizes: sizes.length > 0 ? sizes : undefined,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSize = () => {
    setSizes([...sizes, { size: '', stock: 0 }]);
  };

  const updateSize = (index: number, field: 'size' | 'stock', value: any) => {
    const updated = [...sizes];
    updated[index][field] = field === 'stock' ? parseInt(value) || 0 : value;
    setSizes(updated);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Trainspotting Graffiti Long Sleeve"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Limited edition streetwear..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Price and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (RM) *
          </label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="200.00"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register('category')}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="home">Home</option>
            <option value="skate_shop">Skate Shop</option>
            <option value="preloved">Preloved</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      {/* Cloudinary Upload */}
      <CloudinaryUpload
        onUpload={(uploadedImages) => {
          setImages(uploadedImages);
          setValue('images', uploadedImages);
        }}
        existingImages={initialData?.images}
      />

      {/* Sizes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Sizes & Stock (Optional)
          </label>
          <button
            type="button"
            onClick={addSize}
            className="text-sm text-black hover:underline"
          >
            + Add Size
          </button>
        </div>

        {sizes.length > 0 && (
          <div className="space-y-2">
            {sizes.map((sizeData, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={sizeData.size}
                  onChange={(e) => updateSize(index, 'size', e.target.value)}
                  placeholder="Size (e.g., S, M, L)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="number"
                  value={sizeData.stock}
                  onChange={(e) => updateSize(index, 'stock', e.target.value)}
                  placeholder="Stock"
                  className="w-24 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {sizes.length === 0 && (
          <p className="text-sm text-gray-500">
            No sizes added. Product will have direct "Add to Cart" button.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Saving...'
            : isEditing
            ? 'Update Product'
            : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
