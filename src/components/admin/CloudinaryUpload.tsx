'use client';

import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary';
import { useState } from 'react';

interface CloudinaryUploadProps {
  onUpload: (urls: { image_1: string; image_2: string; image_3: string }) => void;
  existingImages?: { image_1?: string; image_2?: string; image_3?: string };
}

export default function CloudinaryUpload({
  onUpload,
  existingImages,
}: CloudinaryUploadProps) {
  const [images, setImages] = useState<string[]>(
    existingImages
      ? [
          existingImages.image_1 || '',
          existingImages.image_2 || '',
          existingImages.image_3 || '',
        ].filter(Boolean)
      : []
  );

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (!result.info || typeof result.info === 'string') return;
    const newUrl = result.info.secure_url;
    const updatedImages = [...images, newUrl].slice(0, 3);
    setImages(updatedImages);

    if (updatedImages.length === 3) {
      onUpload({
        image_1: updatedImages[0],
        image_2: updatedImages[1],
        image_3: updatedImages[2],
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Product Images (3 required)
        </label>
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={handleUpload}
          options={{
            maxFiles: 3 - images.length,
            clientAllowedFormats: ['jpg', 'png', 'webp'],
            maxFileSize: 5242880, // 5MB
            cropping: true,
            croppingAspectRatio: 1,
            showSkipCropButton: false,
            folder: 'distraction-products',
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              disabled={images.length >= 3}
              className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {images.length === 0
                ? 'Upload Images'
                : `Upload (${images.length}/3)`}
            </button>
          )}
        </CldUploadWidget>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 transition-all"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-center mt-1 text-gray-600">
                Image {index + 1}
                {index === 0 && ' (Front)'}
                {index === 1 && ' (Back)'}
                {index === 2 && ' (Alternate)'}
              </p>
            </div>
          ))}
        </div>
      )}

      {images.length < 3 && (
        <p className="text-sm text-gray-500">
          {images.length === 0
            ? 'Upload 3 product images (front, back, alternate view)'
            : `Upload ${3 - images.length} more image${
                3 - images.length > 1 ? 's' : ''
              }`}
        </p>
      )}
    </div>
  );
}
