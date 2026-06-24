import { StyleSheet, Text, View } from 'react-native';

interface StatusBannerProps {
  isConnected: boolean;
  isSyncing: boolean;
  queueSize: number;
}

export default function StatusBanner({ isConnected, isSyncing, queueSize }: StatusBannerProps) {
  const backgroundColor = !isConnected ? '#5b2119' : isSyncing ? '#4a320c' : '#133246';
  const message = !isConnected
    ? 'Modo offline activo. Los cambios se guardan localmente.'
    : isSyncing
      ? 'Sincronizando cambios pendientes con la API.'
      : queueSize > 0
        ? `${queueSize} cambio(s) pendiente(s) de sincronizar.`
        : 'Sincronizacion al dia.';

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
});