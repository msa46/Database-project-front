import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrder } from './OrderProvider'
import { validateDiscountCode } from '@/lib/api'
import { getDiscountCode, storeDiscountCode } from '@/lib/auth'

interface DiscountCodeInputProps {
  onDiscountApplied?: (discountCode: any) => void
  onDiscountRemoved?: () => void
  showTitle?: boolean
  compact?: boolean
}

export const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  onDiscountApplied,
  onDiscountRemoved,
  showTitle = true,
  compact = false
}) => {
  const { cart, applyDiscount, removeDiscount } = useOrder()
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null)
  
  // Load discount code from localStorage when component mounts
  useEffect(() => {
    const savedDiscountCode = getDiscountCode()
    if (savedDiscountCode && savedDiscountCode.code) {
      setDiscountCodeInput(savedDiscountCode.code)
    }
  }, [])
  
  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) {
      setDiscountError('Please enter a discount code')
      return
    }
    
    setIsApplyingDiscount(true)
    setDiscountError(null)
    setDiscountSuccess(null)
    
    try {
      const response = await validateDiscountCode(discountCodeInput.trim())
      
      if (response.success && response.valid && response.discount_code) {
        // Apply the discount
        applyDiscount(response.discount_code)
        storeDiscountCode(response.discount_code)
        setDiscountSuccess(`Discount code applied! ${response.discount_code.discount_percentage}% off`)
        onDiscountApplied?.(response.discount_code)
      } else {
        setDiscountError(response.error || 'Invalid discount code')
      }
    } catch (err) {
      console.error('Error validating discount code:', err)
      setDiscountError('Failed to validate discount code. Please try again.')
    } finally {
      setIsApplyingDiscount(false)
    }
  }
  
  const handleRemoveDiscount = () => {
    removeDiscount()
    setDiscountCodeInput('')
    setDiscountError(null)
    setDiscountSuccess(null)
    onDiscountRemoved?.()
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyDiscount()
    }
  }
  
  if (compact) {
    // Compact version for places like BulkOrderModal
    return (
      <div className="space-y-3">
        {cart.discountCode ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
            <div>
              <p className="font-medium text-green-800">{cart.discountCode.code}</p>
              <p className="text-sm text-green-600">
                {cart.discountCode.discount_percentage}% discount applied (-${cart.discountAmount.toFixed(2)})
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveDiscount}
              disabled={isApplyingDiscount}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter discount code"
                value={discountCodeInput}
                onChange={(e) => setDiscountCodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isApplyingDiscount}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleApplyDiscount}
                disabled={isApplyingDiscount}
                size="sm"
              >
                {isApplyingDiscount ? 'Applying...' : 'Apply'}
              </Button>
            </div>
            {discountError && (
              <p className="text-sm text-destructive">{discountError}</p>
            )}
            {discountSuccess && (
              <p className="text-sm text-green-600">{discountSuccess}</p>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // Full version for places like OrderReviewModal
  return (
    <Card>
      <CardHeader>
        {showTitle && <CardTitle className="text-lg">Discount Code</CardTitle>}
      </CardHeader>
      <CardContent>
        {cart.discountCode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div>
                <p className="font-medium text-green-800">{cart.discountCode.code}</p>
                <p className="text-sm text-green-600">
                  {cart.discountCode.discount_percentage}% discount applied
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You're saving ${cart.discountAmount.toFixed(2)} on this order!
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveDiscount}
                disabled={isApplyingDiscount}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove Discount
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p>✨ Discount successfully applied to your order</p>
              <p className="text-xs mt-1">Total savings: ${cart.discountAmount.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter discount code"
                value={discountCodeInput}
                onChange={(e) => setDiscountCodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isApplyingDiscount}
              />
              <Button
                variant="outline"
                onClick={handleApplyDiscount}
                disabled={isApplyingDiscount}
              >
                {isApplyingDiscount ? 'Applying...' : 'Apply'}
              </Button>
            </div>
            {discountError && (
              <p className="text-sm text-destructive">{discountError}</p>
            )}
            {discountSuccess && (
              <p className="text-sm text-green-600">{discountSuccess}</p>
            )}
            <div className="text-xs text-gray-500">
              Have a discount code? Enter it above to save on your order.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}