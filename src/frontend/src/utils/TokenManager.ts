import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  userId: string;
  exp: number;
  iat: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Constants
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Functions
export function storeTokens(tokens: Tokens): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isTokenValid(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    // Add a small buffer (2 seconds) to account for any clock differences
    return decoded.exp > (currentTime + 2);
  } catch {
    return false;
  }
}

export function getTokenExpiry(): number | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.exp;
  } catch {
    return null;
  }
}

export function shouldRefresh(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = expiry - currentTime;
  // More aggressive refresh - refresh if less than 30 seconds remaining
  // This is especially important now that the token expiry is only 1 minute
  return timeRemaining < 30;
}

export function getUserId(): string | null {  
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.userId;
  } catch {
    return null;
  }
}
