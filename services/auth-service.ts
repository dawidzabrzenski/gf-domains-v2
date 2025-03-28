// Authentication service for handling JWT tokens and login/logout functionality

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    username: string;
    [key: string]: any; // For any additional user data
  };
}

// Token storage keys
const TOKEN_KEY = "domain_manager_token";
const USER_KEY = "domain_manager_user";

// Auth service functions
export const authService = {
  // Login function - sends credentials to API and stores token
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: AuthResponse = await response.json();

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  },

  // Logout function - clears stored token and user data
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "/login"; // Redirect to login page
  },

  // Get the stored token
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Get the stored user data
  getUser(): any | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Add authorization header to fetch options
  addAuthHeader(options: RequestInit = {}): RequestInit {
    const token = this.getToken();
    if (!token) return options;

    return {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  },
};
