export type UserRole = "admin" | "customer" | "vendor";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}