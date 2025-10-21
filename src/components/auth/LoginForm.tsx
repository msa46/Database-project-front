import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, storeToken } from '@/lib/auth';
import { devModeManager } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const schema = z.object({
  username_or_email: z.string().min(1, { message: 'Username or email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('customer');
  const navigate = useNavigate();

  // Check if dev mode is active on component mount and listen for changes
  useEffect(() => {
    const checkDevMode = () => {
      const devModeActive = devModeManager.isDevModeActive();
      setIsDevMode(devModeActive);
      if (devModeActive) {
        console.log('[LoginForm] Dev mode is active, showing dashboard selection options');
      }
    };

    // Check initially
    checkDevMode();

    // Listen for localStorage changes (dev mode toggle updates localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'force_dev_mode') {
        console.log('[LoginForm] Dev mode localStorage changed, updating state');
        checkDevMode();
      }
    };

    // Listen for custom dev mode toggle events
    const handleDevModeToggle = () => {
      console.log('[LoginForm] Dev mode toggle event received, updating state');
      checkDevMode();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('devModeToggle', handleDevModeToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('devModeToggle', handleDevModeToggle);
    };
  }, []);

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
      console.log('LoginForm: Selected user type:', selectedUserType);

      // Include the selected user type in the login request for dev mode
      const loginData = {
        ...data,
        userType: isDevMode ? selectedUserType : undefined
      };

      const response = await login(loginData);
      console.log('LoginForm: Login response received:', response);
      console.log('LoginForm: Token from response:', response.access_token);

      // Store the selected user type for dev mode dashboard detection
      if (isDevMode) {
        localStorage.setItem('dev_user_type', selectedUserType);
        console.log('LoginForm: Stored dev user type:', selectedUserType);
      }
      
      // Check if token was stored correctly
      const storedToken = localStorage.getItem('auth_token');
      console.log('LoginForm: Token retrieved from localStorage:', storedToken);
      
      // Manually set the access token cookie
      document.cookie = `access_token=${response.access_token}; path=/; domain=${window.location.hostname}; SameSite=Lax`;
      console.log('LoginForm: Set cookie with domain attribute');
      console.log('LoginForm: Document cookies after setting with domain:', document.cookie);
      
      // Also try without domain
      document.cookie = `access_token=${response.access_token}; path=/; SameSite=Lax`;
      console.log('LoginForm: Set cookie without domain attribute');
      console.log('LoginForm: Document cookies after setting without domain:', document.cookie);
      
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dev Mode Dashboard Selection */}
            {isDevMode && (
              <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <FormLabel className="text-sm font-medium text-yellow-800">
                  🚧 Development Mode - Choose Dashboard Type
                </FormLabel>
                <RadioGroup
                  value={selectedUserType}
                  onValueChange={setSelectedUserType}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <FormLabel htmlFor="customer" className="text-sm text-gray-700 cursor-pointer">
                      Customer Dashboard - Order pizzas and manage orders
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery_driver" id="delivery_driver" />
                    <FormLabel htmlFor="delivery_driver" className="text-sm text-gray-700 cursor-pointer">
                      Delivery Driver Dashboard - Manage deliveries and routes
                    </FormLabel>
                  </div>
                </RadioGroup>
                <p className="text-xs text-yellow-600">
                  This option is only available in development mode for testing different dashboard views.
                </p>
              </div>
            )}

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