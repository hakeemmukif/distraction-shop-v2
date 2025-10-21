import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';

export default function PrelovedPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Preloved</h1>
          <p className="text-xl text-gray-600 mb-2">Coming Soon</p>
          <p className="text-gray-500 mb-8">
            We're working on bringing you a curated selection of preloved streetwear and skateboarding gear.
            Check back soon!
          </p>
          <Link
            href="/home"
            className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
