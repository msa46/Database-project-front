# Development Mode: Unsecured Endpoints Implementation

This document explains how to use the development mode system that allows bypassing authentication for testing purposes while you work on the secure implementation.

## Overview

The application now supports two modes:
- **Production/Secure Mode**: Uses proper JWT authentication
- **Development Mode**: Bypasses authentication using fixed user credentials

## How It Works

### 1. Environment-Based Configuration

The mode is controlled by environment variables:

```bash
# Enable dev mode via environment
VITE_DEV_MODE=true npm run dev

# Production mode (default)
npm run dev
```

### 2. Runtime Toggle

You can also toggle dev mode at runtime using the `DevModeToggle` component or programmatically:

```typescript
import { devModeManager } from './lib/api';

// Toggle dev mode
devModeManager.setDevMode(true);

// Check current status
const isDevMode = devModeManager.isDevModeActive();
const modeInfo = devModeManager.getModeInfo();
```

## API Functions

### Available Functions

1. **`submitOrder()`** - Original secure function with JWT authentication
2. **`submitOrderUnsecured()`** - Development function without authentication
3. **`submitOrderFlexible()`** - Smart function that chooses based on current mode

### Usage Examples

```typescript
import { submitOrder, submitOrderUnsecured, submitOrderFlexible, devModeManager } from './lib/api';

// Always uses secure authentication
const result1 = await submitOrder(orderData);

// Always uses fixed user (no auth required)
const result2 = await submitOrderUnsecured(orderData);

// Uses secure or dev mode based on current setting
const result3 = await submitOrderFlexible(orderData);

// Check if dev mode is active
if (devModeManager.isDevModeActive()) {
  console.log('Using unsecured endpoints');
}
```

## Backend Requirements

For the unsecured endpoint to work, your backend needs an endpoint like:

```python
# Example FastAPI endpoint
@app.post("/v1/order-unsecured")
async def order_unsecured(order_data: dict):
    # This endpoint doesn't check authentication
    # It uses the provided user_id and username from the request

    user_id = order_data.get("user_id", 1)  # Default to dev user
    username = order_data.get("username", "dev_user")

    # Process order with fixed user
    return {
        "success": True,
        "orderId": "order_123",
        "message": f"Order placed for {username}"
    }
```

## Using the DevModeToggle Component

Add the toggle component to any page for easy mode switching:

```tsx
import { DevModeToggle } from '../components/DevModeToggle';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <DevModeToggle />
      {/* Rest of your component */}
    </div>
  );
}
```

## Development Workflow

1. **Start in Dev Mode**: Enable dev mode to test functionality without authentication
2. **Test Features**: Use `submitOrderFlexible()` to automatically use unsecured endpoints
3. **Switch to Secure**: Disable dev mode and work on authentication
4. **Compare Results**: Ensure both modes produce similar results

## Security Considerations

⚠️ **IMPORTANT**: This development mode is for testing only!

### Risks
- **No Authentication**: Anyone can submit orders using the fixed user ID
- **Data Exposure**: Orders are processed under the hardcoded user account
- **Testing Data**: Real orders might be mixed with test data

### Best Practices
1. **Never deploy with dev mode enabled**
2. **Use separate backend for development**
3. **Clear test data regularly**
4. **Don't use real payment methods in dev mode**
5. **Disable dev mode before sharing with others**

### Environment Variables

Add to your `.env` file:
```env
# Development
VITE_DEV_MODE=true
VITE_API_URL=http://localhost:8000

# Production
VITE_API_URL=https://your-api.com
```

Remove `VITE_DEV_MODE=true` for production builds.

## Integration Examples

### In Order Components

```typescript
// In your order submission component
import { submitOrderFlexible } from '../lib/api';

const handleSubmitOrder = async (orderData) => {
  try {
    const result = await submitOrderFlexible(orderData);

    if (result.success) {
      console.log('Order placed successfully:', result.orderId);
    } else {
      console.error('Order failed:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### In Development Dashboard

Add the toggle to your dashboard for easy access:

```tsx
import { DevModeToggle } from '../components/DevModeToggle';

function Dashboard() {
  return (
    <div className="dashboard">
      <DevModeToggle className="mb-4" />
      {/* Dashboard content */}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Dev mode not working**
   - Check if `VITE_DEV_MODE=true` is set
   - Verify the backend has the unsecured endpoint
   - Check browser console for errors

2. **Toggle not appearing**
   - Ensure the `DevModeToggle` component is imported correctly
   - Check if the component is rendered in the DOM

3. **Orders failing in dev mode**
   - Verify the backend `/v1/order-unsecured` endpoint exists
   - Check that the endpoint accepts `user_id` and `username` fields
   - Ensure CORS is configured properly

### Debug Information

The system logs detailed information to help with debugging:

```javascript
// In browser console, you'll see logs like:
[DEV MODE] Using unsecured endpoint with fixed user: dev_user
[DEV MODE] Order data being sent: {...}
[DEV MODE] Full unsecured order submission URL: http://localhost:8000/v1/order-unsecured
```

## Migration Guide

When you're ready to move from dev mode to secure mode:

1. Remove `VITE_DEV_MODE=true` from environment variables
2. Replace `submitOrderFlexible()` calls with `submitOrder()`
3. Remove `DevModeToggle` components from production code
4. Test authentication flows thoroughly
5. Ensure all endpoints require proper JWT tokens

## Support

For questions or issues with the development mode system:
1. Check the browser console for detailed error messages
2. Verify backend endpoint configuration
3. Ensure environment variables are set correctly
4. Test both modes to ensure consistent behavior