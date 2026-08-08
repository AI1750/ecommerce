'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, Share2, ChevronLeft, Minus, Plus, Truck } from 'lucide-react';
import { storeApi } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { Product as ProductType } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await storeApi.get<ProductType>(`/products/${params.id}`);
        if (res.success && res.data) {
          setProduct(res.data);
          if (res.data.variants?.length) {
            setSelectedVariant(res.data.variants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  // Group options for variant selection
  const optionGroups = product?.options?.map((opt) => ({
    ...opt,
    selectedValue: selectedVariant?.option_values?.find((ov: any) => ov.option_id === opt.id)?.value || null,
  }));

  const handleOptionSelect = (optionId: string, valueId: string) => {
    // Find variant matching all selected options
    const matching = product?.variants?.find((v) =>
      v.option_values?.every((ov: any) =>
        (ov.option_id === optionId ? ov.value === optionGroups?.find(o => o.id === optionId)?.values?.find(val => val.id === valueId)?.value : true) ||
        (ov.option_id !== optionId && optionGroups?.find(o => o.id === ov.option_id)?.selectedValue === ov.value)
      )
    );
    // Simpler: just select first variant for now
    if (product?.variants?.length) {
      // Find variant that has the selected option value
      const v = product.variants.find((v: any) =>
        v.option_values?.some((ov: any) => ov.option_id === optionId && ov.value === (optionGroups?.find(o => o.id === optionId)?.values?.find(val => val.id === valueId)?.value || ''))
      );
      if (v) setSelectedVariant(v);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAddingToCart(true);
    const success = await addItem(selectedVariant.id, quantity);
    setAddingToCart(false);
    if (success) {
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">商品不存在</p>
          <Link href="/products" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">返回商品列表</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ id: 'default', url: product.thumbnail || 'https://picsum.photos/seed/placeholder/600/600', alt_text: product.title }];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">首页</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700">商品</Link>
        <span>/</span>
        <span className="text-gray-900">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            <img
              src={images[selectedImage]?.url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${i === selectedImage ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.title}</h1>
          {product.subtitle && (
            <p className="text-gray-500 mt-2">{product.subtitle}</p>
          )}

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-red-600">
              {selectedVariant ? formatPrice(selectedVariant.price) : ''}
            </span>
            {selectedVariant?.compare_at_price && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(selectedVariant.compare_at_price)}
              </span>
            )}
            {selectedVariant?.compare_at_price && (
              <span className="badge badge-danger">
                省{formatPrice(selectedVariant.compare_at_price - selectedVariant.price)}
              </span>
            )}
          </div>

          {/* Variant Options */}
          {optionGroups?.map((opt: any) => (
            <div key={opt.id} className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">{opt.title}</h3>
              <div className="flex flex-wrap gap-2">
                {opt.values?.map((v: any) => {
                  const selected = selectedVariant?.option_values?.some((ov: any) => ov.value === v.value);
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleOptionSelect(opt.id, v.id)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {v.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">数量</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              {selectedVariant && (
                <span className="text-sm text-gray-500 ml-4">
                  库存: {selectedVariant.inventory_quantity} 件
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !selectedVariant}
              className="btn btn-primary btn-lg flex-1 gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {addedMsg ? '已加入购物车!' : addingToCart ? '添加中...' : '加入购物车'}
            </button>
            <button className="btn btn-outline btn-lg">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Shipping Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg flex items-start gap-3">
            <Truck className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">配送信息</p>
              <p className="mt-1">满99元包邮 · 预计2-5个工作日送达</p>
              <p>30天无忧退换货</p>
            </div>
          </div>

          {/* SKU */}
          {selectedVariant?.sku && (
            <p className="mt-4 text-xs text-gray-400">SKU: {selectedVariant.sku}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">商品详情</h2>
        <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
          {product.description}
        </div>
      </div>
    </div>
  );
}
