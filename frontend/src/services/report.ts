import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { AlertaRecord, AuditEvent, DashboardDevice, Usuario } from '../types/app';
import { DEFAULT_COMPANY_INFO, generateReportPDF } from './pdfService';

// ─── Re-export para uso externo ───────────────────────────────────────────────
export { DEFAULT_COMPANY_INFO };

// ─── Helpers HTML para la versión web-print ───────────────────────────────────

function buildRows(devices: DashboardDevice[]): string {
  return devices
    .map(
      (d) => `
        <tr>
          <td>${d.nombre}</td>
          <td>${d.tipo}</td>
          <td>${d.ubicacion}</td>
          <td class="${d.estado === 'encendido' ? 'state-on' : 'state-off'}">${d.estado === 'encendido' ? 'Activo' : 'Inactivo'}</td>
          <td class="num">${d.consumoActual.toFixed(0)} W</td>
          <td class="num ${d.alertasActivas > 0 ? 'warn' : ''}">${d.alertasActivas}</td>
        </tr>`
    )
    .join('');
}

function buildAlertRows(alerts: AlertaRecord[]): string {
  return alerts
    .slice(0, 10)
    .map((a) => {
      const cls =
        a.nivel === 'critica' ? 'level-crit' : a.nivel === 'advertencia' ? 'level-warn' : 'level-info';
      return `
        <tr>
          <td><span class="badge ${cls}">${a.nivel.toUpperCase()}</span></td>
          <td>${a.mensaje}</td>
          <td>${a.fecha ? new Date(a.fecha).toLocaleString() : '—'}</td>
        </tr>`;
    })
    .join('');
}

function buildAuditRows(events: AuditEvent[]): string {
  return events
    .slice(0, 12)
    .map(
      (e) => `
        <tr>
          <td>${e.actor.username}</td>
          <td>${e.accion.replace(/_/g, ' ')}</td>
          <td>${e.descripcion}</td>
          <td>${new Date(e.fecha).toLocaleString()}</td>
        </tr>`
    )
    .join('');
}

