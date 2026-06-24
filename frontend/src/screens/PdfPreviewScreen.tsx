import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, Button, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfPreview'>;

export default function PdfPreviewScreen({ route }: Props) {
  const { uri } = (route.params as { uri?: string }) || {};

  const open = async () => {
    if (!uri) return;
    try {
      await Linking.openURL(uri);
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Previsualización PDF</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.msg}>La previsualización embebida no está disponible en este entorno.</Text>
        {uri ? (
          <View style={styles.actions}>
            <Button title="Abrir PDF (sistema)" onPress={open} />
            <Text style={styles.uriText}>{uri}</Text>
          </View>
        ) : (
          <Text style={styles.msg}>No se proporcionó URI de PDF.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02131f' },
  header: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#0f2a3a' },
  title: { color: '#dff6ff', fontSize: 16, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  msg: { color: '#cfeef8', marginBottom: 12, textAlign: 'center' },
  actions: { width: '100%', alignItems: 'center' },
  uriText: { color: '#9fbaca', marginTop: 8, fontSize: 12 },
});
