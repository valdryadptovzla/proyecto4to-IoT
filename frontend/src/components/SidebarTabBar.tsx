import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Usuario } from '../types/app';

// Map each route to a Feather icon and a label
const tabMeta: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  Dashboard: { icon: 'home', label: 'Inicio' },
  Dispositivos: { icon: 'cpu', label: 'Equipos' },
  Alertas: { icon: 'bell', label: 'Alertas' },
  Auditoria: { icon: 'shield', label: 'Auditoria' },
  Usuarios: { icon: 'users', label: 'Usuarios' },
  Configuracion: { icon: 'settings', label: 'Config' },
};

interface SidebarTabBarProps extends BottomTabBarProps {
  onLogout: () => void;
  onQuickGeneratePdf?: () => Promise<void>;
  user: Usuario | null;
}

export default function SidebarTabBar({ navigation, onLogout, onQuickGeneratePdf, state, user }: SidebarTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Tablet and up gets the sidebar. Mobile gets floating dock.
  const isDesktop = width >= 768;
  const desktopExpandedWidth = 282;
  const desktopCollapsedWidth = 86;
  
  // Auto-collapse if width is between 768 and 1024
  const shouldBeExpanded = width >= 1024;
  const [desktopExpanded, setDesktopExpanded] = useState(shouldBeExpanded);

  // Sync state when window resizes
  useEffect(() => {
    setDesktopExpanded(shouldBeExpanded);
  }, [shouldBeExpanded]);

  const desktopAnim = useRef(new Animated.Value(shouldBeExpanded ? 1 : 0)).current;
  const parentNavigation = navigation.getParent();
  const showLabels = isDesktop ? desktopExpanded : true;

  useEffect(() => {
    Animated.timing(desktopAnim, {
      duration: 300,
      toValue: desktopExpanded ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [desktopAnim, desktopExpanded]);

  const handleCreateDevice = () => {
    if (user?.rol === 'admin') {
      (parentNavigation as any)?.navigate('DeviceForm', { mode: 'create' });
    }
  };

  const handleRoute = (routeName: string, params?: object) => {
    (navigation as any).navigate(routeName, params);
  };

  const desktopWidth = desktopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [desktopCollapsedWidth, desktopExpandedWidth],
  });

  const renderRouteButton = (route: (typeof state.routes)[number], compact = false) => {
    const isFocused = state.index === state.routes.findIndex((item) => item.key === route.key);
    const meta = tabMeta[route.name] ?? { icon: 'box', label: route.name };

    return (
      <TouchableOpacity
        accessibilityRole="button"
        key={route.key}
        onPress={() => handleRoute(route.name, route.params)}
        activeOpacity={0.7}
        style={[
          compact ? styles.mobileItem : styles.sidebarItem,
          !showLabels && styles.sidebarItemCollapsed,
          isFocused && styles.itemActive,
        ]}
      >
        <View style={[compact ? styles.mobileIconBadge : styles.iconBadge, isFocused && styles.iconBadgeActive]}>
          <Feather name={meta.icon} size={compact ? 16 : 20} color={isFocused ? '#38bdf8' : '#64748b'} />
        </View>
        {showLabels ? (
          <Text numberOfLines={1} style={[compact ? styles.mobileLabel : styles.sidebarLabel, isFocused && styles.itemActiveText]}>
            {meta.label}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (!isDesktop) {
    return (
      <View style={[styles.mobileBar, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        {state.routes.map((route) => renderRouteButton(route, true))}
        <TouchableOpacity
          accessibilityLabel="Cerrar sesion"
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onLogout}
          style={[styles.mobileItem, styles.mobileLogoutItem]}
        >
          <View style={[styles.mobileIconBadge, styles.mobileLogoutBadge]}>
            <Feather name="log-out" size={16} color="#f87171" />
          </View>
          <Text numberOfLines={1} style={[styles.mobileLabel, styles.mobileLogoutLabel]}>
            Salir
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.desktopContainer, { width: desktopWidth }]}>
      <View style={styles.brandBlock}>
        <View style={styles.sidebarTopRow}>
          {showLabels ? (
            <View style={styles.brandCopy}>
              <Text style={styles.brandEyebrow}>Energia IoT</Text>
              <Text style={styles.brandTitle}>Panel operativo</Text>
              {user ? <Text style={styles.brandUser}>{user.nombre_completo} | {user.rol}</Text> : null}
            </View>
          ) : (
            <View style={styles.brandCollapsedBadge}>
              <Feather name="zap" size={20} color="#38bdf8" />
            </View>
          )}

          <TouchableOpacity activeOpacity={0.6} onPress={() => setDesktopExpanded((value) => !value)} style={styles.toggleButton}>
            <Feather name={desktopExpanded ? 'chevron-left' : 'chevron-right'} size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navGroup}>{state.routes.map((route) => renderRouteButton(route))}</View>

      <View style={styles.quickActions}>
        {user?.rol === 'admin' ? (
          <TouchableOpacity activeOpacity={0.7} onPress={handleCreateDevice} style={[styles.quickActionButton, !showLabels && styles.compactActionButton]}>
            <Feather name="plus-circle" size={18} color="#38bdf8" />
            {showLabels ? <Text style={styles.quickActionLabel}>Agregar dispositivo</Text> : null}
          </TouchableOpacity>
        ) : null}

        {user?.rol === 'admin' && onQuickGeneratePdf ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => void onQuickGeneratePdf()} style={[styles.quickActionButton, !showLabels && styles.compactActionButton]}>
            <Feather name="file-text" size={18} color="#38bdf8" />
            {showLabels ? <Text style={styles.quickActionLabel}>Generar PDF</Text> : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity activeOpacity={0.7} onPress={onLogout} style={[styles.logoutButton, !showLabels && styles.compactActionButton]}>
          <Feather name="log-out" size={18} color="#f87171" />
          {showLabels ? <Text style={styles.logoutLabel}>Cerrar sesion</Text> : null}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  brandBlock: { borderBottomColor: '#1f2937', borderBottomWidth: 1, marginBottom: 16, paddingBottom: 16 },
  brandCollapsedBadge: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  brandCopy: { flex: 1 },
  brandEyebrow: { color: '#38bdf8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  brandTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  brandUser: { color: '#64748b', fontSize: 12, marginTop: 10, fontWeight: '500' },
  compactActionButton: { justifyContent: 'center', paddingHorizontal: 0 },
  desktopContainer: {
    backgroundColor: '#030712', // zinc-950
    borderRightColor: '#1f2937', // gray-800
    borderRightWidth: 1,
    padding: 16,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 36,
    justifyContent: 'center',
    width: 38,
  },
  iconBadgeActive: {
    // We can add a subtle glow or background for the active icon badge if desired, 
    // but the transparent background with colored icon is cleaner.
  },
  itemActive: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 }, // slate-900
  itemActiveText: { color: '#f8fafc', fontWeight: '800' },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#450a0a', // very dark red
    borderColor: '#7f1d1d',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  logoutLabel: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  mobileBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(3, 7, 18, 0.85)', // zinc-950 translucent
    borderColor: '#1f2937', // gray-800
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingTop: 12,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' },
      default: { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    }),
  },
  mobileIconBadge: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  mobileItem: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 4,
  },
  mobileLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  mobileLogoutBadge: {
    backgroundColor: '#2f0a0a',
    borderColor: '#7f1d1d',
    borderRadius: 12,
    borderWidth: 1,
  },
  mobileLogoutItem: {
    maxWidth: 66,
  },
  mobileLogoutLabel: { color: '#fca5a5' },
  navGroup: { gap: 6 },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#1e293b', // slate-800
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickActionLabel: { color: '#e0f2fe', fontSize: 13, fontWeight: '700' },
  quickActions: { borderTopColor: '#1f2937', borderTopWidth: 1, gap: 10, marginTop: 16, paddingTop: 16 },
  sidebarItem: { 
    alignItems: 'center', 
    borderRadius: 14, 
    flexDirection: 'row', 
    gap: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  sidebarItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarLabel: { color: '#94a3b8', flex: 1, fontSize: 14, fontWeight: '600' },
  sidebarTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  toggleButton: { alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, height: 34, justifyContent: 'center', width: 34, borderWidth: 1, borderColor: '#1e293b' },
});
