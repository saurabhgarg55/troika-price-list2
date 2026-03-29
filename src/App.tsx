import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ShoppingCart, Plus, Minus, Trash2, Send, Mail, Phone, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem } from './types';
import productsData from './data/products.json';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(20); break;
      case 'heavy': navigator.vibrate([30, 50, 30]); break;
    }
  }
};

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
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* AppBar */}
      <header className="bg-white text-[#1A365D] p-4 shadow-sm z-10 flex items-center justify-between h-16 shrink-0 border-b border-slate-200">
        <div className="flex items-center">
          <img 
            src="https://raw.githubusercontent.com/saurabhgarg55/troika-price-list2/753aadc10b893627517de3b302d3ccc2e9a5427a/public/logo.png" 
            alt="Troika - artful passion" 
            className="h-12 w-auto object-contain"
          />
          <div className="hidden flex-col">
            <h1 className="text-xl font-black tracking-wider leading-none text-[#1A365D]">TROIKA</h1>
            <span className="text-[10px] tracking-wide text-[#00AEEF] leading-tight mt-0.5">artful passion</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <a href="tel:+9779705952285" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Call Us" onClick={() => triggerHaptic('light')}>
            <Phone className="h-6 w-6" />
          </a>
          <motion.button 
            onClick={() => { triggerHaptic('light'); onOpenCart(); }} 
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            animate={cartBump ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <ShoppingCart className="h-6 w-6" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-0 right-0 bg-[#00AEEF] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
              onClick={() => { triggerHaptic('light'); setSelectedCategory(cat); }}
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
              onClick={() => { triggerHaptic('light'); onSelectProduct(product); }}
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
              src="https://raw.githubusercontent.com/saurabhgarg55/troika-price-list2/753aadc10b893627517de3b302d3ccc2e9a5427a/public/logo.png" 
              alt="Troika" 
              className="h-16 w-auto object-contain mb-3 opacity-80"
            />
            <p className="text-[10px] mt-1">© Troika. All Rights Reserved.</p>
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
    <div className="flex flex-col h-full bg-white">
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8">
          {product.image && (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-64 object-contain mb-6 rounded-xl bg-slate-100 p-4"
              referrerPolicy="no-referrer"
            />
          )}
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
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between">
        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          <button 
            onClick={() => { triggerHaptic('light'); setQuantity(Math.max(1, quantity - 1)); }}
            className="p-3 hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-600"
          >
            <Minus className="h-5 w-5" />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val > 0) setQuantity(val);
            }}
            className="w-16 text-center font-bold text-lg text-slate-800 bg-transparent focus:outline-none"
          />
          <button 
            onClick={() => { triggerHaptic('light'); setQuantity(quantity + 1); }}
            className="p-3 hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button 
          onClick={() => {
            triggerHaptic('medium');
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

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Code', 'Name', 'Qty', 'Price', 'Total']],
      body: cart.map(item => [
        item.product.code,
        item.product.name,
        item.quantity,
        parsePrice(item.product.price).toFixed(2),
        (parsePrice(item.product.price) * item.quantity).toFixed(2)
      ]),
      foot: [['', '', '', 'Total', total.toFixed(2)]],
    });
    doc.save(`Troika_Quote_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSaveExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(cart.map(item => ({
      Code: item.product.code,
      Name: item.product.name,
      Quantity: item.quantity,
      Price: parsePrice(item.product.price),
      Total: parsePrice(item.product.price) * item.quantity
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotation');
    XLSX.writeFile(workbook, `Troika_Quote_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
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

      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
            <img 
              src="https://raw.githubusercontent.com/saurabhgarg55/troika-price-list2/753aadc10b893627517de3b302d3ccc2e9a5427a/public/logo.png" 
              alt="Troika" 
              className="h-24 w-auto object-contain mb-6 opacity-60"
            />
            <p className="font-medium text-slate-500">Your quote is empty.</p>
            <p className="text-sm mt-1">Add items from the Troika catalog.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div 
                key={item.product.code} 
                className="relative rounded-xl bg-red-500 overflow-hidden"
              >
                <div className="absolute inset-y-0 right-0 flex items-center justify-end w-full pr-6 text-white font-bold">
                  <span className="mr-2 text-sm">Swipe to delete</span>
                  <Trash2 className="h-6 w-6" />
                </div>
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.5, right: 0 }}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.x < -100 || velocity.x < -500) {
                      triggerHaptic('medium');
                      onRemoveItem(item.product.code);
                    }
                  }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative z-10 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-4">
                      <h3 className="font-bold text-slate-800 leading-tight">{item.product.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{item.product.code}</p>
                    </div>
                    <button 
                      onClick={() => { triggerHaptic('medium'); onRemoveItem(item.product.code); }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                      <button 
                        onClick={() => { triggerHaptic('light'); onUpdateQuantity(item.product.code, item.quantity - 1); }}
                        className="p-2 hover:bg-slate-200 text-slate-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                      <button 
                        onClick={() => { triggerHaptic('light'); onUpdateQuantity(item.product.code, item.quantity + 1); }}
                        className="p-2 hover:bg-slate-200 text-slate-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="font-bold text-[#00AEEF]">
                      Rs. {(parsePrice(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-white border-t border-slate-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] p-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-slate-500 font-bold">Total Estimated Price:</span>
            <span className="text-2xl font-black text-[#00AEEF]">Rs. {total.toFixed(2)}</span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3 px-2 rounded-xl shadow-md transition-all flex items-center justify-center text-sm"
            >
              <Send className="h-4 w-4 mr-1.5" />
              WhatsApp
            </button>
            <button 
              onClick={handleGeneratePDF}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-2 rounded-xl shadow-md transition-all flex items-center justify-center text-sm"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Send PDF
            </button>
            <button 
              onClick={handleSaveExcel}
              className="flex-1 bg-[#00AEEF] hover:bg-[#0095cc] text-white font-bold py-3 px-2 rounded-xl shadow-md transition-all flex items-center justify-center text-sm"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Save Excel
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

  const categories = ["All", "RE", "EU", "INS", "INR", "BL", "SL", "VS", "NK", "ZE", "VN", "HD", "CR", "DN", "AT", "PR", "EKO", "AL", "T", "MG", "OP", "SQ", "C", "HR", "AR", "SH", "HF", "SINK"];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const code = p.code.trim();
      const prefix = code.split(' ')[0].toUpperCase();
      
      let matchesCategory = selectedCategory === 'All';
      
      if (!matchesCategory) {
        if (selectedCategory === 'SINK') {
          matchesCategory = prefix === 'SINK' || prefix === 'KITCHEN' || prefix === 'SMART' || (p.notes && p.notes.toLowerCase().includes('sink')) || p.name.toLowerCase().includes('sink');
        } else {
          matchesCategory = prefix === selectedCategory;
        }
      }

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
