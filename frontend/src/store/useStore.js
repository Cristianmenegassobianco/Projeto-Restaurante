import { create } from 'zustand';

const useStore = create((set) => ({
  session: null,
  setSession: (sessionData) => set({ session: sessionData }),
  
  cart: [],
  addToCart: (product, quantity, notes) => set((state) => {
    const existingItem = state.cart.find(item => item.product.id === product.id && item.notes === notes);
    
    if (existingItem) {
      return {
        cart: state.cart.map(item =>
          item.product.id === product.id && item.notes === notes
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      };
    }
    
    return { cart: [...state.cart, { product, quantity, notes }] };
  }),
  
  removeFromCart: (productId, notes) => set((state) => ({
    cart: state.cart.filter(item => !(item.product.id === productId && item.notes === notes))
  })),

  clearCart: () => set({ cart: [] })
}));

export default useStore;
