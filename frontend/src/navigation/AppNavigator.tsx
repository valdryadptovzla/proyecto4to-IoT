import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { ActivityIndicator, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SidebarTabBar from '../components/SidebarTabBar';
import { useEnergyApp } from '../hooks/EnergyAppProvider';
import AlertsScreen from '../screens/AlertsScreen';
import AuditScreen from '../screens/AuditScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DeviceDetailScreen from '../screens/DeviceDetailScreen';
import DeviceFormScreen from '../screens/DeviceFormScreen';
import DeviceListScreen from '../screens/DeviceListScreen';
import LoginScreen from '../screens/LoginScreen';
import PdfPreviewScreen from '../screens/PdfPreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UsersAdminScreen from '../screens/UsersAdminScreen';
import { MainTabParamList, RootStackParamList } from './types';

async function openAdminReport(params: {
  alerts: Parameters<typeof import('../services/report').generateAdminReport>[0]['alerts'];
  auditTrail: Parameters<typeof import('../services/report').generateAdminReport>[0]['auditTrail'];
  devices: Parameters<typeof import('../services/report').generateAdminReport>[0]['devices'];
  user: Parameters<typeof import('../services/report').generateAdminReport>[0]['user'];
}) {
  const { generateAdminReport } = await import('../services/report');
  return generateAdminReport({ ...params, logoAssetModule: require('../../assets/icon.png') });
}

function getPdfReadyMessage() {
  return Platform.OS === 'web'
    ? 'Se abrio la vista de impresion del navegador.'
    : 'Se genero el archivo y se abrio el menu para compartir o guardar.';
}

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#030712',
    border: '#1f2937',
    card: '#111827',
    primary: '#38bdf8',
    text: '#f8fafc',
  },
};

function DashboardTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();
  const isAdmin = app.user?.rol === 'admin';

  const handleGeneratePdf = async () => {
    if (!app.user || !isAdmin) return;

    try {
      await openAdminReport({
        alerts: app.alertas,
        auditTrail: app.auditTrail,
        devices: app.dispositivos,
        user: app.user,
      });
      Alert.alert('PDF listo', getPdfReadyMessage());
      await app.registerAuditEvent({
        accion: 'pdf_generado',
        descripcion: 'El administrador genero un reporte PDF desde el dashboard.',
        detalles: {
          alertas: app.alertas.length,
          dispositivos: app.dispositivos.length,
          eventos_auditoria: app.auditTrail.length,
          origen: 'dashboard',
        },
        entidad: 'reporte',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el PDF.';
      Alert.alert('Error', message);
    }
  };

  return (
    <DashboardScreen
      alertas={app.alertas}
      chartData={app.chartData}
      dataLoading={app.dataLoading}
      dispositivos={app.dispositivos}
      isAdmin={isAdmin}
      isConnected={app.isConnected}
      isSyncing={app.syncing}
      lastUpdated={app.lastUpdated}
      monitoredDevicesCount={app.monitoredDevicesCount}
      onBack={() => navigation.navigate('Dashboard')}
      onLogout={() => void app.logout()}
      onOpenCreateDevice={() => navigation.navigate('DeviceForm', { mode: 'create' })}
      onOpenDeviceDetail={(deviceId) => navigation.navigate('DeviceDetail', { deviceId })}
      onOpenDevices={() => navigation.navigate('Dispositivos')}
      onOpenPdfReport={handleGeneratePdf}
      onRefresh={app.refreshData}
      queueSize={app.queueSize}
      totalConsumo={app.totalConsumo}
      usuario={app.user!}
    />
  );
}

function DeviceListTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();
  const isAdmin = app.user?.rol === 'admin';

  return (
    <DeviceListScreen
      dataLoading={app.dataLoading}
      dispositivos={app.filteredDispositivos}
      isAdmin={isAdmin}
      isConnected={app.isConnected}
      isSyncing={app.syncing}
      locations={app.availableLocations}
      onBack={() => navigation.navigate('Dashboard')}
      onCreate={() => navigation.navigate('DeviceForm', { mode: 'create' })}
      onEdit={(deviceId) => navigation.navigate('DeviceForm', { deviceId, mode: 'edit' })}
      onOpen={(deviceId) => navigation.navigate('DeviceDetail', { deviceId })}
      onLogout={() => void app.logout()}
      onRefresh={app.refreshData}
      onSelectLocation={app.setLocationFilter}
      onSetMonitoring={(deviceId, monitored) => app.setMonitoringEnabled(deviceId, monitored)}
      queueSize={app.queueSize}
      selectedLocation={app.locationFilter}
    />
  );
}

function AlertsTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();

  return (
    <AlertsScreen
      alertSummary={app.alertSummary}
      alertas={app.alertas}
      dataLoading={app.dataLoading}
      dispositivos={app.dispositivos}
      isConnected={app.isConnected}
      isSyncing={app.syncing}
      onBack={() => navigation.navigate('Dashboard')}
      onLogout={() => void app.logout()}
      onRefresh={app.refreshData}
      queueSize={app.queueSize}
    />
  );
}

function AuditTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();
  return (
    <AuditScreen
      dataLoading={app.dataLoading}
      events={app.auditTrail}
      isConnected={app.isConnected}
      isSyncing={app.syncing}
      onBack={() => navigation.navigate('Dashboard')}
      onLogout={() => void app.logout()}
      onRefresh={app.refreshData}
      queueSize={app.queueSize}
    />
  );
}

function UsersTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();
  return (
    <UsersAdminScreen
      dataLoading={app.dataLoading}
      onBack={() => navigation.navigate('Dashboard')}
      onDeleteUser={app.deleteUserRecord}
      onLogout={() => void app.logout()}
      onRefresh={app.refreshData}
      onSaveUser={app.saveUserRecord}
      savingUser={app.savingUser}
      users={app.users}
    />
  );
}

