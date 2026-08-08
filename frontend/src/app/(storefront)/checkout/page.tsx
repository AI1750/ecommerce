'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { storeApi } from '@/lib/api-client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import type { Address } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, subtotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('mock_wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ first_name: '', last_name: '', address_1: '', city: '', province: '', postal_code: '', phone: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  async function fetchAddresses() {
    try {
      const res = await storeApi.get<Address[]>('/customers/me/addresses');
      if (res.success) {
        setAddresses(res.data!);
        const def = res.data!.find((a: Address) => a.is_default);
        if (def) setSelectedAddress(def.id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">购物车是空的</h1>
        <Link href="/products" className="btn btn-primary">去逛逛</Link>
      </div>
    );
  }

  const shippingTotal = subtotal >= 9900 ? 0 : 1000;
  const grandTotal = subtotal + shippingTotal;

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await storeApi.post<Address>('/customers/me/addresses', newAddress);
      if (res.success) {
        await fetchAddresses();
        setShowNewAddress(false);
        setNewAddress({ first_name: '', last_name: '', address_1: '', city: '', province: '', postal_code: '', phone: '' });
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      setError('请选择收货地址');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await storeApi.post('/orders', {
        cart_id: cart!.id,
        shipping_address_id: selectedAddress,
        payment_method: paymentMethod,
      });
      if (res.success) {
        // Process payment
        const payRes = await storeApi.post('/payments/process', {
          order_id: res.data.id,
          method: paymentMethod,
        });
        if (payRes.success && payRes.data.status === 'completed') {
          await clearCart();
          setStep('confirm');
        } else {
          setError('支付失败，请重试');
        }
      }
    } catch (err: any) {
      setError(err.message || '下单失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">结算</h1>

      {/* Steps */}
      {step !== 'confirm' && (
        <div className="flex items-center gap-4 mb-8">
          {['address', 'payment'].map((s, i) => (
            <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>{i + 1}</span>
              {s === 'address' ? '收货地址' : '支付方式'}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* Success */}
      {step === 'confirm' && (
        <div className="text-center py-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">下单成功!</h2>
          <p className="text-gray-500 mb-8">感谢您的购买，我们将尽快为您发货</p>
          <div className="flex gap-4 justify-center">
            <Link href="/orders" className="btn btn-primary">查看订单</Link>
            <Link href="/products" className="btn btn-outline">继续购物</Link>
          </div>
        </div>
      )}

      {/* Address Step */}
      {step === 'address' && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">选择收货地址</h2>
          {addresses.length === 0 && !showNewAddress ? (
            <div className="text-center py-8 card">
              <p className="text-gray-500 mb-4">还没有收货地址</p>
              <button onClick={() => setShowNewAddress(true)} className="btn btn-primary">添加地址</button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`card p-4 cursor-pointer border-2 ${selectedAddress === addr.id ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{addr.first_name} {addr.last_name} <span className="text-gray-500 font-normal ml-2">{addr.phone}</span></p>
                      <p className="text-sm text-gray-600 mt-1">{addr.province} {addr.city} {addr.address_1}</p>
                    </div>
                    {addr.is_default ? <span className="badge badge-info">默认</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showNewAddress && (
            <button onClick={() => setShowNewAddress(true)} className="btn btn-outline mt-4 w-full">+ 添加新地址</button>
          )}

          {showNewAddress && (
            <form onSubmit={handleAddAddress} className="card p-6 mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">姓</label><input className="input" value={newAddress.last_name} onChange={e => setNewAddress({...newAddress, last_name: e.target.value})} required /></div>
                <div><label className="label">名</label><input className="input" value={newAddress.first_name} onChange={e => setNewAddress({...newAddress, first_name: e.target.value})} required /></div>
              </div>
              <div><label className="label">手机号</label><input className="input" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} /></div>
              <div><label className="label">省份</label><input className="input" value={newAddress.province} onChange={e => setNewAddress({...newAddress, province: e.target.value})} required /></div>
              <div><label className="label">城市</label><input className="input" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required /></div>
              <div><label className="label">详细地址</label><input className="input" value={newAddress.address_1} onChange={e => setNewAddress({...newAddress, address_1: e.target.value})} required /></div>
              <div><label className="label">邮编</label><input className="input" value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} required /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">保存地址</button>
                <button type="button" onClick={() => setShowNewAddress(false)} className="btn btn-outline">取消</button>
              </div>
            </form>
          )}

          <button
            onClick={() => selectedAddress && setStep('payment')}
            disabled={!selectedAddress}
            className="btn btn-primary w-full mt-6 btn-lg disabled:opacity-50"
          >
            下一步 - 选择支付方式
          </button>
        </div>
      )}

      {/* Payment Step */}
      {step === 'payment' && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">选择支付方式</h2>
          <div className="space-y-3">
            {[
              { id: 'mock_wechat', name: '微信支付', icon: Smartphone, desc: '模拟微信支付' },
              { id: 'mock_alipay', name: '支付宝', icon: CreditCard, desc: '模拟支付宝支付' },
              { id: 'mock_card', name: '银行卡', icon: Building2, desc: '模拟银行卡支付' },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`card p-4 cursor-pointer border-2 flex items-center gap-4 ${paymentMethod === method.id ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <Icon className="w-8 h-8 text-primary-600" />
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="card p-6 mt-6">
            <h3 className="font-semibold mb-3">订单摘要</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>商品 ({itemCount}件)</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>运费</span><span>{shippingTotal === 0 ? '免运费' : formatPrice(shippingTotal)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>应付总额</span><span className="text-red-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('address')} className="btn btn-outline">上一步</button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn btn-primary flex-1 btn-lg disabled:opacity-50"
            >
              {loading ? '提交中...' : `确认支付 ${formatPrice(grandTotal)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
