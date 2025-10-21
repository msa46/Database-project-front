// Order related types
export interface OrderData {
  pizzas: {
    id: string | number
    name: string
    price: number
    size: string
    toppings: string[]
    quantity: number
  }[]
  totalAmount: number
  totalItems: number
}

// Backend API request structure for order-pizza-with-extras endpoint
export interface MultiplePizzaOrderRequest {
  pizza_quantities: {
    pizza_id: number
    quantity: number
  }[]
  extra_ids?: number[] | null
  discount_code?: string | null
  postal_code?: string | null
}

// Legacy backend request structure (not used with order-pizza-with-extras)
export interface BackendOrderRequest {
  pizza_quantities: {
    pizza_id: number
    quantity: number
  }[]
  totalAmount: number
  totalItems: number
}

export interface OrderResponse {
  success: boolean
  orderId?: string
  message?: string
  error?: string
}

// Menu API types
export interface PizzaInfo {
  id: number
  name: string
  description?: string
  stock: number
}

export interface IngredientInfo {
  id: number
  name: string
  price: number
  type: string
}

export interface ExtraInfo {
  id: number
  name: string
  price: number
  type: string
}

export interface PizzaPriceResponse {
  price: number
}

// Discount API types
export interface DiscountCodeInfo {
  code: string
  percentage: number
  valid_from?: string
  valid_until?: string
  used: boolean
  type: string
  description: string
}

// Authentication API types
export interface UserResponse {
  id: number
  username: string
  email: string
  birthdate?: string
  address?: string
  postalCode?: string
  phone?: string
  gender?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user_id: number
  username: string
  email: string
}

// API Response wrapper types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  detail: string
  error_type?: string
  error_message?: string
}