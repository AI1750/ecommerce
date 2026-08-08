'use client';

import { useState, useEffect, useCallback } from 'react';
import { storeApi } from '@/lib/api-client';
import type { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  itemCount: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
}

function getStoredCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cart_id');
}

function storeCartId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart_id', id);
    storeApi.setCartId(id);
  }
}

export function useCart() {
  const [state, setState] = useState<CartState>({
    cart: null,
    itemCount: 0,
    subtotal: 0,
    loading: true,
    error: null,
  });

  const fetchCart = useCallback(async (cartId: string) => {
    try {
      const res = await storeApi.get<Cart>(`/carts/${cartId}`);
      if (res.success && res.data) {
        setState({
          cart: res.data,
          itemCount: res.data.itemCount || 0,
          subtotal: res.data.subtotal || 0,
          loading: false,
          error: null,
        });
        return;
      }
    } catch {
      // Cart might be expired, create new
    }
    // Create new cart
    try {
      const res = await storeApi.post<Cart>('/carts');
      if (res.success && res.data) {
        storeCartId(res.data.id);
        setState({
          cart: res.data,
          itemCount: 0,
          subtotal: 0,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to create cart',
      }));
    }
  }, []);

  useEffect(() => {
    const storedId = getStoredCartId();
    if (storedId) {
      storeApi.setCartId(storedId);
      fetchCart(storedId);
    } else {
      fetchCart('');
    }
  }, [fetchCart]);

  const addItem = async (variantId: string, quantity: number = 1) => {
    if (!state.cart) return false;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await storeApi.post<{ cart: Cart }>(`/carts/${state.cart.id}/items`, {
        variant_id: variantId,
        quantity,
      });
      if (res.success && res.data) {
        setState({
          cart: res.data.cart,
          itemCount: res.data.cart.itemCount || 0,
          subtotal: res.data.cart.subtotal || 0,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to add item',
      }));
      return false;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (!state.cart) return false;
    try {
      const res = await storeApi.put<{ cart: Cart }>(`/carts/${state.cart.id}/items/${itemId}`, { quantity });
      if (res.success && res.data) {
        setState({
          cart: res.data.cart,
          itemCount: res.data.cart.itemCount || 0,
          subtotal: res.data.cart.subtotal || 0,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to update item',
      }));
      return false;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!state.cart) return false;
    try {
      const res = await storeApi.delete<{ cart: Cart }>(`/carts/${state.cart.id}/items/${itemId}`);
      if (res.success && res.data) {
        setState({
          cart: res.data.cart,
          itemCount: res.data.cart.itemCount || 0,
          subtotal: res.data.cart.subtotal || 0,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to remove item',
      }));
      return false;
    }
  };

  const clearCart = async () => {
    // Clear local state and create new cart
    localStorage.removeItem('cart_id');
    storeApi.setCartId(null);
    try {
      const res = await storeApi.post<Cart>('/carts');
      if (res.success && res.data) {
        storeCartId(res.data.id);
        setState({
          cart: res.data,
          itemCount: 0,
          subtotal: 0,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to clear cart',
      }));
    }
  };

  return {
    ...state,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart: () => state.cart && fetchCart(state.cart.id),
  };
}
