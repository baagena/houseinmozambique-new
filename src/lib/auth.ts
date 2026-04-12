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
};

const IS_DEV = process.env.NODE_ENV === 'development';

export const getAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, userName: '', selectedPlan: null };
  }

  // Auto-login logic for local development
  if (IS_DEV && !localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN)) {
    console.log('🛠️ [Auth] Local development detected. Activating auto-login.');
    setAuth({
      isLoggedIn: true,
      userName: 'Dev Curator',
      role: 'agent',
      selectedPlan: 'Premium',
      isDevAutoLogin: true,
    });
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
};

/**
 * Hook-like initializer for components to ensure auth is set up on mount.
 */
export const initAuth = () => {
  return getAuth();
};
