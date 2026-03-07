import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ShoppingCart, Plus, Minus, Trash2, Send, Mail, Phone } from 'lucide-react';
import { Product, CartItem } from './types';
import productsData from './data/products.json';

const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') return price;
  const match = price.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

function HomeScreen({ 
  products, 
  searchQuery, 
  setSearchQuery, 
  categories,
  selectedCategory,
  setSelectedCategory,
  onSelectProduct,
  cartCount,
  onOpenCart
}: { 
  products: Product[], 
  searchQuery: string, 
  setSearchQuery: (q: string) => void, 
  categories: string[],
  selectedCategory: string,
  setSelectedCategory: (c: string) => void,
  onSelectProduct: (p: Product) => void,
  cartCount: number,
  onOpenCart: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* AppBar */}
      <header className="bg-white text-[#1A365D] p-4 shadow-sm z-10 flex items-center justify-between h-16 shrink-0 border-b border-slate-200">
        <div className="flex items-center">
          {/* We will use a placeholder URL until a public link is provided, or assume it's in public/logo.png */}
          <img 
            src="/logo.png" 
            alt="Troika - artful passion" 
            className="h-12 w-auto object-contain"
            onError={(e) => {
              // Fallback if logo.png is not found
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex-col">
            <h1 className="text-xl font-black tracking-wider leading-none text-[#1A365D]">TROIKA</h1>
            <span className="text-[10px] tracking-wide text-[#00AEEF] leading-tight mt-0.5">artful passion</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <a href="tel:+9779705952285" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Call Us">
            <Phone className="h-6 w-6" />
          </a>
          <button onClick={onOpenCart} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#00AEEF] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF] sm:text-sm transition-colors"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex overflow-x-auto hide-scrollbar p-3 space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-[#1A365D] text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {products.length === 0 ? (
          <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
            <div className="bg-slate-100 p-5 rounded-full mb-4">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">No products found.</p>
            <p className="text-sm mt-1">Try a different search term or category.</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div 
              key={`${product.code || product.id}-${index}`}
              onClick={() => onSelectProduct(product)}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex flex-col pr-4">
                <span className="font-bold text-slate-800 text-lg leading-tight">{product.name}</span>
                <span className="text-sm text-slate-500 mt-1 font-mono">{product.code}</span>
              </div>
              <div className="text-lg font-black text-[#00AEEF] shrink-0">
                {typeof product.price === 'number' ? `Rs. ${product.price.toFixed(2)}` : product.price}
              </div>
            </div>
          ))
        )}
        
        {products.length > 0 && (
          <div className="py-8 text-center flex flex-col items-center justify-center opacity-70">
            <img 
              src="/logo.png" 
              alt="Troika" 
              className="h-16 w-auto object-contain mb-3 opacity-80"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <p className="text-[10px] mt-1">© {new Date().getFullYear()} Troika. All Rights Reserved.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetailPage({ 
  product, 
  onBack,
  onAddToCart
}: { 
  product: Product, 
  onBack: () => void,
  onAddToCart: (p: Product, qty: number) => void
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* AppBar */}
      <header className="bg-white text-[#1A365D] p-4 shadow-sm z-10 flex items-center h-16 shrink-0 border-b border-slate-200">
        <button 
          onClick={onBack}
          className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 transition-colors active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold tracking-wide">Product Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">{product.name}</h2>
          <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-mono tracking-wide mb-6 border border-slate-200">
            {product.code}
          </div>
          <div className="text-5xl font-black text-[#00AEEF]">
            {typeof product.price === 'number' ? `Rs. ${product.price.toFixed(2)}` : product.price}
          </div>
        </div>

        {product.notes && (
          <div className="mt-8">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              readOnly
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 resize-none focus:outline-none leading-relaxed"
              rows={6}
              value={product.notes}
            />
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between">
        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-3 hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-600"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-12 text-center font-bold text-lg text-slate-800">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="p-3 hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button 
          onClick={() => {
            onAddToCart(product, quantity);
            onBack();
          }}
          className="flex-1 ml-4 bg-[#1A365D] hover:bg-[#122643] active:bg-[#0a1629] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Quote
        </button>
      </div>
    </div>
  );
}

function CartScreen({
  cart,
  onBack,
  onUpdateQuantity,
  onRemoveItem
}: {
  cart: CartItem[],
  onBack: () => void,
  onUpdateQuantity: (code: string, qty: number) => void,
  onRemoveItem: (code: string) => void
}) {
  const total = cart.reduce((sum, item) => sum + (parsePrice(item.product.price) * item.quantity), 0);

  const generateQuoteText = () => {
    let text = "📝 *Quotation Request*\n\n";
    cart.forEach(item => {
      text += `*${item.product.name}*\n`;
      text += `Code: ${item.product.code}\n`;
      text += `Qty: ${item.quantity}\n\n`;
    });
    return text;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateQuoteText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const text = encodeURIComponent(generateQuoteText());
    window.open(`mailto:?subject=Quotation&body=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="bg-white text-[#1A365D] p-4 shadow-sm z-10 flex items-center h-16 shrink-0 border-b border-slate-200">
        <button 
          onClick={onBack}
          className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 transition-colors active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold tracking-wide">Current Quote</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-40">
        {cart.length === 0 ? (
          <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
            <img 
              src="/logo.png" 
              alt="Troika" 
              className="h-24 w-auto object-contain mb-6 opacity-60"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <p className="font-medium text-slate-500">Your quote is empty.</p>
            <p className="text-sm mt-1">Add items from the Troika catalog.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.product.code} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="pr-4">
                    <h3 className="font-bold text-slate-800 leading-tight">{item.product.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{item.product.code}</p>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.product.code)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    <button 
                      onClick={() => onUpdateQuantity(item.product.code, item.quantity - 1)}
                      className="p-2 hover:bg-slate-200 text-slate-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.product.code, item.quantity + 1)}
                      className="p-2 hover:bg-slate-200 text-slate-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] p-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-slate-500 font-bold">Total Estimated Price:</span>
            <span className="text-2xl font-black text-[#00AEEF]">Rs. {total.toFixed(2)}</span>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <Send className="h-5 w-5 mr-2" />
              WhatsApp
            </button>
            <button 
              onClick={handleEmail}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <Mail className="h-5 w-5 mr-2" />
              Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setProducts(productsData as Product[]);
  }, []);

  const categories = ["All", "RE", "24", "INR", "BL", "SL", "ZE", "VN", "HD", "T", "SH", "HF", "SINK"];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const code = p.code.trim();
      const prefix = code.split(' ')[0];
      const matchesCategory = selectedCategory === 'All' || 
                              (selectedCategory === '24' ? code.startsWith('24') : prefix === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.code === product.code);
      if (existing) {
        return prev.map(item => 
          item.product.code === product.code 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (code: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(code);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.code === code ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.product.code !== code));
  };

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white sm:rounded-[2rem] sm:shadow-2xl h-[100dvh] sm:h-[850px] sm:max-h-[90vh] relative overflow-hidden flex flex-col sm:border-[8px] sm:border-slate-800">
        {isCartOpen ? (
          <CartScreen 
            cart={cart}
            onBack={() => setIsCartOpen(false)}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
          />
        ) : selectedProduct ? (
          <ProductDetailPage 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)} 
            onAddToCart={handleAddToCart}
          />
        ) : (
          <HomeScreen 
            products={filteredProducts} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectProduct={setSelectedProduct}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
