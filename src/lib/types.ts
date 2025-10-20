// Order related types
export interface OrderData {
  items: {
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

export interface OrderResponse {
  success: boolean
  orderId?: string
  message?: string
  error?: string
}