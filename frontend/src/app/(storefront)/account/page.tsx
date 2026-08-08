'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storeApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { Customer, Address } from '@/types';

export default function AccountPage() {
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user) {
      setForm({
        first_name: (user as Customer).first_name || '',
        last_name: (user as Customer).last_name || '',
        phone: (user as Customer).phone || '',
      });
    }
    fetchAddresses();
  }, [isAuthenticated, user]);

  async function fetchAddresses() {
    try {
      const res = await storeApi.get<Address[]>('/customers/me/addresses');
      if (res.success) setAddresses(res.data!);
    } catch {}
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await storeApi.put('/customers/me', form);
      setMessage('保存成功');
      setEditing(false);
    } catch (err: any) {
      setMessage(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <Link href="/login?redirect=/account" className="btn btn-primary">去登录</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">账户管理</h1>

      {message && (
        <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${message.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      {/* Profile */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">个人信息</h2>
          <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-sm">
            {editing ? '取消' : '编辑'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">姓</label><input className="input" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required /></div>
              <div><label className="label">名</label><input className="input" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required /></div>
            </div>
            <div><label className="label">手机号</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '保存'}</button>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">姓名: </span>{form.last_name}{form.first_name}</p>
            <p><span className="text-gray-500">邮箱: </span>{(user as Customer).email}</p>
            <p><span className="text-gray-500">手机: </span>{form.phone || '未设置'}</p>
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">收货地址</h2>
          <Link href="/checkout" className="btn btn-outline btn-sm">管理地址</Link>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">还没有收货地址</p>
        ) : (
          <div className="space-y-3">
            {addresses.slice(0, 3).map((addr) => (
              <div key={addr.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{addr.first_name} {addr.last_name} <span className="text-gray-500 font-normal">{addr.phone}</span></p>
                <p className="text-gray-600 mt-1">{addr.province} {addr.city} {addr.address_1}</p>
                {addr.is_default ? <span className="badge badge-info mt-1">默认</span> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="card divide-y">
        <Link href="/orders" className="block px-6 py-4 hover:bg-gray-50 font-medium text-gray-700">我的订单</Link>
        <button onClick={() => useAuth().logout()} className="block w-full text-left px-6 py-4 hover:bg-gray-50 text-red-600 font-medium">退出登录</button>
      </div>
    </div>
  );
}
