import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { isAuthenticated, getToken, isTokenExpired, logout } from '../lib/auth'
import { API_URL } from '../lib/api'
import ky from 'ky'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { OrderProvider } from '@/components/order/OrderProvider'
import { QuantitySelector } from '@/components/order/QuantitySelector'
import { OrderButton } from '@/components/order/OrderButton'
import { OrderSummary } from '@/components/order/OrderSummary'

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

  const fetchDashboardData = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const token = getToken();
      
      console.log('[DEBUG] fetchDashboardData called');
      console.log('[DEBUG] Token exists:', !!token);
      console.log('[DEBUG] Token expired?', isTokenExpired());
      
      // Check if token is valid before making request
      if (!token || isTokenExpired()) {
        console.log('[DEBUG] Token is missing or expired, redirecting to login');
        navigate({ to: '/login' });
        return;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('[DEBUG] Added Authorization header with token');
      
      const url = `${API_URL}/v1/dashboard?page=${pageNum}`;
      console.log('[DEBUG] Dashboard API URL being used:', url);
      console.log('[DEBUG] API_URL from dashboard module:', API_URL);
      console.log('[DEBUG] Full request headers:', headers);
      
      const response = await ky.get(url, {
        headers,
        credentials: 'include'
      });

      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Handle authentication errors by redirecting to login
        if (response.status === 401 || response.status === 403) {
          console.log('[DEBUG] Authentication error received, clearing token and redirecting to login');
          logout(); // Clear the invalid token
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
      
      // Extract pizzas from the response
      console.log('[DEBUG] Extracting pizzas from response data');
      console.log('[DEBUG] Data type:', typeof data);
      console.log('[DEBUG] Is data an array?', Array.isArray(data));
      console.log('[DEBUG] Data keys:', Object.keys(data));
      
      let pizzas = [];
      if (data.pizzas && Array.isArray(data.pizzas)) {
        console.log('[DEBUG] Found pizzas in data.pizzas');
        pizzas = data.pizzas;
      } else if (Array.isArray(data)) {
        console.log('[DEBUG] Data itself is an array, using as pizzas');
        pizzas = data;
      } else if (data.data && Array.isArray(data.data)) {
        console.log('[DEBUG] Found pizzas in data.data');
        pizzas = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        console.log('[DEBUG] Found pizzas in data.items');
        pizzas = data.items;
      } else if (data.results && Array.isArray(data.results)) {
        console.log('[DEBUG] Found pizzas in data.results');
        pizzas = data.results;
      } else {
        console.log('[DEBUG] Checking for pizzas in nested arrays');
        for (const key in data) {
          console.log(`[DEBUG] Checking key "${key}":`, typeof data[key], Array.isArray(data[key]) ? `array with ${data[key].length} items` : 'not an array');
          if (Array.isArray(data[key]) && data[key].length > 0) {
            const firstItem = data[key][0];
            console.log(`[DEBUG] First item in "${key}":`, firstItem);
            if (firstItem && typeof firstItem === 'object' &&
                (firstItem.name || firstItem.price || firstItem.size || firstItem.toppings)) {
              console.log(`[DEBUG] Found pizzas in data.${key}`);
              pizzas = data[key];
              break;
            }
          }
        }
      }
      
      console.log('[DEBUG] Extracted pizzas:', pizzas);
      console.log('[DEBUG] Number of pizzas:', pizzas.length);
      
      // Check if there are more pages
      const pageSize = 10; // Assuming a page size of 10
      setHasMore(pizzas.length === pageSize);
      
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
    
    // Check authentication status
    const token = getToken()
    console.log('[DEBUG] Authentication check - token exists:', !!token);
    
    if (!token) {
      console.log('[DEBUG] No token found, checking if page refresh might help with cookies')
      // Try to check if we have a valid session through cookies even without localStorage token
      // This handles cases where the user logged in but the token wasn't stored properly
      fetchDashboardData(1, false).catch(err => {
        console.log('[DEBUG] No token and API request failed, redirecting to login');
        navigate({ to: '/login' });
      });
      return
    }
    
    const expired = isTokenExpired();
    console.log('[DEBUG] Token expired check:', expired);
    
    if (expired) {
      console.log('[DEBUG] Token is expired, clearing and redirecting to login')
      logout();
      navigate({ to: '/login' })
      return
    }

    console.log('[DEBUG] Authentication passed, fetching dashboard data');
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

  const handleQuantityChange = (pizzaId: string | number, newQuantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [pizzaId]: newQuantity
    }))
  }

  return (
    <OrderProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pizza Table - Left Side (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="mb-4">This is your personal dashboard where you can manage your account and view your activities.</p>
              
              {dashboardData && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Available Pizzas</h2>
                  
                  {/* Try to extract pizzas from different possible locations in the data */}
                  <Table>
                    <TableCaption>List of available pizzas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Toppings</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
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
                            <TableRow key={pizzaId}>
                              <TableCell className="font-medium">{pizzaId}</TableCell>
                              <TableCell>{pizza.name || 'N/A'}</TableCell>
                              <TableCell>{pizza.description || 'N/A'}</TableCell>
                              <TableCell>${pizza.price || '0.00'}</TableCell>
                              <TableCell>{pizza.size || 'N/A'}</TableCell>
                              <TableCell>
                                {pizza.toppings && Array.isArray(pizza.toppings)
                                  ? pizza.toppings.join(', ')
                                  : pizza.toppings || 'N/A'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-2">
                                  <QuantitySelector
                                    quantity={quantities[pizzaId] || 1}
                                    onIncrease={() => handleQuantityChange(pizzaId, (quantities[pizzaId] || 1) + 1)}
                                    onDecrease={() => handleQuantityChange(pizzaId, Math.max(1, (quantities[pizzaId] || 1) - 1))}
                                  />
                                  {isValidPrice ? (
                                    <OrderButton
                                      pizza={{
                                        id: pizzaId,
                                        name: pizza.name || 'N/A',
                                        description: pizza.description || 'N/A',
                                        price: parsedPrice,
                                        size: pizza.size || 'N/A',
                                        toppings: Array.isArray(pizza.toppings) ? pizza.toppings : []
                                      }}
                                      quantity={quantities[pizzaId] || 1}
                                    />
                                  ) : (
                                    <div className="text-sm text-red-500">
                                      Invalid price - cannot order
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No pizzas found. Check back later for delicious pizzas!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  
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
      </div>
    </OrderProvider>
  )
}