/** HTML completo para impresión web (incluye membrete corporativo) */
function buildWebPrintHtml(params: {
  alerts: AlertaRecord[];
  auditTrail: AuditEvent[];
  devices: DashboardDevice[];
  generatedAt: string;
  user: Usuario;
}): string {
  const { alerts, auditTrail, devices, generatedAt, user } = params;
  const co = DEFAULT_COMPANY_INFO;
  const totalConsumo = devices.reduce((s, d) => s + d.consumoActual, 0);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <style>
    @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f2232; background: #fff; }

    .letterhead { display: flex; align-items: center; gap: 14px; padding-bottom: 10px; }
    .lh-icon { width: 72px; height: 72px; background: linear-gradient(135deg,#0ea5e9,#0284c7); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #fff; font-weight: 900; }
    .lh-company { flex: 1; text-align: center; }
    .lh-name { font-size: 17px; font-weight: 900; color: #0a1f30; letter-spacing: 0.3px; }
    .lh-meta { font-size: 10px; color: #445566; margin-top: 2px; }
    .sep { border: none; border-top: 2px solid #0ea5e9; margin: 10px 0 16px; }

    .cover { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg,#0f172a,#0ea5e9); color: #fff; page-break-after: always; }
    .cover-inner { text-align: center; }
    .cover h1 { font-size: 34px; margin: 0 0 8px; }
    .cover h2 { font-size: 20px; margin: 0 0 14px; opacity: 0.92; }
    .cover-meta { font-size: 13px; opacity: 0.88; }

    .report-title { text-align: center; font-size: 17px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; }
    .report-meta { text-align: center; font-size: 10px; color: #506070; margin-bottom: 18px; }

    .kpi-row { display: flex; gap: 8px; margin-bottom: 18px; }
    .kpi-box { flex: 1; background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; text-align: center; }
    .kpi-box.warn { background: #fff7ed; border-color: #fed7aa; }
    .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }

    .section-title { font-size: 13px; font-weight: 800; color: #062236; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #dbeafe; }

    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 4px; }
    th { background: #e8f3fb; color: #334a5c; font-weight: 800; text-align: left; padding: 7px 8px; border-bottom: 2px solid #bfdbfe; }
    td { padding: 6px 8px; border-bottom: 1px solid #e8f0f6; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fbff; }
    .num { text-align: right; }
    .warn { color: #b45309; font-weight: 700; }
    .state-on { color: #15803d; font-weight: 700; }
    .state-off { color: #b91c1c; font-weight: 700; }
    .empty { text-align: center; color: #8fa3b2; font-style: italic; padding: 14px; }

    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; }
    .level-crit { background: #fee2e2; color: #991b1b; }
    .level-warn { background: #fef3c7; color: #92400e; }
    .level-info { background: #dbeafe; color: #1e40af; }

    @media print {
      .page-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #677d8e; border-top: 1px solid #d0e4ef; padding: 4px 0 2px; background: #fff; }
    }
    .page-footer { text-align: center; font-size: 9px; color: #677d8e; border-top: 1px solid #d0e4ef; margin-top: 28px; padding-top: 6px; }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-inner">
      <h1>${co.name}</h1>
      <h2>Reporte Energético y de Auditoría</h2>
      <div class="cover-meta">Generado por ${user.nombre_completo} &nbsp;·&nbsp; ${generatedAt}</div>
    </div>
  </div>

  <!-- Membrete en páginas de contenido -->
  <div class="letterhead">
    <div class="lh-icon">⚡</div>
    <div class="lh-company">
      <div class="lh-name">${co.name}</div>
      ${co.rif ? `<div class="lh-meta">RIF: ${co.rif}</div>` : ''}
      ${co.address ? `<div class="lh-meta">${co.address}</div>` : ''}
      ${co.phone || co.email ? `<div class="lh-meta">${co.phone ?? ''}${co.phone && co.email ? '  |  ' : ''}${co.email ?? ''}</div>` : ''}
    </div>
  </div>
  <hr class="sep"/>

  <div class="report-title">REPORTE ENERGÉTICO Y DE AUDITORÍA</div>
  <div class="report-meta">Fecha: <strong>${generatedAt}</strong> &nbsp;|&nbsp; Generado por: <strong>${user.nombre_completo}</strong> (${user.rol})</div>

  <div class="kpi-row">
    <div class="kpi-box"><div class="kpi-label">Dispositivos</div><div class="kpi-val">${devices.length}</div></div>
    <div class="kpi-box"><div class="kpi-label">Consumo total</div><div class="kpi-val">${totalConsumo.toFixed(0)} W</div></div>
    <div class="kpi-box warn"><div class="kpi-label">Alertas activas</div><div class="kpi-val">${alerts.length}</div></div>
    <div class="kpi-box"><div class="kpi-label">Eventos auditados</div><div class="kpi-val">${auditTrail.length}</div></div>
  </div>

  <h3 class="section-title">Dispositivos monitoreados</h3>
  <table>
    <thead><tr><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Estado</th><th>Consumo</th><th>Alertas</th></tr></thead>
    <tbody>${buildRows(devices) || '<tr><td colspan="6" class="empty">Sin dispositivos.</td></tr>'}</tbody>
  </table>

  <h3 class="section-title">Alertas recientes</h3>
  <table>
    <thead><tr><th>Nivel</th><th>Mensaje</th><th>Fecha</th></tr></thead>
    <tbody>${buildAlertRows(alerts) || '<tr><td colspan="3" class="empty">Sin alertas registradas.</td></tr>'}</tbody>
  </table>

  <h3 class="section-title">Auditoría reciente</h3>
  <table>
    <thead><tr><th>Usuario</th><th>Acción</th><th>Descripción</th><th>Fecha</th></tr></thead>
    <tbody>${buildAuditRows(auditTrail) || '<tr><td colspan="4" class="empty">Sin eventos de auditoría.</td></tr>'}</tbody>
  </table>

  <div class="page-footer">${co.name} · ${co.rif ?? ''} &nbsp;|&nbsp; Reporte generado el ${generatedAt}</div>

</body>
</html>`;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function generateAdminReport(params: {
  alerts: AlertaRecord[];
  auditTrail: AuditEvent[];
  devices: DashboardDevice[];
  user: Usuario;
  logoAssetModule?: any;
}): Promise<string> {
  const generatedAt = new Date().toLocaleString('es-VE');
  const { alerts, auditTrail, devices, user } = params;

  // ── Web: impresión vía iframe ────────────────────────────────────────────
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('No se pudo abrir la impresión en este navegador.');
    }

    const html = buildWebPrintHtml({ alerts, auditTrail, devices, generatedAt, user });

    const iframe = window.document.createElement('iframe');
    Object.assign(iframe.style, {
      height: '0',
      opacity: '0',
      pointerEvents: 'none',
      position: 'fixed',
      width: '0',
      right: '0',
      bottom: '0',
    });

    window.document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = frameWindow?.document;

    if (!frameWindow || !frameDocument) {
      window.document.body.removeChild(iframe);
      throw new Error('No se pudo preparar la vista de impresión.');
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    await new Promise<void>((resolve) => window.setTimeout(resolve, 300));

    frameWindow.focus();
    frameWindow.print();

    window.setTimeout(() => {
      if (window.document.body.contains(iframe)) {
        window.document.body.removeChild(iframe);
      }
    }, 1500);

    return 'web-print';
  }

  // ── Mobile: generar PDF y compartir ─────────────────────────────────────
  const totalConsumo = devices.reduce((s, d) => s + d.consumoActual, 0);
  const consumos = devices.map((d) => d.consumoActual);
  const pico = consumos.length ? Math.max(...consumos) : 0;
  const promedio = consumos.length ? totalConsumo / consumos.length : 0;

  const result = await generateReportPDF(
    {
      title: 'REPORTE ENERGÉTICO Y DE AUDITORÍA',
      generatedAt,
      userName: user.nombre_completo,
      consumoResumen: `${totalConsumo.toFixed(0)} W`,
      consumoPromedio: `${promedio.toFixed(0)} W`,
      consumoPico: `${pico.toFixed(0)} W`,
      totalDispositivos: devices.length,
      totalAlertas: alerts.length,
      totalEventosAuditoria: auditTrail.length,
      rows: devices.map((d) => ({
        equipo: d.nombre,
        tipo: d.tipo,
        ubicacion: d.ubicacion,
        consumo: `${d.consumoActual.toFixed(0)} W`,
        estado: d.estado === 'encendido' ? 'Activo' : 'Inactivo',
        alertas: d.alertasActivas,
        fecha: d.ultimaLectura
          ? new Date(d.ultimaLectura).toLocaleDateString('es-VE')
          : '',
      })),
      alertRows: alerts.slice(0, 10).map((a) => ({
        nivel: a.nivel,
        mensaje: a.mensaje,
        fecha: a.fecha ? new Date(a.fecha).toLocaleString('es-VE') : '—',
      })),
      auditRows: auditTrail.slice(0, 12).map((e) => ({
        actor: `${e.actor.username} (${e.actor.rol})`,
        accion: e.accion.replace(/_/g, ' '),
        descripcion: e.descripcion,
        fecha: new Date(e.fecha).toLocaleString('es-VE'),
      })),
    },
    {
      ...DEFAULT_COMPANY_INFO,
      logoAssetModule: params.logoAssetModule ?? require('../../assets/icon.png'),
    },
    { name: user.nombre_completo },
    { preview: true, fileName: `reporte_admin_${Date.now()}` }
  );

  return result.uri;
}