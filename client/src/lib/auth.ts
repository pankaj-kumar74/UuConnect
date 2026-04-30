import React from "react";
import { useAuth } from "@/contexts/auth-context";

export function useAuthenticatedRequest() {
  const { token } = useAuth();
  
  const makeRequest = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });
  };

  return makeRequest;
}

export function requireAuth(Component: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' }, 'Loading...');
    }

    if (!user) {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' }, 'Please sign in to access this page.');
    }

    return React.createElement(Component, props);
  };
}

export function requireAdmin(Component: React.ComponentType<any>) {
  return function AdminComponent(props: any) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' }, 'Loading...');
    }

    if (!user) {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' }, 'Please sign in to access this page.');
    }

    if (user.role !== 'admin') {
      return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' }, 'Admin access required.');
    }

    return React.createElement(Component, props);
  };
}
