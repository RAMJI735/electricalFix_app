import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import CartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    totalQuantity: 0,
    totalPrice: 0,
    discount: 0,
    couponCode: '',
    shippingFee: 0,
    tax: 0,
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch latest cart from backend
   */
  const fetchCart = useCallback(async () => {
    try {
      setError(null);
      const data = await CartService.getCart(user?._id || user?.id);
      if (data) {
        setCart(data);
      }
    } catch (err) {
      console.warn('Error fetching cart:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart on mount and when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
        discount: 0,
        couponCode: '',
        shippingFee: 0,
        tax: 0,
        grandTotal: 0,
      });
      setLoading(false);
    }
  }, [fetchCart, isAuthenticated]);

  /**
   * Add item to cart with backend persistence (Requires user login)
   */
  const addToCart = async (product, quantity = 1, notes = '') => {
    if (!isAuthenticated) {
      const authErr = new Error('Please log in to add items to your cart');
      authErr.code = 'AUTH_REQUIRED';
      setError(authErr.message);
      throw authErr;
    }
    setUpdating(true);
    setError(null);
    try {
      const updatedCart = await CartService.addToCart(
        product,
        quantity,
        notes,
        user?._id || user?.id
      );
      if (updatedCart) {
        setCart(updatedCart);
      } else {
        await fetchCart();
      }
      return true;
    } catch (err) {
      console.error('Add to cart failed:', err.message);
      setError(err.message);
      // Fallback: reload cart
      await fetchCart();
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Update quantity of an item in cart
   */
  const updateQuantity = async (targetId, newQty) => {
    if (newQty <= 0) {
      return removeFromCart(targetId);
    }

    setUpdating(true);
    setError(null);

    // Optimistic UI update
    setCart((prev) => {
      const updatedItems = (prev.items || []).map((i) => {
        const idMatches =
          i._id === targetId ||
          i.id === targetId ||
          i.item?._id === targetId ||
          i.item === targetId;
        return idMatches ? { ...i, quantity: newQty, itemTotal: (i.price || 0) * newQty } : i;
      });
      const newQtyTotal = updatedItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
      const newSubtotal = updatedItems.reduce(
        (acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1),
        0
      );
      const tax = Math.round(newSubtotal * 0.18);
      const shipping = newSubtotal > 2000 || newSubtotal === 0 ? 0 : 150;
      return {
        ...prev,
        items: updatedItems,
        totalQuantity: newQtyTotal,
        totalPrice: newSubtotal,
        tax,
        shippingFee: shipping,
        grandTotal: newSubtotal + tax + shipping - (prev.discount || 0),
      };
    });

    try {
      const updatedCart = await CartService.updateCartItem(
        targetId,
        newQty,
        '',
        user?._id || user?.id
      );
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (err) {
      console.error('Update quantity failed:', err.message);
      setError(err.message);
      await fetchCart();
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = async (targetId) => {
    setUpdating(true);
    setError(null);

    // Optimistic removal
    setCart((prev) => {
      const filtered = (prev.items || []).filter((i) => {
        const idMatches =
          i._id === targetId ||
          i.id === targetId ||
          i.item?._id === targetId ||
          i.item === targetId;
        return !idMatches;
      });
      const newQtyTotal = filtered.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
      const newSubtotal = filtered.reduce(
        (acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1),
        0
      );
      const tax = Math.round(newSubtotal * 0.18);
      const shipping = newSubtotal > 2000 || newSubtotal === 0 ? 0 : 150;
      return {
        ...prev,
        items: filtered,
        totalQuantity: newQtyTotal,
        totalPrice: newSubtotal,
        tax,
        shippingFee: shipping,
        grandTotal: Math.max(0, newSubtotal + tax + shipping - (prev.discount || 0)),
      };
    });

    try {
      const updatedCart = await CartService.removeCartItem(
        targetId,
        user?._id || user?.id
      );
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (err) {
      console.error('Remove from cart failed:', err.message);
      setError(err.message);
      await fetchCart();
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Clear active cart
   */
  const clearCart = async () => {
    setUpdating(true);
    setError(null);
    setCart({
      items: [],
      totalQuantity: 0,
      totalPrice: 0,
      discount: 0,
      couponCode: '',
      shippingFee: 0,
      tax: 0,
      grandTotal: 0,
    });

    try {
      await CartService.clearCart(user?._id || user?.id);
    } catch (err) {
      console.error('Clear cart failed:', err.message);
      setError(err.message);
      await fetchCart();
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Apply coupon code
   */
  const applyCoupon = async (code) => {
    setUpdating(true);
    setError(null);
    try {
      const updatedCart = await CartService.applyCoupon(
        code,
        user?._id || user?.id
      );
      if (updatedCart) {
        setCart(updatedCart);
      }
      return updatedCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Remove coupon
   */
  const removeCoupon = async () => {
    setUpdating(true);
    setError(null);
    try {
      const updatedCart = await CartService.removeCoupon(
        user?._id || user?.id
      );
      if (updatedCart) {
        setCart(updatedCart);
      }
      return updatedCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Normalise cart items format for UI components
  const normalizedItems = (cart?.items || []).map((item) => {
    const populated = typeof item.item === 'object' && item.item !== null ? item.item : {};
    return {
      id: item._id || item.id || populated._id,
      itemId: populated._id || item.item,
      name: item.name || populated.serviceName || populated.name || 'Electrical Item',
      price: Number(item.price !== undefined ? item.price : populated.price) || 0,
      quantity: Number(item.quantity) || 1,
      brand: item.brand || populated.brand || 'Voltline',
      spec: populated.estimated_time
        ? `${populated.estimated_time} • ${populated.warranty || 'ISI Certified'}`
        : (populated.warranty || 'Certified Electrical Standard'),
      category: item.category || populated.category || '',
      type: item.type || populated.type || 'service',
      image: item.image || populated.image || '',
      itemTotal: item.itemTotal || (item.price || 0) * (item.quantity || 1),
      notes: item.notes || '',
    };
  });

  const totalCartCount =
    cart?.totalQuantity !== undefined && cart?.totalQuantity !== null
      ? cart.totalQuantity
      : normalizedItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  /**
   * Check if a product or service is already present in the cart
   */
  const isInCart = useCallback(
    (target) => {
      if (!target) return false;
      const targetId = String(
        typeof target === 'object'
          ? (target._id || target.id || target.itemId || target.serviceId || '')
          : target
      );
      const targetName =
        typeof target === 'object'
          ? (target.name || target.serviceName || '').trim().toLowerCase()
          : '';

      return normalizedItems.some((ci) => {
        const ciId = String(ci.id || ci._id || '');
        const ciItemId = String(ci.itemId || '');
        const matchesId = Boolean(targetId && (ciId === targetId || ciItemId === targetId));
        const matchesName = Boolean(
          targetName && ci.name && ci.name.trim().toLowerCase() === targetName
        );
        return matchesId || matchesName;
      });
    },
    [normalizedItems]
  );

  const value = {
    cart,
    cartItems: normalizedItems,
    totalCartCount,
    loading,
    updating,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
