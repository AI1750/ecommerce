'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Package, Truck, Shield } from 'lucide-react';
import { storeApi } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          storeApi.get<Product[]>('/products', { limit: 8, sort_by: 'created_at' }),
          storeApi.get<Category[]>('/categories'),
        ]);
        if (prodRes.success) setProducts(prodRes.data!);
        if (catRes.success) setCategories(catRes.data!);
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              发现好物<br />享受品质生活
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              精选优质商品，全场满99包邮，新用户首单9折优惠
            </p>
            <div className="flex gap-4">
              <Link href="/products" className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg">
                立即选购
              </Link>
              <Link href="/products?sort_by=price_asc" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold text-lg">
                特价商品 <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">满99包邮</h3>
                <p className="text-sm text-gray-500">全国范围快速配送</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">正品保障</h3>
                <p className="text-sm text-gray-500">品质保证，售后无忧</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">每日新品</h3>
                <p className="text-sm text-gray-500">精选好物每日更新</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">商品分类</h2>
          <Link href="/products" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category_id=${cat.id}`}
              className="card p-6 text-center hover:shadow-md transition-shadow group"
            >
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-medium text-gray-900">{cat.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {cat.children?.length ? `${cat.children.length} 个子分类` : ''}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">热销推荐</h2>
            <Link href="/products" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="card overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.thumbnail || 'https://picsum.photos/seed/placeholder/400/400'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{product.subtitle || product.category_name}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-red-600">
                        {product.variants?.[0]?.price ? formatPrice(product.variants[0].price) : ''}
                      </span>
                      {product.variants?.[0]?.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.variants[0].compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">准备好开始购物了吗？</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          注册即享新用户9折优惠，海量好物等你来发现
        </p>
        <Link href="/register" className="btn btn-primary btn-lg">
          立即注册
        </Link>
      </section>
    </div>
  );
}
