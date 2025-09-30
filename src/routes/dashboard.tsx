import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { isAuthenticated } from '../lib/auth'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Dashboard'
    
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate({ to: '/login' })
    }
  }, [navigate])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-4">This is your personal dashboard where you can manage your account and view your activities.</p>
        
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