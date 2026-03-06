import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { Product } from './types';
import productsData from './data/products.json';

function HomeScreen({ 
  products, 
  searchQuery, 
  setSearchQuery, 
  onSelectProduct 
}: { 
  products: Product[], 
  searchQuery: string, 
  setSearchQuery: (q: string) => void, 
  onSelectProduct: (p: Product) => void 
}) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* AppBar */}
      <header className="bg-[#6287AF] text-white p-4 shadow-md z-10 flex items-center h-16 shrink-0">
        <h1 className="text-xl font-bold tracking-wide">Troika Price List</h1>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6287AF] focus:border-[#6287AF] sm:text-sm transition-colors"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {products.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">No products found.</div>
        ) : (
          products.map((product) => (
            <div 
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex flex-col pr-4">
                <span className="font-bold text-slate-800 text-lg leading-tight">{product.name}</span>
                <span className="text-sm text-slate-500 mt-1 font-mono">{product.code}</span>
              </div>
              <div className="text-lg font-black text-[#6287AF] shrink-0">
                Rs. {product.price.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProductDetailPage({ 
  product, 
  onBack 
}: { 
  product: Product, 
  onBack: () => void 
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* AppBar */}
      <header className="bg-[#6287AF] text-white p-4 shadow-md z-10 flex items-center h-16 shrink-0">
        <button 
          onClick={onBack}
          className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-white/20 transition-colors active:bg-white/30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold tracking-wide">Product Details</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">{product.name}</h2>
          <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-mono tracking-wide mb-6 border border-slate-200">
            {product.code}
          </div>
          <div className="text-5xl font-black text-[#6287AF]">
            Rs. {product.price.toFixed(2)}
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
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Simulate loading from a service
    setProducts(productsData as Product[]);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white sm:rounded-[2rem] sm:shadow-2xl h-[100dvh] sm:h-[850px] sm:max-h-[90vh] relative overflow-hidden flex flex-col sm:border-[8px] sm:border-slate-800">
        {selectedProduct ? (
          <ProductDetailPage 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)} 
          />
        ) : (
          <HomeScreen 
            products={filteredProducts} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectProduct={setSelectedProduct}
          />
        )}
      </div>
    </div>
  );
}
