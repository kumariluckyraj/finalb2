import type { TimestampedRecord, UserRole } from "./common";

export interface UserRecord extends TimestampedRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface CreateUserInput {
  id?: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}
