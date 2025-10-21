import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrder } from './OrderProvider'
import { OrderReviewModal } from './OrderReviewModal'
import { DiscountCodeInput } from './DiscountCodeInput'
import type { PizzaItem } from './OrderProvider'

export const OrderSummary: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useOrder()
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const handleQuantityChange = (id: string | number, newQuantity: number) => {
    updateQuantity(id, newQuantity)
  }

  const handleRemoveItem = (id: string | number) => {
    removeFromCart(id)
  }

  const handleClearCart = () => {
    clearCart()
  }

  const handleCheckout = () => {
    setIsReviewModalOpen(true)
  }

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false)
  }

  if (cart.items.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add some delicious pizzas to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Order Summary
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCart}
            className="text-destructive hover:text-destructive"
          >
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.items.map((item: PizzaItem) => (
            <div key={item.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-destructive hover:text-destructive h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {item.size} • ${item.price.toFixed(2)} each
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 p-0"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="h-7 w-7 p-0"
                  >
                    +
                  </Button>
                </div>
                <span className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
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
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Total:</span>
              <span className="font-bold text-lg">${cart.finalAmount.toFixed(2)}</span>
            </div>
            {cart.discountCode && (
              <div className="text-sm text-green-600 mb-4 p-2 bg-green-50 rounded">
                <div className="flex items-center justify-between">
                  <span>✨ {cart.discountCode.code} applied ({cart.discountCode.discount_percentage}% off)</span>
                  <span className="font-medium">Saved ${cart.discountAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground mb-4">
              {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} in cart
            </div>
            <Button className="w-full" onClick={handleCheckout}>
              Checkout
            </Button>
          </div>
        </div>
      </CardContent>
      
      <OrderReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
      />
    </Card>
  )
}