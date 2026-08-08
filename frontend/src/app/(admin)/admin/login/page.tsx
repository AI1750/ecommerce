'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password, true);
    if (success) router.push('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">管理后台</h1>
          <p className="text-sm text-gray-500 text-center mb-8">请使用管理员账号登录</p>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="label">邮箱</label><input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="label">密码</label><input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg disabled:opacity-50">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">默认: admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
