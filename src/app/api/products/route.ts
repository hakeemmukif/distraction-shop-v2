import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'home';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    // Fetch products from Stripe
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: limit,
    });

    // Filter and transform products
    const products = await Promise.all(
      stripeProducts.data
        .filter((product) => product.metadata.unit_label === category)
        .map(async (product) => {
          // Get price
          let price = 0;
          if (product.default_price) {
            const priceId = typeof product.default_price === 'string'
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

          return {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: price,
            currency: 'myr',
            images: [
              product.metadata.image_1,
              product.metadata.image_2,
              product.metadata.image_3,
            ] as [string, string, string],
            sizes: sizes,
            category: product.metadata.unit_label as 'home' | 'skate_shop' | 'preloved',
          };
        })
    );

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
