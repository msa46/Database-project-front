import { Link } from '@tanstack/react-router'
import { isAuthenticated } from '@/lib/auth'

export default function Header() {
  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>
        {isAuthenticated() ? (
          <div className="px-2">
            <Link to="/dashboard">Dashboard</Link>
          </div>
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
