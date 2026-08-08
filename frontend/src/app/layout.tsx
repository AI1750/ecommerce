import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopNow - 电商平台',
  description: '现代化的电商购物平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
