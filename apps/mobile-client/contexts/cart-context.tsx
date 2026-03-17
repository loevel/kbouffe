import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Product, ProductOption } from '@kbouffe/shared-types';

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    selectedOptions: Record<string, string>;
    unitPrice: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartContextType {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    addItem: (product: Product, quantity: number, selectedOptions: Record<string, string>, restaurantId: string, restaurantName: string) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState<string | null>(null);

    const addItem = useCallback((product: Product, quantity: number, selectedOptions: Record<string, string>, restId: string, restName: string) => {
        // If cart has items from different restaurant, clear first
        if (restaurantId && restaurantId !== restId) {
            setItems([]);
        }
        setRestaurantId(restId);
        setRestaurantName(restName);

        // Calculate extra price from options
        let extraPrice = 0;
        if (product.options) {
            product.options.forEach(opt => {
                const selectedChoice = selectedOptions[opt.name];
                if (selectedChoice) {
                    const choice = opt.choices.find(c => c.label === selectedChoice);
                    if (choice) extraPrice += choice.extraPrice;
                }
            });
        }

        const unitPrice = product.price + extraPrice;
        const itemId = `${product.id}-${JSON.stringify(selectedOptions)}`;

        setItems(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (existing) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { id: itemId, product, quantity, selectedOptions, unitPrice, restaurantId: restId, restaurantName: restName }];
        });
    }, [restaurantId]);

    const removeItem = useCallback((itemId: string) => {
        setItems(prev => {
            const updated = prev.filter(i => i.id !== itemId);
            if (updated.length === 0) {
                setRestaurantId(null);
                setRestaurantName(null);
            }
            return updated;
        });
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(itemId);
            return;
        }
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }, [removeItem]);

    const clearCart = useCallback(() => {
        setItems([]);
        setRestaurantId(null);
        setRestaurantName(null);
    }, []);

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const deliveryFee = restaurantId ? 1000 : 0; // Default fee
    const total = subtotal + deliveryFee;

    return (
        <CartContext.Provider value={{ items, restaurantId, restaurantName, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, deliveryFee, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
