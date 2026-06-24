import { StyleSheet, Text, View } from 'react-native';

interface KpiCardProps {
  accentColor: string;
  icon: string;
  label: string;
  secondary?: string;
  value: string;
}

export default function KpiCard({ accentColor, icon, label, secondary, value }: KpiCardProps) {
  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}>
          <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#091724',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 160,
    minHeight: 150,
    padding: 20,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 10,
  },
  icon: {
    fontSize: 14,
    fontWeight: '900',
  },
  label: {
    color: '#9fb4c8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  secondary: {
    color: '#6b879d',
    fontSize: 12,
    marginTop: 8,
  },
  value: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  statusDot: {
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
