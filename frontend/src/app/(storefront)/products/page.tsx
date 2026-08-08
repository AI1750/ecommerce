'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { storeApi } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/types';

function ProductListContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('category_id') || '';
  const sortBy = searchParams.get('sort_by') || '';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          storeApi.get<Product[]>('/products', {
            limit, offset: (page - 1) * limit,
            q: q || undefined,
            category_id: categoryId || undefined,
            sort_by: sortBy || undefined,
          }),
          storeApi.get<Category[]>('/categories'),
        ]);
        if (prodRes.success) {
          setProducts(prodRes.data!);
          setTotal(prodRes.pagination?.total || 0);
        }
        if (catRes.success) setCategories(catRes.data!);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [q, categoryId, sortBy, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Categories */}
        <aside className="lg:w-64 shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> 商品分类
            </h3>
            <div className="space-y-1">
              <Link
                href="/products"
                className={`block px-3 py-2 rounded-lg text-sm ${!categoryId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                全部商品
              </Link>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/products?category_id=${cat.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm ${categoryId === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </Link>
                  {cat.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/products?category_id=${child.id}`}
                      className={`block px-3 py-2 pl-6 rounded-lg text-sm ${categoryId === child.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {q ? `搜索: "${q}"` : categoryId ? categories.find(c => c.id === categoryId)?.name || '商品列表' : '全部商品'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">共 {total} 件商品</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/products?q=${q}&category_id=${categoryId}&sort_by=created_at`} className={`btn btn-sm ${sortBy === 'created_at' || !sortBy ? 'btn-primary' : 'btn-outline'}`}>最新</Link>
              <Link href={`/products?q=${q}&category_id=${categoryId}&sort_by=price_asc`} className={`btn btn-sm ${sortBy === 'price_asc' ? 'btn-primary' : 'btn-outline'}`}>价格↑</Link>
              <Link href={`/products?q=${q}&category_id=${categoryId}&sort_by=price_desc`} className={`btn btn-sm ${sortBy === 'price_desc' ? 'btn-primary' : 'btn-outline'}`}>价格↓</Link>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">没有找到相关商品</p>
              <Link href="/products" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">查看全部商品</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate text-sm md:text-base">{product.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">{product.subtitle || product.category_name}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base md:text-lg font-bold text-red-600">
                          {product.variants?.[0]?.price ? formatPrice(product.variants[0].price) : ''}
                        </span>
                        {product.variants?.[0]?.compare_at_price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.variants[0].compare_at_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <ProductListContent />
    </Suspense>
  );
}
