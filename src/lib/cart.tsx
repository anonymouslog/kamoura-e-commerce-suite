import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BagItem = {
  key: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: BagItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<BagItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "kamoura.bag.v1";
const CartContext = createContext<CartContextValue | null>(null);

const keyOf = (slug: string, size: string, color: string) => `${slug}::${size}::${color}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Guest bag lives in localStorage; when Supabase is connected this is where
  // the carts/cart_items sync + merge-on-login would hook in.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as BagItem[]);
    } catch {
      /* corrupt payload — start with an empty bag */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    const key = keyOf(item.slug, item.size, item.color);
    setItems((current) => {
      const existing = current.find((i) => i.key === key);
      if (existing) {
        return current.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i,
        );
      }
      return [...current, { ...item, key, quantity }];
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((key, quantity) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.key !== key)
        : current.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 10) } : i)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    return { items, count, subtotal, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
