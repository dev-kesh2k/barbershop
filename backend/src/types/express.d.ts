import type { Role } from "../lib/constants";

export interface PublicUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  barbershopId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
