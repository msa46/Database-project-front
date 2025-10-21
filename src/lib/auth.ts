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
  // Check the actual DevModeManager state (respects the toggle setting)
  const isDevModeActive = window.localStorage.getItem('force_dev_mode') === 'true';

  if (isDevModeActive) {
    console.log('[DEV MODE] Mock login active (toggle is in Development mode)');
    console.log('[DEV MODE] Username:', request.username_or_email);

    // Mock successful login response - use proper JWT format that matches backend expectations
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: request.username_or_email,  // Use username as subject to match backend
      user_id: 1,                     // Include user_id in payload
      username: request.username_or_email,
      email: `${request.username_or_email}@example.com`,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days to match backend
      iat: Math.floor(Date.now() / 1000)
    }));
    // Create a more realistic signature that won't cause parsing errors
    const signature = btoa('mock_signature_for_development_mode_only').replace(/=/g, '');

    const mockResponse: AuthResponse = {
      access_token: `${header}.${payload}.${signature}`,
      token_type: 'bearer',
      expires_in: 7 * 24 * 60 * 60, // 7 days to match backend
      user_id: 1,
      username: request.username_or_email,
      email: `${request.username_or_email}@example.com`
    };

    // Store the mock token
    storeToken(mockResponse.access_token);

    console.log('[DEV MODE] Mock login successful:', mockResponse);
    return mockResponse;
  }

  console.log('[DEBUG] API_URL from auth module:', API_URL);
  console.log('[DEBUG] Attempting login to:', `${API_URL}/auth/login`);
  console.log('[DEBUG] Login request:', request);

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
    console.log('[DEBUG] API_URL from auth module:', API_URL);
    console.log('[DEBUG] Attempting signup to:', `${API_URL}/auth/signup`);
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
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('[DEBUG] getToken called. Token exists:', !!token);
    if (token) {
        console.log('[DEBUG] Token length:', token.length);
        console.log('[DEBUG] Token starts with:', token.substring(0, 10) + '...');
    }
    return token;
}

export function isAuthenticated(): boolean {
    const token = getToken();
    console.log('Checking authentication. Token in localStorage:', token ? 'exists' : 'not found');
    // Check for token in localStorage as backup
    // The primary authentication should be handled by cookies
    return token !== null && typeof token === 'string' && token.trim() !== '';
}

export function logout(): void {
    console.log('[DEBUG] Logging out, removing token from localStorage')
    localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(): boolean {
    const token = getToken();
    if (!token) {
        console.log('[DIAGNOSTIC] isTokenExpired: No token found, returning true');
        return true;
    }
    
    try {
        console.log('[DIAGNOSTIC] isTokenExpired: Checking token expiration');
        console.log('[DIAGNOSTIC] Token format check - has 3 parts:', token.split('.').length === 3);
        
        // Simple JWT token parsing to check expiration
        const parts = token.split('.');
        console.log('[DIAGNOSTIC] Token parts:', parts.map((part, i) => `Part ${i}: ${part.substring(0, 20)}...`));
        
        const payload = JSON.parse(atob(parts[1]));
        console.log('[DIAGNOSTIC] Token payload:', payload);
        
        const currentTime = Date.now() / 1000;
        console.log('[DIAGNOSTIC] Current time (Unix timestamp):', currentTime);
        console.log('[DIAGNOSTIC] Token expiration time:', payload.exp);
        console.log('[DIAGNOSTIC] Token expired?', payload.exp < currentTime);
        console.log('[DIAGNOSTIC] Time until expiration (seconds):', payload.exp - currentTime);
        
        return payload.exp < currentTime;
    } catch (error) {
        console.error('[DIAGNOSTIC] Error parsing token:', error);
        console.error('[DIAGNOSTIC] Token that failed to parse:', token.substring(0, 50) + '...');
        return true; // If we can't parse the token, assume it's expired
    }
}

export function refreshTokenIfNeeded(): boolean {
    if (isTokenExpired()) {
        console.log('[DIAGNOSTIC] Token is expired, logging out');
        logout();
        return false;
    }
    return true;
}

// New function to validate token format
export function isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
        console.log('[DIAGNOSTIC] Invalid token: not a string or empty');
        return false;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.log('[DIAGNOSTIC] Invalid token format: does not have 3 parts');
        return false;
    }
    
    try {
        // Try to parse the payload
        JSON.parse(atob(parts[1]));
        return true;
    } catch (error) {
        console.log('[DIAGNOSTIC] Invalid token: payload cannot be parsed');
        return false;
    }
}

// Enhanced getToken function with validation
export function getValidToken(): string | null {
    const token = getToken();
    
    if (!token) {
        console.log('[DIAGNOSTIC] getValidToken: No token found');
        return null;
    }
    
    if (!isValidTokenFormat(token)) {
        console.log('[DIAGNOSTIC] getValidToken: Invalid token format, removing and returning null');
        logout();
        return null;
    }
    
    if (isTokenExpired()) {
        console.log('[DIAGNOSTIC] getValidToken: Token is expired, removing and returning null');
        logout();
        return null;
    }
    
    console.log('[DIAGNOSTIC] getValidToken: Token is valid');
    return token;
}