import type {
  CreationItem,
  CreditUsageEntry,
  GenerationRequest,
} from '../types/studio';

const TOKEN_KEY = 'forma_auth_token';
const USER_KEY = 'forma_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  planId: string;
  credits: number;
  maxCredits: number;
  createdAt?: string;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const apiBase = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const targetUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status} ${response.statusText || ''})`.trim();
    try {
      const errJson = await response.json();
      if (errJson && (errJson.error || errJson.message)) {
        errorMessage = errJson.error || errJson.message;
      }
    } catch {}
    throw new ApiError(errorMessage, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    async signup(payload: { email: string; password: string; fullName?: string }) {
      const res = await request<{ message: string; token: string; user: AuthUser }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      return res;
    },

    async signin(payload: { email: string; password: string }) {
      const res = await request<{ message: string; token: string; user: AuthUser }>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      return res;
    },

    async getMe() {
      const res = await request<{ user: AuthUser }>('/api/auth/me');
      setStoredUser(res.user);
      return res.user;
    },

    async oauth(provider: 'google' | 'apple') {
      const res = await request<{ message: string; token: string; user: AuthUser }>('/api/auth/oauth-mock', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      return res;
    },

    async forgotPassword(email: string) {
      return request<{ message: string; code: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(payload: { email: string; code: string; newPassword: string }) {
      return request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async updateProfile(payload: { name?: string; email?: string }) {
      const res = await request<{ message: string; user: AuthUser }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setStoredUser(res.user);
      return res.user;
    },

    signout() {
      setStoredToken(null);
      setStoredUser(null);
    },
  },

  creations: {
    async list(params?: { filter?: string; collection?: string; search?: string }) {
      const query = new URLSearchParams();
      if (params?.filter) query.set('filter', params.filter);
      if (params?.collection) query.set('collection', params.collection);
      if (params?.search) query.set('search', params.search);
      const url = `/api/creations${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await request<{ creations: CreationItem[] }>(url);
      return res.creations;
    },

    async update(id: string, updates: { title?: string; saved?: boolean; collection?: string | null }) {
      const res = await request<{ creation: CreationItem }>(`/api/creations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.creation;
    },

    async delete(id: string) {
      return request<{ message: string; id: string }>(`/api/creations/${id}`, {
        method: 'DELETE',
      });
    },

    async duplicate(id: string) {
      const res = await request<{ creation: CreationItem }>(`/api/creations/${id}/duplicate`, {
        method: 'POST',
      });
      return res.creation;
    },
  },

  generate: {
    async run(requestPayload: GenerationRequest): Promise<CreationItem & { newBalance?: number }> {
      return request<CreationItem & { newBalance?: number }>('/api/generate', {
        method: 'POST',
        body: JSON.stringify(requestPayload),
      });
    },

    async enhance(prompt: string, style?: string): Promise<{ enhancedPrompt: string; provider: string }> {
      return request<{ enhancedPrompt: string; provider: string }>('/api/generate/enhance', {
        method: 'POST',
        body: JSON.stringify({ prompt, style }),
      });
    },
  },

  credits: {
    async getHistory(): Promise<CreditUsageEntry[]> {
      const res = await request<{ history: CreditUsageEntry[] }>('/api/credits/history');
      return res.history;
    },

    async selectPlan(planId: string) {
      return request<{
        message: string;
        planId: string;
        credits: number;
        maxCredits: number;
        transaction: CreditUsageEntry;
      }>('/api/credits/plan', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
    },

    async topup(amount: number, label?: string) {
      return request<{
        message: string;
        credits: number;
        transaction: CreditUsageEntry;
      }>('/api/credits/topup', {
        method: 'POST',
        body: JSON.stringify({ amount, label }),
      });
    },
  },

  collections: {
    async list(): Promise<string[]> {
      const res = await request<{ collections: string[] }>('/api/collections');
      return res.collections;
    },

    async create(name: string) {
      return request<{ message: string; name: string }>('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },

    async delete(name: string) {
      return request<{ message: string; name: string }>(`/api/collections/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
    },
  },

  upload: {
    async uploadReference(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      return request<{
        message: string;
        url: string;
        filename: string;
        mediaKind: 'image' | 'video';
        size: number;
      }>('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },

  stats: {
    async get() {
      return request<{
        stats: {
          totalCreations: number;
          totalImages: number;
          totalVideos: number;
          totalSaved: number;
          totalCollections: number;
          totalCreditsSpent: number;
          creditsRemaining: number;
          maxCredits: number;
          planId: string;
        };
      }>('/api/stats');
    },
  },
};