function SettingsTabScreen({ navigation }: { navigation: any }) {
  const app = useEnergyApp();
  return (
    <SettingsScreen
      isConnected={app.isConnected}
      isNetworkAvailable={app.isNetworkAvailable}
      offlineModeEnabled={app.offlineModeEnabled}
      onBack={() => navigation.navigate('Dashboard')}
      onLogout={app.logout}
      onToggleOfflineMode={app.setOfflineModeEnabled}
      queueSize={app.queueSize}
      user={app.user}
    />
  );
}

function MainTabs() {
  const app = useEnergyApp();
  const { width } = useWindowDimensions();
  // Match SidebarTabBar breakpoint: sidebar layout from 768px up
  const isDesktop = width >= 768;
  const isAdmin = app.user?.rol === 'admin';

  const handleGeneratePdf = async () => {
    if (!app.user || !isAdmin) return;

    try {
      await openAdminReport({
        alerts: app.alertas,
        auditTrail: app.auditTrail,
        devices: app.dispositivos,
        user: app.user,
      });
      Alert.alert('PDF listo', getPdfReadyMessage());
      await app.registerAuditEvent({
        accion: 'pdf_generado',
        descripcion: 'El administrador genero un reporte PDF desde la navegacion.',
        detalles: {
          alertas: app.alertas.length,
          dispositivos: app.dispositivos.length,
          eventos_auditoria: app.auditTrail.length,
          origen: 'navegacion',
        },
        entidad: 'reporte',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el PDF.';
      Alert.alert('Error', message);
    }
  };

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <SidebarTabBar
          {...props}
          onLogout={() => void app.logout()}
          onQuickGeneratePdf={isAdmin ? handleGeneratePdf : undefined}
          user={app.user}
        />
      )}
      screenOptions={{
        freezeOnBlur: Platform.OS === 'web' ? false : undefined,
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        tabBarStyle: isDesktop ? styles.desktopTabBar : styles.mobileTabBar,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardTabScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Dispositivos" component={DeviceListTabScreen} options={{ title: 'Dispositivos' }} />
      <Tab.Screen name="Alertas" component={AlertsTabScreen} options={{ title: 'Alertas' }} />
      {isAdmin ? <Tab.Screen name="Auditoria" component={AuditTabScreen} options={{ title: 'Auditoria' }} /> : null}
      {isAdmin ? <Tab.Screen name="Usuarios" component={UsersTabScreen} options={{ title: 'Usuarios' }} /> : null}
      {isAdmin ? <Tab.Screen name="Configuracion" component={SettingsTabScreen} options={{ title: 'Configuracion' }} /> : null}
    </Tab.Navigator>
  );
}

function DeviceDetailStackScreen({ route, navigation }: { navigation: any; route: any }) {
  const app = useEnergyApp();
  const { deviceId } = route.params;
  const dispositivo = app.getDeviceById(deviceId);
  const isAdmin = app.user?.rol === 'admin';

  return (
    <DeviceDetailScreen
      alertas={app.getDeviceAlertas(deviceId)}
      consumos={app.getDeviceConsumos(deviceId)}
      dispositivo={dispositivo}
      isAdmin={isAdmin}
      isConnected={app.isConnected}
      onBack={navigation.goBack}
      onDelete={async (selectedId) => {
        await app.deleteDevice(selectedId);
        navigation.goBack();
      }}
      onEdit={() => navigation.navigate('DeviceForm', { deviceId, mode: 'edit' })}
      onLogout={() => void app.logout()}
      onSetMonitoring={(monitored) => app.setMonitoringEnabled(deviceId, monitored)}
    />
  );
}

function DeviceFormStackScreen({ route, navigation }: { navigation: any; route: any }) {
  const app = useEnergyApp();
  const { deviceId, mode } = route.params;
  const dispositivo = deviceId ? app.getDeviceById(deviceId) : null;

  if (app.user?.rol !== 'admin') {
    return null;
  }

  return (
    <DeviceFormScreen
      dispositivo={dispositivo}
      isConnected={app.isConnected}
      isSaving={app.savingDevice}
      mode={mode}
      onCancel={navigation.goBack}
      onLogout={() => void app.logout()}
      onSave={async (payload) => {
        await app.saveDevice(payload, mode, deviceId);
        navigation.goBack();
      }}
    />
  );
}

function LoginStackScreen() {
  const app = useEnergyApp();
  return (
    <LoginScreen
      initialPassword={app.rememberedLogin.password}
      initialRemember={app.rememberedLogin.remember}
      initialUsername={app.rememberedLogin.username}
      isSubmitting={app.authLoading}
      onSubmit={app.login}
    />
  );
}

export default function AppNavigator() {
  const app = useEnergyApp();

  if (app.sessionLoading) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#38bdf8" size="large" />
          <Text style={styles.loadingText}>Cargando panel energetico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right', headerShown: false }}>
        {!app.user ? (
          <RootStack.Screen name="Login" component={LoginStackScreen} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen name="PdfPreview" component={PdfPreviewScreen} />
            <RootStack.Screen name="DeviceDetail" component={DeviceDetailStackScreen} />
            <RootStack.Screen name="DeviceForm" component={DeviceFormStackScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  desktopTabBar: {
    backgroundColor: '#030712',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingSafeArea: {
    backgroundColor: '#030712',
    flex: 1,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 14,
  },
  mobileTabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 90,
    position: 'absolute',
  },
  scene: {
    backgroundColor: '#030712',
  },
});
