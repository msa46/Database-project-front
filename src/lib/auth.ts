import { API_URL } from './api';

export interface LoginRequest {
    username_or_email: string;
    password: string;
}

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
}

export interface AuthResponse {
    token: string;
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    return response.json();
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Signup failed: ${response.statusText}`);
    }

    return response.json();
}

const TOKEN_KEY = 'auth_token';

export function storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
}