// Shim temporal: si falta el módulo nativo PlatformConstants, evitamos el crash
import { NativeModules, Platform } from 'react-native';
if (!NativeModules.PlatformConstants) {
  NativeModules.PlatformConstants = {
    reactNativeVersion: { major: 0, minor: 0, patch: 0 },
    osVersion: Platform.Version,
    forceTouchAvailable: false,
  } as any;
}

import 'react-native-gesture-handler';

import { Component, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EnergyAppProvider } from './src/hooks/EnergyAppProvider';
import AppNavigator from './src/navigation/AppNavigator';

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Root render failed', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title}>La app se inicio en modo seguro</Text>
          <Text style={styles.message}>
            Ocurrio un error al cargar el panel principal. Cierra y vuelve a abrir la app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootErrorBoundary>
          <EnergyAppProvider>
            <AppNavigator />
          </EnergyAppProvider>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: '#02131f',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: '#cfe4f3',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});
