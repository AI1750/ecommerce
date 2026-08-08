'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', first_name: '', last_name: '' });
  const [localError, setLocalError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.confirmPassword) {
      setLocalError('两次密码不一致');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('密码至少6位');
      return;
    }
    const success = await register({ email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name });
    if (success) router.push('/');
  }

  const displayError = localError || error;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">用户注册</h1>
          {displayError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{displayError}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">姓</label>
                <input className="input" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
              </div>
              <div>
                <label className="label">名</label>
                <input className="input" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label">邮箱</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">密码</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="至少6位" required />
            </div>
            <div>
              <label className="label">确认密码</label>
              <input type="password" className="input" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg disabled:opacity-50">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            已有账号？<Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">去登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
