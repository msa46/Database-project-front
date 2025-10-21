import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getUserId } from '../lib/auth'
import { API_URL } from '../lib/api'
import ky from 'ky'
import { Button } from '@/components/ui/button'
import { OrderProvider } from '@/components/order/OrderProvider'
import { QuantitySelector } from '@/components/order/QuantitySelector'
import { OrderButton } from '@/components/order/OrderButton'
import { OrderSummary } from '@/components/order/OrderSummary'
import { BulkOrderModal } from '@/components/order/BulkOrderModal'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allPizzas, setAllPizzas] = useState<any[]>([])
  const [quantities, setQuantities] = useState<Record<string | number, number>>({})
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false)

  const fetchDashboardData = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const userId = getUserId();

      console.log('[DIAGNOSTIC] fetchDashboardData called');
      console.log('[DIAGNOSTIC] User ID exists:', !!userId);

      // Check if user_id exists before making request
      if (!userId) {
        console.log('[DIAGNOSTIC] No user_id found, redirecting to login');
        navigate({ to: '/login' });
        return;
      }

      console.log('[DEBUG] Using public dashboard endpoint');

      const url = `${API_URL}/v1/public/dashboard/${userId}?page=${pageNum}&page_size=10&dietary_filter=all&available_only=true`;
      console.log('[DEBUG] Dashboard API URL being used:', url);
      console.log('[DEBUG] API_URL from dashboard module:', API_URL);

      const response = await ky.get(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Handle user not found errors
        if (response.status === 404) {
          console.log('[DEBUG] User not found, redirecting to login');
          navigate({ to: '/login' });
          return;
        }

        const errorText = await response.text();
        console.log('[DEBUG] Error response body:', errorText);
        throw new Error(`Failed to fetch dashboard data: ${errorText}`);
      }

      const data = await response.json<any>()
      console.log('[DEBUG] Response data:', JSON.stringify(data, null, 2));
      
      if (append) {
        setDashboardData((prevData: any) => ({
          ...prevData,
          ...data
        }));
      } else {
        setDashboardData(data);
      }
      
      // Extract pizzas from the public dashboard response
      console.log('[DEBUG] Extracting pizzas from public dashboard response');
      console.log('[DEBUG] Data keys:', Object.keys(data));

      // Public dashboard returns: { available_pizzas: [...], pizza_pagination: {...} }
      let pizzas = [];
      if (data.available_pizzas && Array.isArray(data.available_pizzas)) {
        console.log('[DEBUG] Found pizzas in data.available_pizzas');
        pizzas = data.available_pizzas;
      } else {
        console.log('[DEBUG] No pizzas found in expected location, checking all fields');
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            const firstItem = data[key][0];
            if (firstItem && typeof firstItem === 'object' && firstItem.name) {
              pizzas = data[key];
              break;
            }
          }
        }
      }
      
      console.log('[DEBUG] Extracted pizzas:', pizzas);
      console.log('[DEBUG] Number of pizzas:', pizzas.length);
      
      // Check if there are more pages using public dashboard pagination
      if (data.pizza_pagination) {
        setHasMore(data.pizza_pagination.has_next);
        console.log('[DEBUG] Using pagination info:', data.pizza_pagination);
      } else {
        // Fallback: assume no more if we got less than expected
        setHasMore(pizzas.length >= 10);
      }
      
      if (append) {
        setAllPizzas(prevPizzas => [...prevPizzas, ...pizzas]);
      } else {
        setAllPizzas(pizzas);
      }
      
    } catch (err) {
      console.error('[DEBUG] Error fetching dashboard data:', err);
      console.error('[DEBUG] Error type:', typeof err);
      console.error('[DEBUG] Error name:', err instanceof Error ? err.name : 'N/A');
      console.error('[DEBUG] Error message:', err instanceof Error ? err.message : String(err));
      
      // Additional network error debugging
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('[DEBUG] Network error detected - unable to connect to server');
        console.error('[DEBUG] Check if backend is running at:', API_URL);
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      console.log('[DEBUG] fetchDashboardData completed - setting loading to false');
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    console.log('[DEBUG] Dashboard useEffect triggered');
    document.title = 'Dashboard'

    // Check if user is logged in (has user_id)
    const userId = getUserId()
    console.log('[DIAGNOSTIC] Authentication check - user_id exists:', !!userId);

    if (!userId) {
      console.log('[DIAGNOSTIC] No user_id found, redirecting to login')
      navigate({ to: '/login' })
      return
    }

    console.log('[DIAGNOSTIC] User authenticated, fetching dashboard data');
    fetchDashboardData(1, false)
  }, [navigate])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDashboardData(nextPage, true);
    }
  };

  const handleQuantityChange = (pizzaId: string | number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [pizzaId]: newQuantity
    }))
  }

  const handleBulkOrder = () => {
    // Reset all quantities to 1 for bulk ordering
    const resetQuantities: Record<string | number, number> = {}
    allPizzas.forEach((pizza, index) => {
      const pizzaId = pizza.id || index
      resetQuantities[pizzaId] = 1
    })
    setQuantities(resetQuantities)
    setShowBulkOrderModal(true)
  }

  // Create a wrapper component to use the OrderProvider context
  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pizza Table - Left Side (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <p>This is your personal dashboard where you can manage your account and view your activities.</p>
                {allPizzas.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBulkOrder}
                    className="shrink-0"
                  >
                    Quick Order Multiple Pizzas
                  </Button>
                )}
              </div>
              
              {dashboardData && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Available Pizzas</h2>
                  
                  {/* Redesigned pizza table for better ordering experience */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Select Pizzas for Your Order</h3>
                    <div className="grid gap-4">
                      {allPizzas.length > 0 ? (
                        allPizzas.map((pizza: any, index: number) => {
                          const pizzaId = pizza.id || index
                          
                          // Parse and validate price
                          const parsedPrice = parseFloat(pizza.price);
                          const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;
                          
                          // Log pizza data for debugging
                          console.log(`[DEBUG] Processing pizza at index ${index}:`, {
                            originalPizzaId: pizza.id,
                            originalIdType: typeof pizza.id,
                            assignedPizzaId: pizzaId,
                            assignedIdType: typeof pizzaId,
                            name: pizza.name,
                            nameType: typeof pizza.name,
                            description: pizza.description,
                            descriptionType: typeof pizza.description,
                            price: pizza.price,
                            priceType: typeof pizza.price,
                            parsedPrice: parsedPrice,
                            isValidPrice: isValidPrice,
                            size: pizza.size,
                            sizeType: typeof pizza.size,
                            toppings: pizza.toppings,
                            toppingsType: typeof pizza.toppings,
                            toppingsIsArray: Array.isArray(pizza.toppings)
                          });
                          
                          return (
                            <div key={pizzaId} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* Pizza Details */}
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-orange-600 font-bold text-lg">🍕</span>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">{pizza.name || 'N/A'}</h4>
                                      <p className="text-sm text-gray-600 mt-1">{pizza.description || 'No description available'}</p>
                                      
                                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">Size:</span>
                                          <span className="bg-gray-100 px-2 py-1 rounded">{pizza.size || 'medium'}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">Price:</span>
                                          <span className="text-green-600 font-semibold">${pizza.price || '0.00'}</span>
                                        </div>
                                      </div>
                                      
                                      {pizza.toppings && Array.isArray(pizza.toppings) && pizza.toppings.length > 0 && (
                                        <div className="mt-2">
                                          <span className="font-medium text-sm">Toppings: </span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {pizza.toppings.map((topping: string, toppingIndex: number) => (
                                              <span key={toppingIndex} className="bg-orange-50 text-orange-700 px-2 py-1 rounded-full text-xs">
                                                {topping}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Order Controls */}
                                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Qty:</span>
                                    <QuantitySelector
                                      quantity={quantities[pizzaId] || 1}
                                      onIncrease={() => handleQuantityChange(pizzaId, (quantities[pizzaId] || 1) + 1)}
                                      onDecrease={() => handleQuantityChange(pizzaId, Math.max(1, (quantities[pizzaId] || 1) - 1))}
                                    />
                                  </div>
                                  
                                  {isValidPrice ? (
                                    <OrderButton
                                      pizza={{
                                        id: pizzaId,
                                        name: pizza.name || 'N/A',
                                        description: pizza.description || 'N/A',
                                        price: parsedPrice,
                                        size: pizza.size || 'medium', // Default to 'medium' instead of 'N/A'
                                        toppings: Array.isArray(pizza.toppings) ? pizza.toppings : []
                                      }}
                                      quantity={quantities[pizzaId] || 1}
                                    />
                                  ) : (
                                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                      Invalid price - cannot order
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">🍕</div>
                          <p className="text-gray-500">No pizzas found. Check back later for delicious pizzas!</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        variant="outline"
                      >
                        {loadingMore ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Order Summary - Right Side (1 column on large screens) */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Profile</h2>
            <p>View and edit your personal information.</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Orders</h2>
            <p>Track your current and past orders.</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
            <p>Manage your account settings and preferences.</p>
          </div>
        </div>
        
        <BulkOrderModal
          isOpen={showBulkOrderModal}
          onClose={() => setShowBulkOrderModal(false)}
          pizzas={allPizzas}
          initialQuantities={quantities}
        />
      </div>
    )
  }

  return (
    <OrderProvider>
      <DashboardContent />
    </OrderProvider>
  )
}