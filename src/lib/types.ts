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

// Discount code related types
export interface DiscountCode {
  id: string;
  code: string;
  user_id: string;
  created_at: string;
  expires_at?: string;
  used: boolean;
  discount_percentage?: number;
}

export interface CreateDiscountCodeRequest {
  user_id: string;
}

export interface CreateDiscountCodeResponse {
  success: boolean;
  discount_code?: DiscountCode;
  error?: string;
}

export interface ValidateDiscountCodeRequest {
  code: string;
}

export interface ValidateDiscountCodeResponse {
  success: boolean;
  valid: boolean;
  discount_code?: DiscountCode;
  error?: string;
}