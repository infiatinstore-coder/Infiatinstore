import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            // Add item to cart
            addItem: (product, variant = null, quantity = 1) => {
                const items = get().items;
                const existingIndex = items.findIndex(
                    (item) =>
                        item.productId === product.id &&
                        item.variantId === (variant?.id || null)
                );

                if (existingIndex > -1) {
                    // Update quantity if item exists
                    const newItems = [...items];
                    newItems[existingIndex].quantity += quantity;
                    set({ items: newItems });
                } else {
                    // Add new item
                    const newItem = {
                        id: `${product.id}-${variant?.id || 'default'}`,
                        productId: product.id,
                        variantId: variant?.id || null,
                        name: product.name,
                        variantName: variant?.name || null,
                        image: product.images?.[0] || '/placeholder-product.jpg',
                        basePrice: Number(product.basePrice),
                        salePrice: product.salePrice ? Number(product.salePrice) : null,
                        quantity,
                        stock: variant?.stock || product.stock,
                    };
                    set({ items: [...items, newItem] });
                }
            },

            // Remove item from cart
            removeItem: (itemId) => {
                const items = get().items.filter((item) => item.id !== itemId);
                set({ items });
            },

            // Update item quantity
            updateQuantity: (itemId, quantity) => {
                if (quantity < 1) return;
                const items = get().items.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                );
                set({ items });
            },

            // Increase quantity
            increaseQuantity: (itemId) => {
                const item = get().items.find((i) => i.id === itemId);
                if (item && item.quantity < item.stock) {
                    get().updateQuantity(itemId, item.quantity + 1);
                }
            },

            // Decrease quantity
            decreaseQuantity: (itemId) => {
                const item = get().items.find((i) => i.id === itemId);
                if (item && item.quantity > 1) {
                    get().updateQuantity(itemId, item.quantity - 1);
                }
            },

            // Clear cart
            clearCart: () => set({ items: [] }),

            // Toggle cart drawer
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            // Get cart total
            getTotal: () => {
                return get().items.reduce((total, item) => {
                    const price = item.salePrice || item.basePrice;
                    return total + price * item.quantity;
                }, 0);
            },

            // Get items count
            getItemsCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'infiya-cart',
        }
    )
);

export default useCartStore;
