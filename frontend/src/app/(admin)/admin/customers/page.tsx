'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { CustomerStats } from '@/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await adminApi.get<CustomerStats[]>('/customers', {
          limit, offset: (page - 1) * limit,
          q: search || undefined,
        });
        if (res.success) {
          setCustomers(res.data!);
          setTotal(res.pagination?.total || 0);
        }
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">客户管理</h1>

      <div className="card p-4 mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="搜索姓名/邮箱..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">客户</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">邮箱</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">订单数</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">消费总额</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">加载中...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">暂无客户</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{c.last_name}{c.first_name}</td>
                    <td className="px-6 py-4 text-gray-500">{c.email}</td>
                    <td className="px-6 py-4">{c.total_orders}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(c.total_spent)}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString('zh-CN')}</td>
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
