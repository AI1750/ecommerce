'use client';

import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { cart, itemCount, subtotal, loading, updateItem, removeItem } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-24 h-24 text-gray-200 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">购物车是空的</h1>
        <p className="text-gray-500 mb-8">快去挑选心仪的商品吧</p>
        <Link href="/products" className="btn btn-primary">去逛逛</Link>
      </div>
    );
  }

  const shippingTotal = subtotal >= 9900 ? 0 : 1000; // ¥99 = 9900 cents
  const grandTotal = subtotal + shippingTotal;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">购物车 ({itemCount} 件)</h1>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="card p-4 flex gap-4">
            <Link href={`/products/${item.variant?.product?.id}`} className="shrink-0">
              <img
                src={item.variant?.product?.thumbnail || 'https://picsum.photos/seed/placeholder/120/120'}
                alt={item.variant?.product?.title || ''}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.variant?.product?.id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2">
                {item.variant?.product?.title || '商品'}
              </Link>
              {item.variant?.title !== '默认' && (
                <p className="text-sm text-gray-500 mt-1">{item.variant?.title}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => item.quantity > 1 && updateItem(item.id, item.quantity - 1)}
                    className="p-1 rounded border hover:bg-gray-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                    className="p-1 rounded border hover:bg-gray-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-red-600">{formatPrice(item.unit_price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-6 mt-6">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">商品小计</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">运费</span>
            <span>{shippingTotal === 0 ? <span className="text-green-600">免运费</span> : formatPrice(shippingTotal)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-base font-bold">
            <span>合计</span>
            <span className="text-red-600">{formatPrice(grandTotal)}</span>
          </div>
        </div>
        {subtotal < 9900 && (
          <p className="text-xs text-gray-400 mt-2">
            还差{formatPrice(9900 - subtotal)}即可享受免运费
          </p>
        )}
        <Link href="/checkout" className="btn btn-primary w-full mt-4 btn-lg">
          去结算
        </Link>
      </div>
    </div>
  );
}
