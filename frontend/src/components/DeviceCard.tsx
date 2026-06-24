import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { DashboardDevice } from '../types/app';

interface DeviceCardProps {
  compact?: boolean;
  device: DashboardDevice;
  onEdit?: () => void;
  onOpen?: () => void;
  onToggleMonitoring?: () => void;
}

function getConsumptionTone(consumoActual: number) {
  if (consumoActual >= 350) return { color: '#ef4444', label: 'Alto' };
  if (consumoActual >= 180) return { color: '#f59e0b', label: 'Medio' };
  return { color: '#22c55e', label: 'Normal' };
}

export default function DeviceCard({ compact = false, device, onEdit, onOpen, onToggleMonitoring }: DeviceCardProps) {
  const consumptionTone = getConsumptionTone(device.consumoActual);
  const isMonitored = device.estado === 'encendido';
  const hasActions = Boolean(onEdit || onToggleMonitoring);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onOpen} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={styles.deviceIconRow}>
            <View style={[styles.deviceIconBadge, { backgroundColor: isMonitored ? '#0c1f3a' : '#111827', borderColor: isMonitored ? '#1e3a5f' : '#1f2937' }]}>
              <Feather name="cpu" size={14} color={isMonitored ? '#38bdf8' : '#4b5563'} />
            </View>
            <Text numberOfLines={1} style={styles.title}>{device.nombre}</Text>
          </View>
          <Text numberOfLines={1} style={styles.subtitle}>{device.tipo} · {device.ubicacion}</Text>
        </View>
        <View style={[styles.statePill, isMonitored ? styles.stateOn : styles.stateOff]}>
          <View style={[styles.stateDot, { backgroundColor: isMonitored ? '#22c55e' : '#4b5563' }]} />
          <Text style={[styles.stateLabel, { color: isMonitored ? '#86efac' : '#9ca3af' }]}>
            {isMonitored ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Consumo</Text>
          <Text style={styles.metricValue}>{device.consumoActual.toFixed(0)} W</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Nivel</Text>
          <Text style={[styles.metricValue, { color: consumptionTone.color }]}>{consumptionTone.label}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Alertas</Text>
          <Text style={[styles.metricValue, device.alertasActivas > 0 && { color: '#f87171' }]}>{device.alertasActivas}</Text>
        </View>
        {!compact ? (
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Sync</Text>
            <Text style={[styles.metricValue, device.pendingSync && { color: '#fbbf24' }]}>{device.pendingSync ? 'Pendiente' : 'OK'}</Text>
          </View>
        ) : null}
      </View>

      {hasActions ? (
        <View style={styles.actionsRow}>
          {onToggleMonitoring ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onToggleMonitoring} style={styles.secondaryButton}>
              <Feather name={isMonitored ? 'pause-circle' : 'play-circle'} size={14} color="#94a3b8" />
              <Text style={styles.secondaryButtonText}>{isMonitored ? 'Pausar' : 'Activar'}</Text>
            </TouchableOpacity>
          ) : null}
          {onEdit ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onEdit} style={styles.primaryButton}>
              <Feather name="edit-2" size={14} color="#f8fafc" />
              <Text style={styles.primaryButtonText}>Editar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  card: {
    backgroundColor: '#111827', // gray-900
    borderColor: '#1f2937', // gray-800
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  deviceIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  deviceIconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  metricBlock: { flex: 1, minWidth: 68 },
  metricLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { color: '#f9fafb', fontSize: 16, fontWeight: '700', marginTop: 5 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  primaryButton: { 
    alignItems: 'center', 
    backgroundColor: '#0ea5e9', 
    borderRadius: 12, 
    flex: 1, 
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#f8fafc', fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#94a3b8', fontWeight: '700' },
  stateLabel: { fontSize: 11, fontWeight: '700' },
  stateDot: { borderRadius: 999, height: 6, width: 6 },
  stateOff: { 
    backgroundColor: '#1f2937', 
    borderRadius: 999, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10, 
    paddingVertical: 6, 
  },
  stateOn: { 
    backgroundColor: '#052e16', 
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10, 
    paddingVertical: 6,
  },
  subtitle: { color: '#6b7280', fontSize: 12, marginTop: 5 },
  title: { color: '#f9fafb', fontSize: 17, fontWeight: '700' },
  titleGroup: { flex: 1, paddingRight: 12 },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
});
