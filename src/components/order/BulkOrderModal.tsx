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
import { QuantitySelector } from './QuantitySelector'
import { useOrder } from './OrderProvider'
import { DiscountCodeInput } from './DiscountCodeInput'

interface BulkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  pizzas: any[]
  initialQuantities: Record<string | number, number>
}

export const BulkOrderModal: React.FC<BulkOrderModalProps> = ({
  isOpen,
  onClose,
  pizzas,
  initialQuantities
}) => {
  const { addToCart, cart } = useOrder()
  const [quantities, setQuantities] = useState<Record<string | number, number>>(initialQuantities)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuantityChange = (pizzaId: string | number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [pizzaId]: newQuantity
    }))
  }

  const calculateTotal = () => {
    return pizzas.reduce((total, pizza, index) => {
      const pizzaId = pizza.id || index
      const quantity = quantities[pizzaId] || 0
      const price = parseFloat(pizza.price) || 0
      return total + (price * quantity)
    }, 0)
  }

  const calculateTotalItems = () => {
    return pizzas.reduce((total, pizza, index) => {
      const pizzaId = pizza.id || index
      return total + (quantities[pizzaId] || 0)
    }, 0)
  }

  const handleBulkAddToCart = async () => {
    setIsSubmitting(true)
    
    // Add each pizza to cart
    for (let i = 0; i < pizzas.length; i++) {
      const pizza = pizzas[i]
      const pizzaId = pizza.id || i
      const quantity = quantities[pizzaId] || 0
      
      if (quantity > 0) {
        const parsedPrice = parseFloat(pizza.price);
        const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;
        
        if (isValidPrice) {
          addToCart({
            id: pizzaId,
            name: pizza.name || 'N/A',
            description: pizza.description || 'N/A',
            price: parsedPrice,
            size: pizza.size || 'medium', // Default to 'medium' instead of 'N/A'
            toppings: Array.isArray(pizza.toppings) ? pizza.toppings : [],
            quantity
          })
        }
      }
    }
    
    setIsSubmitting(false)
    onClose()
  }

  const totalAmount = calculateTotal()
  const totalItems = calculateTotalItems()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Order Multiple Pizzas</DialogTitle>
          <DialogDescription>
            Select quantities for multiple pizzas to add them all to your cart at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            {pizzas.map((pizza, index) => {
              const pizzaId = pizza.id || index
              const parsedPrice = parseFloat(pizza.price);
              
              return (
                <div key={pizzaId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{pizza.name || 'N/A'}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>{pizza.size || 'medium'}</span>
                      <span>•</span>
                      <span className="font-medium text-green-600">${pizza.price || '0.00'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Qty:</span>
                      <QuantitySelector
                        quantity={quantities[pizzaId] || 0}
                        onIncrease={() => handleQuantityChange(pizzaId, (quantities[pizzaId] || 0) + 1)}
                        onDecrease={() => handleQuantityChange(pizzaId, Math.max(0, (quantities[pizzaId] || 0) - 1))}
                        min={0}
                      />
                    </div>
                    
                    <div className="w-20 text-right">
                      <span className="font-medium">
                        ${((parsedPrice || 0) * (quantities[pizzaId] || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Discount Code Section */}
          <div className="border-t pt-4">
            <DiscountCodeInput
              compact={true}
              onDiscountApplied={() => {
                // Force re-render to show updated totals with discount
              }}
              onDiscountRemoved={() => {
                // Force re-render to show updated totals without discount
              }}
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-green-600">Discount:</span>
                <span className="text-green-600">-${cart.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Amount:</span>
              <span className="font-bold text-lg">${(totalAmount - cart.discountAmount).toFixed(2)}</span>
            </div>
            {cart.discountCode && (
              <div className="text-sm text-green-600 mt-2">
                {cart.discountCode.code} applied ({cart.discountCode.discount_percentage}% off)
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkAddToCart}
            disabled={isSubmitting || totalItems === 0}
          >
            {isSubmitting ? 'Adding to Cart...' : `Add ${totalItems} ${totalItems === 1 ? 'Item' : 'Items'} to Cart`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}