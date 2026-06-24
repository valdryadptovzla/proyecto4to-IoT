import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <TouchableOpacity activeOpacity={0.92} onPress={onOpen} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={styles.deviceIconRow}>
            <View style={styles.deviceIconBadge}>
              <Text style={styles.deviceIconText}>IOT</Text>
            </View>
            <Text numberOfLines={1} style={styles.title}>{device.nombre}</Text>
          </View>
          <Text numberOfLines={1} style={styles.subtitle}>{device.tipo} | {device.ubicacion}</Text>
        </View>
        <View style={[styles.statePill, isMonitored ? styles.stateOn : styles.stateOff]}>
          <Text style={styles.stateLabel}>{isMonitored ? 'Activo' : 'Inactivo'}</Text>
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
          <Text style={styles.metricValue}>{device.alertasActivas}</Text>
        </View>
        {!compact ? (
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Sync</Text>
            <Text style={styles.metricValue}>{device.pendingSync ? 'Pendiente' : 'OK'}</Text>
          </View>
        ) : null}
      </View>

      {hasActions ? (
        <View style={styles.actionsRow}>
          {onToggleMonitoring ? (
            <TouchableOpacity onPress={onToggleMonitoring} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{isMonitored ? 'Pausar' : 'Activar'}</Text>
            </TouchableOpacity>
          ) : null}
          {onEdit ? (
            <TouchableOpacity onPress={onEdit} style={styles.primaryButton}>
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
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  deviceIconBadge: {
    alignItems: 'center',
    backgroundColor: '#0d2d42',
    borderColor: '#1f5672',
    borderRadius: 10,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 38,
  },
  deviceIconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  deviceIconText: {
    color: '#7dd3fc',
    fontSize: 9,
    fontWeight: '900',
  },
  metricBlock: { flex: 1, minWidth: 68 },
  metricLabel: { color: '#7f95ab', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metricValue: { color: '#eef6fb', fontSize: 16, fontWeight: '900', marginTop: 6 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  primaryButton: { alignItems: 'center', backgroundColor: '#0ea5e9', borderRadius: 12, flex: 1, paddingVertical: 12 },
  primaryButtonText: { color: '#f8fafc', fontWeight: '900' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#d3e8f5', fontWeight: '900' },
  stateLabel: { color: '#eff6ff', fontSize: 11, fontWeight: '900' },
  stateOff: { backgroundColor: '#334155' },
  stateOn: { backgroundColor: '#15803d' },
  statePill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  subtitle: { color: '#85a0b6', marginTop: 5 },
  title: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  titleGroup: { flex: 1, paddingRight: 12 },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
});
