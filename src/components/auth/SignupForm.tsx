import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signup, storeToken } from '@/lib/auth';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { faker } from '@faker-js/faker';
import * as zod from 'zod';

const schema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirm_password: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }),
  user_type: z.enum(['customer', 'employee', 'delivery_person'], {
    message: 'Please select a user type'
  }),
  birthdate: z.string().datetime().optional(),
  address: z.string().min(1, { message: 'Address is required' }),
  postalCode: z.string().min(1, { message: 'Postal code is required' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  position: z.string().optional(),
  salary: z.number().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fakeDataApplied, setFakeDataApplied] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: (data, context, options) => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { values: result.data, errors: {} };
      } else {
        return {
          values: {},
          errors: result.error.issues.reduce((acc, issue) => {
            acc[issue.path.join('.')] = { message: issue.message, type: 'validation' };
            return acc;
          }, {} as Record<string, any>)
        };
      }
    },
    defaultValues: {
      user_type: 'customer'
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const signupData = { ...data };
      
      // Convert birthdate from date string to datetime object if it exists
      if (signupData.birthdate) {
        const birthdate = new Date(signupData.birthdate);
        // Format as ISO string to get datetime representation
        signupData.birthdate = birthdate.toISOString();
      }
      
      const response = await signup(signupData);
      storeToken(response.token);
      setSuccess('Signup successful! Welcome aboard.');
      form.reset();
      
      // Redirect to dashboard after successful signup
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateFakeData = () => {
    const fakePassword = faker.internet.password({ length: 10, memorable: true });
    const userType = faker.helpers.arrayElement(['customer', 'employee', 'delivery_person']);
    
    // Reset form first to clear all values
    form.reset();
    
    // Set the user type first to ensure conditional rendering works properly
    form.setValue('user_type', userType);
    
    // Force a re-render by updating the fakeDataApplied state
    setFakeDataApplied(!fakeDataApplied);
    
    // Set basic user data
    form.setValue('username', faker.internet.username());
    form.setValue('email', faker.internet.email());
    form.setValue('password', fakePassword);
    form.setValue('confirm_password', fakePassword);
    form.setValue('birthdate', faker.date.birthdate().toISOString().split('T')[0]);
    form.setValue('address', faker.location.streetAddress());
    form.setValue('postalCode', faker.location.zipCode());
    form.setValue('phone', faker.phone.number());
    form.setValue('gender', faker.person.gender());
    
    // Add employee specific data if userType is employee
    if (userType === 'employee') {
      form.setValue('position', faker.helpers.arrayElement(['Manager', 'Specialist', 'Associate', 'Director']));
      form.setValue('salary', faker.number.int({ min: 30000, max: 100000 }));
    }
    
    // Add delivery person specific data if userType is delivery_person
    if (userType === 'delivery_person') {
      form.setValue('position', faker.helpers.arrayElement(['Senior Delivery', 'Junior Delivery', 'Delivery Specialist', 'Route Manager']));
      form.setValue('salary', faker.number.int({ min: 25000, max: 60000 }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
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
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthdate (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Your address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Your postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input placeholder="Male/Female" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>User Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="customer" id="customer" />
                        <Label htmlFor="customer">Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="employee" id="employee" />
                        <Label htmlFor="employee">Employee</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery_person" id="delivery_person" />
                        <Label htmlFor="delivery_person">Delivery Person</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Employee and delivery person specific fields - conditionally rendered */}
            {(form.watch('user_type') === 'employee' || form.watch('user_type') === 'delivery_person') && (
              <>
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Your position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Your salary"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
              <Button type="button" onClick={generateFakeData} variant="outline" className="flex-1">
                Fake Data
              </Button>
            </div>
          </form>
        </Form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-500 hover:underline">
            Already have an account? Log in
          </a>
        </div>
      </CardContent>
    </Card>
  );
}