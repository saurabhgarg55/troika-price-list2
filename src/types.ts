export interface Product {
  id?: string;
  name: string;
  code: string;
  price: number | string;
  notes?: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
