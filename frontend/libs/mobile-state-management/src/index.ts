/**
 * Mobile State Management Library
 *
 * Centralized state management for Meqenet mobile app
 * Built with Zustand for lightweight, performant state management
 */

// Auth store exports
export { useAuthStore, authUtils } from './lib/auth-store';
export type { User, AuthState } from './lib/auth-store';

// Re-export common utilities
export * from './lib/auth-store';
