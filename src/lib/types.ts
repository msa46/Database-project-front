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