import { API_URL } from './api';
import ky from 'ky';

export interface LoginRequest {
    username_or_email: string;
    password: string;
}

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    birthdate?: string;
    address: string;
    postalCode: string;
    phone: string;
    gender: string;
    user_type?: string;
    position?: string;
    salary?: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user_id: number;
    username: string;
    email: string;
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
    console.log('Attempting login to:', `${API_URL}/auth/login`);
    console.log('Login request:', request);
    
    const response = await ky.post(`${API_URL}/auth/login`, {
        json: request,
        credentials: 'include',
    });

    console.log('Login response status:', response.status);
    console.log('Login response headers:', response.headers);

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json<AuthResponse>();
    console.log('Login response data:', data);
    
    // Store token in localStorage as backup but rely on cookies for authentication
    if (data.access_token && typeof data.access_token === 'string' && data.access_token.trim() !== '') {
        console.log('Storing token in localStorage');
        storeToken(data.access_token);
    } else {
        console.error('Invalid token received from login response');
        throw new Error('Invalid authentication token received');
    }
    
    return data;
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
    console.log('DEBUG: Attempting signup to:', `${API_URL}/auth/signup`);
    console.log('DEBUG: API_URL from environment:', API_URL);
    console.log('DEBUG: Current frontend origin:', window.location.origin);
    console.log('DEBUG: Signup request:', JSON.stringify(request, null, 2));
    
    // Validate required fields based on user type
    if (request.user_type === 'employee' || request.user_type === 'delivery_person') {
        if (!request.position || request.position.trim() === '') {
            throw new Error(`Position is required for ${request.user_type} accounts`);
        }
        if (request.salary === undefined || request.salary === null || isNaN(request.salary)) {
            throw new Error(`Salary is required for ${request.user_type} accounts`);
        }
    }
    
    try {
        console.log('DEBUG: Making POST request to:', `${API_URL}/auth/signup`);
        console.log('DEBUG: Request JSON payload:', JSON.stringify({
            ...request,
            // Log the type of each field to help debug type issues
            fieldTypes: Object.entries(request).reduce((acc, [key, value]) => {
                acc[key] = typeof value;
                return acc;
            }, {} as Record<string, string>)
        }, null, 2));
        
        const response = await ky.post(`${API_URL}/auth/signup`, {
            json: request,
            credentials: 'include',
        });

        console.log('DEBUG: Signup response status:', response.status);
        console.log('DEBUG: Signup response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DEBUG: Signup error response:', errorText);
            
            // Try to parse the error as JSON to get more details
            try {
                const errorJson = JSON.parse(errorText);
                console.error('DEBUG: Parsed error JSON:', errorJson);
                throw new Error(`Signup failed: ${response.statusText} - ${errorJson.detail || errorText}`);
            } catch {
                throw new Error(`Signup failed: ${response.statusText} - ${errorText}`);
            }
        }

        const data = await response.json<AuthResponse>();
        console.log('DEBUG: Signup response data:', data);
        
        // Store token in localStorage as backup but rely on cookies for authentication
        if (data.access_token && typeof data.access_token === 'string' && data.access_token.trim() !== '') {
            console.log('DEBUG: Storing token in localStorage');
            storeToken(data.access_token);
        } else {
            console.error('DEBUG: Invalid token received from signup response');
            throw new Error('Invalid authentication token received');
        }
        
        return data;
    } catch (error) {
        console.error('DEBUG: Signup error caught:', error);
        
        // Add more specific error handling for network issues
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
        }
        
        throw error;
    }
}

const TOKEN_KEY = 'auth_token';

export function storeToken(token: string): void {
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Attempted to store invalid token');
        throw new Error('Cannot store invalid token');
    }
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    const token = getToken();
    console.log('Checking authentication. Token in localStorage:', token ? 'exists' : 'not found');
    // Check for token in localStorage as backup
    // The primary authentication should be handled by cookies
    return token !== null && typeof token === 'string' && token.trim() !== '';
}

export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
}