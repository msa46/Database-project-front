import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { isAuthenticated, getToken } from '../lib/auth'
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

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Dashboard'
    
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate({ to: '/login' })
      return
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const token = getToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add Authorization header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await ky.get(`${API_URL}/v1/dashboard`, {
          headers,
          credentials: 'include'
        })

        if (!response.ok) {
          // Handle authentication errors by redirecting to login
          if (response.status === 401 || response.status === 403) {
            console.log('Authentication error, redirecting to login');
            navigate({ to: '/login' });
            return;
          }
          
          const errorText = await response.text();
          throw new Error(`Failed to fetch dashboard data: ${errorText}`);
        }

        const data = await response.json<any>()
        setDashboardData(data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

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
      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-4">This is your personal dashboard where you can manage your account and view your activities.</p>
        
        {dashboardData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Pizzas</h2>
            
            {/* Try to extract pizzas from different possible locations in the data */}
            {(() => {
              let pizzas = [];
              
              // Check if pizzas is directly in the data
              if (dashboardData.pizzas && Array.isArray(dashboardData.pizzas)) {
                pizzas = dashboardData.pizzas;
              }
              // Check if data itself is an array of pizzas
              else if (Array.isArray(dashboardData)) {
                pizzas = dashboardData;
              }
              // Check if pizzas are nested in a data property
              else if (dashboardData.data && Array.isArray(dashboardData.data)) {
                pizzas = dashboardData.data;
              }
              // Check if pizzas are nested in other common properties
              else if (dashboardData.items && Array.isArray(dashboardData.items)) {
                pizzas = dashboardData.items;
              }
              // Check if pizzas are nested in results
              else if (dashboardData.results && Array.isArray(dashboardData.results)) {
                pizzas = dashboardData.results;
              }
              // Look for any array in the data that might contain pizzas
              else {
                for (const key in dashboardData) {
                  if (Array.isArray(dashboardData[key]) && dashboardData[key].length > 0) {
                    // Check if this array looks like it contains pizzas
                    const firstItem = dashboardData[key][0];
                    if (firstItem && typeof firstItem === 'object' &&
                        (firstItem.name || firstItem.price || firstItem.size || firstItem.toppings)) {
                      pizzas = dashboardData[key];
                      break;
                    }
                  }
                }
              }
              
              return (
                <Table>
                  <TableCaption>List of your pizzas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Toppings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pizzas.length > 0 ? (
                      pizzas.map((pizza: any, index: number) => (
                        <TableRow key={pizza.id || index}>
                          <TableCell className="font-medium">{pizza.id || index + 1}</TableCell>
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No pizzas found. Check back later for delicious pizzas!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              );
            })()}
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Raw Dashboard Data</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(dashboardData, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
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
    </div>
  )
}