import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { AlertaRecord, ConsumoRecord, DashboardDevice } from '../types/app';

interface DeviceDetailScreenProps {
  alertas: AlertaRecord[];
  consumos: ConsumoRecord[];
  dispositivo: DashboardDevice | null;
  isAdmin: boolean;
  isConnected: boolean;
  onBack: () => void;
  onDelete: (deviceId: string) => Promise<void>;
  onEdit: () => void;
  onLogout: () => void;
  onSetMonitoring: (monitored: boolean) => Promise<void>;
}

export default function DeviceDetailScreen({
  alertas,
  consumos,
  dispositivo,
  isAdmin,
  isConnected,
  onBack,
  onDelete,
  onEdit,
  onLogout,
  onSetMonitoring,
}: DeviceDetailScreenProps) {
  if (!dispositivo) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.fallbackContainer}>
          <ScreenHeader onBack={onBack} onLogout={onLogout} subtitle="Dispositivo no disponible" title="Detalle" />
        </View>
      </SafeAreaView>
    );
  }

  const isMonitored = dispositivo.estado === 'encendido';

  const confirmDelete = () => {
    Alert.alert('Eliminar dispositivo', 'Esta accion eliminara el equipo y sus registros asociados.', [
      { style: 'cancel', text: 'Cancelar' },
      { style: 'destructive', text: 'Eliminar', onPress: () => void onDelete(dispositivo.id) },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <ScreenHeader
          actionLabel={isAdmin ? 'Editar' : undefined}
          onAction={isAdmin ? onEdit : undefined}
          onBack={onBack}
          onLogout={onLogout}
          subtitle={`${dispositivo.tipo} | ${dispositivo.ubicacion}`}
          title={dispositivo.nombre}
        />

        <View style={styles.heroCard}>
          <Text style={styles.heroStatus}>{isMonitored ? 'Monitoreando' : 'Monitoreo pausado'}</Text>
          <Text style={styles.heroValue}>{dispositivo.consumoActual.toFixed(0)} W</Text>
          <Text style={styles.heroCaption}>Consumo actual del dispositivo</Text>
          <Text style={styles.heroFootnote}>{isConnected ? 'Sincronizacion online con backend' : 'Mostrando ultimo estado local'}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Alertas</Text>
            <Text style={styles.metricValue}>{alertas.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Mediciones</Text>
            <Text style={styles.metricValue}>{consumos.length}</Text>
          </View>
        </View>

        {isAdmin ? (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => void onSetMonitoring(!isMonitored)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{isMonitored ? 'Pausar monitoreo' : 'Activar monitoreo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyTitle}>Modo solo lectura</Text>
            <Text style={styles.readOnlyText}>Tu usuario puede visualizar informacion, reportes y monitoreo sin modificar datos.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Historial de consumo</Text>
        {consumos.slice(0, 6).map((consumo) => (
          <View key={consumo.id} style={styles.listCard}>
            <Text style={styles.listTitle}>{consumo.consumo_watts.toFixed(0)} W</Text>
            <Text style={styles.listSubtitle}>{new Date(consumo.fecha).toLocaleString()}</Text>
          </View>
        ))}
        {!consumos.length ? <Text style={styles.emptyLabel}>No hay mediciones registradas.</Text> : null}

        <Text style={styles.sectionTitle}>Alertas del dispositivo</Text>
        {alertas.slice(0, 6).map((alerta) => (
          <View key={alerta.id} style={styles.listCard}>
            <Text style={[styles.alertBadge, alerta.nivel === 'critica' && styles.alertCrit]}>{alerta.nivel.toUpperCase()}</Text>
            <Text style={styles.listSubtitle}>{alerta.mensaje}</Text>
          </View>
        ))}
        {!alertas.length ? <Text style={styles.emptyLabel}>Sin alertas asociadas.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  alertBadge: { color: '#fbbf24', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  alertCrit: { color: '#f87171' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  dangerButtonText: { color: '#fee2e2', fontWeight: '900' },
  emptyLabel: { color: '#92a8ba', fontSize: 14, marginTop: 6 },
  fallbackContainer: { flex: 1, padding: 18 },
  heroCaption: { color: '#a6bfd0', fontSize: 14, marginTop: 8 },
  heroCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
  },
  heroFootnote: { color: '#7f95ab', fontSize: 12, marginTop: 10 },
  heroStatus: { color: '#7dd3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  heroValue: { color: '#f8fafc', fontSize: 36, fontWeight: '900', marginTop: 10 },
  listCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  listSubtitle: { color: '#cadbe8', fontSize: 14, lineHeight: 20 },
  listTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  metricCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 18,
  },
  metricLabel: { color: '#9bb2c4', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  metricValue: { color: '#f8fafc', fontSize: 26, fontWeight: '900', marginTop: 10 },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  primaryButtonText: { color: '#f8fafc', fontWeight: '900' },
  readOnlyCard: {
    backgroundColor: '#071826',
    borderColor: '#15354a',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  readOnlyText: { color: '#9bb2c4', fontSize: 13, lineHeight: 19, marginTop: 6 },
  readOnlyTitle: { color: '#86efac', fontSize: 14, fontWeight: '900' },
  safeArea: { backgroundColor: '#050b12', flex: 1 },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginBottom: 12, marginTop: 24 },
});
