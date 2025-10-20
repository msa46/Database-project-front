import ky from 'ky'
import { getValidToken } from './auth'
import type { OrderData, BackendOrderRequest, MultiplePizzaOrderRequest, OrderResponse } from './types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Debug: Log the API URL when the module loads
console.log('[DEBUG] API_URL initialized to:', API_URL);
console.log('[DEBUG] Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

// Development mode flag - set to true to use unsecured endpoints
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.MODE === 'development';

// Hardcoded user credentials for development mode
const DEV_USER_ID = 1; // Fixed user ID for development
const DEV_USERNAME = 'dev_user'; // Fixed username for development

export async function submitOrder(orderData: OrderData | BackendOrderRequest | MultiplePizzaOrderRequest): Promise<OrderResponse> {
  try {
    const token = getValidToken()
    console.log('[DIAGNOSTIC] Submitting order with token:', token ? 'Valid token present' : 'No valid token')
    console.log('[DIAGNOSTIC] Token value (first 10 chars):', token ? token.substring(0, 10) + '...' : 'N/A')
    console.log('[DIAGNOSTIC] Token length:', token ? token.length : 0)
    
    // Check if token exists and is valid
    if (!token) {
      console.error('[DIAGNOSTIC] No valid authentication token found. User may need to log in again.')
      return {
        success: false,
        error: 'Authentication required. Please log in again to place your order.'
      }
    }
    
    // Log token details for debugging
    console.log('[DIAGNOSTIC] Token validation details:', {
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 10) + '...' : 'N/A',
      tokenFormat: token ? (token.split('.').length === 3 ? 'JWT' : 'Unknown') : 'N/A'
    })
    
    // Enhanced validation of order data
    console.log('[DEBUG] Order data being sent:', JSON.stringify(orderData, null, 2))
    
    // Check if it's the new backend format or the old format
    if ('pizza_quantities' in orderData) {
      // Check if it's the MultiplePizzaOrderRequest (for order-pizza-with-extras) or BackendOrderRequest
      if ('extra_ids' in orderData || 'discount_code' in orderData || 'postal_code' in orderData) {
        // MultiplePizzaOrderRequest format (for order-pizza-with-extras endpoint)
        console.log('[DEBUG] Order data types (MultiplePizzaOrderRequest):', {
          pizza_quantities: typeof orderData.pizza_quantities,
          pizza_quantitiesLength: orderData.pizza_quantities?.length,
          extra_ids: typeof orderData.extra_ids,
          discount_code: typeof orderData.discount_code,
          postal_code: typeof orderData.postal_code,
          firstPizzaQuantity: orderData.pizza_quantities[0],
        })
      } else {
        // BackendOrderRequest format
        const backendData = orderData as BackendOrderRequest
        console.log('[DEBUG] Order data types (BackendOrderRequest):', {
          pizza_quantities: typeof backendData.pizza_quantities,
          pizza_quantitiesLength: backendData.pizza_quantities?.length,
          totalAmount: typeof backendData.totalAmount,
          totalItems: typeof backendData.totalItems,
          firstPizzaQuantity: backendData.pizza_quantities[0],
        })
      }
      
      // Validate each pizza quantity in the order
      if (orderData.pizza_quantities && Array.isArray(orderData.pizza_quantities)) {
        orderData.pizza_quantities.forEach((pizzaQty, index) => {
          console.log(`[DEBUG] Pizza quantity ${index} details:`, {
            pizza_id: pizzaQty.pizza_id,
            pizza_idType: typeof pizzaQty.pizza_id,
            quantity: pizzaQty.quantity,
            quantityType: typeof pizzaQty.quantity,
          })
        })
      }
    } else {
      // Old format (for backward compatibility)
      console.log('[DEBUG] Order data types (OrderData):', {
        pizzas: typeof orderData.pizzas,
        pizzasLength: orderData.pizzas?.length,
        totalAmount: typeof orderData.totalAmount,
        totalItems: typeof orderData.totalItems,
        firstPizzaId: orderData.pizzas[0]?.id,
        firstPizzaIdType: typeof orderData.pizzas[0]?.id,
        firstPizzaPrice: orderData.pizzas[0]?.price,
        firstPizzaPriceType: typeof orderData.pizzas[0]?.price,
        firstPizzaQuantity: orderData.pizzas[0]?.quantity,
        firstPizzaQuantityType: typeof orderData.pizzas[0]?.quantity,
      })
      
      // Validate each pizza in the order
      if (orderData.pizzas && Array.isArray(orderData.pizzas)) {
        orderData.pizzas.forEach((pizza, index) => {
          console.log(`[DEBUG] Pizza ${index} details:`, {
            id: pizza.id,
            idType: typeof pizza.id,
            name: pizza.name,
            nameType: typeof pizza.name,
            price: pizza.price,
            priceType: typeof pizza.price,
            size: pizza.size,
            sizeType: typeof pizza.size,
            toppings: pizza.toppings,
            toppingsType: typeof pizza.toppings,
            isArray: Array.isArray(pizza.toppings),
            quantity: pizza.quantity,
            quantityType: typeof pizza.quantity,
          })
        })
      }
    }
    
    console.log('[DEBUG] Full order submission URL:', `${API_URL}/v1/order-pizza-with-extras`)
    console.log('[DEBUG] API_URL being used:', API_URL)
    
    // Use the correct endpoint for pizza orders with extras
    console.log('[DEBUG] Using correct endpoint: /v1/order-pizza-with-extras')
    const endpointUsed = '/v1/order-pizza-with-extras'
    
    // Ensure Content-Type header is set
    console.log('[DIAGNOSTIC] Making POST request to:', `${API_URL}/v1/order-pizza-with-extras`)
    console.log('[DIAGNOSTIC] Request headers:', {
      'Authorization': `Bearer ${token ? token.substring(0, 10) + '...' : 'N/A'}`,
      'Content-Type': 'application/json',
      'credentials': 'include'
    })
    console.log('[DIAGNOSTIC] Request body:', JSON.stringify(orderData, null, 2))
    
    let response;
    try {
      response = await ky.post(`${API_URL}/v1/order-pizza-with-extras`, {
        json: orderData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        timeout: 30000, // Add 30 second timeout
      })
    } catch (networkError) {
      console.error('[DEBUG] Network error during order submission:', networkError)
      return {
        success: false,
        error: 'Network error: Unable to connect to the server. Please check your connection and try again.'
      }
    }

    console.log('[DIAGNOSTIC] Response status from', endpointUsed, ':', response.status)
    console.log('[DIAGNOSTIC] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DEBUG] Order submission error from', endpointUsed, ':', errorText)
      console.error('[DEBUG] Response status text:', response.statusText)
      console.error('[DEBUG] Response status code:', response.status)
      
      // Handle 422 Unprocessable Entity specifically
      if (response.status === 422) {
        console.error('[DEBUG] Unprocessable Entity Error - The server understands the request but cannot process the contained instructions')
        console.error('[DEBUG] Raw error response:', errorText)
        console.error('[DEBUG] Request URL:', `${API_URL}/v1/order-pizza-with-extras`)
        console.error('[DEBUG] Request headers:', {
          'Authorization': `Bearer ${token ? token.substring(0, 10) + '...' : 'N/A'}`,
          'Content-Type': 'application/json',
          'credentials': 'include'
        })
        console.error('[DEBUG] Request body:', JSON.stringify(orderData, null, 2))
        
        try {
          const errorJson = JSON.parse(errorText)
          console.error('[DEBUG] Parsed 422 error:', errorJson)
          
          // Log specific validation errors if available
          if (errorJson.detail && Array.isArray(errorJson.detail)) {
            console.error('[DEBUG] Validation errors:')
            errorJson.detail.forEach((err: any, index: number) => {
              console.error(`  [${index}] Field: ${err.loc?.join('.') || 'unknown'}, Message: ${err.msg}, Type: ${err.type}`)
            })
          }
          
          return {
            success: false,
            error: `Invalid order data: ${errorJson.detail || JSON.stringify(errorJson)}`
          }
        } catch {
          return {
            success: false,
            error: `Invalid order data: The server could not process your order. Please check your cart items and try again. Raw error: ${errorText}`
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

    const data = await response.json() as any
    console.log('[DEBUG] Order submission successful from', endpointUsed, ':', data)
    
    // Validate the response structure
    const orderResponse: OrderResponse = {
      success: data.success !== undefined ? data.success : true, // Default to success if not specified
      orderId: data.orderId || data.order_id || data.id,
      message: data.message,
      error: data.error
    }
    
    // Check if the response indicates failure despite a 200 status
    if (orderResponse.success === false || orderResponse.error) {
      console.error('[DEBUG] Server returned 200 but indicated failure:', orderResponse.error)
      return {
        success: false,
        error: orderResponse.error || 'Order failed without specific error message'
      }
    }
    
    return orderResponse
  } catch (error) {
    console.error('[DEBUG] Order submission error:', error)
    
    // Handle HTTPError from ky library (includes 422 errors)
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as any
      console.error('[DEBUG] HTTPError detected')
      console.error('[DEBUG] Response status:', httpError.response?.status)
      console.error('[DEBUG] Response status text:', httpError.response?.statusText)
      
      try {
        const errorText = await httpError.response.text()
        console.error('[DEBUG] Error response body:', errorText)
        
        // Handle 422 Unprocessable Entity specifically
        if (httpError.response?.status === 422) {
          console.error('[DEBUG] Unprocessable Entity Error - The server understands the request but cannot process the contained instructions')
          console.error('[DEBUG] Raw error response:', errorText)
          console.error('[DEBUG] Request URL:', `${API_URL}/v1/order-pizza-with-extras`)
          console.error('[DEBUG] Request body:', JSON.stringify(orderData, null, 2))
          
          try {
            const errorJson = JSON.parse(errorText)
            console.error('[DEBUG] Parsed 422 error:', errorJson)
            
            // Log specific validation errors if available
            if (errorJson.detail && Array.isArray(errorJson.detail)) {
              console.error('[DEBUG] Validation errors:')
              errorJson.detail.forEach((err: any, index: number) => {
                console.error(`  [${index}] Field: ${err.loc?.join('.') || 'unknown'}, Message: ${err.msg}, Type: ${err.type}`)
              })
            }
            
            return {
              success: false,
              error: `Invalid order data: ${errorJson.detail || JSON.stringify(errorJson)}`
            }
          } catch (parseError) {
            console.error('[DEBUG] Failed to parse error response as JSON:', parseError)
            return {
              success: false,
              error: `Invalid order data: The server could not process your order. Raw error: ${errorText}`
            }
          }
        }
        
        // Handle authentication errors specifically
        if (httpError.response?.status === 401 || httpError.response?.status === 403) {
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
            error: errorJson.detail || errorJson.message || `Failed to place order: ${httpError.response?.statusText}`
          }
        } catch {
          return {
            success: false,
            error: `Failed to place order: ${httpError.response?.statusText} - ${errorText}`
          }
        }
      } catch (textError) {
        console.error('[DEBUG] Failed to get error response text:', textError)
        return {
          success: false,
          error: `Failed to place order: ${httpError.response?.statusText || 'Unknown error'}`
        }
      }
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to the server. Please check your connection.'
      }
    }
    
    console.error('[DEBUG] Unhandled error type:', typeof error)
    console.error('[DEBUG] Error details:', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

// Unsecured version for development - bypasses authentication with fixed user
export async function submitOrderUnsecured(orderData: OrderData | BackendOrderRequest | MultiplePizzaOrderRequest): Promise<OrderResponse> {
  try {
    console.log('[DEV MODE] Using unsecured endpoint with fixed user:', DEV_USERNAME);

    // Enhanced validation of order data (same as secure version)
    console.log('[DEV MODE] Order data being sent:', JSON.stringify(orderData, null, 2));

    // Convert order data to the format expected by the unsecured endpoint
    let unsecuredOrderData: any = {};

    if ('pizza_quantities' in orderData) {
      // Handle MultiplePizzaOrderRequest or BackendOrderRequest format
      unsecuredOrderData = {
        ...orderData,
        user_id: DEV_USER_ID, // Add fixed user ID
        username: DEV_USERNAME // Add fixed username
      };
    } else {
      // Handle legacy OrderData format
      unsecuredOrderData = {
        pizzas: orderData.pizzas,
        totalAmount: orderData.totalAmount,
        totalItems: orderData.totalItems,
        user_id: DEV_USER_ID,
        username: DEV_USERNAME
      };
    }

    console.log('[DEV MODE] Full unsecured order submission URL:', `${API_URL}/v1/order-unsecured`);
    console.log('[DEV MODE] Using unsecured endpoint without authentication');

    // Make request without authentication headers
    const response = await ky.post(`${API_URL}/v1/order-unsecured`, {
      json: unsecuredOrderData,
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header - this is the "unsecured" part
      },
      credentials: 'include',
      timeout: 30000,
    });

    console.log('[DEV MODE] Unsecured order response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEV MODE] Unsecured order submission error:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          error: `Unsecured order failed: ${errorJson.detail || JSON.stringify(errorJson)}`
        };
      } catch {
        return {
          success: false,
          error: `Unsecured order failed: ${response.statusText} - ${errorText}`
        };
      }
    }

    const data = await response.json() as any;
    console.log('[DEV MODE] Unsecured order submission successful:', data);

    // Validate the response structure
    const orderResponse: OrderResponse = {
      success: data.success !== undefined ? data.success : true,
      orderId: data.orderId || data.order_id || data.id,
      message: data.message,
      error: data.error
    };

    // Check if the response indicates failure despite a 200 status
    if (orderResponse.success === false || orderResponse.error) {
      console.error('[DEV MODE] Server returned 200 but indicated failure:', orderResponse.error);
      return {
        success: false,
        error: orderResponse.error || 'Unsecured order failed without specific error message'
      };
    }

    return orderResponse;
  } catch (error) {
    console.error('[DEV MODE] Unsecured order submission error:', error);

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to the server. Please check your connection.'
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred with unsecured order. Please try again.'
    };
  }
}

