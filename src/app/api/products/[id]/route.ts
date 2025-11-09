import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/data/mockProducts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if this is a mock product (handle before importing Stripe)
    if (id.startsWith('mock-')) {
      const mockProduct = mockProducts.find(p => p.id === id);

      if (!mockProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(mockProduct);
    }

    // Only import Stripe when needed for real products
    const { stripe } = await import('@/lib/stripe/client');

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    // Fetch product from Stripe
    const product = await stripe.products.retrieve(id);

    if (!product.active) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Get price
    let price = 0;
    let priceId = '';
    if (product.default_price) {
      priceId = typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price.id;
      const priceData = await stripe.prices.retrieve(priceId);
      price = priceData.unit_amount || 0;
    }

    // Parse sizes from metadata
    const sizes: Array<{ label: string; stock: number; available: boolean }> = [];
    Object.keys(product.metadata).forEach((key) => {
      if (key.startsWith('size_') && !key.includes('stock')) {
        const sizeLabel = product.metadata[key];
        const stockKey = `${key}_stock`;
        const stock = parseInt(product.metadata[stockKey] || '0');
        sizes.push({
          label: sizeLabel,
          stock: stock,
          available: stock > 0,
        });
      }
    });

    // Transform to our product format
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: price,
      priceId: priceId,
      currency: 'myr',
      images: [
        product.metadata.image_1,
        product.metadata.image_2,
        product.metadata.image_3,
      ] as [string, string, string],
      sizes: sizes,
      category: product.metadata.unit_label as 'home' | 'skate_shop' | 'preloved',
    };

    return NextResponse.json(productData);
  } catch (error: any) {
    console.error('Failed to fetch product:', error);

    if (error.code === 'resource_missing') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
