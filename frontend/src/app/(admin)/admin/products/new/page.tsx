'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import type { Product, Category } from '@/types';

export default function AdminProductFormPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = !params.id;

  const [form, setForm] = useState({ title: '', subtitle: '', description: '', category_id: '', status: 'draft' as string, weight: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get<Category[]>('/categories').then(res => {
      if (res.success) setCategories(res.data!);
    });
    if (!isNew) {
      adminApi.get<Product>(`/products/${params.id}`).then(res => {
        if (res.success && res.data) {
          const p = res.data;
          setForm({
            title: p.title, subtitle: p.subtitle || '', description: p.description || '',
            category_id: p.category_id || '', status: p.status, weight: p.weight?.toString() || '',
          });
        }
      });
    }
  }, [isNew, params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form, weight: form.weight ? parseFloat(form.weight) : null };
      if (isNew) {
        const res = await adminApi.post<{ id: string }>('/products', data);
        if (res.success) router.push(`/admin/products/${res.data!.id}`);
      } else {
        await adminApi.put(`/products/${params.id}`, data);
        router.push('/admin/products');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  const flatCategories = categories.flatMap(c => [c, ...(c.children || [])]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? '新增商品' : '编辑商品'}</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="label">商品标题 *</label>
          <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        </div>
        <div>
          <label className="label">副标题</label>
          <input className="input" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
        </div>
        <div>
          <label className="label">商品描述</label>
          <textarea className="input min-h-[120px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">分类</label>
            <select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">无分类</option>
              {flatCategories.map(c => (
                <option key={c.id} value={c.id}>{c.parent_id ? '-- ' : ''}{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">重量 (克)</label>
          <input type="number" className="input" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
        </div>

        {!isNew && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">提示：创建后可以在此页面添加变体（SKU、价格、库存）和图片。</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary gap-2">
            <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-outline">取消</button>
        </div>
      </form>
    </div>
  );
}
