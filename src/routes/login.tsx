import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../components/auth/LoginForm'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: () => {
    useEffect(() => {
      document.title = 'Login'
    }, [])
    return <LoginForm />
  }
})