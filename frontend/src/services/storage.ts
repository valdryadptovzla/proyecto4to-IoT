import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AppSettings,
  AuthSession,
  CachedSnapshot,
  QueuedDeviceAction,
  RememberedLogin,
  Usuario,
} from '../types/app';

const STORAGE_KEYS = {
  settings: 'energia.settings',
  queue: 'energia.queue',
  rememberedLogin: 'energia.rememberedLogin',
  snapshot: 'energia.snapshot',
  user: 'energia.user',
  session: 'energia.session',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  const rawValue = await AsyncStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  async clearRememberedLogin() {
    await AsyncStorage.removeItem(STORAGE_KEYS.rememberedLogin);
  },

  async clearUser() {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
    await AsyncStorage.removeItem(STORAGE_KEYS.session);
  },

  async loadQueue() {
    return (await readJson<QueuedDeviceAction[]>(STORAGE_KEYS.queue)) ?? [];
  },

  async loadSettings() {
    return await readJson<AppSettings>(STORAGE_KEYS.settings);
  },

  async loadRememberedLogin() {
    return await readJson<RememberedLogin>(STORAGE_KEYS.rememberedLogin);
  },

  async loadSnapshot() {
    return await readJson<CachedSnapshot>(STORAGE_KEYS.snapshot);
  },

  async loadUser() {
    return await readJson<Usuario>(STORAGE_KEYS.user);
  },

  async loadSession() {
    return await readJson<AuthSession>(STORAGE_KEYS.session);
  },

  async saveQueue(queue: QueuedDeviceAction[]) {
    await writeJson(STORAGE_KEYS.queue, queue);
  },

  async saveSettings(settings: AppSettings) {
    await writeJson(STORAGE_KEYS.settings, settings);
  },

  async saveRememberedLogin(login: RememberedLogin) {
    await writeJson(STORAGE_KEYS.rememberedLogin, login);
  },

  async saveSnapshot(snapshot: CachedSnapshot) {
    await writeJson(STORAGE_KEYS.snapshot, snapshot);
  },

  async saveUser(user: Usuario) {
    await writeJson(STORAGE_KEYS.user, user);
  },

  async saveSession(session: AuthSession) {
    await writeJson(STORAGE_KEYS.session, session);
    await writeJson(STORAGE_KEYS.user, session.usuario);
  },
};
