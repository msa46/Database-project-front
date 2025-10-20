import React from 'react'
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

  const handleAddToOrder = () => {
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
    
    addToCart({
      ...pizza,
      quantity
    })
  }

  return (
    <Button
      onClick={handleAddToOrder}
      disabled={quantity <= 0}
      className="w-full"
    >
      Add {quantity > 1 ? `${quantity} ` : ''}to Order
    </Button>
  )
}