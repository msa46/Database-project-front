import React, { useState } from 'react'
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
import { useOrder } from './OrderProvider'
import type { PizzaItem } from './OrderProvider'
import type { OrderData } from '@/lib/types'
import { submitOrder } from '@/lib/api'
import { useNavigate } from '@tanstack/react-router'
import { getToken, isTokenExpired } from '@/lib/auth'

interface OrderReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({ isOpen, onClose }) => {
  const { cart, clearCart } = useOrder()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePlaceOrder = async () => {
    console.log('[DEBUG] Order submission started')
    
    // Check authentication before proceeding
    const token = getToken()
    if (!token) {
      console.log('[DEBUG] No token found, cannot place order')
      setError('You must be logged in to place an order.')
      return
    }
    
    if (isTokenExpired()) {
      console.log('[DEBUG] Token is expired, cannot place order')
      setError('Your session has expired. Please log in again.')
      setTimeout(() => {
        if (confirm('Your session has expired. Would you like to log in again?')) {
          navigate({ to: '/login' })
        }
      }, 1000)
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare order data with proper type conversion
      const orderData: OrderData = {
        items: cart.items.map((item: PizzaItem) => {
          // Convert ID to number, but handle cases where it might be a non-numeric string
          let convertedId: number;
          if (typeof item.id === 'string') {
            // Try to convert string ID to number, if it fails, use a hash or fallback
            const parsedId = parseInt(item.id, 10);
            convertedId = isNaN(parsedId) ? item.id.charCodeAt(0) : parsedId;
            console.log('[DEBUG] Converting string ID to number:', {
              originalId: item.id,
              convertedId,
              isNumeric: !isNaN(parsedId)
            });
          } else {
            convertedId = Number(item.id);
          }
          
          const processedItem = {
            id: convertedId, // Ensure ID is always a number for the API
            name: String(item.name), // Ensure name is a string
            price: Number(item.price), // Ensure price is a number
            size: String(item.size), // Ensure size is a string
            toppings: Array.isArray(item.toppings) ? item.toppings : [], // Ensure toppings is an array
            quantity: Number(item.quantity), // Ensure quantity is a number
          };
          
          // Log detailed information about each item being processed
          console.log('[DEBUG] Processing cart item:', {
            originalId: item.id,
            originalIdType: typeof item.id,
            convertedId: processedItem.id,
            convertedIdType: typeof processedItem.id,
            name: processedItem.name,
            nameType: typeof processedItem.name,
            nameLength: processedItem.name.length,
            price: processedItem.price,
            priceType: typeof processedItem.price,
            priceIsValid: !isNaN(processedItem.price) && processedItem.price > 0,
            size: processedItem.size,
            sizeType: typeof processedItem.size,
            sizeLength: processedItem.size.length,
            toppings: processedItem.toppings,
            toppingsType: typeof processedItem.toppings,
            toppingsIsArray: Array.isArray(processedItem.toppings),
            toppingsLength: processedItem.toppings.length,
            quantity: processedItem.quantity,
            quantityType: typeof processedItem.quantity,
            quantityIsValid: !isNaN(processedItem.quantity) && processedItem.quantity > 0
          });
          
          return processedItem;
        }),
        totalAmount: Number(cart.totalAmount), // Ensure totalAmount is a number
        totalItems: Number(cart.totalItems), // Ensure totalItems is a number
      }

      console.log('[DEBUG] Order data prepared:', JSON.stringify(orderData, null, 2))
      console.log('[DEBUG] Order data validation:', {
        itemsCount: orderData.items.length,
        totalAmount: orderData.totalAmount,
        totalItems: orderData.totalItems,
        sampleItem: orderData.items[0] ? {
          id: orderData.items[0].id,
          idType: typeof orderData.items[0].id,
          price: orderData.items[0].price,
          priceType: typeof orderData.items[0].price,
          quantity: orderData.items[0].quantity,
          quantityType: typeof orderData.items[0].quantity,
        } : null
      })

      // Additional validation before sending
      if (orderData.items.length === 0) {
        setError('Your cart is empty. Please add items before placing an order.')
        setIsSubmitting(false)
        return
      }

      // Validate each item has the required fields
      const invalidItems = orderData.items.filter((item, index) => {
        const idAsNumber = Number(item.id);
        
        // Check each validation rule individually and log specific failures
        const validations = {
          idExists: !!item.id,
          idIsNumber: !isNaN(idAsNumber),
          nameExists: !!item.name,
          nameIsString: typeof item.name === 'string',
          nameNotEmpty: item.name.trim().length > 0,
          priceExists: !isNaN(item.price),
          pricePositive: item.price > 0,
          sizeExists: !!item.size,
          sizeIsString: typeof item.size === 'string',
          sizeNotEmpty: item.size.trim().length > 0,
          toppingsIsArray: Array.isArray(item.toppings),
          quantityExists: !isNaN(item.quantity),
          quantityPositive: item.quantity > 0
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
          console.error(`[DEBUG] Invalid item at index ${index}:`, {
            originalCartItem: cart.items[index],
            processedItem: item,
            validationResults: validations,
            validationFailures: Object.entries(validations)
              .filter(([_, isValid]) => !isValid)
              .map(([rule]) => rule)
          });
        }
        
        return isInvalid;
      });

      if (invalidItems.length > 0) {
        console.error('[DEBUG] Invalid items found:', invalidItems)
        console.error('[DEBUG] Original cart items:', cart.items)
        setError('Some items in your cart have invalid data. Please remove them and try again.')
        setIsSubmitting(false)
        return
      }

      // Submit order to the API
      const response = await submitOrder(orderData)

      console.log('[DEBUG] Order submission response:', response)
      
      if (response.success) {
        console.log('[DEBUG] Order was successful, clearing cart and closing modal')
        clearCart()
        onClose()
        // Show success message
        alert(`Order placed successfully! Order ID: ${response.orderId}`)
        console.log('Order placed successfully:', response.orderId)
      } else {
        console.log('[DEBUG] Order failed with error:', response.error)
        
        // Check if it's an authentication error
        if (response.error?.includes('session has expired') ||
            response.error?.includes('Authentication required') ||
            response.error?.includes('log in again')) {
          console.log('[DEBUG] Authentication error detected, redirecting to login')
          setError(response.error)
          
          // Provide option to redirect to login
          setTimeout(() => {
            if (confirm('Your session has expired. Would you like to log in again?')) {
              navigate({ to: '/login' })
            }
          }, 1000)
        } else {
          setError(response.error || 'Failed to place order')
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
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Items:</span>
                <span>{cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount:</span>
                <span className="font-bold text-lg">${cart.totalAmount.toFixed(2)}</span>
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