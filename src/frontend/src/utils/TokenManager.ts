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

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static storeTokens(tokens: Tokens): void {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  static clearTokens(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  static getTokenExpiry(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.exp;
    } catch {
      return null;
    }
  }

  static shouldRefresh(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = expiry - currentTime;
    return timeRemaining < 300; // Refresh if less than 5 minutes remaining
  }

  static getUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.userId;
    } catch {
      return null;
    }
  }
}
