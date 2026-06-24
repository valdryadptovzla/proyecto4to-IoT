import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import ScreenHeader from '../components/ScreenHeader';
import StatusBanner from '../components/StatusBanner';
import { AlertLevel, AlertaRecord, DashboardDevice } from '../types/app';

type FilterLevel = 'todas' | AlertLevel;

interface AlertsScreenProps {
  alertSummary: Record<AlertLevel, number>;
  alertas: AlertaRecord[];
  dataLoading: boolean;
  dispositivos: DashboardDevice[];
  isConnected: boolean;
  isSyncing: boolean;
  onBack: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  queueSize: number;
}

function levelColor(level: AlertLevel): string {
  if (level === 'critica') return '#ef4444';
  if (level === 'advertencia') return '#f59e0b';
  return '#38bdf8';
}

function levelBg(level: AlertLevel): string {
  if (level === 'critica') return '#1a0a0a';
  if (level === 'advertencia') return '#1a1200';
  return '#071826';
}

function levelBorderCard(level: AlertLevel): string {
  if (level === 'critica') return '#7f1d1d';
  if (level === 'advertencia') return '#78350f';
  return '#15354a';
}

function levelBadgeBg(level: AlertLevel): string {
  if (level === 'critica') return '#fee2e2';
  if (level === 'advertencia') return '#fef3c7';
  return '#dbeafe';
}

function levelBadgeText(level: AlertLevel): string {
  if (level === 'critica') return '#991b1b';
  if (level === 'advertencia') return '#92400e';
  return '#1e40af';
}

const FILTERS: { key: FilterLevel; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'critica', label: 'Críticas' },
  { key: 'advertencia', label: 'Advertencias' },
  { key: 'info', label: 'Info' },
];

export default function AlertsScreen({
  alertSummary,
  alertas,
  dataLoading,
  dispositivos,
  isConnected,
  isSyncing,
  onBack,
  onLogout,
  onRefresh,
  queueSize,
}: AlertsScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 460;
  const [activeFilter, setActiveFilter] = useState<FilterLevel>('todas');

  // Mapa id → nombre de dispositivo
  const deviceMap = useMemo(
    () => new Map(dispositivos.map((d) => [d.id, d.nombre])),
    [dispositivos]
  );

  const filtered = useMemo(
    () => (activeFilter === 'todas' ? alertas : alertas.filter((a) => a.nivel === activeFilter)),
    [alertas, activeFilter]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, width > 900 && styles.contentWide]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={dataLoading} tintColor="#0ea5e9" />}
        style={styles.container}
      >
        <ScreenHeader
          onBack={onBack}
          onLogout={onLogout}
          subtitle="Eventos energéticos detectados por el sistema"
          title="Alertas"
        />

        <StatusBanner isConnected={isConnected} isSyncing={isSyncing} queueSize={queueSize} />

        {/* ── Resumen por nivel ── */}
        <View style={[styles.summaryRow, isCompact && styles.summaryRowCompact]}>
          <View style={[styles.summaryCard, { borderTopColor: '#ef4444' }]}>
            <Text style={styles.summaryLabel}>Críticas</Text>
            <Text style={[styles.summaryValue, { color: '#fca5a5' }]}>{alertSummary.critica}</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: '#f59e0b' }]}>
            <Text style={styles.summaryLabel}>Advertencias</Text>
            <Text style={[styles.summaryValue, { color: '#fcd34d' }]}>{alertSummary.advertencia}</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: '#38bdf8' }]}>
            <Text style={styles.summaryLabel}>Info</Text>
            <Text style={[styles.summaryValue, { color: '#93c5fd' }]}>{alertSummary.info}</Text>
          </View>
        </View>

        {/* ── Filtros por nivel ── */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                    {f.key !== 'todas' ? ` (${alertSummary[f.key as AlertLevel] ?? 0})` : ` (${alertas.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Lista de alertas ── */}
        <View>
          {filtered.length ? (
            filtered.map((alerta) => {
              const deviceName = deviceMap.get(alerta.dispositivo_id);
              return (
                <View
                  key={alerta.id}
                  style={[
                    styles.alertCard,
                    {
                      backgroundColor: levelBg(alerta.nivel),
                      borderColor: levelBorderCard(alerta.nivel),
                      borderLeftColor: levelColor(alerta.nivel),
                    },
                  ]}
                >
                  <View style={styles.alertTop}>
                    <View style={[styles.badge, { backgroundColor: levelBadgeBg(alerta.nivel) }]}>
                      <Text style={[styles.badgeText, { color: levelBadgeText(alerta.nivel) }]}>
                        {alerta.nivel.toUpperCase()}
                      </Text>
                    </View>
                    {alerta.fecha ? (
                      <Text style={styles.alertDate}>{new Date(alerta.fecha).toLocaleString()}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
                  {deviceName ? (
                    <View style={styles.deviceTag}>
                      <Text style={styles.deviceTagIcon}>🔌</Text>
                      <Text style={styles.deviceTagText}>{deviceName}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'todas' ? 'No hay alertas activas ✅' : `No hay alertas de tipo "${activeFilter}"`}
              </Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'todas'
                  ? 'Cuando el sistema detecte consumos anómalos aparecerán aquí.'
                  : 'Prueba cambiando el filtro de nivel.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    borderLeftWidth: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  alertDate: { color: '#7f95ab', fontSize: 11 },
  alertMessage: { color: '#e4eff7', fontSize: 14, lineHeight: 20, marginTop: 8 },
  alertTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 32 },
  contentWide: { alignSelf: 'center', maxWidth: 960, width: '100%' },
  deviceTag: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 10 },
  deviceTagIcon: { fontSize: 12 },
  deviceTagText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: { color: '#90a8bb', fontSize: 14, lineHeight: 20, marginTop: 8 },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  filterChip: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterChipText: { color: '#90a8bb', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#f8fafc' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4, paddingTop: 4 },
  filterScroll: { marginBottom: 16 },
  safeArea: { backgroundColor: '#02131f', flex: 1 },
  summaryCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 18,
    borderTopWidth: 3,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  summaryLabel: { color: '#9bb2c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 22, marginTop: 18 },
  summaryRowCompact: { flexWrap: 'wrap' },
  summaryValue: { fontSize: 28, fontWeight: '900', marginTop: 12 },
});
