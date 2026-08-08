'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await adminApi.get<Product[]>('/products', {
          limit, offset: (page - 1) * limit,
          q: search || undefined,
          status: statusFilter || undefined,
        });
        if (res.success) {
          setProducts(res.data!);
          setTotal(res.pagination?.total || 0);
        }
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [page, search, statusFilter]);

  async function handleDelete(id: string) {
    if (!confirm('确定删除该产品？')) return;
    try {
      await adminApi.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(t => t - 1);
    } catch {}
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <Link href="/admin/products/new" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" /> 新增商品
        </Link>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="搜索商品..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">商品</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">分类</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">价格</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">库存</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">加载中...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">暂无商品</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail || 'https://picsum.photos/40/40'} className="w-10 h-10 rounded object-cover" alt="" />
                        <div>
                          <p className="font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.variants?.length || 0} 个变体</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.category_name || '-'}</td>
                    <td className="px-6 py-4 font-medium">
                      {p.variants?.[0]?.price ? formatPrice(p.variants[0].price) : '-'}
                    </td>
                    <td className="px-6 py-4">{p.variants?.reduce((sum, v) => sum + v.inventory_quantity, 0) || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${p.status === 'published' ? 'badge-success' : p.status === 'draft' ? 'badge-warning' : 'badge-gray'}`}>
                        {p.status === 'published' ? '已发布' : p.status === 'draft' ? '草稿' : '归档'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${p.id}`} className="p-1.5 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Link>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setPage(i+1)} className={`btn btn-sm ${page === i+1 ? 'btn-primary' : 'btn-outline'}`}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
