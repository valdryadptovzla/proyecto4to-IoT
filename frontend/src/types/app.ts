export type UserRole = 'admin' | 'usuario';
export type DeviceStatus = 'encendido' | 'apagado';
export type AlertLevel = 'info' | 'advertencia' | 'critica';

export interface AuditActor {
  rol: string;
  user_id?: string | null;
  username: string;
}

export interface AuditEvent {
  accion: string;
  actor: AuditActor;
  descripcion: string;
  detalles: Record<string, unknown>;
  entidad?: string | null;
  entidad_id?: string | null;
  fecha: string;
  id: string;
}

export interface Usuario {
  id: string;
  username: string;
  nombre_completo: string;
  rol: UserRole;
}

export interface AuthSession {
  token: string;
  usuario: Usuario;
}

export interface UsuarioFormPayload {
  nombre_completo: string;
  password?: string;
  rol: UserRole;
  username: string;
}

export interface UsuarioUpdatePayload {
  nombre_completo?: string;
  password?: string;
  rol?: UserRole;
}

export interface DispositivoPayload {
  nombre: string;
  tipo: string;
  ubicacion: string;
  estado: DeviceStatus;
}

export interface Dispositivo extends DispositivoPayload {
  id: string;
}

export interface DashboardDevice extends Dispositivo {
  alertasActivas: number;
  consumoActual: number;
  pendingSync?: boolean;
  ultimaLectura?: string | null;
}

export interface ConsumoRecord {
  id: string;
  dispositivo_id: string;
  consumo_watts: number;
  fecha: string;
}

export interface AlertaRecord {
  id: string;
  dispositivo_id: string;
  mensaje: string;
  nivel: AlertLevel;
  fecha?: string | null;
}

export interface ChartDatum {
  label: string;
  value: number;
}

export interface CachedSnapshot {
  alertas: AlertaRecord[];
  consumos: ConsumoRecord[];
  dispositivos: DashboardDevice[];
  updatedAt: string;
}

export interface RememberedLogin {
  password: string;
  remember: boolean;
  username: string;
}

export interface AppSettings {
  apiUrl: string;
  offlineModeEnabled: boolean;
}

export interface QueuedDeviceAction {
  createdAt: string;
  id: string;
  payload?: DispositivoPayload;
  targetId: string;
  type: 'create' | 'update' | 'delete';
}
