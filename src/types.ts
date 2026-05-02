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

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}