// Main function that chooses between secure and unsecured based on DEV_MODE
export async function submitOrderFlexible(orderData: OrderData | BackendOrderRequest | MultiplePizzaOrderRequest): Promise<OrderResponse> {
  if (DEV_MODE) {
    console.log('[DEBUG] DEV_MODE is enabled, using unsecured endpoint');
    return submitOrderUnsecured(orderData);
  } else {
    console.log('[DEBUG] DEV_MODE is disabled, using secure endpoint');
    return submitOrder(orderData);
  }
}

// Development utilities for managing the unsecured mode
export class DevModeManager {
  private static FORCE_DEV_MODE_KEY = 'force_dev_mode';
  private static instance: DevModeManager;

  private constructor() {}

  static getInstance(): DevModeManager {
    if (!DevModeManager.instance) {
      DevModeManager.instance = new DevModeManager();
    }
    return DevModeManager.instance;
  }

  // Force enable/disable dev mode (overrides environment variable)
  setDevMode(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(DevModeManager.FORCE_DEV_MODE_KEY, 'true');
      console.log('[DEV MODE] Forced dev mode enabled');
    } else {
      localStorage.removeItem(DevModeManager.FORCE_DEV_MODE_KEY);
      console.log('[DEV MODE] Forced dev mode disabled');
    }
  }

  // Check if dev mode is active (either by environment or forced)
  isDevModeActive(): boolean {
    const forced = localStorage.getItem(DevModeManager.FORCE_DEV_MODE_KEY) === 'true';
    const env = DEV_MODE;
    const active = forced || env;
    console.log('[DEV MODE] Status check:', { forced, env, active });
    return active;
  }

  // Get current mode info
  getModeInfo(): { mode: string; reason: string; canOverride: boolean } {
    const forced = localStorage.getItem(DevModeManager.FORCE_DEV_MODE_KEY) === 'true';
    const env = DEV_MODE;

    if (forced) {
      return { mode: 'development', reason: 'forced via localStorage', canOverride: true };
    } else if (env) {
      return { mode: 'development', reason: 'environment variable', canOverride: false };
    } else {
      return { mode: 'production', reason: 'default secure mode', canOverride: true };
    }
  }

  // Toggle dev mode (only works if can override)
  toggleDevMode(): boolean {
    const info = this.getModeInfo();
    if (!info.canOverride) {
      console.warn('[DEV MODE] Cannot toggle - mode is controlled by environment');
      return false;
    }

    const newState = !this.isDevModeActive();
    this.setDevMode(newState);
    return newState;
  }
}

// Export singleton instance
export const devModeManager = DevModeManager.getInstance();