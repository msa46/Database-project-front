import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOrder } from './OrderProvider'

interface OrderButtonProps {
  pizza: {
    id: string | number
    name: string
    description: string
    price: number
    size: string
    toppings: string[]
  }
  quantity: number
}

export const OrderButton: React.FC<OrderButtonProps> = ({
  pizza,
  quantity
}) => {
  const { addToCart } = useOrder()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToOrder = async () => {
    // Validate price before adding to cart
    const isValidPrice = !isNaN(pizza.price) && pizza.price > 0;
    
    console.log('[DEBUG] Adding pizza to cart:', {
      id: pizza.id,
      idType: typeof pizza.id,
      name: pizza.name,
      price: pizza.price,
      priceType: typeof pizza.price,
      isValidPrice: isValidPrice,
      size: pizza.size,
      toppings: pizza.toppings,
      toppingsType: typeof pizza.toppings,
      isArray: Array.isArray(pizza.toppings),
      quantity
    });
    
    if (!isValidPrice) {
      console.error('[DEBUG] Attempted to add item with invalid price to cart:', {
        id: pizza.id,
        name: pizza.name,
        price: pizza.price
      });
      alert('This pizza has an invalid price and cannot be added to the cart.');
      return;
    }
    
    setIsAdding(true)
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      addToCart({
        ...pizza,
        quantity
      })
      
      setIsAdding(false)
      setShowSuccess(true)
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    }, 300)
  }

  return (
    <div className="w-full">
      <Button
        onClick={handleAddToOrder}
        disabled={quantity <= 0 || isAdding}
        className="w-full relative overflow-hidden"
      >
        {isAdding ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Adding...
          </span>
        ) : (
          <>
            <span className="relative z-10">
              Add {quantity > 1 ? `${quantity} ` : ''}to Order
            </span>
            {quantity > 1 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                ${(pizza.price * quantity).toFixed(2)}
              </span>
            )}
          </>
        )}
      </Button>
      
      {showSuccess && (
        <div className="mt-2 text-sm text-green-600 font-medium animate-pulse">
          ✓ Added {quantity > 1 ? `${quantity} ${pizza.name}s` : pizza.name} to cart
        </div>
      )}
    </div>
  )
}