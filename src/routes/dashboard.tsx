import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { isAuthenticated, getToken } from '../lib/auth'
import { API_URL } from '../lib/api'
import ky from 'ky'

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
            <h2 className="text-xl font-semibold mb-2">Your Information</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
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