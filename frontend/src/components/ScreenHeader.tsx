import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backLabel}>Volver</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={[styles.actionButton, isCompact && styles.actionButtonCompact]}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  actionButtonCompact: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  actionLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#102b3d',
    borderColor: '#173243',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backLabel: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '900',
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
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  title: {
    color: '#f8fafc',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 33,
  },
});
