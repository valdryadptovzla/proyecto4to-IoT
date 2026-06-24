import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { DashboardDevice, DeviceStatus, DispositivoPayload } from '../types/app';

interface DeviceFormScreenProps {
  dispositivo: DashboardDevice | null;
  isConnected: boolean;
  isSaving: boolean;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onLogout: () => void;
  onSave: (payload: DispositivoPayload) => Promise<void>;
}

const initialState: DispositivoPayload = {
  estado: 'apagado',
  nombre: '',
  tipo: '',
  ubicacion: '',
};

export default function DeviceFormScreen({
  dispositivo,
  isConnected,
  isSaving,
  mode,
  onCancel,
  onLogout,
  onSave,
}: DeviceFormScreenProps) {
  const [form, setForm] = useState<DispositivoPayload>(initialState);

  useEffect(() => {
    if (mode === 'edit' && dispositivo) {
      setForm({
        estado: dispositivo.estado,
        nombre: dispositivo.nombre,
        tipo: dispositivo.tipo,
        ubicacion: dispositivo.ubicacion,
      });
      return;
    }

    setForm(initialState);
  }, [dispositivo, mode]);

  const updateField = (field: keyof DispositivoPayload, value: string | DeviceStatus) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (form.nombre.trim().length < 3 || form.tipo.trim().length < 3 || form.ubicacion.trim().length < 2) {
      Alert.alert('Datos incompletos', 'Revisa nombre, tipo y ubicacion antes de guardar.');
      return;
    }

    try {
      await onSave({
        estado: form.estado,
        nombre: form.nombre.trim(),
        tipo: form.tipo.trim(),
        ubicacion: form.ubicacion.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el dispositivo.';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <ScreenHeader
          onBack={onCancel}
          onLogout={onLogout}
          subtitle={mode === 'create' ? 'Alta de dispositivo monitoreado' : 'Actualiza la información del equipo'}
          title={mode === 'create' ? 'Nuevo dispositivo' : 'Editar dispositivo'}
        />

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Datos principales</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          editable={!isSaving}
          onChangeText={(value) => updateField('nombre', value)}
          placeholder="Ejemplo: Aire sala norte"
          placeholderTextColor="#6b879d"
          style={styles.input}
          value={form.nombre}
        />

        <Text style={styles.label}>Tipo</Text>
        <TextInput
          editable={!isSaving}
          onChangeText={(value) => updateField('tipo', value)}
          placeholder="Iluminacion, climatizacion, seguridad"
          placeholderTextColor="#6b879d"
          style={styles.input}
          value={form.tipo}
        />

          <Text style={styles.label}>Ubicación</Text>
        <TextInput
          editable={!isSaving}
          onChangeText={(value) => updateField('ubicacion', value)}
          placeholder="Piso 2 · Oficina comercial"
          placeholderTextColor="#6b879d"
          style={styles.input}
          value={form.ubicacion}
        />

          <Text style={styles.label}>Estado de monitoreo</Text>
          <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => updateField('estado', 'encendido')}
            style={[styles.toggleButton, form.estado === 'encendido' && styles.toggleButtonActive]}
          >
              <Text style={styles.toggleLabel}>Activo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateField('estado', 'apagado')}
            style={[styles.toggleButton, form.estado === 'apagado' && styles.toggleButtonActive]}
          >
              <Text style={styles.toggleLabel}>Inactivo</Text>
          </TouchableOpacity>
          </View>

          <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{isConnected ? 'Guardado online' : 'Guardado offline'}</Text>
          <Text style={styles.noteText}>
            {isConnected
              ? 'Los cambios se enviarán al backend FastAPI inmediatamente.'
              : 'Los cambios se almacenarán localmente y se sincronizarán cuando vuelva internet.'}
          </Text>
          </View>
        </View>

        <View style={styles.footerActions}>
        <TouchableOpacity onPress={onCancel} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d2232',
    borderColor: '#15354a',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  input: {
    backgroundColor: '#081a28',
    borderColor: '#16374c',
    borderRadius: 16,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    color: '#a6bfd0',
    fontSize: 13,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#081a28',
    borderRadius: 18,
    marginTop: 8,
    padding: 14,
  },
  noteText: {
    color: '#8ba5ba',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  noteTitle: {
    color: '#d8ebf7',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: '#d3e8f5',
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  safeArea: {
    backgroundColor: '#02131f',
    flex: 1,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: '#102b3d',
    borderColor: '#1e4a64',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  toggleButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  toggleLabel: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    marginTop: 8,
  },
});