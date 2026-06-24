import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConsumptionChart from '../components/ConsumptionChart';
import DeviceCard from '../components/DeviceCard';
import KpiCard from '../components/KpiCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBanner from '../components/StatusBanner';
import { AlertaRecord, ChartDatum, DashboardDevice, Usuario } from '../types/app';

interface DashboardScreenProps {
  alertas: AlertaRecord[];
  chartData: ChartDatum[];
  dataLoading: boolean;
  dispositivos: DashboardDevice[];
  isAdmin: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastUpdated: string | null;
  monitoredDevicesCount: number;
  onBack: () => void;
  onLogout: () => void;
  onOpenCreateDevice: () => void;
  onOpenDeviceDetail: (deviceId: string) => void;
  onOpenDevices: () => void;
  onOpenPdfReport?: () => Promise<void>;
  onRefresh: () => Promise<void>;
  queueSize: number;
  totalConsumo: number;
  usuario: Usuario;
}

export default function DashboardScreen({
  alertas,
  chartData,
  dataLoading,
  dispositivos,
  isAdmin,
  isConnected,
  isSyncing,
  lastUpdated,
  monitoredDevicesCount,
  onLogout,
  onOpenCreateDevice,
  onOpenDeviceDetail,
  onOpenDevices,
  onOpenPdfReport,
  onRefresh,
  queueSize,
  totalConsumo,
  usuario,
}: DashboardScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 620;
  const isWide = width >= 1100;
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const featuredDevices = [...dispositivos].sort((a, b) => b.consumoActual - a.consumoActual).slice(0, 4);
  const consumos = dispositivos.map((device) => device.consumoActual);
  const consumoPico = consumos.length ? Math.max(...consumos) : 0;
  const consumoPromedio = consumos.length ? totalConsumo / consumos.length : 0;
  const consumoDiario = totalConsumo * 24;
  const consumoMensual = consumoDiario * 30;
  const criticalAlerts = alertas.filter((alerta) => alerta.nivel === 'critica').length;
  const energyState = criticalAlerts > 0 ? 'Critico' : alertas.length > 0 ? 'Atencion' : 'Estable';
  const stateColor = criticalAlerts > 0 ? '#ef4444' : alertas.length > 0 ? '#f59e0b' : '#22c55e';

  const handlePdf = async () => {
    if (!onOpenPdfReport || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await onOpenPdfReport();
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, !isCompact && styles.contentTablet, isWide && styles.contentWide]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={dataLoading} tintColor="#38bdf8" />}
        style={styles.container}
      >
        <ScreenHeader
          onLogout={onLogout}
          subtitle={`${usuario.nombre_completo} | ${usuario.rol === 'admin' ? 'Admin' : 'Usuario'}`}
          title="Dashboard energetico"
          actionLabel={generatingPdf ? 'Generando...' : 'Reporte PDF'}
          onAction={onOpenPdfReport ? handlePdf : undefined}
        />

        <View style={styles.heroPanel}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Estado energetico general</Text>
            <Text style={[styles.heroState, { color: stateColor }]}>{energyState}</Text>
            <Text style={styles.heroText}>
              Monitoreo en tiempo real de consumo, alertas y dispositivos IoT conectados.
            </Text>
          </View>
          <View style={styles.heroMeter}>
            <Text style={styles.heroMeterValue}>{totalConsumo.toFixed(0)}</Text>
            <Text style={styles.heroMeterUnit}>W actuales</Text>
          </View>
        </View>

        {lastUpdated ? <Text style={styles.lastUpdatedText}>Ultima actualizacion: {new Date(lastUpdated).toLocaleString()}</Text> : null}
        <StatusBanner isConnected={isConnected} isSyncing={isSyncing} queueSize={queueSize} />

        <View style={[styles.kpiGrid, isWide && styles.kpiGridWide]}>
          <KpiCard accentColor="#38bdf8" icon="zap" label="Consumo actual" secondary="Lectura consolidada" value={`${totalConsumo.toFixed(0)} W`} />
          <KpiCard accentColor="#22c55e" icon="sun" label="Consumo diario" secondary="Estimado por 24 horas" value={`${consumoDiario.toFixed(0)} Wh`} />
          <KpiCard accentColor="#f59e0b" icon="trending-up" label="Consumo mensual" secondary="Proyeccion operativa" value={`${consumoMensual.toFixed(0)} Wh`} />
          <KpiCard accentColor="#ef4444" icon="alert-triangle" label="Alertas" secondary={`${criticalAlerts} criticas`} value={`${alertas.length}`} />
        </View>

        <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
          <View style={styles.chartColumn}>
            <Text style={styles.sectionTitle}>Tendencia semanal</Text>
            <ConsumptionChart data={chartData} />

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Promedio</Text>
                <Text style={styles.metricValue}>{consumoPromedio.toFixed(0)} W</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pico maximo</Text>
                <Text style={[styles.metricValue, { color: consumoPico > 500 ? '#f87171' : '#86efac' }]}>{consumoPico.toFixed(0)} W</Text>
              </View>
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertas recientes</Text>
              <Text style={styles.sectionCount}>{alertas.length}</Text>
            </View>
            {alertas.length ? (
              alertas.slice(0, 4).map((alerta) => (
                <View key={alerta.id} style={[styles.alertCard, alerta.nivel === 'critica' ? styles.alertCrit : alerta.nivel === 'advertencia' ? styles.alertWarn : styles.alertInfo]}>
                  <Text style={styles.alertLevel}>{alerta.nivel.toUpperCase()}</Text>
                  <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
                  {alerta.fecha ? <Text style={styles.alertDate}>{new Date(alerta.fecha).toLocaleString()}</Text> : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sin alertas activas</Text>
                <Text style={styles.emptyText}>El sistema opera sin eventos criticos.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dispositivos destacados</Text>
          <TouchableOpacity onPress={onOpenDevices}>
            <Text style={styles.linkLabel}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {featuredDevices.length ? (
          <View style={[styles.deviceGrid, !isCompact && styles.deviceGridTablet]}>
            {featuredDevices.map((device) => (
              <DeviceCard compact device={device} key={device.id} onOpen={() => onOpenDeviceDetail(device.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay dispositivos registrados</Text>
            <Text style={styles.emptyText}>Agrega dispositivos para iniciar el monitoreo energetico.</Text>
            {isAdmin ? (
              <TouchableOpacity onPress={onOpenCreateDevice} style={styles.createButton}>
                <Text style={styles.createButtonText}>Crear dispositivo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    borderLeftWidth: 3,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  alertCrit: { backgroundColor: '#1c0a0a', borderColor: '#450a0a', borderLeftColor: '#ef4444' },
  alertDate: { color: '#6b7280', fontSize: 11, marginTop: 6 },
  alertInfo: { backgroundColor: '#0c1a2e', borderColor: '#1e3a5f', borderLeftColor: '#38bdf8' },
  alertLevel: { color: '#f9fafb', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  alertMessage: { color: '#d1d5db', fontSize: 13, lineHeight: 18, marginTop: 5 },
  alertWarn: { backgroundColor: '#1c1408', borderColor: '#451a03', borderLeftColor: '#f59e0b' },
  chartColumn: { flex: 1.35 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  contentTablet: { padding: 22 },
  contentWide: { alignSelf: 'center', maxWidth: 1180, width: '100%' },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284c7',
    borderRadius: 12,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  createButtonText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  deviceGrid: { gap: 12 },
  deviceGridTablet: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
  emptyCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 8 },
  emptyTitle: { color: '#f9fafb', fontSize: 17, fontWeight: '700' },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: '#38bdf8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroMeter: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 132,
    padding: 16,
  },
  heroMeterUnit: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  heroMeterValue: { color: '#86efac', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  heroPanel: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    padding: 20,
  },
  heroState: { fontSize: 34, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  heroText: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 8 },
  kpiGrid: { gap: 12, marginTop: 14 },
  kpiGridWide: { flexDirection: 'row' },
  lastUpdatedText: { color: '#4b5563', fontSize: 11, marginBottom: 8 },
  linkLabel: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  mainGrid: { gap: 16, marginTop: 18 },
  mainGridWide: { flexDirection: 'row' },
  metricCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  metricLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { color: '#f9fafb', fontSize: 22, fontWeight: '700', marginTop: 6 },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  safeArea: { backgroundColor: '#030712', flex: 1 },
  sectionCount: { color: '#22c55e', fontSize: 13, fontWeight: '700', backgroundColor: '#052e16', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 22 },
  sectionTitle: { color: '#f9fafb', fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  sideColumn: { flex: 1 },
});
