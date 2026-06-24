import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface KpiCardProps {
  accentColor: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  secondary?: string;
  value: string;
}

export default function KpiCard({ accentColor, icon, label, secondary, value }: KpiCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { borderColor: `${accentColor}55`, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}>
          <Feather name={icon} size={18} color={accentColor} />
        </View>
        <View style={[styles.statusDot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: '#f8fafc' }]}>{value}</Text>
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827', // gray-900
    borderRadius: 20,
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
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  label: {
    color: '#6b7280', // gray-500
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  secondary: {
    color: '#4b5563', // gray-600
    fontSize: 12,
    marginTop: 8,
  },
  value: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
