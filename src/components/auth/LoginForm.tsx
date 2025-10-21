import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, storeUser } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  username_or_email: z.string().min(1, { message: 'Username or email is required' }),
  password: z.string().min(1, { message: 'Password is required' }), // Keep for UI but ignore
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const form = useForm<FormData>({
    // @ts-ignore: Zod version compatibility issue
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      console.log('LoginForm: Submitting login form with data:', data);

      // For public auth, we don't need password
      const loginData = { username_or_email: data.username_or_email };
      const response = await login(loginData);

      console.log('LoginForm: Login response received:', response);
      console.log('LoginForm: User ID from response:', response.id);
      console.log('LoginForm: Username from response:', response.username);

      // Store user data in localStorage (no tokens needed!)
      storeUser(response.id, response.username);

      setSuccess('Login successful!');
      form.reset();

      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1000);
    } catch (err) {
      console.error('LoginForm: Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username_or_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your username or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Any password works!)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Any password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        <div className="mt-4 text-center">
          <a href="/signup" className="text-blue-500 hover:underline">
            Don't have an account? Sign up
          </a>
        </div>
      </CardContent>
    </Card>
  );
}