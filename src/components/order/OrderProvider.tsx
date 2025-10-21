import React, { createContext, useContext, useReducer, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getDiscountCode, clearDiscountCode } from '@/lib/auth'
import type { DiscountCode } from '@/lib/types'

// Define the type for a pizza item
export interface PizzaItem {
  id: string | number
  name: string
  description: string
  price: number
  size: string
  toppings: string[]
  quantity: number
}

// Define the cart state type
interface CartState {
  items: PizzaItem[]
  totalAmount: number
  totalItems: number
  discountCode: DiscountCode | null
  discountAmount: number
  finalAmount: number
}

// Define the action types
type CartAction =
  | { type: 'ADD_TO_CART'; payload: Omit<PizzaItem, 'quantity'> & { quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string | number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string | number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_DISCOUNT'; payload: DiscountCode }
  | { type: 'REMOVE_DISCOUNT' }

// Define the initial state
const initialState: CartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  discountCode: null,
  discountAmount: 0,
  finalAmount: 0,
}

// Helper function to calculate discount
const calculateDiscount = (totalAmount: number, discountCode: DiscountCode | null): number => {
  if (!discountCode || !discountCode.discount_percentage) return 0
  return Math.round((totalAmount * discountCode.discount_percentage) / 100 * 100) / 100 // Round to 2 decimal places
}

// Create the reducer function
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { id, quantity } = action.payload
      const existingItemIndex = state.items.findIndex(item => item.id === id)
      
      let newTotalAmount = state.totalAmount
      let newTotalItems = state.totalItems
      let newItems = [...state.items]
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const existingItem = newItems[existingItemIndex]
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        }
        newTotalItems = state.totalItems + quantity
        newTotalAmount = state.totalAmount + (action.payload.price * quantity)
      } else {
        // Add new item
        const newItem: PizzaItem = {
          ...action.payload,
        }
        newItems = [...state.items, newItem]
        newTotalItems = state.totalItems + quantity
        newTotalAmount = state.totalAmount + (action.payload.price * quantity)
      }
      
      // Calculate discount and final amount
      const discountAmount = calculateDiscount(newTotalAmount, state.discountCode)
      const finalAmount = newTotalAmount - discountAmount
      
      return {
        ...state,
        items: newItems,
        totalItems: newTotalItems,
        totalAmount: newTotalAmount,
        discountAmount,
        finalAmount,
      }
    }
    
    case 'REMOVE_FROM_CART': {
      const itemId = action.payload
      const existingItem = state.items.find(item => item.id === itemId)
      
      if (!existingItem) return state
      
      const updatedItems = state.items.filter(item => item.id !== itemId)
      const newTotalAmount = state.totalAmount - (existingItem.price * existingItem.quantity)
      const newTotalItems = state.totalItems - existingItem.quantity
      
      // Calculate discount and final amount
      const discountAmount = calculateDiscount(newTotalAmount, state.discountCode)
      const finalAmount = newTotalAmount - discountAmount
      
      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        totalAmount: newTotalAmount,
        discountAmount,
        finalAmount,
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: id })
      }
      
      const existingItemIndex = state.items.findIndex(item => item.id === id)
      if (existingItemIndex === -1) return state
      
      const existingItem = state.items[existingItemIndex]
      const quantityDifference = quantity - existingItem.quantity
      
      const updatedItems = [...state.items]
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity,
      }
      
      const newTotalAmount = state.totalAmount + (existingItem.price * quantityDifference)
      const newTotalItems = state.totalItems + quantityDifference
      
      // Calculate discount and final amount
      const discountAmount = calculateDiscount(newTotalAmount, state.discountCode)
      const finalAmount = newTotalAmount - discountAmount
      
      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        totalAmount: newTotalAmount,
        discountAmount,
        finalAmount,
      }
    }
    
    case 'CLEAR_CART':
      return {
        ...initialState,
        discountCode: state.discountCode, // Keep discount code when clearing cart
      }
    
    case 'APPLY_DISCOUNT': {
      const discountAmount = calculateDiscount(state.totalAmount, action.payload)
      const finalAmount = state.totalAmount - discountAmount
      
      return {
        ...state,
        discountCode: action.payload,
        discountAmount,
        finalAmount,
      }
    }
    
    case 'REMOVE_DISCOUNT': {
      return {
        ...state,
        discountCode: null,
        discountAmount: 0,
        finalAmount: state.totalAmount,
      }
    }
    
    default:
      return state
  }
}

