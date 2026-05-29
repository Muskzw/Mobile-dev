import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  fullName?: string;
  subscription_tier?: string;
}

interface Company {
  id: string;
  name: string;
  email?: string;
  address?: string;
  logo_url?: string;
  currency: string;
  brand_color: string;
  taxRate?: number;
  terms?: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  contact_name?: string;
  phone?: string;
  address_line2?: string;
  address_line3?: string;
  business_label?: string;
  business_number?: string;
  business_category?: string;
  payment_instructions?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  companies: Company[];
  currentCompany: Company | null;
  hasCompletedOnboarding: boolean;
  setAuth: (token: string, user: User, companies: Company[]) => void;
  setCurrentCompany: (company: Company) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      companies: [],
      currentCompany: null,
      hasCompletedOnboarding: false,
      setAuth: (token, user, companies) => {
        set({ token, user, companies, currentCompany: companies[0] || null });
      },
      setCurrentCompany: (company) => {
        set({ currentCompany: company });
      },
      setHasCompletedOnboarding: (completed) => {
        set({ hasCompletedOnboarding: completed });
      },
      logout: () => {
        set({ token: null, user: null, companies: [], currentCompany: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

