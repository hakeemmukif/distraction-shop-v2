import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { Product } from '@/types/product';

async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products?category=home`, {
      cache: 'no-store', // Will be changed to ISR later
    });

    if (!response.ok) {
      console.error('Failed to fetch products');
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Video Section */}
        <section className="relative w-full h-[70vh] bg-gray-900">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="/video-poster.jpg"
          >
            <source src="/mug-promo.mp4" type="video/mp4" />
            {/* Fallback content */}
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
              Video not supported
            </div>
          </video>

          {/* Overlay text */}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-4">DISTRACTION SHOP</h1>
              <p className="text-xl">Streetwear & Skateboarding</p>
            </div>
          </div>
        </section>

        {/* Products Grid Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
