import { StyleSheet, Text, View } from 'react-native';

import { ChartDatum } from '../types/app';

interface ConsumptionChartProps {
  data: ChartDatum[];
}

export default function ConsumptionChart({ data }: ConsumptionChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Analitica</Text>
          <Text style={styles.title}>Consumo semanal</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>kWh</Text>
        </View>
      </View>
      <View style={styles.chartRow}>
        {data.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max((item.value / maxValue) * 100, 8)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>{item.value.toFixed(0)}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barFill: {
    backgroundColor: '#24b7f2',
    borderRadius: 999,
    minHeight: 10,
    width: '100%',
  },
  barTrack: {
    alignItems: 'flex-end',
    backgroundColor: '#0b2538',
    borderRadius: 999,
    height: 150,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 6,
    width: 30,
  },
  badge: {
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#091724',
    borderColor: '#173243',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: '#9ab1c4',
    fontSize: 12,
    marginTop: 6,
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  value: {
    color: '#d3e8f5',
    fontSize: 11,
    marginTop: 10,
  },
});
