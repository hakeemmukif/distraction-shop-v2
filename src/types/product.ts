export type ProductSize = {
  label: string;
  stock: number;
  available: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  currency: string;
  images: [string, string, string]; // 3 images required
  sizes?: ProductSize[];
  category: 'home' | 'skate_shop' | 'preloved';
  priceId?: string; // Stripe price ID
};

export type ProductsResponse = {
  products: Product[];
  total: number;
};
