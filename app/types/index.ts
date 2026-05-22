export type MenuCategory = 'appetizers' | 'mains' | 'desserts' | 'drinks';

export interface IngredientOrigin {
  ingredient: string;
  origin: string;
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  calories: number;
  ingredients: IngredientOrigin[];
  glbSrc: string;
  usdzSrc: string;
  imageSrc: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  tableNumber: number | null;
  activeModelId: string | null;
}

export type CartAction =
  | { type: 'SET_TABLE'; payload: number }
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_ACTIVE_MODEL'; payload: string | null }
  | { type: 'CLEAR_CART' };
