/**
 * JWT payload interface
 * Contains user information to be encoded in the JWT token
 */
export interface JwtPayload {
  sub: string;           // User ID
  email: string;         // User email
  phone_number: string;  // User phone number
  role?: string;         // User role
  iat?: number;          // Issued at timestamp
  exp?: number;          // Expiration timestamp
  jti?: string;          // JWT ID for token tracking
}