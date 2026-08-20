import { create } from 'zustand';
import { UserProfileDto, WalletBalancesDto } from '@fintech/shared';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  user: UserProfileDto | null;
  wallet: WalletBalancesDto | null;
  isLoading: boolean;
  setAuth: (token: string, user: UserProfileDto, wallet?: WalletBalancesDto) => void;
  setWallet: (wallet: WalletBalancesDto) => void;
  refreshWallet: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  wallet: localStorage.getItem('wallet') ? JSON.parse(localStorage.getItem('wallet')!) : null,
  isLoading: false,

  setAuth: (token, user, wallet) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (wallet) {
      localStorage.setItem('wallet', JSON.stringify(wallet));
    }
    set({ token, user, wallet: wallet || null });
  },

  setWallet: (wallet) => {
    localStorage.setItem('wallet', JSON.stringify(wallet));
    set({ wallet });
  },

  refreshWallet: async () => {
    try {
      const res = await api.get('/wallet/balance');
      if (res.data?.data) {
        localStorage.setItem('wallet', JSON.stringify(res.data.data));
        set({ wallet: res.data.data });
      }
    } catch {
      // Ignored
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
    set({ token: null, user: null, wallet: null });
  }
}));
