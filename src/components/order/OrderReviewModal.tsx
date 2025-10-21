import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrder } from './OrderProvider'
import type { PizzaItem } from './OrderProvider'
import type { OrderData, BackendOrderRequest, MultiplePizzaOrderRequest } from '@/lib/types'
import { submitOrder } from '@/lib/api'
import { useNavigate } from '@tanstack/react-router'
import { getUserId } from '@/lib/auth'
import { DiscountCodeInput } from './DiscountCodeInput'

interface OrderReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({ isOpen, onClose }) => {
  const { cart, clearCart, removeDiscount } = useOrder()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handlePlaceOrder = async () => {
    console.log('[DIAGNOSTIC] Order submission started')
    
    // Check if user is logged in before proceeding
    const userId = getUserId()
    if (!userId) {
      console.log('[DIAGNOSTIC] No user_id found, cannot place order')
      setError('You must be logged in to place an order.')
      setTimeout(() => {
        if (confirm('You need to log in to place an order. Would you like to log in now?')) {
          navigate({ to: '/login' })
        }
      }, 1000)
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare order data with proper type conversion
      console.log('[DIAGNOSTIC] Starting order data preparation with cart items:', cart.items);
      
      // Process cart items to match backend expectations
      const processedPizzas = cart.items.map((item: PizzaItem, index: number) => {
        // Convert ID to number, but handle cases where it might be a non-numeric string
        let convertedId: number;
        if (typeof item.id === 'string') {
          // Try to convert string ID to number, if it fails, use a hash or fallback
          const parsedId = parseInt(item.id, 10);
          convertedId = isNaN(parsedId) ? item.id.charCodeAt(0) : parsedId;
          console.log('[DIAGNOSTIC] Converting string ID to number:', {
            itemIndex: index,
            originalId: item.id,
            originalIdType: typeof item.id,
            convertedId,
            isNumeric: !isNaN(parsedId),
            charCodeFallback: isNaN(parsedId) ? item.id.charCodeAt(0) : 'N/A'
          });
        } else {
          convertedId = Number(item.id);
          console.log('[DIAGNOSTIC] ID is already a number:', {
            itemIndex: index,
            originalId: item.id,
            originalIdType: typeof item.id,
            convertedId
          });
        }
        
        const processedPizza = {
          id: convertedId, // Ensure ID is always a number for the API
          name: String(item.name), // Ensure name is a string
          price: Number(item.price), // Ensure price is a number
          size: String(item.size), // Ensure size is a string
          toppings: Array.isArray(item.toppings) ? item.toppings : [], // Ensure toppings is an array
          quantity: Number(item.quantity), // Ensure quantity is a number
        };
        
        // Add additional validation for the converted ID
        console.log('[DIAGNOSTIC] Final pizza data for API:', {
          itemIndex: index,
          finalId: processedPizza.id,
          finalIdType: typeof processedPizza.id,
          finalIdIsNaN: isNaN(processedPizza.id),
          finalIdIsInteger: Number.isInteger(processedPizza.id),
          finalIdIsPositive: processedPizza.id > 0,
          name: processedPizza.name,
          nameLength: processedPizza.name.length,
          price: processedPizza.price,
          priceIsNaN: isNaN(processedPizza.price),
          priceIsPositive: processedPizza.price > 0,
          size: processedPizza.size,
          sizeLength: processedPizza.size.length,
          toppings: processedPizza.toppings,
          toppingsIsArray: Array.isArray(processedPizza.toppings),
          quantity: processedPizza.quantity,
          quantityIsNaN: isNaN(processedPizza.quantity),
          quantityIsPositive: processedPizza.quantity > 0
        });
        
        // Log detailed information about each pizza being processed
        console.log('[DEBUG] Processing cart pizza:', {
          originalId: item.id,
          originalIdType: typeof item.id,
          convertedId: processedPizza.id,
          convertedIdType: typeof processedPizza.id,
          name: processedPizza.name,
          nameType: typeof processedPizza.name,
          nameLength: processedPizza.name.length,
          price: processedPizza.price,
          priceType: typeof processedPizza.price,
          priceIsValid: !isNaN(processedPizza.price) && processedPizza.price > 0,
          size: processedPizza.size,
          sizeType: typeof processedPizza.size,
          sizeLength: processedPizza.size.length,
          toppings: processedPizza.toppings,
          toppingsType: typeof processedPizza.toppings,
          toppingsIsArray: Array.isArray(processedPizza.toppings),
          toppingsLength: processedPizza.toppings.length,
          quantity: processedPizza.quantity,
          quantityType: typeof processedPizza.quantity,
          quantityIsValid: !isNaN(processedPizza.quantity) && processedPizza.quantity > 0
        });
        
        return processedPizza;
      });
      
      // Create order data with the expected structure for the backend
      // The backend expects 'pizza_quantities' instead of 'pizzas'
      const orderData: OrderData = {
        pizzas: processedPizzas, // Keep for frontend compatibility
        totalAmount: Number(cart.totalAmount), // Ensure totalAmount is a number
        totalItems: Number(cart.totalItems), // Ensure totalItems is a number
      }
      
      // Create the request body with the expected backend structure
      // The backend expects MultiplePizzaOrderRequest structure
      const requestBody = {
        pizza_quantities: processedPizzas.map(pizza => ({
          pizza_id: pizza.id,
          quantity: pizza.quantity
        })),
        extra_ids: null, // Not used in current implementation
        discount_code: cart.discountCode?.code || null, // Include discount code if applied
        postal_code: null // Will be taken from user's profile in backend
      };
      
      console.log('[DEBUG] Request body for backend:', JSON.stringify(requestBody, null, 2));
      console.log('[DEBUG] Order data validation:', {
        pizzasCount: orderData.pizzas.length,
        totalAmount: orderData.totalAmount,
        totalItems: orderData.totalItems,
        samplePizza: orderData.pizzas[0] ? {
          id: orderData.pizzas[0].id,
          idType: typeof orderData.pizzas[0].id,
          price: orderData.pizzas[0].price,
          priceType: typeof orderData.pizzas[0].price,
          quantity: orderData.pizzas[0].quantity,
          quantityType: typeof orderData.pizzas[0].quantity,
        } : null
      })

      // Additional validation before sending
      if (orderData.pizzas.length === 0) {
        setError('Your cart is empty. Please add items before placing an order.')
        setIsSubmitting(false)
        return
      }

      // Validate each pizza has the required fields
      const invalidPizzas = orderData.pizzas.filter((pizza, index) => {
        const idAsNumber = Number(pizza.id);
        
        // Check each validation rule individually and log specific failures
        const validations = {
          idExists: !!pizza.id,
          idIsNumber: !isNaN(idAsNumber),
          nameExists: !!pizza.name,
          nameIsString: typeof pizza.name === 'string',
          nameNotEmpty: pizza.name.trim().length > 0,
          priceExists: !isNaN(pizza.price),
          pricePositive: pizza.price > 0,
          sizeExists: !!pizza.size,
          sizeIsString: typeof pizza.size === 'string',
          sizeNotEmpty: pizza.size.trim().length > 0,
          toppingsIsArray: Array.isArray(pizza.toppings),
          quantityExists: !isNaN(pizza.quantity),
          quantityPositive: pizza.quantity > 0
        };
        
        const isInvalid = !(
          validations.idExists &&
          validations.idIsNumber &&
          validations.nameExists &&
          validations.nameIsString &&
          validations.nameNotEmpty &&
          validations.priceExists &&
          validations.pricePositive &&
          validations.sizeExists &&
          validations.sizeIsString &&
          validations.sizeNotEmpty &&
          validations.toppingsIsArray &&
          validations.quantityExists &&
          validations.quantityPositive
        );
        
        if (isInvalid) {
          console.error(`[DEBUG] Invalid pizza at index ${index}:`, {
            originalCartItem: cart.items[index],
            processedPizza: pizza,
            validationResults: validations,
            validationFailures: Object.entries(validations)
              .filter(([_, isValid]) => !isValid)
              .map(([rule]) => rule)
          });
        }
        
        return isInvalid;
      });

      if (invalidPizzas.length > 0) {
        console.error('[DEBUG] Invalid pizzas found:', invalidPizzas)
        console.error('[DEBUG] Original cart items:', cart.items)
        setError('Some items in your cart have invalid data. Please remove them and try again.')
        setIsSubmitting(false)
        return
      }

      // Submit order to the API with the correct request body structure
      console.log('[DEBUG] About to submit order with requestBody:', JSON.stringify(requestBody, null, 2))
      const response = await submitOrder(requestBody as MultiplePizzaOrderRequest)

      console.log('[DEBUG] Order submission response:', response)
      console.log('[DEBUG] Response success value:', response.success)
      console.log('[DEBUG] Response error value:', response.error)
      console.log('[DEBUG] Response orderId value:', response.orderId)
      
      if (response.success) {
        console.log('[DEBUG] Order was successful, clearing cart and closing modal')
        clearCart()
        onClose()
        // Show success message
        const orderId = response.orderId || 'Unknown'
        alert(`Order placed successfully! Order ID: ${orderId}`)
        console.log('Order placed successfully:', orderId)
      } else {
        console.log('[DEBUG] Order failed with error:', response.error)
        
        // Check if it's a user error
        if (response.error?.includes('User not found') ||
            response.error?.includes('log in again')) {
          console.log('[DEBUG] User error detected, redirecting to login')
          setError(response.error)

          // Provide option to redirect to login
          setTimeout(() => {
            if (confirm('Please log in again to place your order.')) {
              navigate({ to: '/login' })
            }
          }, 1000)
        } else {
          // Provide more detailed error information
          const errorMessage = response.error || 'Failed to place order'
          console.error('[DEBUG] Detailed order failure:', {
            error: errorMessage,
            requestBody: requestBody,
            cartItems: cart.items
          })
          setError(errorMessage)
        }
      }
    } catch (err) {
      console.error('[DEBUG] Unexpected error during order submission:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      console.log('[DEBUG] Order submission process completed, setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Your Order</DialogTitle>
          <DialogDescription>
            Please review your order details before placing it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.items.map((item: PizzaItem) => (
                  <div key={item.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.size} • ${item.price.toFixed(2)} each
                    </p>
                    {item.toppings.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Toppings: {item.toppings.join(', ')}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quantity: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <DiscountCodeInput
            showTitle={true}
            onDiscountApplied={() => {
              // Force re-render to show updated totals
            }}
            onDiscountRemoved={() => {
              // Force re-render to show updated totals
            }}
          />
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Subtotal:</span>
                <span>${cart.totalAmount.toFixed(2)}</span>
              </div>
              {cart.discountAmount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-600">Discount:</span>
                  <span className="text-green-600">-${cart.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Items:</span>
                <span>{cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount:</span>
                <span className="font-bold text-lg">${cart.finalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}