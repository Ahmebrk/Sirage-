import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  nameAr: string;
  price: number;
  quantity: number;
  image: string;
  stock?: number;
};

const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
} | null>(null);

export function formatDZD(value: number) {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("sirage-cart") || "[]"
      ) as CartItem[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("sirage-cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem(item: CartItem) {
        setItems(current => {
          const existing = current.find(entry => entry.slug === item.slug);
          if (existing)
            return current.map(entry =>
              entry.slug === item.slug
                ? {
                    ...entry,
                    quantity: Math.min(
                      entry.quantity + item.quantity,
                      entry.stock || 99
                    ),
                  }
                : entry
            );
          return [...current, item];
        });
      },
      updateQuantity(slug: string, quantity: number) {
        if (quantity < 1)
          return setItems(current =>
            current.filter(item => item.slug !== slug)
          );
        setItems(current =>
          current.map(item =>
            item.slug === slug
              ? { ...item, quantity: Math.min(quantity, item.stock || 99) }
              : item
          )
        );
      },
      removeItem(slug: string) {
        setItems(current => current.filter(item => item.slug !== slug));
      },
      clear() {
        setItems([]);
      },
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
