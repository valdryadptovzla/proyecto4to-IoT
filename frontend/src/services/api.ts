import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import {
  AuditEvent,
  AlertaRecord,
  ConsumoRecord,
  Dispositivo,
  DispositivoPayload,
  Usuario,
  UsuarioFormPayload,
  UsuarioUpdatePayload,
} from '../types/app';

function resolveWebBaseUrl(candidateUrl?: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const browserHostname = window.location.hostname || 'localhost';
  const protocol = browserHostname === 'localhost' || browserHostname === '127.0.0.1' ? 'http:' : window.location.protocol;

  try {
    const parsedCandidate = new URL(candidateUrl ?? 'http://localhost:8000');
    return `${protocol}//${browserHostname}:${parsedCandidate.port || '8000'}`;
  } catch {
    return `${protocol}//${browserHostname}:8000`;
  }
}

function resolveFallbackBaseUrl() {
  const webBaseUrl = resolveWebBaseUrl();
  if (webBaseUrl) {
    return webBaseUrl;
  }

  // If running inside Expo client, try to derive the dev server host from Constants
  try {
    const debuggerHost = (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.debuggerHost;
    if (debuggerHost && typeof debuggerHost === 'string') {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:8000`;
    }
  } catch {
    // ignore
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export function sanitizeBaseUrl(url?: string) {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) {
    return resolveFallbackBaseUrl();
  }

  const webBaseUrl = resolveWebBaseUrl(trimmedUrl);
  if (webBaseUrl) {
    return webBaseUrl;
  }

  return trimmedUrl.replace(/\/$/, '');
}

let currentBaseUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
let activeUser: Usuario | null = null;
let activeToken: string | null = null;

export const apiConfig = {
  get baseUrl() {
    return currentBaseUrl;
  },
};

const http = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

function buildError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return new Error(detail);
    }

    if (!error.response) {
      return new Error('No fue posible conectar con la API.');
    }

    return new Error(`La API respondio con error ${error.response.status}.`);
  }

  return new Error('Ocurrio un error inesperado.');
}

function normalizeConsumo(item: Record<string, unknown>): ConsumoRecord {
  return {
    consumo_watts: Number(item.consumo_watts ?? 0),
    dispositivo_id: String(item.dispositivo_id ?? ''),
    fecha: String(item.fecha ?? item.fecha_registro ?? new Date().toISOString()),
    id: String(item.id ?? ''),
  };
}

function normalizeAlerta(item: Record<string, unknown>): AlertaRecord {
  return {
    dispositivo_id: String(item.dispositivo_id ?? ''),
    fecha: item.fecha ? String(item.fecha) : null,
    id: String(item.id ?? ''),
    mensaje: String(item.mensaje ?? ''),
    nivel: (item.nivel as AlertaRecord['nivel']) ?? 'advertencia',
  };
}

function normalizeAuditEvent(item: Record<string, unknown>): AuditEvent {
  const actor = (item.actor as Record<string, unknown> | undefined) ?? {};
  return {
    accion: String(item.accion ?? 'evento'),
    actor: {
      rol: String(actor.rol ?? 'anonimo'),
      user_id: actor.user_id ? String(actor.user_id) : null,
      username: String(actor.username ?? 'sistema'),
    },
    descripcion: String(item.descripcion ?? ''),
    detalles: (item.detalles as Record<string, unknown> | undefined) ?? {},
    entidad: item.entidad ? String(item.entidad) : null,
    entidad_id: item.entidad_id ? String(item.entidad_id) : null,
    fecha: String(item.fecha ?? new Date().toISOString()),
    id: String(item.id ?? ''),
  };
}

function applyUserHeaders() {
  if (!activeUser) {
    delete http.defaults.headers.common['X-User-Id'];
    delete http.defaults.headers.common['X-User-Role'];
    delete http.defaults.headers.common['X-Username'];
    delete http.defaults.headers.common.Authorization;
    return;
  }

  if (activeToken) {
    http.defaults.headers.common.Authorization = `Bearer ${activeToken}`;
  }

  http.defaults.headers.common['X-User-Id'] = activeUser.id;
  http.defaults.headers.common['X-User-Role'] = activeUser.rol;
  http.defaults.headers.common['X-Username'] = activeUser.username;
}

export const apiService = {
  getBaseUrl() {
    return currentBaseUrl;
  },

  setActiveUser(user: Usuario | null, token?: string | null) {
    activeUser = user;
    activeToken = token ?? null;
    applyUserHeaders();
  },

  setBaseUrl(url: string) {
    currentBaseUrl = sanitizeBaseUrl(url);
    http.defaults.baseURL = currentBaseUrl;
    return currentBaseUrl;
  },

  async createDispositivo(payload: DispositivoPayload) {
    try {
      const response = await http.post<Dispositivo>('/dispositivos', payload);
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async deleteDispositivo(id: string) {
    try {
      await http.delete(`/dispositivos/${id}`);
    } catch (error) {
      throw buildError(error);
    }
  },

  async getAlertas() {
    try {
      const response = await http.get<Record<string, unknown>[]>('/alertas');
      return response.data.map(normalizeAlerta);
    } catch (error) {
      throw buildError(error);
    }
  },

  async getConsumo() {
    try {
      const response = await http.get<Record<string, unknown>[]>('/consumo');
      return response.data.map(normalizeConsumo);
    } catch (error) {
      throw buildError(error);
    }
  },

  async getConsumoByDispositivo(dispositivoId: string) {
    try {
      const response = await http.get<Record<string, unknown>[]>(`/consumo/${dispositivoId}`);
      return response.data.map(normalizeConsumo);
    } catch (error) {
      throw buildError(error);
    }
  },

  async getDispositivos() {
    try {
      const response = await http.get<Dispositivo[]>('/dispositivos');
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async login(username: string, password: string) {
    try {
      const response = await http.post<{ message: string; token: string; usuario: Usuario }>('/usuarios/login', {
        password,
        username,
      });
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async updateDispositivo(id: string, payload: DispositivoPayload) {
    try {
      const response = await http.put<Dispositivo>(`/dispositivos/${id}`, payload);
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async getAuditoria() {
    try {
      const response = await http.get<Record<string, unknown>[]>('/auditoria');
      return response.data.map(normalizeAuditEvent);
    } catch (error) {
      throw buildError(error);
    }
  },

  async createAuditEvent(payload: {
    accion: string;
    descripcion: string;
    detalles?: Record<string, unknown>;
    entidad?: string;
    entidad_id?: string;
  }) {
    try {
      const response = await http.post<Record<string, unknown>>('/auditoria/eventos', payload);
      return normalizeAuditEvent(response.data);
    } catch (error) {
      throw buildError(error);
    }
  },

  async getUsuarios() {
    try {
      const response = await http.get<Usuario[]>('/usuarios');
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async createUsuario(payload: UsuarioFormPayload) {
    try {
      const response = await http.post<Usuario>('/usuarios', payload);
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async updateUsuario(id: string, payload: UsuarioUpdatePayload) {
    try {
      const response = await http.put<Usuario>(`/usuarios/${id}`, payload);
      return response.data;
    } catch (error) {
      throw buildError(error);
    }
  },

  async deleteUsuario(id: string) {
    try {
      await http.delete(`/usuarios/${id}`);
    } catch (error) {
      throw buildError(error);
    }
  },
};
