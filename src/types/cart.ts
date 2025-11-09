export interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  total: number;
}
