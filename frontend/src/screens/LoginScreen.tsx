import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RememberedLogin } from '../types/app';

interface LoginScreenProps {
  initialPassword: string;
  initialRemember: boolean;
  initialUsername: string;
  isSubmitting: boolean;
  onSubmit: (credentials: RememberedLogin) => Promise<void>;
}

export default function LoginScreen({
  initialPassword,
  initialRemember,
  initialUsername,
  isSubmitting,
  onSubmit,
}: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(initialRemember);
  const [username, setUsername] = useState(initialUsername);

  useEffect(() => {
    setPassword(initialPassword);
    setRemember(initialRemember);
    setUsername(initialUsername);
  }, [initialPassword, initialRemember, initialUsername]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa usuario y contrasena para continuar.');
      return;
    }

    try {
      await onSubmit({ password, remember, username });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
      Alert.alert('Error de acceso', message);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.shell, isWide && styles.shellWide, { opacity: fadeAnim }]}>
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.formMark}>
                  <Text style={styles.formMarkText}>GE</Text>
                </View>
                <View style={styles.formCopy}>
                  <Text style={styles.cardEyebrow}>Acceso seguro</Text>
                  <Text style={styles.cardTitle}>Iniciar sesion</Text>
                </View>
              </View>

              <Text style={styles.cardSubtitle}>Ingresa con tu rol para consultar o administrar el monitoreo energetico.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Usuario</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setUsername}
                  placeholder="usuario"
                  placeholderTextColor="#6b879d"
                  style={styles.input}
                  value={username}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contrasena</Text>
                <View style={styles.passwordShell}>
                  <TextInput
                    editable={!isSubmitting}
                    onChangeText={setPassword}
                    placeholder="contrasena"
                    placeholderTextColor="#6b879d"
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    value={password}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.showButton}>
                    <Text style={styles.showButtonText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => setRemember((value) => !value)} style={styles.rememberRow}>
                  <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                    {remember ? <Text style={styles.checkText}>OK</Text> : null}
                  </View>
                  <Text style={styles.rememberLabel}>Recordar acceso</Text>
                </TouchableOpacity>
                <Text style={styles.roleHint}>Admin / Usuario</Text>
              </View>

              <TouchableOpacity
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitLabel}>{isSubmitting ? 'Validando...' : 'Entrar al dashboard'}</Text>
              </TouchableOpacity>

              <Text style={styles.securityNote}>La API se configura internamente para pruebas locales y futura APK.</Text>
            </View>

            <View style={styles.hero}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>GE</Text>
              </View>
              <Text style={styles.eyebrow}>Monitoreo energetico IoT</Text>
              <Text style={styles.title}>Panel inteligente de energia</Text>
              <Text style={styles.subtitle}>
                Supervisa consumo, alertas, auditoria y estado operativo con una interfaz empresarial moderna.
              </Text>

              <View style={styles.signalGrid}>
                <View style={styles.signalCard}>
                  <Text style={styles.signalIcon}>LIVE</Text>
                  <Text style={styles.signalValue}>24/7</Text>
                  <Text style={styles.signalLabel}>Monitoreo</Text>
                </View>
                <View style={styles.signalCard}>
                  <Text style={styles.signalIcon}>IOT</Text>
                  <Text style={styles.signalValue}>IoT</Text>
                  <Text style={styles.signalLabel}>Dispositivos</Text>
                </View>
                <View style={styles.signalCard}>
                  <Text style={styles.signalIcon}>PWR</Text>
                  <Text style={styles.signalValue}>kWh</Text>
                  <Text style={styles.signalLabel}>Analitica</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#16a8e8',
    borderColor: 'rgba(125, 211, 252, 0.45)',
    borderRadius: 18,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  brandMarkText: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  card: {
    backgroundColor: 'rgba(9, 23, 36, 0.98)',
    borderColor: '#1f4259',
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 460,
    padding: 28,
    width: '100%',
  },
  cardEyebrow: { color: '#38bdf8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardSubtitle: { color: '#93aabe', fontSize: 14, lineHeight: 20, marginTop: 16 },
  cardTitle: { color: '#f8fafc', fontSize: 30, fontWeight: '900', marginTop: 3 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  checkText: { color: '#f8fafc', fontSize: 9, fontWeight: '900' },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#0f2940',
    borderColor: '#214e6a',
    borderRadius: 8,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    marginRight: 10,
    width: 24,
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#22c55e' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  contentWide: { alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#38bdf8', fontSize: 12, fontWeight: '900', marginTop: 22, textTransform: 'uppercase' },
  fieldGroup: { marginTop: 20 },
  formCopy: { flex: 1 },
  formMark: {
    alignItems: 'center',
    backgroundColor: '#0d2d42',
    borderColor: '#1f5672',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  formMarkText: { color: '#7dd3fc', fontSize: 15, fontWeight: '900' },
  hero: { flex: 1, gap: 2, maxWidth: 520 },
  input: {
    backgroundColor: '#081826',
    borderColor: '#1b3f55',
    borderRadius: 13,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    marginTop: 8,
    minHeight: 54,
    paddingHorizontal: 15,
  },
  keyboard: { flex: 1 },
  label: { color: '#a6bfd0', fontSize: 13, fontWeight: '900' },
  optionsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  passwordInput: { color: '#f8fafc', flex: 1, fontSize: 16, minHeight: 54, paddingHorizontal: 15 },
  passwordShell: {
    alignItems: 'center',
    backgroundColor: '#081826',
    borderColor: '#1b3f55',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
  },
  rememberLabel: { color: '#c3d8e7', fontSize: 13, fontWeight: '700' },
  rememberRow: { alignItems: 'center', flexDirection: 'row' },
  roleHint: { color: '#7892a5', fontSize: 12, fontWeight: '800' },
  safeArea: { backgroundColor: '#050b12', flex: 1 },
  securityNote: { color: '#7892a5', fontSize: 12, lineHeight: 18, marginTop: 16, textAlign: 'center' },
  shell: { alignSelf: 'center', maxWidth: 460, width: '100%' },
  shellWide: { alignItems: 'center', flexDirection: 'row', gap: 64, maxWidth: 1120 },
  showButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 38,
    paddingHorizontal: 13,
  },
  showButtonText: { color: '#d3e8f5', fontSize: 12, fontWeight: '900' },
  signalCard: {
    backgroundColor: '#0a1e2e',
    borderColor: '#1d4056',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 112,
    padding: 15,
  },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  signalIcon: { color: '#38bdf8', fontSize: 10, fontWeight: '900' },
  signalLabel: { color: '#89a5b7', fontSize: 12, marginTop: 4 },
  signalValue: { color: '#86efac', fontSize: 24, fontWeight: '900', marginTop: 6 },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#16a8e8',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 56,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitLabel: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  subtitle: { color: '#9bb2c4', fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 490 },
  title: { color: '#f8fafc', fontSize: 44, fontWeight: '900', lineHeight: 50, marginTop: 9 },
});
