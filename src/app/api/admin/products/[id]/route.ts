import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/middleware';

const updateProductSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(1).max(100000).optional(),
  category: z.enum(['home', 'skate_shop', 'preloved']).optional(),
  images: z
    .object({
      image_1: z.string().url().optional(),
      image_2: z.string().url().optional(),
      image_3: z.string().url().optional(),
    })
    .optional(),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1),
        stock: z.number().min(0).max(9999),
      })
    )
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, ['admin', 'superadmin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // Get existing product
    const existingProduct = await stripe.products.retrieve(params.id);

    // Build updated metadata
    const metadata: Record<string, string> = {
      ...existingProduct.metadata,
    };

    if (data.category) {
      metadata.unit_label = data.category;
    }

    if (data.images) {
      if (data.images.image_1) metadata.image_1 = data.images.image_1;
      if (data.images.image_2) metadata.image_2 = data.images.image_2;
      if (data.images.image_3) metadata.image_3 = data.images.image_3;
    }

    // Update sizes in metadata
    if (data.sizes) {
      // Clear existing size metadata
      Object.keys(metadata).forEach((key) => {
        if (key.startsWith('size_')) {
          delete metadata[key];
        }
      });

      // Add new sizes
      data.sizes.forEach((sizeData, index) => {
        const sizeKey = `size_${index + 1}`;
        metadata[sizeKey] = sizeData.size;
        metadata[`${sizeKey}_stock`] = sizeData.stock.toString();
      });
    }

    // Update product
    const updateData: any = { metadata };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const product = await stripe.products.update(params.id, updateData);

    // Update price if changed
    if (data.price) {
      const newPrice = await stripe.prices.create({
        unit_amount: Math.round(data.price * 100),
        currency: 'myr',
        product: params.id,
      });

      await stripe.products.update(params.id, {
        default_price: newPrice.id,
      });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update product error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, ['admin', 'superadmin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await stripe.products.update(params.id, {
      active: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
