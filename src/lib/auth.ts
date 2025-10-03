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
    birthdate?: string;
    address: string;
    postalCode: string;
    phone: string;
    gender: string;
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
    console.log('Attempting signup to:', `${API_URL}/auth/signup`);
    console.log('Signup request:', request);
    
    const response = await ky.post(`${API_URL}/auth/signup`, {
        json: request,
        credentials: 'include',
    });

    console.log('Signup response status:', response.status);
    console.log('Signup response headers:', response.headers);

    if (!response.ok) {
        throw new Error(`Signup failed: ${response.statusText}`);
    }

    const data = await response.json<AuthResponse>();
    console.log('Signup response data:', data);
    
    // Store token in localStorage as backup but rely on cookies for authentication
    if (data.access_token && typeof data.access_token === 'string' && data.access_token.trim() !== '') {
        console.log('Storing token in localStorage');
        storeToken(data.access_token);
    } else {
        console.error('Invalid token received from signup response');
        throw new Error('Invalid authentication token received');
    }
    
    return data;
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