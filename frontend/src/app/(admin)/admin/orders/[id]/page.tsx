'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor, getPaymentStatusLabel } from '@/lib/utils';
import type { Order } from '@/types';

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await adminApi.get<Order>(`/orders/${params.id}`);
        if (res.success) setOrder(res.data!);
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, [params.id]);

  async function handleStatusUpdate(status: string) {
    setUpdating(true);
    try {
      const res = await adminApi.put<Order>(`/orders/${params.id}/status`, { status });
      if (res.success) setOrder(res.data!);
    } catch {} finally { setUpdating(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">订单不存在</div>;

  const allowedStatuses = ORDER_STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
          <p className="text-sm text-gray-500 font-mono">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className={`badge ${getOrderStatusColor(order.status)} text-sm px-3 py-1`}>{getOrderStatusLabel(order.status)}</span>
                <span className={`badge ml-2 text-sm px-3 py-1 ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{getPaymentStatusLabel(order.payment_status)}</span>
              </div>
              {allowedStatuses.length > 0 && (
                <div className="flex gap-2">
                  {allowedStatuses.map(s => (
                    <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updating} className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}>
                      {s === 'confirmed' ? '确认' : s === 'processing' ? '开始处理' : s === 'shipped' ? '发货' : s === 'delivered' ? '完成' : s === 'refunded' ? '退款' : getOrderStatusLabel(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">商品清单</h2>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 shrink-0">商品</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.product_title}</p>
                    <p className="text-xs text-gray-500">{item.variant_title} · SKU: {item.sku || '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium">{formatPrice(item.unit_price)} x {item.quantity}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {(order.status_history?.length ?? 0) > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">状态记录</h2>
              <div className="space-y-2">
                {order.status_history!.map((h: any) => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <span className="text-gray-400 shrink-0">{new Date(h.created_at).toLocaleString('zh-CN')}</span>
                    <span className={`badge ${getOrderStatusColor(h.status)}`}>{getOrderStatusLabel(h.status)}</span>
                    {h.note && <span className="text-gray-500">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">订单摘要</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">商品小计</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">运费</span><span>{formatPrice(order.shipping_total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">税费</span><span>{formatPrice(order.tax_total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">折扣</span><span>{formatPrice(order.discount_total)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>总计</span><span className="text-red-600">{formatPrice(order.grand_total)}</span></div>
            </div>
          </div>

          {/* Customer */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">客户信息</h2>
            <p className="text-sm">{order.email}</p>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">收货地址</h2>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                <p>{order.shipping_address.phone}</p>
                <p>{order.shipping_address.province} {order.shipping_address.city}</p>
                <p>{order.shipping_address.address_1}</p>
              </div>
            </div>
          )}

          {/* Payment */}
          {order.payment && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">支付信息</h2>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">方式: </span>{order.payment.method}</p>
                <p><span className="text-gray-500">状态: </span><span className={`badge ${order.payment.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{order.payment.status}</span></p>
                {order.payment.transaction_id && <p><span className="text-gray-500">流水号: </span><span className="font-mono text-xs">{order.payment.transaction_id}</span></p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
