'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { CartState, CartAction, MenuItem, CartItem } from '@/app/types';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_TABLE':
      return { ...state, tableNumber: action.payload };

    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.menuItem.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.menuItem.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { menuItem: action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.menuItem.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => i.menuItem.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItem.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }

    case 'SET_ACTIVE_MODEL':
      return { ...state, activeModelId: action.payload };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setActiveModel: (id: string | null) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  cartItems: CartItem[];
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = {
  items: [],
  tableNumber: null,
  activeModelId: null,
};

export function CartProvider({
  children,
  tableNumber,
}: {
  children: React.ReactNode;
  tableNumber: number | null;
}) {
  const [state, dispatch] = useReducer(cartReducer, {
    ...initialState,
    tableNumber,
  });

  useEffect(() => {
    if (tableNumber !== null) {
      dispatch({ type: 'SET_TABLE', payload: tableNumber });
    }
  }, [tableNumber]);

  const addItem = useCallback((item: MenuItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const setActiveModel = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_MODEL', payload: id });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        setActiveModel,
        clearCart,
        totalPrice,
        totalItems,
        cartItems: state.items,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
