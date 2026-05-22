import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─── 1. TABLE NUMBER PARSING ──────────────────────────────────────────────────

describe('Table number parsing from URL', () => {
  function parseTableNumber(searchString: string): number | null {
    const params = new URLSearchParams(searchString);
    const raw = params.get('table');
    if (raw === null) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  it('extracts table number from ?table=15', () => {
    expect(parseTableNumber('table=15')).toBe(15);
  });

  it('returns null when table param is missing', () => {
    expect(parseTableNumber('')).toBeNull();
  });

  it('returns null when table param is not a number', () => {
    expect(parseTableNumber('table=abc')).toBeNull();
  });

  it('handles table=0', () => {
    expect(parseTableNumber('table=0')).toBe(0);
  });

  it('handles large table numbers', () => {
    expect(parseTableNumber('table=999')).toBe(999);
  });
});

// ─── 2. CART BUSINESS LOGIC ──────────────────────────────────────────────────

import type { MenuItem, CartState, CartAction } from '@/app/types';

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
            i.menuItem.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { menuItem: action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.menuItem.id !== action.payload) };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.menuItem.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItem.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
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

const makeItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 'test-1',
  name: 'Test Dish',
  category: 'mains',
  description: 'Test description',
  price: 500,
  calories: 400,
  ingredients: [],
  glbSrc: '/models/test.glb',
  usdzSrc: '/models/test.usdz',
  imageSrc: '/images/test.jpg',
  ...overrides,
});

const emptyState: CartState = { items: [], tableNumber: null, activeModelId: null };

describe('Cart business logic — total price calculation', () => {
  it('starts with zero total', () => {
    const total = emptyState.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(0);
  });

  it('calculates total after adding one item', () => {
    const item = makeItem({ price: 690 });
    const state = cartReducer(emptyState, { type: 'ADD_ITEM', payload: item });
    const total = state.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(690);
  });

  it('increases quantity instead of duplicating when same item added twice', () => {
    const item = makeItem({ price: 500 });
    let state = cartReducer(emptyState, { type: 'ADD_ITEM', payload: item });
    state = cartReducer(state, { type: 'ADD_ITEM', payload: item });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    const total = state.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(1000);
  });

  it('recalculates total after removing an item', () => {
    const item1 = makeItem({ id: 'a', price: 300 });
    const item2 = makeItem({ id: 'b', price: 700 });
    let state = cartReducer(emptyState, { type: 'ADD_ITEM', payload: item1 });
    state = cartReducer(state, { type: 'ADD_ITEM', payload: item2 });
    state = cartReducer(state, { type: 'REMOVE_ITEM', payload: 'a' });
    const total = state.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(700);
  });

  it('removes item when quantity updated to 0', () => {
    const item = makeItem({ price: 400 });
    let state = cartReducer(emptyState, { type: 'ADD_ITEM', payload: item });
    state = cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: 0 } });
    expect(state.items).toHaveLength(0);
  });

  it('clears all items on CLEAR_CART', () => {
    const item = makeItem({ price: 600 });
    let state = cartReducer(emptyState, { type: 'ADD_ITEM', payload: item });
    state = cartReducer(state, { type: 'CLEAR_CART' });
    expect(state.items).toHaveLength(0);
  });

  it('calculates total for multiple different items', () => {
    const items = [
      makeItem({ id: 'x', price: 200 }),
      makeItem({ id: 'y', price: 350 }),
      makeItem({ id: 'z', price: 150 }),
    ];
    let state = emptyState;
    for (const item of items) {
      state = cartReducer(state, { type: 'ADD_ITEM', payload: item });
    }
    const total = state.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    expect(total).toBe(700);
  });
});

// ─── 3. AR MODEL PATH MAPPING ─────────────────────────────────────────────────

import { MENU_ITEMS } from '@/app/data/menu';

describe('AR model path initialisation', () => {
  it('every menu item has a .glb path', () => {
    for (const item of MENU_ITEMS) {
      expect(item.glbSrc).toMatch(/\.glb$/);
    }
  });

  it('every menu item has a .usdz path', () => {
    for (const item of MENU_ITEMS) {
      expect(item.usdzSrc).toMatch(/\.usdz$/);
    }
  });

  it('glb and usdz share the same base filename', () => {
    for (const item of MENU_ITEMS) {
      const glbBase = item.glbSrc.replace(/\.glb$/, '');
      const usdzBase = item.usdzSrc.replace(/\.usdz$/, '');
      expect(glbBase).toBe(usdzBase);
    }
  });

  it('paths use /models/ directory', () => {
    for (const item of MENU_ITEMS) {
      expect(item.glbSrc).toMatch(/^\/models\//);
      expect(item.usdzSrc).toMatch(/^\/models\//);
    }
  });

  it('item ids are unique', () => {
    const ids = MENU_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all items have valid categories', () => {
    const valid = new Set(['appetizers', 'mains', 'desserts', 'drinks']);
    for (const item of MENU_ITEMS) {
      expect(valid.has(item.category)).toBe(true);
    }
  });

  it('all prices are positive numbers', () => {
    for (const item of MENU_ITEMS) {
      expect(item.price).toBeGreaterThan(0);
    }
  });
});

// ─── 4. CART CONTEXT COMPONENT TEST ──────────────────────────────────────────

import { CartProvider, useCart } from '@/app/context/CartContext';

function TestConsumer({ item }: { item: MenuItem }) {
  const { addItem, totalPrice, totalItems, cartItems } = useCart();
  return (
    <div>
      <button onClick={() => addItem(item)}>add</button>
      <span data-testid="total">{totalPrice}</span>
      <span data-testid="count">{totalItems}</span>
      <span data-testid="items">{cartItems.length}</span>
    </div>
  );
}

describe('CartProvider integration', () => {
  const item = makeItem({ id: 'p1', price: 750 });

  it('renders children and starts with empty cart', () => {
    render(
      <CartProvider tableNumber={7}>
        <TestConsumer item={item} />
      </CartProvider>
    );
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('updates total when item is added', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider tableNumber={7}>
        <TestConsumer item={item} />
      </CartProvider>
    );
    await user.click(screen.getByText('add'));
    expect(screen.getByTestId('total').textContent).toBe('750');
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('accumulates quantity on repeated add', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider tableNumber={5}>
        <TestConsumer item={item} />
      </CartProvider>
    );
    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('add'));
    expect(screen.getByTestId('total').textContent).toBe('1500');
    expect(screen.getByTestId('items').textContent).toBe('1'); // still one line item
  });
});
