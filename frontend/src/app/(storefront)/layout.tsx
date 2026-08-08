'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, Menu, X, Package } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>全场满99元包邮 | 新用户首单9折</span>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="hover:text-gray-300">{user?.email}</Link>
                <button onClick={logout} className="hover:text-gray-300">退出</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-300">登录</Link>
                <Link href="/register" className="hover:text-gray-300">注册</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Package className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ShopNow</span>
            </Link>

            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="搜索商品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
              {/* Account */}
              <Link href="/account" className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                <User className="w-6 h-6 text-gray-700" />
              </Link>
              {/* Mobile Menu */}
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Search - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link href="/products" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>全部商品</Link>
              <Link href="/cart" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>购物车</Link>
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>我的订单</Link>
                  <Link href="/account" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>账户管理</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>登录</Link>
                  <Link href="/register" className="block py-2 text-gray-700 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>注册</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">ShopNow</span>
              </div>
              <p className="text-sm">现代化的电商购物平台，为您提供优质的购物体验。</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">购物指南</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white">全部商品</Link></li>
                <li><Link href="/products" className="hover:text-white">新品上市</Link></li>
                <li><Link href="/products" className="hover:text-white">热销排行</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">客户服务</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/account" className="hover:text-white">我的账户</Link></li>
                <li><Link href="/orders" className="hover:text-white">我的订单</Link></li>
                <li><Link href="/cart" className="hover:text-white">购物车</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">关于我们</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white">公司简介</span></li>
                <li><span className="hover:text-white">联系我们</span></li>
                <li><span className="hover:text-white">隐私政策</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 ShopNow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
