import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import ScreenHeader from '../components/ScreenHeader';
import { UserRole, Usuario, UsuarioFormPayload } from '../types/app';

interface UsersAdminScreenProps {
  dataLoading: boolean;
  onBack: () => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onSaveUser: (payload: UsuarioFormPayload, userId?: string) => Promise<void>;
  savingUser: boolean;
  users: Usuario[];
}

const initialForm: UsuarioFormPayload = {
  nombre_completo: '',
  password: '',
  rol: 'usuario',
  username: '',
};

/** Puntuación de seguridad de contraseña (0-4) */
function passwordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

function strengthLabel(score: number): string {
  if (score === 0) return '';
  if (score === 1) return 'Débil';
  if (score === 2) return 'Regular';
  if (score === 3) return 'Buena';
  return 'Fuerte';
}

function strengthColor(score: number): string {
  if (score <= 1) return '#ef4444';
  if (score === 2) return '#f59e0b';
  if (score === 3) return '#22c55e';
  return '#0ea5e9';
}

function rolBadgeStyle(rol: UserRole): { bg: string; text: string } {
  if (rol === 'admin') return { bg: '#0c2e52', text: '#38bdf8' };
  return { bg: '#1a2e0d', text: '#86efac' };
}

function userInitials(nombre: string): string {
  const parts = nombre.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(username: string): string {
  const palette = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const ROL_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acceso total al sistema',
  usuario: 'Solo visualizacion de informacion',
};

export default function UsersAdminScreen({
  dataLoading,
  onBack,
  onDeleteUser,
  onLogout,
  onRefresh,
  onSaveUser,
  savingUser,
  users,
}: UsersAdminScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 780;
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<UsuarioFormPayload>(initialForm);

  const pwdStrength = useMemo(() => passwordStrength(form.password ?? ''), [form.password]);

  useEffect(() => {
    if (!editingUserId) {
      setForm(initialForm);
      return;
    }
    const selected = users.find((u) => u.id === editingUserId);
    if (!selected) {
      setForm(initialForm);
      return;
    }
    setForm({
      nombre_completo: selected.nombre_completo,
      password: '',
      rol: selected.rol,
      username: selected.username,
    });
  }, [editingUserId, users]);

  const updateField = (field: keyof UsuarioFormPayload, value: string | UserRole) => {
    setForm((cur) => ({ ...cur, [field]: value }));
  };

  const handleSave = async () => {
    if (form.username.trim().length < 3 || form.nombre_completo.trim().length < 3) {
      Alert.alert('Datos incompletos', 'Completa usuario y nombre antes de guardar.');
      return;
    }
    if (!editingUserId && (!form.password || form.password.trim().length < 6)) {
      Alert.alert('Contraseña inválida', 'Para crear un usuario la contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await onSaveUser(
        {
          nombre_completo: form.nombre_completo.trim(),
          password: form.password?.trim() || undefined,
          rol: form.rol,
          username: form.username.trim(),
        },
        editingUserId
      );
      setEditingUserId(undefined);
      setForm(initialForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el usuario.';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = (userId: string, username: string) => {
    Alert.alert('Eliminar usuario', `Se eliminará la cuenta "${username}". Esta acción no se puede deshacer.`, [
      { style: 'cancel', text: 'Cancelar' },
      {
        style: 'destructive',
        text: 'Eliminar',
        onPress: () => { void onDeleteUser(userId); },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, width > 1200 && styles.contentWide]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={dataLoading} tintColor="#0ea5e9" />}
        style={styles.container}
      >
        <ScreenHeader
          onBack={onBack}
          onLogout={onLogout}
          subtitle="Alta, edición y control de cuentas de acceso al sistema."
          title="Usuarios"
        />

        <View style={[styles.layout, isCompact && styles.layoutCompact]}>
          {/* ── Formulario ── */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              {editingUserId ? '✏️  Editar usuario' : '➕  Crear usuario'}
            </Text>

            <Text style={styles.label}>Usuario</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!savingUser && !editingUserId}
              onChangeText={(v) => updateField('username', v)}
              placeholder="nombre_usuario"
              placeholderTextColor="#4f6d80"
              style={[styles.input, editingUserId ? styles.inputDisabled : undefined]}
              value={form.username}
            />

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              editable={!savingUser}
              onChangeText={(v) => updateField('nombre_completo', v)}
              placeholder="Nombre del usuario"
              placeholderTextColor="#4f6d80"
              style={styles.input}
              value={form.nombre_completo}
            />

            <Text style={styles.label}>
              Contraseña {editingUserId ? '(opcional, dejar vacía para conservar)' : '*'}
            </Text>
            <TextInput
              editable={!savingUser}
              onChangeText={(v) => updateField('password', v)}
              placeholder={editingUserId ? 'Dejar vacía para conservarla' : 'Mínimo 6 caracteres'}
              placeholderTextColor="#4f6d80"
              secureTextEntry
              style={styles.input}
              value={form.password}
            />

            {/* Indicador de fuerza de contraseña */}
            {(form.password?.length ?? 0) > 0 ? (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= pwdStrength ? strengthColor(pwdStrength) : '#1e3a4f' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor(pwdStrength) }]}>
                  {strengthLabel(pwdStrength)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>Rol</Text>
            <View style={styles.roleGrid}>
              {(['admin', 'usuario'] as const).map((rol) => (
                <TouchableOpacity
                  key={rol}
                  onPress={() => updateField('rol', rol)}
                  style={[styles.roleCard, form.rol === rol && styles.roleCardActive]}
                >
                  <Text style={[styles.roleName, form.rol === rol && styles.roleNameActive]}>
                    {rol === 'admin' ? 'Administrador' : rol.charAt(0).toUpperCase() + rol.slice(1)}
                  </Text>
                  <Text style={[styles.roleDesc, form.rol === rol && styles.roleDescActive]}>
                    {ROL_DESCRIPTIONS[rol]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              {editingUserId ? (
                <TouchableOpacity
                  onPress={() => { setEditingUserId(undefined); setForm(initialForm); }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                disabled={savingUser}
                onPress={() => void handleSave()}
                style={[styles.primaryButton, savingUser && styles.primaryButtonDisabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {savingUser ? 'Guardando...' : editingUserId ? 'Actualizar usuario' : 'Crear usuario'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Lista de usuarios ── */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.cardTitle}>Cuentas registradas</Text>
              <View style={styles.userCountBadge}>
                <Text style={styles.userCountText}>{users.length}</Text>
              </View>
            </View>

            {users.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sin usuarios registrados</Text>
                <Text style={styles.emptyText}>Crea el primer usuario usando el formulario.</Text>
              </View>
            ) : (
              users.map((user) => {
                const badge = rolBadgeStyle(user.rol);
                const color = avatarColor(user.username);
                const initials = userInitials(user.nombre_completo || user.username);
                const isEditing = editingUserId === user.id;
                return (
                  <View key={user.id} style={[styles.userCard, isEditing && styles.userCardEditing]}>
                    <View style={styles.userCardInner}>
                      {/* Avatar */}
                      <View style={[styles.avatar, { backgroundColor: color + '33', borderColor: color }]}>
                        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                      </View>

                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{user.nombre_completo}</Text>
                          <View style={[styles.rolBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.rolBadgeText, { color: badge.text }]}>{user.rol}</Text>
                          </View>
                        </View>
                        <Text style={styles.userMeta}>@{user.username}</Text>
                      </View>
                    </View>

                    <View style={styles.userActions}>
                      <TouchableOpacity
                        onPress={() => setEditingUserId(user.id)}
                        style={styles.inlineButton}
                      >
                        <Text style={styles.inlineButtonText}>✏️ Editar</Text>
                      </TouchableOpacity>
                      {user.username !== 'admin' ? (
                        <TouchableOpacity
                          onPress={() => handleDelete(user.id, user.username)}
                          style={styles.inlineDangerButton}
                        >
                          <Text style={styles.inlineDangerText}>🗑️ Eliminar</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { fontSize: 15, fontWeight: '900' },
  cardTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  contentWide: { alignSelf: 'center', maxWidth: 1200, width: '100%' },
  emptyCard: {
    backgroundColor: '#071826',
    borderColor: '#15354a',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: { color: '#90a8bb', fontSize: 13, marginTop: 6 },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  formActions: { gap: 12, marginTop: 8 },
  formCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    padding: 18,
  },
  inlineButton: {
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: { color: '#d3e8f5', fontSize: 12, fontWeight: '700' },
  inlineDangerButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineDangerText: { color: '#fee2e2', fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: '#081a28',
    borderColor: '#16374c',
    borderRadius: 16,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabled: { opacity: 0.5 },
  label: { color: '#a6bfd0', fontSize: 13, fontWeight: '700' },
  layout: { flexDirection: 'row', gap: 16 },
  layoutCompact: { flexDirection: 'column' },
  listCard: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1.1,
    padding: 18,
  },
  listHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    paddingVertical: 15,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#f8fafc', fontWeight: '800' },
  roleCard: {
    backgroundColor: '#081a28',
    borderColor: '#16374c',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  roleCardActive: { backgroundColor: '#0c2e52', borderColor: '#0ea5e9' },
  roleDesc: { color: '#4f6d80', fontSize: 10, marginTop: 4 },
  roleDescActive: { color: '#7dd3fc' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, marginTop: 10 },
  rolBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rolBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  roleName: { color: '#c4d7e5', fontSize: 12, fontWeight: '800' },
  roleNameActive: { color: '#f8fafc' },
  safeArea: { backgroundColor: '#02131f', flex: 1 },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
  },
  secondaryButtonText: { color: '#d3e8f5', fontWeight: '800' },
  strengthBarRow: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthContainer: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 },
  strengthLabel: { fontSize: 11, fontWeight: '800', width: 48 },
  strengthSegment: { borderRadius: 4, flex: 1, height: 6 },
  userActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  userCard: {
    backgroundColor: '#081a28',
    borderColor: '#16374c',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  userCardEditing: { borderColor: '#0ea5e9' },
  userCardInner: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  userCountBadge: {
    backgroundColor: '#0ea5e9',
    borderRadius: 999,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 6,
  },
  userCountText: { color: '#f8fafc', fontSize: 12, fontWeight: '900' },
  userInfo: { flex: 1 },
  userMeta: { color: '#8ba5ba', fontSize: 12, marginTop: 2 },
  userName: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  userNameRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
