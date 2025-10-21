import { Link, useRouter, useLocation } from '@tanstack/react-router'
import { isAuthenticated, logout } from '@/lib/auth'

export default function Header() {
  const router = useRouter()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    router.navigate({ to: '/login' })
  }

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>
        {isAuthenticated() ? (
          <>
            <div className="px-2">
              <Link to="/dashboard">Dashboard</Link>
            </div>
            {location.pathname === '/dashboard' && (
              <div className="px-2">
                <Link
                  to="/login"
                  onClick={(e) => {
                    e.preventDefault()
                    handleLogout()
                  }}
                  className="hover:underline"
                >
                  Logout
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-2">
              <Link to="/login">Login</Link>
            </div>
            <div className="px-2">
              <Link to="/signup">Signup</Link>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}
