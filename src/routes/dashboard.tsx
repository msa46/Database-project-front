import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { isAuthenticated, getValidToken, logout } from '../lib/auth'
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
import { OrderProvider, useOrder } from '@/components/order/OrderProvider'
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
  const [userType, setUserType] = useState<'customer' | 'delivery_driver' | 'employee' | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  const fetchDashboardData = async (pageNum: number = 1, append: boolean = false) => {
    try {
      // Check if we're in development mode (using the same logic as DevModeToggle)
      const isDevModeActive = window.localStorage.getItem('force_dev_mode') === 'true';

      if (isDevModeActive) {
        console.log('[DEV MODE] Using mock dashboard data');

        // Mock data for development based on user type
        let mockDashboardData;
        let devUserType = 'customer';

        // Check if we should show delivery driver dashboard based on dev mode context
        const isDevModeActive = window.localStorage.getItem('force_dev_mode') === 'true';

        if (isDevModeActive) {
          // Try to detect user type from localStorage or default to customer
          devUserType = localStorage.getItem('dev_user_type') || 'customer';

          if (devUserType === 'delivery_driver') {
            console.log('[DEV MODE] Using mock delivery driver dashboard data');
            const mockCustomers = [
              { id: 1, username: 'john_doe', address: '123 Main St', phone: '555-0123' },
              { id: 2, username: 'jane_smith', address: '456 Oak Ave', phone: '555-0456' },
              { id: 3, username: 'bob_johnson', address: '789 Pine Rd', phone: '555-0789' }
            ];

            mockDashboardData = {
              customers: mockCustomers,
              total: mockCustomers.length,
              page: pageNum,
              has_more: false
            };

            setCustomers(mockCustomers);
            setUserType('delivery_driver');
          } else if (devUserType === 'employee') {
            console.log('[DEV MODE] Using mock employee dashboard data');
            const mockEmployees = [
              { id: 1, username: 'manager_smith', position: 'Store Manager', salary: 45000.0, status: 'Available' },
              { id: 2, username: 'chef_jones', position: 'Head Chef', salary: 38000.0, status: 'Available' },
              { id: 3, username: 'cashier_brown', position: 'Cashier', salary: 28000.0, status: 'Off_Duty' }
            ];

            mockDashboardData = {
              employees: mockEmployees,
              total: mockEmployees.length,
              page: pageNum,
              has_more: false
            };

            setEmployees(mockEmployees);
            setUserType('employee');
          } else {
            console.log('[DEV MODE] Using mock customer dashboard data');
            const mockPizzas = [
              {
                id: 1,
                name: 'Margherita',
                description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
                price: '12.99',
                size: 'medium',
                toppings: ['tomato sauce', 'mozzarella', 'basil']
              },
              {
                id: 2,
                name: 'Pepperoni',
                description: 'Spicy pepperoni with mozzarella cheese and tomato sauce',
                price: '14.99',
                size: 'medium',
                toppings: ['tomato sauce', 'mozzarella', 'pepperoni']
              },
              {
                id: 3,
                name: 'Vegetarian Supreme',
                description: 'Loaded with fresh vegetables, mushrooms, and olives',
                price: '16.99',
                size: 'medium',
                toppings: ['tomato sauce', 'mozzarella', 'mushrooms', 'peppers', 'olives', 'onions']
              }
            ];

            mockDashboardData = {
              pizzas: mockPizzas,
              total: mockPizzas.length,
              page: pageNum,
              has_more: false
            };

            setAllPizzas(mockPizzas);
            setUserType('customer');
          }
        } else {
          // Default to customer pizzas for non-dev mode
          const defaultMockPizzas = [
            {
              id: 1,
              name: 'Margherita',
              description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
              price: '12.99',
              size: 'medium',
              toppings: ['tomato sauce', 'mozzarella', 'basil']
            }
          ];

          mockDashboardData = {
            pizzas: defaultMockPizzas,
            total: defaultMockPizzas.length,
            page: pageNum,
            has_more: false
          };

          setAllPizzas(defaultMockPizzas);
          setUserType('customer');
        }

        if (append) {
          setDashboardData((prevData: any) => ({
            ...prevData,
            ...mockDashboardData
          }));
        } else {
          setDashboardData(mockDashboardData);
        }

        // Set appropriate state based on user type - no more variable scope issues
        if (devUserType === 'employee') {
          // Employee dashboard doesn't need pizza-related state
          setHasMore(false);
        } else if (devUserType === 'delivery_driver') {
          // Delivery driver dashboard doesn't need pizza-related state
          setHasMore(false);
        } else {
          // Set pizzas for customer dashboard - define mockPizzas in the right scope
          const customerMockPizzas = [
            {
              id: 1,
              name: 'Margherita',
              description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
              price: '12.99',
              size: 'medium',
              toppings: ['tomato sauce', 'mozzarella', 'basil']
            },
            {
              id: 2,
              name: 'Pepperoni',
              description: 'Spicy pepperoni with mozzarella cheese and tomato sauce',
              price: '14.99',
              size: 'medium',
              toppings: ['tomato sauce', 'mozzarella', 'pepperoni']
            }
          ];
          setAllPizzas(customerMockPizzas);
          setHasMore(false);
        }
        setLoading(false);
        setLoadingMore(false);

        console.log('[DEV MODE] Mock dashboard data loaded:', mockDashboardData);
        return;
      }

      const token = getValidToken();

      console.log('[DIAGNOSTIC] fetchDashboardData called');
      console.log('[DIAGNOSTIC] Valid token exists:', !!token);

      // Check if token is valid before making request
      if (!token) {
        console.log('[DIAGNOSTIC] No valid token found, redirecting to login');
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

      // Detect user type based on response structure
      console.log('[DEBUG] Detecting user type from response data');
      let detectedUserType: 'customer' | 'delivery_driver' | 'employee' | null = 'customer';

      if (data.employees && Array.isArray(data.employees)) {
        console.log('[DEBUG] Found employees array - this is an employee dashboard');
        detectedUserType = 'employee';
        setEmployees(data.employees);
      } else if (data.customers && Array.isArray(data.customers)) {
        console.log('[DEBUG] Found customers array - this is a delivery driver dashboard');
        detectedUserType = 'delivery_driver';
        setCustomers(data.customers);
      } else if (data.pizzas && Array.isArray(data.pizzas)) {
        console.log('[DEBUG] Found pizzas array - this is a customer dashboard');
        detectedUserType = 'customer';
      } else {
        console.log('[DEBUG] Could not determine user type, defaulting to customer');
        detectedUserType = 'customer';
      }

      setUserType(detectedUserType);
      console.log('[DEBUG] Detected user type:', detectedUserType);

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
    const token = getValidToken()
    console.log('[DIAGNOSTIC] Authentication check - valid token exists:', !!token);
    
    if (!token) {
      console.log('[DIAGNOSTIC] No valid token found, redirecting to login')
      navigate({ to: '/login' })
      return
    }

    console.log('[DIAGNOSTIC] Authentication passed, fetching dashboard data');
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
        <h1 className="text-2xl font-bold mb-4">
          Welcome to Your {
            userType === 'delivery_driver' ? 'Delivery Driver' :
            userType === 'employee' ? 'Employee' : 'Customer'
          } Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <p>
                  {userType === 'delivery_driver'
                    ? "Manage your deliveries and customer orders."
                    : userType === 'employee'
                    ? "Manage staff and oversee business operations."
                    : "This is your personal dashboard where you can manage your account and view your activities."
                  }
                </p>
                {userType === 'customer' && allPizzas.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBulkOrder}
                    className="shrink-0"
                  >
                    Quick Order Multiple Pizzas
                  </Button>
                )}
              </div>

              {/* Delivery Driver Dashboard */}
              {userType === 'delivery_driver' && customers.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Customer Management</h2>
                  <div className="space-y-4">
                    <Table>
                      <TableCaption>Customer orders and delivery information</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer: any) => (
                          <TableRow key={customer.id}>
                            <TableCell>{customer.id}</TableCell>
                            <TableCell>{customer.username || 'N/A'}</TableCell>
                            <TableCell>{customer.address || 'N/A'}</TableCell>
                            <TableCell>{customer.phone || 'N/A'}</TableCell>
                            <TableCell>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                Active
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Employee Dashboard */}
              {userType === 'employee' && employees.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Staff Management</h2>
                  <div className="space-y-4">
                    <Table>
                      <TableCaption>Employee overview and management</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Salary</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee: any) => (
                          <TableRow key={employee.id}>
                            <TableCell>{employee.id}</TableCell>
                            <TableCell>{employee.username || 'N/A'}</TableCell>
                            <TableCell>{employee.position || 'N/A'}</TableCell>
                            <TableCell>${employee.salary ? employee.salary.toLocaleString() : 'N/A'}</TableCell>
                            <TableCell>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                Employee
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
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