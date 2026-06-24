import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import ScreenHeader from '../components/ScreenHeader';
import StatusBanner from '../components/StatusBanner';
import { AuditEvent } from '../types/app';

interface AuditScreenProps {
  dataLoading: boolean;
  events: AuditEvent[];
  isConnected: boolean;
  isSyncing: boolean;
  onBack: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  queueSize: number;
}

function actionIcon(accion: string): string {
  const a = accion.toLowerCase();
  if (a.includes('login') || a.includes('sesion')) return '🔐';
  if (a.includes('create') || a.includes('crear') || a.includes('nuevo')) return '➕';
  if (a.includes('delete') || a.includes('elimin')) return '🗑️';
  if (a.includes('update') || a.includes('actualiz') || a.includes('edit')) return '✏️';
  if (a.includes('pdf') || a.includes('report')) return '📄';
  if (a.includes('logout') || a.includes('cierre')) return '🚪';
  return '📋';
}

function actionColor(accion: string): string {
  const a = accion.toLowerCase();
  if (a.includes('delete') || a.includes('elimin')) return '#ef4444';
  if (a.includes('create') || a.includes('crear') || a.includes('nuevo')) return '#22c55e';
  if (a.includes('login') || a.includes('sesion')) return '#38bdf8';
  if (a.includes('update') || a.includes('actualiz') || a.includes('edit')) return '#f59e0b';
  if (a.includes('pdf') || a.includes('report')) return '#a855f7';
  return '#9fbaca';
}

function rolColor(rol: string): string {
  if (rol === 'admin') return '#38bdf8';
  return '#86efac';
}

export default function AuditScreen({
  dataLoading,
  events,
  isConnected,
  isSyncing,
  onBack,
  onLogout,
  onRefresh,
  queueSize,
}: AuditScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const [searchQuery, setSearchQuery] = useState('');

  // Métricas derivadas
  const uniqueUsers = useMemo(() => new Set(events.map((e) => e.actor.username)).size, [events]);
  const criticalActions = useMemo(
    () => events.filter((e) => e.accion.toLowerCase().includes('delete') || e.accion.toLowerCase().includes('elimin')).length,
    [events]
  );
  const lastEvent = events[0];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.accion.toLowerCase().includes(q) ||
        e.actor.username.toLowerCase().includes(q) ||
        e.descripcion.toLowerCase().includes(q) ||
        (e.entidad ?? '').toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

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
          subtitle="Panel exclusivo para administración y trazabilidad"
          title="Auditoría"
        />

        <StatusBanner isConnected={isConnected} isSyncing={isSyncing} queueSize={queueSize} />

        {/* ── Métricas ── */}
        <View style={[styles.metricsRow, isCompact && styles.metricsRowCompact]}>
          <View style={[styles.metricCard, { borderTopColor: '#38bdf8' }]}>
            <Text style={styles.metricLabel}>Total eventos</Text>
            <Text style={styles.metricValue}>{events.length}</Text>
          </View>
          <View style={[styles.metricCard, { borderTopColor: '#22c55e' }]}>
            <Text style={styles.metricLabel}>Usuarios únicos</Text>
            <Text style={styles.metricValue}>{uniqueUsers}</Text>
          </View>
          <View style={[styles.metricCard, { borderTopColor: '#ef4444' }]}>
            <Text style={styles.metricLabel}>Eliminaciones</Text>
            <Text style={[styles.metricValue, criticalActions > 0 && { color: '#fca5a5' }]}>{criticalActions}</Text>
          </View>
          <View style={[styles.metricCard, { borderTopColor: '#f59e0b' }]}>
            <Text style={styles.metricLabel}>Último evento</Text>
            <Text style={styles.metricValueSmall}>
              {lastEvent?.fecha ? new Date(lastEvent.fecha).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>

        {/* ── Buscador ── */}
        <View>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Buscar por acción, usuario o descripción..."
              placeholderTextColor="#4f6d80"
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {searchQuery.length > 0 ? (
            <Text style={styles.searchResultCount}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{searchQuery}"
            </Text>
          ) : null}
        </View>

        {/* ── Timeline de eventos ── */}
        <View>
          {filtered.length ? (
            <View style={styles.timelineContainer}>
              {filtered.map((event, index) => {
                const color = actionColor(event.accion);
                const icon = actionIcon(event.accion);
                const isLast = index === filtered.length - 1;

                return (
                  <View key={event.id} style={styles.timelineItem}>
                    {/* Línea vertical conectora */}
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: color }]}>
                        <Text style={styles.timelineDotIcon}>{icon}</Text>
                      </View>
                      {!isLast ? <View style={[styles.timelineLine, { backgroundColor: color + '44' }]} /> : null}
                    </View>

                    {/* Contenido de la tarjeta */}
                    <View style={[styles.eventCard, { borderLeftColor: color }]}>
                      <View style={styles.eventHeader}>
                        <Text style={[styles.eventAction, { color }]}>
                          {event.accion.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        <Text style={styles.eventDate}>
                          {new Date(event.fecha).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.eventActorRow}>
                        <Text style={styles.eventUser}>@{event.actor.username}</Text>
                        <View style={[styles.rolBadge, { borderColor: rolColor(event.actor.rol) }]}>
                          <Text style={[styles.rolBadgeText, { color: rolColor(event.actor.rol) }]}>
                            {event.actor.rol}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.eventDescription}>{event.descripcion}</Text>

                      {event.entidad ? (
                        <View style={styles.entityTag}>
                          <Text style={styles.entityTagText}>
                            {event.entidad}{event.entidad_id ? ` #${event.entidad_id.slice(0, 8)}` : ''}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'Sin eventos de auditoría'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Aquí aparecerán inicios de sesión y acciones relevantes de usuarios.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  contentWide: { alignSelf: 'center', maxWidth: 960, width: '100%' },
  emptyCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: { color: '#90a8bb', fontSize: 14, lineHeight: 20, marginTop: 8 },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  entityTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f2a3d',
    borderRadius: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entityTagText: { color: '#7dd3fc', fontSize: 10, fontWeight: '700' },
  eventAction: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  eventActorRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  eventCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderLeftWidth: 3,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    marginBottom: 0,
    padding: 14,
  },
  eventDate: { color: '#7f95ab', fontSize: 10 },
  eventDescription: { color: '#dceaf4', fontSize: 13, lineHeight: 18, marginTop: 8 },
  eventHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  eventUser: { color: '#38bdf8', fontSize: 12, fontWeight: '800' },
  metricCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 18,
    borderTopWidth: 3,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: 14,
  },
  metricLabel: { color: '#9bb2c4', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: '#f8fafc', fontSize: 26, fontWeight: '900', marginTop: 8 },
  metricValueSmall: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 8 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 18 },
  metricsRowCompact: { flexWrap: 'wrap' },
  rolBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  rolBadgeText: { fontSize: 10, fontWeight: '800' },
  safeArea: { backgroundColor: '#02131f', flex: 1 },
  searchClear: { color: '#7f95ab', fontSize: 16, paddingHorizontal: 4 },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#081a28',
    borderColor: '#16374c',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { color: '#f8fafc', flex: 1, fontSize: 14, paddingVertical: 12 },
  searchResultCount: { color: '#7f95ab', fontSize: 12, marginBottom: 14 },
  timelineContainer: { gap: 0 },
  timelineDot: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
    zIndex: 1,
  },
  timelineDotIcon: { fontSize: 14 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineLeft: { alignItems: 'center', width: 34 },
  timelineLine: { flex: 1, marginTop: 2, width: 2 },
});
