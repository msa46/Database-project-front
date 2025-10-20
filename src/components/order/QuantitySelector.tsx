import React from 'react'
import { Button } from '@/components/ui/button'

interface QuantitySelectorProps {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  min?: number
  max?: number
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onDecrease}
        disabled={quantity <= min}
        className="h-8 w-8 p-0"
      >
        -
      </Button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onIncrease}
        disabled={quantity >= max}
        className="h-8 w-8 p-0"
      >
        +
      </Button>
    </div>
  )
}