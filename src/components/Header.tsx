import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { isAuthenticated, logout } from '@/lib/auth'
import { DevModeToggle } from './DevModeToggle'

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const isOnDashboard = location.pathname === '/dashboard';

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/" className="text-black hover:text-gray-600 transition-colors">Home</Link>
        </div>
        {isAuthenticated() ? (
          <>
            <div className="px-2">
              <Link to="/dashboard" className="text-black hover:text-gray-600 transition-colors">Dashboard</Link>
            </div>
            {isOnDashboard && (
              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                  style={{
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    display: 'inline',
                    verticalAlign: 'baseline',
                    padding: 0,
                    margin: 0
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-2">
              <Link to="/login" className="text-black hover:text-gray-600 transition-colors">Login</Link>
            </div>
            <div className="px-2">
              <Link to="/signup" className="text-black hover:text-gray-600 transition-colors">Signup</Link>
            </div>
          </>
        )}
      </nav>
      <div className="flex items-center">
        <DevModeToggle />
      </div>
    </header>
  )
}
