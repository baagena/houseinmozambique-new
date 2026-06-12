/**
 * Centralized Auth Utility for HouseinMozambique
 * Handles mock authentication state using localStorage with dev-mode auto-login.
 */

export interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  role: 'admin' | 'agent';
  selectedPlan: string | null;
  isDevAutoLogin?: boolean;
}

const STORAGE_KEYS = {
  IS_LOGGED_IN: 'isLoggedIn',
  USER_NAME: 'userName',
  ROLE: 'userRole',
  SELECTED_PLAN: 'selectedPlan',
  IS_DEV_AUTO: 'isDevAutoLogin',
  USER_ID: 'userId',
  AUTO_LOGIN_DISABLED: 'autoLoginDisabled',
};

export const getAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, userName: '', role: 'agent', selectedPlan: null };
  }

  return {
    isLoggedIn: localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true',
    userName: localStorage.getItem(STORAGE_KEYS.USER_NAME) || '',
    role: (localStorage.getItem(STORAGE_KEYS.ROLE) as 'admin' | 'agent') || 'agent',
    selectedPlan: localStorage.getItem(STORAGE_KEYS.SELECTED_PLAN),
    isDevAutoLogin: localStorage.getItem(STORAGE_KEYS.IS_DEV_AUTO) === 'true',
  };
};

export const setAuth = (state: Partial<AuthState>) => {
  if (typeof window === 'undefined') return;

  if (state.isLoggedIn !== undefined) {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(state.isLoggedIn));
  }
  if (state.userName !== undefined) {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, state.userName);
  }
  if (state.role !== undefined) {
    localStorage.setItem(STORAGE_KEYS.ROLE, state.role);
  }
  if (state.selectedPlan !== undefined) {
    if (state.selectedPlan) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, state.selectedPlan);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_PLAN);
    }
  }
  if (state.isDevAutoLogin !== undefined) {
    localStorage.setItem(STORAGE_KEYS.IS_DEV_AUTO, String(state.isDevAutoLogin));
  }
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem(STORAGE_KEYS.ROLE);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_PLAN);
  localStorage.removeItem(STORAGE_KEYS.IS_DEV_AUTO);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.setItem(STORAGE_KEYS.AUTO_LOGIN_DISABLED, 'true');
};

export async function logout() {
  if (typeof window !== 'undefined') {
    clearAuth();
  }

  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

/**
 * Hook-like initializer for components to ensure auth is set up on mount.
 */
export const initAuth = () => {
  return getAuth();
};
