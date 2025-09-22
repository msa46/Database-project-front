import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from '../components/auth/SignupForm'
import { useEffect } from 'react'

export const Route = createFileRoute('/signup')({
  component: () => {
    useEffect(() => {
      document.title = 'Sign Up'
    }, [])
    return <SignupForm />
  }
})