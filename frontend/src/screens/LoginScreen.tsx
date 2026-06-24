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
import { Feather } from '@expo/vector-icons';

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
                  <Feather name="zap" size={22} color="#38bdf8" />
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
                    {remember ? <Feather name="check" size={13} color="#f8fafc" /> : null}
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
                <Feather name="zap" size={28} color="#f8fafc" />
              </View>
              <Text style={styles.eyebrow}>Monitoreo energetico IoT</Text>
              <Text style={styles.title}>Panel inteligente de energia</Text>
              <Text style={styles.subtitle}>
                Supervisa consumo, alertas, auditoria y estado operativo con una interfaz empresarial moderna.
              </Text>

              <View style={styles.signalGrid}>
                <View style={styles.signalCard}>
                  <Feather name="activity" size={18} color="#38bdf8" />
                  <Text style={styles.signalValue}>24/7</Text>
                  <Text style={styles.signalLabel}>Monitoreo</Text>
                </View>
                <View style={styles.signalCard}>
                  <Feather name="cpu" size={18} color="#38bdf8" />
                  <Text style={styles.signalValue}>IoT</Text>
                  <Text style={styles.signalLabel}>Dispositivos</Text>
                </View>
                <View style={styles.signalCard}>
                  <Feather name="trending-up" size={18} color="#38bdf8" />
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
    backgroundColor: '#0284c7',
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  brandMarkText: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  card: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 460,
    padding: 28,
    width: '100%',
  },
  cardEyebrow: { color: '#38bdf8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardSubtitle: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginTop: 16 },
  cardTitle: { color: '#f9fafb', fontSize: 28, fontWeight: '800', marginTop: 3, letterSpacing: -0.5 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  checkText: { color: '#f8fafc', fontSize: 9, fontWeight: '900' },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
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
  eyebrow: { color: '#38bdf8', fontSize: 11, fontWeight: '800', marginTop: 22, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldGroup: { marginTop: 20 },
  formCopy: { flex: 1 },
  formMark: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  formMarkText: { color: '#38bdf8', fontSize: 15, fontWeight: '900' },
  hero: { flex: 1, gap: 2, maxWidth: 520 },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 13,
    borderWidth: 1,
    color: '#f9fafb',
    fontSize: 16,
    marginTop: 8,
    minHeight: 54,
    paddingHorizontal: 15,
  },
  keyboard: { flex: 1 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  optionsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  passwordInput: { color: '#f9fafb', flex: 1, fontSize: 16, minHeight: 54, paddingHorizontal: 15 },
  passwordShell: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
  },
  rememberLabel: { color: '#d1d5db', fontSize: 13, fontWeight: '600' },
  rememberRow: { alignItems: 'center', flexDirection: 'row' },
  roleHint: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  safeArea: { backgroundColor: '#030712', flex: 1 },
  securityNote: { color: '#6b7280', fontSize: 12, lineHeight: 18, marginTop: 16, textAlign: 'center' },
  shell: { alignSelf: 'center', maxWidth: 460, width: '100%' },
  shellWide: { alignItems: 'center', flexDirection: 'row', gap: 64, maxWidth: 1120 },
  showButton: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 38,
    paddingHorizontal: 13,
  },
  showButtonText: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  signalCard: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    minWidth: 112,
    padding: 16,
  },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  signalIcon: { color: '#38bdf8', fontSize: 10, fontWeight: '900' },
  signalLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  signalValue: { color: '#86efac', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 56,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitLabel: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#6b7280', fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 490 },
  title: { color: '#f9fafb', fontSize: 44, fontWeight: '800', lineHeight: 50, marginTop: 9, letterSpacing: -1.5 },
});
