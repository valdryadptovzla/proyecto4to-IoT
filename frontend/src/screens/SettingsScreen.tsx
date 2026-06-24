import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { Usuario } from '../types/app';

interface SettingsScreenProps {
  isConnected: boolean;
  isNetworkAvailable: boolean;
  offlineModeEnabled: boolean;
  onBack: () => void;
  onLogout: () => Promise<void>;
  onToggleOfflineMode: (enabled: boolean) => Promise<void>;
  queueSize: number;
  user: Usuario | null;
}

export default function SettingsScreen({
  isConnected,
  isNetworkAvailable,
  offlineModeEnabled,
  onBack,
  onLogout,
  onToggleOfflineMode,
  queueSize,
  user,
}: SettingsScreenProps) {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, width > 900 && styles.containerWide]}>
        <ScreenHeader
          onBack={onBack}
          onLogout={() => void onLogout()}
          subtitle={user ? `${user.nombre_completo} | ${user.rol}` : 'Sesion local'}
          title="Configuracion"
        />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Conectividad local</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Red disponible</Text>
            <Text style={styles.rowValue}>{isNetworkAvailable ? 'Si' : 'No'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Modo de la app</Text>
            <Text style={styles.rowValue}>{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Cambios pendientes</Text>
            <Text style={styles.rowValue}>{queueSize}</Text>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchTextBlock}>
              <Text style={styles.switchTitle}>Modo offline</Text>
              <Text style={styles.switchSubtitle}>Usa datos guardados localmente y sincroniza cambios pendientes al volver la conexion.</Text>
            </View>
            <Switch onValueChange={(value) => void onToggleOfflineMode(value)} value={offlineModeEnabled} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>API local</Text>
          <Text style={styles.infoText}>
            La URL del backend se configura por variable de entorno o por el script local de arranque. No se solicita al usuario final.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sesion</Text>
          <TouchableOpacity onPress={() => void onLogout()} style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  containerWide: { alignSelf: 'center', maxWidth: 860, width: '100%' },
  dangerButton: { alignItems: 'center', backgroundColor: '#7f1d1d', borderRadius: 14, marginTop: 14, paddingVertical: 15 },
  dangerButtonText: { color: '#fee2e2', fontWeight: '900' },
  infoText: { color: '#9bb2c4', fontSize: 14, lineHeight: 21, marginTop: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  rowLabel: { color: '#9bb2c4', fontSize: 14 },
  rowValue: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  safeArea: { backgroundColor: '#050b12', flex: 1 },
  sectionCard: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  switchSubtitle: { color: '#7f95ab', fontSize: 12, lineHeight: 18, marginTop: 4 },
  switchTextBlock: { flex: 1, paddingRight: 16 },
  switchTitle: { color: '#dceaf4', fontSize: 14, fontWeight: '900' },
});
