'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) router.push(redirect);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">用户登录</h1>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">邮箱</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" required />
            </div>
            <div>
              <label className="label">密码</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg disabled:opacity-50">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            还没有账号？<Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">立即注册</Link>
          </p>
          <div className="border-t mt-6 pt-4 text-center">
            <p className="text-xs text-gray-400 mb-2">测试账号</p>
            <p className="text-xs text-gray-500">customer@example.com / customer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
