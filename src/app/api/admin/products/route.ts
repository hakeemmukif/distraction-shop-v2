import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/middleware';

const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1).max(100000),
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await requireAuth(request, ['admin', 'superadmin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);

    // Build metadata
    const metadata: Record<string, string> = {
      unit_label: data.category,
      image_1: data.images.image_1,
      image_2: data.images.image_2,
      image_3: data.images.image_3,
    };

    // Add sizes to metadata
    if (data.sizes && data.sizes.length > 0) {
      data.sizes.forEach((sizeData, index) => {
        const sizeKey = `size_${index + 1}`;
        metadata[sizeKey] = sizeData.size;
        metadata[`${sizeKey}_stock`] = sizeData.stock.toString();
      });
    }

    // Create product in Stripe first
    let product = await stripe.products.create({
      name: data.name,
      description: data.description || '',
      metadata,
      active: true,
    });

    // Create price with reference to the product
    const price = await stripe.prices.create({
      unit_amount: Math.round(data.price * 100),
      currency: 'myr',
      product: product.id,
    });

    // Update product to set the default price
    product = await stripe.products.update(product.id, {
      default_price: price.id,
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price.unit_amount,
        currency: price.currency,
        metadata: product.metadata,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
