import { API_URL } from './api';
import ky from 'ky';

export interface LoginRequest {
    username_or_email: string;
    // No password needed for public auth
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
    id: number;        // user id
    username: string;
    email: string;
    user_type: string;
    // No tokens for public auth!
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
    console.log('[DEBUG] API_URL from auth module:', API_URL);
    console.log('[DEBUG] Attempting login to:', `${API_URL}/public-auth/login`);
    console.log('[DEBUG] Login request:', request);

    const response = await ky.post(`${API_URL}/public-auth/login`, {
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

    // Store user_id in localStorage (no tokens needed!)
    if (data.id) {
        console.log('Storing user_id in localStorage:', data.id);
        localStorage.setItem('user_id', data.id.toString());
        localStorage.setItem('username', data.username);
    } else {
        console.error('No user_id received from login response');
        throw new Error('Invalid login response');
    }

    return data;
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
    console.log('[DEBUG] API_URL from auth module:', API_URL);
    console.log('[DEBUG] Attempting signup to:', `${API_URL}/public-auth/signup`);
    console.log('[DEBUG] API_URL from environment:', API_URL);
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
        console.log('DEBUG: Making POST request to:', `${API_URL}/public-auth/signup`);
        console.log('DEBUG: Request JSON payload:', JSON.stringify({
            ...request,
            // Log the type of each field to help debug type issues
            fieldTypes: Object.entries(request).reduce((acc, [key, value]) => {
                acc[key] = typeof value;
                return acc;
            }, {} as Record<string, string>)
        }, null, 2));
        
        const response = await ky.post(`${API_URL}/public-auth/signup`, {
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

        // Store user_id in localStorage (no tokens needed for public auth!)
        if (data.id) {
            console.log('DEBUG: Storing user_id in localStorage:', data.id);
            localStorage.setItem('user_id', data.id.toString());
            localStorage.setItem('username', data.username);
        } else {
            console.error('DEBUG: No user_id received from signup response');
            throw new Error('Invalid signup response');
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

const USER_ID_KEY = 'user_id';
const USERNAME_KEY = 'username';
const DISCOUNT_CODE_KEY = 'discount_code';

export function storeToken(token: string): void {
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Attempted to store invalid token');
        throw new Error('Cannot store invalid token');
    }
    localStorage.setItem('auth_token', token);
}

export function storeUser(userId: number, username: string): void {
    if (!userId || isNaN(userId)) {
        console.error('Attempted to store invalid user_id');
        throw new Error('Cannot store invalid user_id');
    }
    localStorage.setItem(USER_ID_KEY, userId.toString());
    localStorage.setItem(USERNAME_KEY, username);
}

export function getUserId(): number | null {
    const userId = localStorage.getItem(USER_ID_KEY);
    console.log('[DEBUG] getUserId called. User ID exists:', !!userId);
    if (userId) {
        const id = parseInt(userId, 10);
        console.log('[DEBUG] User ID:', id);
        return id;
    }
    return null;
}

export function getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
}

export function isAuthenticated(): boolean {
    const userId = getUserId();
    console.log('Checking authentication. User ID in localStorage:', userId);
    return userId !== null && !isNaN(userId);
}

export function logout(): void {
    console.log('[DEBUG] Logging out, removing user data from localStorage')
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
}

// Since we're not using tokens anymore, these functions are simplified
export function isTokenExpired(): boolean {
    // No tokens to expire in public auth
    return false;
}

export function refreshTokenIfNeeded(): boolean {
    // No tokens to refresh in public auth
    return true;
}

// No token validation needed for public auth
export function isValidTokenFormat(token: string): boolean {
    // No tokens in public auth
    return false;
}

// No token needed for public auth
export function getValidToken(): string | null {
    // No tokens in public auth - return null
    return null;
}

// Discount code localStorage functions
export function storeDiscountCode(discountCode: any): void {
    if (!discountCode || typeof discountCode !== 'object') {
        console.error('Attempted to store invalid discount code');
        throw new Error('Cannot store invalid discount code');
    }
    localStorage.setItem(DISCOUNT_CODE_KEY, JSON.stringify(discountCode));
}

export function getDiscountCode(): any | null {
    try {
        const discountCodeStr = localStorage.getItem(DISCOUNT_CODE_KEY);
        if (discountCodeStr) {
            return JSON.parse(discountCodeStr);
        }
        return null;
    } catch (error) {
        console.error('Error parsing discount code from localStorage:', error);
        return null;
    }
}

export function clearDiscountCode(): void {
    localStorage.removeItem(DISCOUNT_CODE_KEY);
}