// Create the context
interface CartContextType {
  cart: CartState
  addToCart: (item: Omit<PizzaItem, 'quantity'> & { quantity: number }) => void
  removeFromCart: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
  applyDiscount: (discountCode: DiscountCode) => void
  removeDiscount: () => void
  isOrderProcessing: boolean
  setIsOrderProcessing: (processing: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Create the provider component
interface OrderProviderProps {
  children: ReactNode
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  const [isOrderProcessing, setIsOrderProcessing] = useState(false)
  
  // Load discount code from localStorage on mount
  useEffect(() => {
    const loadDiscountCode = () => {
      try {
        const discountCode = getDiscountCode()
        if (discountCode) {
          dispatch({ type: 'APPLY_DISCOUNT', payload: discountCode })
        }
      } catch (error) {
        console.error('Error loading discount code:', error)
      }
    }
    
    loadDiscountCode()
  }, [])

  const addToCart = (item: Omit<PizzaItem, 'quantity'> & { quantity: number }) => {
    // Validate the item before adding to cart
    const isValidPrice = !isNaN(item.price) && item.price > 0;
    const isValidQuantity = !isNaN(item.quantity) && item.quantity > 0;
    const hasValidName = item.name && typeof item.name === 'string' && item.name.trim().length > 0;
    const hasValidSize = item.size && typeof item.size === 'string' && item.size.trim().length > 0;
    const hasValidToppings = Array.isArray(item.toppings);
    
    console.log('[DIAGNOSTIC] addToCart called with item:', {
      id: item.id,
      idType: typeof item.id,
      name: item.name,
      price: item.price,
      priceType: typeof item.price,
      priceValue: Number(item.price),
      priceIsNaN: isNaN(item.price),
      priceIsGreaterThanZero: item.price > 0,
      isValidPrice: isValidPrice,
      size: item.size,
      toppings: item.toppings,
      toppingsType: typeof item.toppings,
      isArray: Array.isArray(item.toppings),
      quantity: item.quantity,
      quantityType: typeof item.quantity,
      quantityValue: Number(item.quantity),
      quantityIsNaN: isNaN(item.quantity),
      quantityIsGreaterThanZero: item.quantity > 0,
      isValidQuantity: isValidQuantity,
      hasValidName: hasValidName,
      hasValidSize: hasValidSize,
      hasValidToppings: hasValidToppings
    });
    
    if (!isValidPrice || !isValidQuantity || !hasValidName || !hasValidSize || !hasValidToppings) {
      console.error('[DIAGNOSTIC] Attempted to add invalid item to cart:', {
        id: item.id,
        name: item.name,
        price: item.price,
        priceType: typeof item.price,
        priceValue: Number(item.price),
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        quantityValue: Number(item.quantity),
        size: item.size,
        toppings: item.toppings,
        validationFailures: {
          isValidPrice,
          isValidQuantity,
          hasValidName,
          hasValidSize,
          hasValidToppings
        }
      });
      // Don't add invalid items to cart
      return;
    }
    
    console.log('[DIAGNOSTIC] Item passed validation, adding to cart');
    dispatch({ type: 'ADD_TO_CART', payload: item })
  }

  const removeFromCart = (id: string | number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id })
  }

  const updateQuantity = (id: string | number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const applyDiscount = (discountCode: DiscountCode) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: discountCode })
  }

  const removeDiscount = () => {
    dispatch({ type: 'REMOVE_DISCOUNT' })
    clearDiscountCode() // Also remove from localStorage
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, applyDiscount, removeDiscount, isOrderProcessing, setIsOrderProcessing }}>
      {children}
    </CartContext.Provider>
  )
}

// Create a custom hook to use the cart context
export const useOrder = (): CartContextType => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}