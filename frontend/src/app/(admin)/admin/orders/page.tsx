'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { formatPrice, getOrderStatusLabel, getOrderStatusColor, getPaymentStatusLabel, getPaymentStatusColor } from '@/lib/utils';
import type { Order } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await adminApi.get<Order[]>('/orders', {
          limit, offset: (page - 1) * limit,
          q: search || undefined,
          status: statusFilter || undefined,
        });
        if (res.success) {
          setOrders(res.data!);
          setTotal(res.pagination?.total || 0);
        }
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [page, search, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理</h1>

      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="搜索订单号/邮箱..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          {['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s => (
            <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">订单号</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">客户</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">金额</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">订单状态</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">支付状态</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">加载中...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">暂无订单</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-primary-600 font-mono text-xs">{o.id.substring(0, 8)}...</Link>
                    </td>
                    <td className="px-6 py-4">{o.email}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(o.grand_total)}</td>
                    <td className="px-6 py-4"><span className={`badge ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></td>
                    <td className="px-6 py-4"><span className={`badge ${getPaymentStatusColor(o.payment_status)}`}>{getPaymentStatusLabel(o.payment_status)}</span></td>
                    <td className="px-6 py-4 text-gray-500">{new Date(o.created_at).toLocaleDateString('zh-CN')}</td>
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
