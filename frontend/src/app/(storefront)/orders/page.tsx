'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { storeApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor, getPaymentStatusLabel, getPaymentStatusColor } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchOrders() {
      try {
        const res = await storeApi.get<Order[]>('/orders');
        if (res.success) setOrders(res.data!);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
        <Link href="/login?redirect=/orders" className="btn btn-primary">去登录</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">我的订单</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">还没有订单</p>
          <Link href="/products" className="btn btn-primary">去逛逛</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">订单号: <span className="font-mono text-xs">{order.id.substring(0, 8)}...</span></p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                  <span className={`badge ${getPaymentStatusColor(order.payment_status)}`}>{getPaymentStatusLabel(order.payment_status)}</span>
                </div>
              </div>

              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 border-t border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-xs text-gray-400">商品</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product_title}</p>
                    <p className="text-xs text-gray-500">{item.variant_title} x {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-red-600">{formatPrice(item.total_price)}</p>
                    <p className="text-xs text-gray-400">{formatPrice(item.unit_price)}/件</p>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <span className="text-sm text-gray-500">共 {order.items?.length || 0} 件商品</span>
                <div className="text-right">
                  <span className="text-sm text-gray-500">实付: </span>
                  <span className="text-lg font-bold text-red-600">{formatPrice(order.grand_total)}</span>
                </div>
              </div>

              {order.status === 'pending' && (
                <button
                  onClick={async () => {
                    try {
                      await storeApi.post(`/orders/${order.id}/cancel`);
                      window.location.reload();
                    } catch {}
                  }}
                  className="btn btn-outline btn-sm mt-3"
                >
                  取消订单
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
