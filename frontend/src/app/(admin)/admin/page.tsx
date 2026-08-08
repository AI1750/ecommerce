'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { formatPrice, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { AdminStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await adminApi.get<AdminStats>('/orders/stats');
        if (res.success) setStats(res.data!);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: '总订单', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: '总收入', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: '商品数', value: stats?.totalProducts || 0, icon: Package, color: 'bg-purple-50 text-purple-600' },
          { label: '客户数', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-orange-50 text-orange-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Distribution */}
      {stats?.ordersByStatus && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">订单状态分布</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <span className={`badge ${getOrderStatusColor(status)} mb-2`}>{getOrderStatusLabel(status)}</span>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">最近订单</h2>
          <Link href="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700">查看全部</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">订单号</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">客户</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">金额</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">
                    <Link href={`/admin/orders/${order.id}`} className="text-primary-600">{order.id.substring(0, 8)}...</Link>
                  </td>
                  <td className="px-6 py-4">{order.email}</td>
                  <td className="px-6 py-4 font-medium">{formatPrice(order.grand_total)}</td>
                  <td className="px-6 py-4"><span className={`badge ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
