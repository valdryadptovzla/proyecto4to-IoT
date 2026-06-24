import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ScreenHeaderProps {
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  subtitle?: string;
  title: string;
}

export default function ScreenHeader({ actionLabel, onAction, onBack, subtitle, title }: ScreenHeaderProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
      <View style={styles.leftGroup}>
        {onBack ? (
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={13} color="#38bdf8" />
            <Text style={styles.backLabel}>Volver</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity activeOpacity={0.75} onPress={onAction} style={[styles.actionButton, isCompact && styles.actionButtonCompact]}>
          <Feather name="file-text" size={14} color="#f8fafc" />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#0284c7', // sky-600
    borderRadius: 12,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButtonCompact: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  actionLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingTop: 12,
  },
  headerRowCompact: {
    flexDirection: 'column',
  },
  leftGroup: {
    flex: 1,
    paddingRight: 12,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  title: {
    color: '#f9fafb',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});
