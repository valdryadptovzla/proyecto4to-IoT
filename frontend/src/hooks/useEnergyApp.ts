import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { apiConfig, apiService } from '../services/api';
import { offlineService } from '../services/offline';
import { storageService } from '../services/storage';
import {
  AuditEvent,
  AlertLevel,
  AlertaRecord,
  AppSettings,
  CachedSnapshot,
  ConsumoRecord,
  DashboardDevice,
  Dispositivo,
  DispositivoPayload,
  RememberedLogin,
  Usuario,
} from '../types/app';

const defaultRememberedLogin: RememberedLogin = {
  password: 'admin',
  remember: false,
  username: 'admin',
};

const defaultSettings: AppSettings = {
  apiUrl: apiConfig.baseUrl,
  offlineModeEnabled: false,
};

function normalizeApiUrl(url: string) {
  return url.trim().replace(/\/$/, '');
}

function extractHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isLocalHost(host: string | null) {
  if (!host) {
    return false;
  }

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '10.0.2.2' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function resolveStartupApiUrl(savedApiUrl?: string) {
  const runtimeApiUrl = normalizeApiUrl(apiConfig.baseUrl);

  if (!savedApiUrl?.trim()) {
    return runtimeApiUrl;
  }

  const normalizedSavedApiUrl = normalizeApiUrl(savedApiUrl);
  if (normalizedSavedApiUrl === runtimeApiUrl) {
    return runtimeApiUrl;
  }

  const runtimeHost = extractHost(runtimeApiUrl);
  const savedHost = extractHost(normalizedSavedApiUrl);

  // Prefer the current runtime URL when a stale local IP was persisted from a previous network.
  if (runtimeHost !== savedHost && isLocalHost(runtimeHost) && isLocalHost(savedHost)) {
    return runtimeApiUrl;
  }

  // On web, the current runtime configuration should win over a previously cached URL.
  if (Platform.OS === 'web' && runtimeHost && savedHost && runtimeHost !== savedHost) {
    return runtimeApiUrl;
  }

  return normalizedSavedApiUrl;
}

function decorateDevices(
  dispositivos: Dispositivo[],
  consumos: ConsumoRecord[],
  alertas: AlertaRecord[]
) {
  const latestConsumptions = new Map<string, ConsumoRecord>();
  consumos.forEach((consumo) => {
    if (!latestConsumptions.has(consumo.dispositivo_id)) {
      latestConsumptions.set(consumo.dispositivo_id, consumo);
    }
  });

  const alertsPerDevice = alertas.reduce<Record<string, number>>((accumulator, alerta) => {
    accumulator[alerta.dispositivo_id] = (accumulator[alerta.dispositivo_id] ?? 0) + 1;
    return accumulator;
  }, {});

  return dispositivos.map<DashboardDevice>((dispositivo) => {
    const latestConsumo = latestConsumptions.get(dispositivo.id);
    return {
      ...dispositivo,
      alertasActivas: alertsPerDevice[dispositivo.id] ?? 0,
      consumoActual: latestConsumo?.consumo_watts ?? 0,
      pendingSync: false,
      ultimaLectura: latestConsumo?.fecha ?? null,
    };
  });
}

function buildChartData(consumos: ConsumoRecord[], dispositivos: DashboardDevice[]) {
  if (!consumos.length) {
    const baseline = Math.max(dispositivos.length * 20, 60);
    return ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, index) => ({
      label,
      value: baseline + [15, 34, 12, 25, 38, 18, 10][index],
    }));
  }

  const today = new Date();
  const buckets = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - offset));
    const key = day.toISOString().slice(0, 10);
    const label = day
      .toLocaleDateString('es-ES', { weekday: 'short' })
      .slice(0, 1)
      .toUpperCase();
    return { key, label, value: 0 };
  });

  consumos.forEach((consumo) => {
    const bucket = buckets.find((entry) => entry.key === consumo.fecha.slice(0, 10));
    if (bucket) {
      bucket.value += consumo.consumo_watts;
    }
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

function summarizeAlertLevels(alertas: AlertaRecord[]) {
  return alertas.reduce<Record<AlertLevel, number>>(
    (accumulator, alerta) => {
      accumulator[alerta.nivel] += 1;
      return accumulator;
    },
    { advertencia: 0, critica: 0, info: 0 }
  );
}

export function useEnergyAppState() {
  const [alertas, setAlertas] = useState<AlertaRecord[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [consumos, setConsumos] = useState<ConsumoRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dispositivos, setDispositivos] = useState<DashboardDevice[]>([]);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('Todas');
  const [queueSize, setQueueSize] = useState(0);
  const [rememberedLogin, setRememberedLogin] = useState(defaultRememberedLogin);
  const [savingDevice, setSavingDevice] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [reporting, setReporting] = useState(false);
  const syncingRef = useRef(false);

  const isConnected = isNetworkAvailable && !settings.offlineModeEnabled;

  const applySnapshot = useCallback((snapshot: CachedSnapshot) => {
    setAlertas(snapshot.alertas);
    setConsumos(snapshot.consumos);
    setDispositivos(snapshot.dispositivos);
    setLastUpdated(snapshot.updatedAt);
  }, []);

  const refreshQueueState = useCallback(async () => {
    const queue = await storageService.loadQueue();
    setQueueSize(queue.length);
  }, []);

  const persistSnapshot = useCallback(
    async (
      nextDispositivos: DashboardDevice[],
      nextConsumos: ConsumoRecord[] = consumos,
      nextAlertas: AlertaRecord[] = alertas
    ) => {
      const updatedAt = new Date().toISOString();
      setDispositivos(nextDispositivos);
      setConsumos(nextConsumos);
      setAlertas(nextAlertas);
      setLastUpdated(updatedAt);
      await storageService.saveSnapshot({
        alertas: nextAlertas,
        consumos: nextConsumos,
        dispositivos: nextDispositivos,
        updatedAt,
      });
    },
    [alertas, consumos]
  );

  const refreshData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);
    try {
      if (!isConnected) {
        const cachedSnapshot = await storageService.loadSnapshot();
        if (cachedSnapshot) {
          applySnapshot(cachedSnapshot);
        }
        return;
      }

      const [rawDispositivos, rawConsumos, rawAlertas] = await Promise.all([
        apiService.getDispositivos(),
        apiService.getConsumo(),
        apiService.getAlertas(),
      ]);

      if (user.rol === 'admin') {
        try {
          setAuditTrail(await apiService.getAuditoria());
        } catch {
          setAuditTrail([]);
        }

        try {
          setUsers(await apiService.getUsuarios());
        } catch {
          setUsers([]);
        }
      } else {
        setAuditTrail([]);
        setUsers([]);
      }

      const decorated = decorateDevices(rawDispositivos, rawConsumos, rawAlertas);
      await persistSnapshot(decorated, rawConsumos, rawAlertas);
    } catch {
      const cachedSnapshot = await storageService.loadSnapshot();
      if (cachedSnapshot) {
        applySnapshot(cachedSnapshot);
      }
    } finally {
      setDataLoading(false);
      await refreshQueueState();
    }
  }, [applySnapshot, isConnected, persistSnapshot, refreshQueueState, user]);

  const syncPendingChanges = useCallback(async () => {
    if (!user || !isConnected || syncingRef.current) {
      return;
    }

    const pendingQueue = await storageService.loadQueue();
    if (!pendingQueue.length) {
      setQueueSize(0);
      return;
    }

    syncingRef.current = true;
    setSyncing(true);
    try {
      const synced = await offlineService.syncPendingDeviceActions();
      await refreshQueueState();
      if (synced) {
        await refreshData();
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [isConnected, refreshData, refreshQueueState, user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [savedUser, savedSnapshot, savedLogin, savedQueue, savedSettings] = await Promise.all([
          storageService.loadSession(),
          storageService.loadSnapshot(),
          storageService.loadRememberedLogin(),
          storageService.loadQueue(),
          storageService.loadSettings(),
        ]);

        if (!mounted) {
          return;
        }

        if (savedSettings) {
          const resolvedApiUrl = resolveStartupApiUrl(savedSettings.apiUrl);
          const nextSettings = {
            ...savedSettings,
            apiUrl: apiService.setBaseUrl(resolvedApiUrl),
          };
          setSettings(nextSettings);

          if (nextSettings.apiUrl !== savedSettings.apiUrl) {
            await storageService.saveSettings(nextSettings);
          }
        }

        if (savedSnapshot) {
          applySnapshot(savedSnapshot);
        }

        if (savedUser) {
          apiService.setActiveUser(savedUser.usuario, savedUser.token);
          setUser(savedUser.usuario);
        }

        if (savedLogin) {
          setRememberedLogin(savedLogin);
        }

        setQueueSize(savedQueue.length);
      } catch (error) {
        console.error('Startup bootstrap failed', error);

        if (!mounted) {
          return;
        }

        apiService.setActiveUser(null);
        setAlertas([]);
        setAuditTrail([]);
        setConsumos([]);
        setDispositivos([]);
        setQueueSize(0);
        setRememberedLogin(defaultRememberedLogin);
        setSettings(defaultSettings);
        setUser(null);
        setUsers([]);
      } finally {
        if (mounted) {
          setSessionLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applySnapshot]);

  useEffect(() => {
    try {
      const unsubscribe = NetInfo.addEventListener((state) => {
        const online = Boolean(state.isConnected && state.isInternetReachable !== false);
        setIsNetworkAvailable(online);
      });

      return unsubscribe;
    } catch (error) {
      console.error('NetInfo bootstrap failed', error);
      setIsNetworkAvailable(false);

      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (isConnected) {
      void syncPendingChanges();
      return;
    }

    void refreshData();
  }, [isConnected, refreshData, syncPendingChanges, user]);

  useEffect(() => {
    if (!user || !isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshData();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, refreshData, user]);

  const login = useCallback(async ({ password, remember, username }: RememberedLogin) => {
    setAuthLoading(true);
    try {
      const response = await apiService.login(username, password);
      apiService.setActiveUser(response.usuario, response.token);
      setUser(response.usuario);
      setRememberedLogin({ password, remember, username });
      try {
        await storageService.saveSession({ token: response.token, usuario: response.usuario });

        if (remember) {
          await storageService.saveRememberedLogin({ password, remember, username });
        } else {
          await storageService.clearRememberedLogin();
        }
      } catch (error) {
        console.error('Session persistence failed', error);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    apiService.setActiveUser(null, null);
    try {
      await storageService.clearUser();
    } catch (error) {
      console.error('Session clear failed', error);
    }
    setAuditTrail([]);
    setUsers([]);
    setUser(null);
  }, []);

  const saveDevice = useCallback(
    async (payload: DispositivoPayload, mode: 'create' | 'edit', deviceId?: string) => {
      setSavingDevice(true);
      try {
        if (!user || user.rol !== 'admin') {
          throw new Error('Solo el admin puede modificar dispositivos.');
        }

        if (isConnected) {
          if (mode === 'create') {
            await apiService.createDispositivo(payload);
          } else if (deviceId) {
            await apiService.updateDispositivo(deviceId, payload);
          }

          await refreshData();
          return;
        }

        if (mode === 'create') {
          const tempId = offlineService.buildTempId();
          await offlineService.queueCreate(tempId, payload);
          await persistSnapshot([
            {
              ...payload,
              alertasActivas: 0,
              consumoActual: 0,
              id: tempId,
              pendingSync: true,
              ultimaLectura: null,
            },
            ...dispositivos,
          ]);
          await refreshQueueState();
          return;
        }

        if (deviceId) {
          await offlineService.queueUpdate(deviceId, payload);
          await persistSnapshot(
            dispositivos.map((device) =>
              device.id === deviceId ? { ...device, ...payload, pendingSync: true } : device
            )
          );
          await refreshQueueState();
        }
      } finally {
        setSavingDevice(false);
      }
    },
    [dispositivos, isConnected, persistSnapshot, refreshData, refreshQueueState, user]
  );

  const setMonitoringEnabled = useCallback(
    async (deviceId: string, monitored: boolean) => {
      const device = dispositivos.find((item) => item.id === deviceId);
      if (!device) {
        return;
      }

      if (!user || user.rol !== 'admin') {
        throw new Error('Solo el admin puede modificar dispositivos.');
      }

      const payload: DispositivoPayload = {
        estado: monitored ? 'encendido' : 'apagado',
        nombre: device.nombre,
        tipo: device.tipo,
        ubicacion: device.ubicacion,
      };

      if (isConnected) {
        await apiService.updateDispositivo(deviceId, payload);
        await refreshData();
        return;
      }

      await offlineService.queueUpdate(deviceId, payload);
      await persistSnapshot(
        dispositivos.map((item) =>
          item.id === deviceId ? { ...item, estado: payload.estado, pendingSync: true } : item
        )
      );
      await refreshQueueState();
    },
    [dispositivos, isConnected, persistSnapshot, refreshData, refreshQueueState, user]
  );

  const deleteDevice = useCallback(
    async (deviceId: string) => {
      if (!user || user.rol !== 'admin') {
        throw new Error('Solo el admin puede eliminar dispositivos.');
      }

      if (isConnected) {
        await apiService.deleteDispositivo(deviceId);
        await refreshData();
        return;
      }

      await offlineService.queueDelete(deviceId);
      await persistSnapshot(
        dispositivos.filter((device) => device.id !== deviceId),
        consumos.filter((consumo) => consumo.dispositivo_id !== deviceId),
        alertas.filter((alerta) => alerta.dispositivo_id !== deviceId)
      );
      await refreshQueueState();
    },
    [alertas, consumos, dispositivos, isConnected, persistSnapshot, refreshData, refreshQueueState, user]
  );

  const updateApiUrl = useCallback(
    async (nextUrl: string) => {
      const normalizedUrl = apiService.setBaseUrl(nextUrl);
      const nextSettings = { ...settings, apiUrl: normalizedUrl };
      setSettings(nextSettings);
      await storageService.saveSettings(nextSettings);
      if (user && !nextSettings.offlineModeEnabled) {
        await refreshData();
      }
    },
    [refreshData, settings, user]
  );

  const setOfflineModeEnabled = useCallback(
    async (enabled: boolean) => {
      const nextSettings = { ...settings, offlineModeEnabled: enabled };
      setSettings(nextSettings);
      await storageService.saveSettings(nextSettings);
    },
    [settings]
  );

  const getDeviceById = useCallback(
    (deviceId: string) => dispositivos.find((device) => device.id === deviceId) ?? null,
    [dispositivos]
  );

  const getDeviceConsumos = useCallback(
    (deviceId: string) => consumos.filter((consumo) => consumo.dispositivo_id === deviceId),
    [consumos]
  );

  const getDeviceAlertas = useCallback(
    (deviceId: string) => alertas.filter((alerta) => alerta.dispositivo_id === deviceId),
    [alertas]
  );

  const registerAuditEvent = useCallback(
    async (payload: {
      accion: string;
      descripcion: string;
      detalles?: Record<string, unknown>;
      entidad?: string;
      entidad_id?: string;
    }) => {
      if (!user || user.rol !== 'admin' || !isConnected) {
        return null;
      }

      const event = await apiService.createAuditEvent(payload);
      setAuditTrail((current) => [event, ...current]);
      return event;
    },
    [isConnected, user]
  );

  const saveUserRecord = useCallback(
    async (
      payload: {
        nombre_completo: string;
        password?: string;
        rol: Usuario['rol'];
        username: string;
      },
      userId?: string
    ) => {
      if (!user || user.rol !== 'admin') {
        throw new Error('Solo el admin puede gestionar usuarios.');
      }

      setSavingUser(true);
      try {
        if (userId) {
          await apiService.updateUsuario(userId, {
            nombre_completo: payload.nombre_completo,
            password: payload.password,
            rol: payload.rol,
          });
        } else {
          await apiService.createUsuario(payload);
        }

        await refreshData();
      } finally {
        setSavingUser(false);
      }
    },
    [refreshData, user]
  );

  const deleteUserRecord = useCallback(
    async (userId: string) => {
      if (!user || user.rol !== 'admin') {
        throw new Error('Solo el admin puede eliminar usuarios.');
      }

      await apiService.deleteUsuario(userId);
      await refreshData();
    },
    [refreshData, user]
  );

  const availableLocations = useMemo(
    () => ['Todas', ...new Set(dispositivos.map((device) => device.ubicacion).filter(Boolean))],
    [dispositivos]
  );

  const filteredDispositivos = useMemo(() => {
    if (locationFilter === 'Todas') {
      return dispositivos;
    }

    return dispositivos.filter((device) => device.ubicacion === locationFilter);
  }, [dispositivos, locationFilter]);

  return {
    alertSummary: summarizeAlertLevels(alertas),
    alertas,
    apiBaseUrl: settings.apiUrl,
    auditTrail,
    authLoading,
    availableLocations,
    chartData: buildChartData(consumos, dispositivos),
    dataLoading,
    deleteDevice,
    dispositivos,
    filteredDispositivos,
    getDeviceAlertas,
    getDeviceById,
    getDeviceConsumos,
    isConnected,
    isNetworkAvailable,
    lastUpdated,
    locationFilter,
    login,
    logout,
    monitoredDevicesCount: dispositivos.filter((device) => device.estado === 'encendido').length,
    offlineModeEnabled: settings.offlineModeEnabled,
    queueSize,
    refreshData,
    registerAuditEvent,
    rememberedLogin,
    reporting,
    saveDevice,
    savingDevice,
    sessionLoading,
    setLocationFilter,
    setMonitoringEnabled,
    setOfflineModeEnabled,
    settings,
    syncing,
    totalConsumo: consumos.reduce((total, consumo) => total + consumo.consumo_watts, 0),
    updateApiUrl,
    user,
    users,
    saveUserRecord,
    deleteUserRecord,
    savingUser,
  };
}

export type EnergyAppState = ReturnType<typeof useEnergyAppState>;
