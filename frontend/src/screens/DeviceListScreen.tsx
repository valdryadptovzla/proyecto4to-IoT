import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DeviceCard from '../components/DeviceCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBanner from '../components/StatusBanner';
import { DashboardDevice } from '../types/app';

interface DeviceListScreenProps {
  dataLoading: boolean;
  dispositivos: DashboardDevice[];
  isAdmin: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  locations: string[];
  onBack: () => void;
  onCreate: () => void;
  onEdit: (deviceId: string) => void;
  onLogout: () => void;
  onOpen: (deviceId: string) => void;
  onRefresh: () => Promise<void>;
  onSelectLocation: (location: string) => void;
  onSetMonitoring: (deviceId: string, monitored: boolean) => Promise<void>;
  queueSize: number;
  selectedLocation: string;
}

export default function DeviceListScreen({
  dataLoading,
  dispositivos,
  isAdmin,
  isConnected,
  isSyncing,
  locations,
  onBack,
  onCreate,
  onEdit,
  onLogout,
  onOpen,
  onRefresh,
  onSelectLocation,
  onSetMonitoring,
  queueSize,
  selectedLocation,
}: DeviceListScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 840;
  const isDesktop = width >= 1200;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={dataLoading} tintColor="#38bdf8" />}
        style={styles.container}
      >
        <ScreenHeader
          actionLabel={isAdmin ? 'Nuevo' : undefined}
          onAction={isAdmin ? onCreate : undefined}
          onBack={onBack}
          onLogout={onLogout}
          subtitle={isAdmin ? 'Administracion de equipos monitoreados' : 'Vista de monitoreo en solo lectura'}
          title="Dispositivos IoT"
        />

        <StatusBanner isConnected={isConnected} isSyncing={isSyncing} queueSize={queueSize} />

        <View style={styles.filtersCard}>
          <Text style={styles.filterTitle}>Filtrar por ubicacion</Text>
          <View style={styles.filterWrap}>
            {locations.map((location) => {
              const selected = selectedLocation === location;
              return (
                <TouchableOpacity
                  key={location}
                  onPress={() => onSelectLocation(location)}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelActive]}>{location}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {dispositivos.length ? (
          <View style={[styles.list, isWide && styles.grid]}>
            {dispositivos.map((device) => (
              <View key={device.id} style={isWide ? [styles.gridItem, isDesktop && styles.gridItemDesktop] : undefined}>
                <DeviceCard
                  device={device}
                  onEdit={isAdmin ? () => onEdit(device.id) : undefined}
                  onOpen={() => onOpen(device.id)}
                  onToggleMonitoring={isAdmin ? () => onSetMonitoring(device.id, device.estado !== 'encendido') : undefined}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay dispositivos registrados</Text>
            <Text style={styles.emptyText}>Cuando el admin agregue equipos, apareceran aqui para monitoreo.</Text>
            {isAdmin ? (
              <TouchableOpacity onPress={onCreate} style={styles.createButton}>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  contentWide: { alignSelf: 'center', maxWidth: 1120, width: '100%' },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  createButtonText: { color: '#f8fafc', fontSize: 13, fontWeight: '900' },
  emptyCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: { color: '#90a8bb', fontSize: 14, lineHeight: 20, marginTop: 8 },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  filterChip: {
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterChipLabel: { color: '#d3e8f5', fontSize: 12, fontWeight: '800' },
  filterChipLabelActive: { color: '#f8fafc' },
  filterTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '900', marginBottom: 12 },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filtersCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { padding: 6, width: '50%' },
  gridItemDesktop: { width: '33.3333%' },
  list: { gap: 12 },
  safeArea: { backgroundColor: '#050b12', flex: 1 },
});
