export type RootStackParamList = {
  DeviceDetail: { deviceId: string };
  DeviceForm: { deviceId?: string; mode: 'create' | 'edit' };
  Login: undefined;
  MainTabs: undefined;
  PdfPreview: { uri: string };
};

export type MainTabParamList = {
  Alertas: undefined;
  Auditoria: undefined;
  Configuracion: undefined;
  Dashboard: undefined;
  Dispositivos: undefined;
  Usuarios: undefined;
};
