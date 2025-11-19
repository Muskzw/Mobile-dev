import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  currency: string;
  brand_color: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  companies: Company[];
  currentCompany: Company | null;
  setAuth: (token: string, user: User, companies: Company[]) => void;
  setCurrentCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      companies: [],
      currentCompany: null,
      setAuth: (token, user, companies) => {
        set({ token, user, companies, currentCompany: companies[0] || null });
      },
      setCurrentCompany: (company) => {
        set({ currentCompany: company });
      },
      logout: () => {
        set({ token: null, user: null, companies: [], currentCompany: null });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

