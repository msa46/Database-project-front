import ky from 'ky'
import { getToken } from './auth'
import type { OrderData, OrderResponse } from './types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Debug: Log the API URL when the module loads
console.log('[DEBUG] API_URL initialized to:', API_URL);
console.log('[DEBUG] Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

export async function submitOrder(orderData: OrderData): Promise<OrderResponse> {
  try {
    const token = getToken()
    console.log('[DEBUG] Submitting order with token:', token ? 'Token present' : 'No token')
    
    // Check if token exists
    if (!token) {
      console.error('[DEBUG] No authentication token found. User may need to log in again.')
      return {
        success: false,
        error: 'Authentication required. Please log in again to place your order.'
      }
    }
    
    // Enhanced validation of order data
    console.log('[DEBUG] Order data being sent:', JSON.stringify(orderData, null, 2))
    console.log('[DEBUG] Order data types:', {
      items: typeof orderData.items,
      itemsLength: orderData.items?.length,
      totalAmount: typeof orderData.totalAmount,
      totalItems: typeof orderData.totalItems,
      firstItemId: orderData.items[0]?.id,
      firstItemIdType: typeof orderData.items[0]?.id,
      firstItemPrice: orderData.items[0]?.price,
      firstItemPriceType: typeof orderData.items[0]?.price,
      firstItemQuantity: orderData.items[0]?.quantity,
      firstItemQuantityType: typeof orderData.items[0]?.quantity,
    })
    
    // Validate each item in the order
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach((item, index) => {
        console.log(`[DEBUG] Item ${index} details:`, {
          id: item.id,
          idType: typeof item.id,
          name: item.name,
          nameType: typeof item.name,
          price: item.price,
          priceType: typeof item.price,
          size: item.size,
          sizeType: typeof item.size,
          toppings: item.toppings,
          toppingsType: typeof item.toppings,
          isArray: Array.isArray(item.toppings),
          quantity: item.quantity,
          quantityType: typeof item.quantity,
        })
      })
    }
    
    console.log('[DEBUG] Full order submission URL:', `${API_URL}/v1/order-multiple-pizzas`)
    console.log('[DEBUG] API_URL being used:', API_URL)
    
    // Use the correct endpoint for multiple pizza orders
    console.log('[DEBUG] Using correct endpoint: /v1/order-multiple-pizzas')
    const endpointUsed = '/v1/order-multiple-pizzas'
    
    // Ensure Content-Type header is set
    const response = await ky.post(`${API_URL}/v1/order-multiple-pizzas`, {
      json: orderData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
    })

    console.log('[DEBUG] Response status from', endpointUsed, ':', response.status)
    console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DEBUG] Order submission error from', endpointUsed, ':', errorText)
      console.error('[DEBUG] Response status text:', response.statusText)
      console.error('[DEBUG] Response status code:', response.status)
      
      // Handle 422 Unprocessable Entity specifically
      if (response.status === 422) {
        console.error('[DEBUG] Unprocessable Entity Error - The server understands the request but cannot process the contained instructions')
        try {
          const errorJson = JSON.parse(errorText)
          console.error('[DEBUG] Parsed 422 error:', errorJson)
          return {
            success: false,
            error: `Invalid order data: ${errorJson.detail || JSON.stringify(errorJson)}`
          }
        } catch {
          return {
            success: false,
            error: `Invalid order data: The server could not process your order. Please check your cart items and try again.`
          }
        }
      }
      
      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        console.error('[DEBUG] Authentication error - token may be expired or invalid')
        return {
          success: false,
          error: 'Your session has expired. Please log in again to place your order.'
        }
      }
      
      // Try to parse the error as JSON to get more details
      try {
        const errorJson = JSON.parse(errorText)
        return {
          success: false,
          error: errorJson.detail || errorJson.message || `Failed to place order: ${response.statusText}`
        }
      } catch {
        return {
          success: false,
          error: `Failed to place order: ${response.statusText} - ${errorText}`
        }
      }
    }

    const data = await response.json<OrderResponse>()
    console.log('[DEBUG] Order submission successful from', endpointUsed, ':', data)
    return data
  } catch (error) {
    console.error('[DEBUG] Order submission error:', error)
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to the server. Please check your connection.'
      }
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}