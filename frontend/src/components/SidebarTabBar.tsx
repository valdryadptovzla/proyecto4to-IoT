import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Usuario } from '../types/app';

const tabMeta: Record<string, { icon: string; label: string }> = {
  Alertas: { icon: '!', label: 'Alertas' },
  Auditoria: { icon: 'AUD', label: 'Auditoria' },
  Configuracion: { icon: 'CFG', label: 'Config' },
  Dashboard: { icon: 'KW', label: 'Inicio' },
  Dispositivos: { icon: 'IOT', label: 'Equipos' },
  Usuarios: { icon: 'USR', label: 'Usuarios' },
};

interface SidebarTabBarProps extends BottomTabBarProps {
  onLogout: () => void;
  onQuickGeneratePdf?: () => Promise<void>;
  user: Usuario | null;
}

export default function SidebarTabBar({ navigation, onLogout, onQuickGeneratePdf, state, user }: SidebarTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 1024;
  const desktopExpandedWidth = 282;
  const desktopCollapsedWidth = 86;
  const [desktopExpanded, setDesktopExpanded] = useState(width >= 1280);
  const desktopAnim = useRef(new Animated.Value(width >= 1280 ? 1 : 0)).current;
  const parentNavigation = navigation.getParent();
  const showLabels = isDesktop ? desktopExpanded : true;

  useEffect(() => {
    Animated.timing(desktopAnim, {
      duration: 220,
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
    const meta = tabMeta[route.name] ?? { icon: 'APP', label: route.name };

    return (
      <TouchableOpacity
        accessibilityRole="button"
        key={route.key}
        onPress={() => handleRoute(route.name, route.params)}
        style={[
          compact ? styles.mobileItem : styles.sidebarItem,
          !showLabels && styles.sidebarItemCollapsed,
          isFocused && styles.itemActive,
        ]}
      >
        <View style={[compact ? styles.mobileIconBadge : styles.iconBadge, isFocused && styles.iconBadgeActive]}>
          <Text style={[compact ? styles.mobileIcon : styles.icon, isFocused && styles.itemActiveText]}>{meta.icon}</Text>
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
      <View style={[styles.mobileBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {state.routes.map((route) => renderRouteButton(route, true))}
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
              <Text style={styles.brandCollapsedText}>GE</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setDesktopExpanded((value) => !value)} style={styles.toggleButton}>
            <Text style={styles.toggleLabel}>{desktopExpanded ? '<' : '>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navGroup}>{state.routes.map((route) => renderRouteButton(route))}</View>

      <View style={styles.quickActions}>
        {user?.rol === 'admin' ? (
          <TouchableOpacity onPress={handleCreateDevice} style={[styles.quickActionButton, !showLabels && styles.compactActionButton]}>
            <Text style={styles.quickActionIcon}>+</Text>
            {showLabels ? <Text style={styles.quickActionLabel}>Agregar dispositivo</Text> : null}
          </TouchableOpacity>
        ) : null}

        {user?.rol === 'admin' && onQuickGeneratePdf ? (
          <TouchableOpacity onPress={() => void onQuickGeneratePdf()} style={[styles.quickActionButton, !showLabels && styles.compactActionButton]}>
            <Text style={styles.quickActionIcon}>PDF</Text>
            {showLabels ? <Text style={styles.quickActionLabel}>Generar PDF</Text> : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={onLogout} style={[styles.logoutButton, !showLabels && styles.compactActionButton]}>
          <Text style={styles.quickActionIcon}>OUT</Text>
          {showLabels ? <Text style={styles.logoutLabel}>Cerrar sesion</Text> : null}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  brandBlock: { borderBottomColor: '#173243', borderBottomWidth: 1, marginBottom: 16, paddingBottom: 16 },
  brandCollapsedBadge: {
    alignItems: 'center',
    backgroundColor: '#0f2a3d',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandCollapsedText: { color: '#38bdf8', fontSize: 15, fontWeight: '900' },
  brandCopy: { flex: 1 },
  brandEyebrow: { color: '#38bdf8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  brandTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 8 },
  brandUser: { color: '#94a3b8', fontSize: 12, marginTop: 10 },
  compactActionButton: { justifyContent: 'center', paddingHorizontal: 0 },
  desktopContainer: {
    backgroundColor: '#07111c',
    borderRightColor: '#173243',
    borderRightWidth: 1,
    padding: 16,
  },
  icon: { color: '#7f95ab', fontSize: 11, fontWeight: '900' },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#0b1f2f',
    borderColor: '#18364a',
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 38,
  },
  iconBadgeActive: {
    backgroundColor: '#0e3450',
    borderColor: '#38bdf8',
  },
  itemActive: { backgroundColor: '#0f2a3d' },
  itemActiveText: { color: '#38bdf8' },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#1a2e3d',
    borderColor: '#3f596d',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logoutLabel: { color: '#fecaca', fontSize: 13, fontWeight: '800' },
  mobileBar: {
    alignItems: 'center',
    backgroundColor: '#07111c',
    borderColor: '#173243',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  mobileIcon: { color: '#7f95ab', fontSize: 9, fontWeight: '900' },
  mobileIconBadge: {
    alignItems: 'center',
    backgroundColor: '#0b1f2f',
    borderColor: '#18364a',
    borderRadius: 9,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 32,
  },
  mobileItem: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 4,
  },
  mobileLabel: { color: '#c4d7e5', fontSize: 10, fontWeight: '800' },
  navGroup: { gap: 8 },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#173243',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickActionIcon: { color: '#7dd3fc', fontSize: 12, fontWeight: '900' },
  quickActionLabel: { color: '#d3e8f5', fontSize: 13, fontWeight: '800' },
  quickActions: { borderTopColor: '#173243', borderTopWidth: 1, gap: 10, marginTop: 16, paddingTop: 16 },
  sidebarItem: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  sidebarItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarLabel: { color: '#c4d7e5', flex: 1, fontSize: 14, fontWeight: '800' },
  sidebarTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  toggleButton: { alignItems: 'center', backgroundColor: '#0f2a3d', borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  toggleLabel: { color: '#dbeafe', fontSize: 14, fontWeight: '900' },
});
