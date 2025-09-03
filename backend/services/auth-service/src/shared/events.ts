export enum AuthEvent {
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  PASSWORD_RESET_REQUESTED = 'user.password_reset_requested',
  USER_PASSWORD_RESET = 'user.password_reset',
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  timestamp: string;
}

export interface UserLoggedInPayload {
  userId: string;
  timestamp: string;
  ipAddress: string;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  timestamp: string;
}

export interface UserPasswordResetPayload {
  userId: string;
  timestamp: string;
  eventType: string;
}
