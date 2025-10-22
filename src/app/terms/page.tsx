import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600">
                Welcome to Distraction Shop. By accessing and using our website, you agree to comply
                with and be bound by the following terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Products and Services</h2>
              <p className="text-gray-600">
                All products are subject to availability. We reserve the right to limit quantities
                of any products or services that we offer. Product descriptions and prices are subject
                to change at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Pricing</h2>
              <p className="text-gray-600">
                All prices are listed in Malaysian Ringgit (MYR) and are inclusive of applicable taxes.
                We reserve the right to modify prices at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment</h2>
              <p className="text-gray-600">
                Payment is processed securely through Stripe. We accept major credit cards and debit cards.
                All transactions are encrypted and secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Shipping</h2>
              <p className="text-gray-600">
                We currently ship within Malaysia only. Shipping costs and delivery times will be
                calculated at checkout. We are not responsible for delays caused by shipping carriers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Returns and Refunds</h2>
              <p className="text-gray-600">
                Due to the nature of our products, we have a strict no-return policy unless items
                are defective or damaged upon arrival. Please contact us within 7 days of receiving
                your order if you encounter any issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-600">
                Your privacy is important to us. We collect only necessary information to process
                your orders and improve our services. We do not share your personal information
                with third parties except as required to process payments and ship orders.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600">
                Distraction Shop shall not be liable for any indirect, incidental, special, or
                consequential damages arising out of or in connection with your use of our website
                or products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to update these terms and conditions at any time. Changes will
                be effective immediately upon posting to the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about these terms, please contact us through our contact page.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p>Last updated: October 2025</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
