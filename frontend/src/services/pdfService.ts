import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type ReportRow = {
  equipo: string;
  tipo?: string;
  ubicacion?: string;
  consumo: string; // e.g. '1.5 kWh'
  estado: string; // 'Activo' | 'Inactivo'
  alertas?: number;
  fecha?: string;
};

export type ReportData = {
  title: string;
  generatedAt: string;
  userName: string;
  consumoResumen?: string;
  consumoPromedio?: string;
  consumoPico?: string;
  totalDispositivos?: number;
  totalAlertas?: number;
  totalEventosAuditoria?: number;
  rows: ReportRow[];
  alertRows?: { nivel: string; mensaje: string; dispositivo?: string; fecha?: string }[];
  auditRows?: { actor: string; accion: string; descripcion: string; fecha: string }[];
  conclusions?: string;
};

export type CompanyInfo = {
  name: string;
  rif?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Base64 data-url (data:image/…) */
  logoBase64?: string;
  /** Module ref from require('../assets/logo.png') */
  logoAssetModule?: any;
};

export type GenOptions = {
  /** Abrir el diálogo de compartir/guardar tras generar */
  preview?: boolean;
  /** Nombre del archivo sin extensión */
  fileName?: string;
};

// ─── Información de empresa por defecto ─────────────────────────────────────

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CONSTRUCTORA BAUTISTA C.A.',
  rif: 'J-XXXXXXXX-X',
  address: 'Dirección ejemplo, Ciudad, Venezuela',
  phone: '+58 412 0000000',
  email: 'contacto@constructora.example',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s?: string | number | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function moduleAssetToDataUrl(moduleRef: any): Promise<string | null> {
  try {
    if (!moduleRef) return null;
    const asset = Asset.fromModule(moduleRef);
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'png';
    const mime =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'svg'
        ? 'image/svg+xml'
        : 'image/png';
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    console.warn('[pdfService] moduleAssetToDataUrl failed', err);
    return null;
  }
}

// ─── Construcción del HTML ────────────────────────────────────────────────────

function buildHtml(report: ReportData, company: CompanyInfo): string {
  const logo = company.logoBase64 ?? '';

  // ── Membrete ─────────────────────────────────────────────────────────────
  const letterheadHtml = `
    <div class="letterhead">
      <div class="lh-logo">
        ${logo ? `<img src="${logo}" alt="logo"/>` : '<div class="lh-logo-placeholder">⚡</div>'}
      </div>
      <div class="lh-company">
        <div class="lh-name">${esc(company.name)}</div>
        ${company.rif ? `<div class="lh-meta">RIF: ${esc(company.rif)}</div>` : ''}
        ${company.address ? `<div class="lh-meta">${esc(company.address)}</div>` : ''}
        ${company.phone || company.email
          ? `<div class="lh-meta">${esc(company.phone ?? '')}${company.phone && company.email ? '  |  ' : ''}${esc(company.email ?? '')}</div>`
          : ''}
      </div>
    </div>
    <hr class="sep" />
  `;

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const hasKpis =
    report.consumoResumen ||
    report.totalDispositivos != null ||
    report.totalAlertas != null;

  const kpisHtml = hasKpis
    ? `
    <div class="kpi-row">
      ${report.consumoResumen ? `<div class="kpi-box"><div class="kpi-label">Consumo total</div><div class="kpi-val">${esc(report.consumoResumen)}</div></div>` : ''}
      ${report.consumoPromedio ? `<div class="kpi-box"><div class="kpi-label">Consumo promedio</div><div class="kpi-val">${esc(report.consumoPromedio)}</div></div>` : ''}
      ${report.consumoPico ? `<div class="kpi-box"><div class="kpi-label">Pico máximo</div><div class="kpi-val">${esc(report.consumoPico)}</div></div>` : ''}
      ${report.totalDispositivos != null ? `<div class="kpi-box"><div class="kpi-label">Dispositivos</div><div class="kpi-val">${report.totalDispositivos}</div></div>` : ''}
      ${report.totalAlertas != null ? `<div class="kpi-box kpi-warn"><div class="kpi-label">Alertas activas</div><div class="kpi-val">${report.totalAlertas}</div></div>` : ''}
      ${report.totalEventosAuditoria != null ? `<div class="kpi-box"><div class="kpi-label">Eventos auditados</div><div class="kpi-val">${report.totalEventosAuditoria}</div></div>` : ''}
    </div>`
    : '';

  // ── Tabla de dispositivos ─────────────────────────────────────────────────
  const deviceRowsHtml = report.rows
    .map(
      (r) => `
      <tr>
        <td>${esc(r.equipo)}</td>
        <td>${esc(r.tipo ?? '')}</td>
        <td>${esc(r.ubicacion ?? '')}</td>
        <td class="${r.estado === 'Activo' ? 'state-on' : 'state-off'}">${esc(r.estado)}</td>
        <td class="num">${esc(r.consumo)}</td>
        ${r.alertas != null ? `<td class="num ${r.alertas > 0 ? 'warn' : ''}">${r.alertas}</td>` : '<td>—</td>'}
        <td>${esc(r.fecha ?? '')}</td>
      </tr>`
    )
    .join('');

  // ── Alertas ───────────────────────────────────────────────────────────────
  const alertRowsHtml = report.alertRows?.length
    ? report.alertRows
        .map((a) => {
          const cls =
            a.nivel === 'critica' ? 'level-crit' : a.nivel === 'advertencia' ? 'level-warn' : 'level-info';
          return `
          <tr>
            <td><span class="badge ${cls}">${esc(a.nivel.toUpperCase())}</span></td>
            <td>${esc(a.mensaje)}</td>
            <td>${esc(a.dispositivo ?? '—')}</td>
            <td>${esc(a.fecha ?? '—')}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="4" class="empty">Sin alertas registradas.</td></tr>';

  // ── Auditoría ─────────────────────────────────────────────────────────────
  const auditRowsHtml = report.auditRows?.length
    ? report.auditRows
        .map(
          (e) => `
          <tr>
            <td>${esc(e.actor)}</td>
            <td>${esc(e.accion.replace(/_/g, ' '))}</td>
            <td>${esc(e.descripcion)}</td>
            <td>${esc(e.fecha)}</td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="empty">Sin eventos de auditoría.</td></tr>';

  // ── Conclusiones ──────────────────────────────────────────────────────────
  const conclusionsHtml = report.conclusions
    ? `<h3 class="section-title">Resumen / Conclusiones</h3><p class="conclusions">${esc(report.conclusions)}</p>`
    : '';

  // ── HTML completo ─────────────────────────────────────────────────────────
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    /* ── Page ── */
    @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #0f2232;
      background: #fff;
    }

    /* ── Membrete (fixed en impresión, normal en pantalla) ── */
    .letterhead {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 10px;
    }
    .lh-logo img {
      width: 72px;
      height: auto;
      object-fit: contain;
      border-radius: 6px;
    }
    .lh-logo-placeholder {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg,#0ea5e9,#0284c7);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #fff;
      font-weight: 900;
    }
    .lh-company { flex: 1; text-align: center; }
    .lh-name { font-size: 17px; font-weight: 900; color: #0a1f30; letter-spacing: 0.3px; }
    .lh-meta { font-size: 10px; color: #445566; margin-top: 2px; }
    .sep { border: none; border-top: 2px solid #0ea5e9; margin: 10px 0 16px; }

    /* ── Footer ── */
    @media print {
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9px;
        color: #677d8e;
        border-top: 1px solid #d0e4ef;
        padding: 4px 0 2px;
        background: #fff;
      }
    }
    .page-footer {
      text-align: center;
      font-size: 9px;
      color: #677d8e;
      border-top: 1px solid #d0e4ef;
      margin-top: 28px;
      padding-top: 6px;
    }

    /* ── Cabecera del reporte ── */
    .report-header { text-align: center; margin-bottom: 18px; }
    .report-title {
      font-size: 18px;
      font-weight: 900;
      color: #062236;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta {
      font-size: 10px;
      color: #506070;
      margin-top: 6px;
    }

    /* ── KPIs ── */
    .kpi-row {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .kpi-box {
      flex: 1;
      min-width: 100px;
      background: #f0f7ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
    }
    .kpi-box.kpi-warn { background: #fff7ed; border-color: #fed7aa; }
    .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }

    /* ── Secciones ── */
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #062236;
      margin: 20px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #dbeafe;
    }

    /* ── Tablas ── */
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th {
      background: #e8f3fb;
      color: #334a5c;
      font-weight: 800;
      text-align: left;
      padding: 7px 8px;
      border-bottom: 2px solid #bfdbfe;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e8f0f6;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f8fbff; }
    .num { text-align: right; }
    .warn { color: #b45309; font-weight: 700; }
    .state-on { color: #15803d; font-weight: 700; }
    .state-off { color: #b91c1c; font-weight: 700; }
    .empty { text-align: center; color: #8fa3b2; font-style: italic; padding: 14px; }

    /* ── Badges alertas ── */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .level-crit { background: #fee2e2; color: #991b1b; }
    .level-warn { background: #fef3c7; color: #92400e; }
    .level-info { background: #dbeafe; color: #1e40af; }

    /* ── Conclusiones ── */
    .conclusions {
      background: #f0f9ff;
      border-left: 3px solid #0ea5e9;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      line-height: 1.6;
      margin-top: 8px;
    }
  </style>
</head>
<body>

  ${letterheadHtml}

  <div class="report-header">
    <div class="report-title">${esc(report.title || 'REPORTE DE CONSUMO ENERGÉTICO')}</div>
    <div class="report-meta">
      Fecha de generación: <strong>${esc(report.generatedAt)}</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      Generado por: <strong>${esc(report.userName)}</strong>
    </div>
  </div>

  ${kpisHtml}

  <h3 class="section-title">Detalle de dispositivos monitoreados</h3>
  <table>
    <thead>
      <tr>
        <th>Equipo</th>
        <th>Tipo</th>
        <th>Ubicación</th>
        <th>Estado</th>
        <th>Consumo</th>
        <th>Alertas</th>
        <th>Última lectura</th>
      </tr>
    </thead>
    <tbody>${deviceRowsHtml || '<tr><td colspan="7" class="empty">Sin dispositivos registrados.</td></tr>'}</tbody>
  </table>

  <h3 class="section-title">Alertas recientes</h3>
  <table>
    <thead>
      <tr><th>Nivel</th><th>Mensaje</th><th>Dispositivo</th><th>Fecha</th></tr>
    </thead>
    <tbody>${alertRowsHtml}</tbody>
  </table>

  ${report.auditRows != null ? `
  <h3 class="section-title">Auditoría reciente</h3>
  <table>
    <thead>
      <tr><th>Usuario</th><th>Acción</th><th>Descripción</th><th>Fecha</th></tr>
    </thead>
    <tbody>${auditRowsHtml}</tbody>
  </table>` : ''}

  ${conclusionsHtml}

  <div class="page-footer">
    ${esc(company.name)} · ${esc(company.rif ?? '')} &nbsp;|&nbsp; Reporte generado el ${esc(report.generatedAt)}
  </div>

</body>
</html>`;
}

// ─── Función principal exportada ──────────────────────────────────────────────

/**
 * Genera un PDF con membrete corporativo completo y lo comparte/guarda.
 *
 * @param reportData  Datos del reporte (filas, KPIs, alertas, auditoría, conclusiones).
 * @param companyInfo Información de la empresa (nombre, RIF, dirección, logo).
 * @param userInfo    Info del usuario que genera el reporte (nombre).
 * @param options     Opciones de generación (preview, fileName).
 */
export async function generateReportPDF(
  reportData: ReportData,
  companyInfo: CompanyInfo,
  userInfo?: { id?: string; name?: string },
  options?: GenOptions
): Promise<{ uri: string }> {
  try {
    // Resolver logo
    const info = { ...companyInfo };
    if (!info.logoBase64 && info.logoAssetModule) {
      const dataUrl = await moduleAssetToDataUrl(info.logoAssetModule);
      if (dataUrl) info.logoBase64 = dataUrl;
    }

    const data: ReportData = {
      ...reportData,
      userName: userInfo?.name ?? reportData.userName,
    };

    const html = buildHtml(data, info);
    const { uri } = await Print.printToFileAsync({ html });

    // Copiar a ruta con nombre amigable
    const fileName = options?.fileName ? `${options.fileName}.pdf` : `reporte_${Date.now()}.pdf`;
    const cacheDir: string = (FileSystem as any).cacheDirectory ?? '';
    const destUri = `${cacheDir}${fileName}`;

    let finalUri = uri;

    try {
      await FileSystem.copyAsync({ from: uri, to: destUri });
      finalUri = destUri;
    } catch (copyErr) {
      console.warn('[pdfService] copyAsync failed, using original uri', copyErr);
    }

    if (options?.preview) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(finalUri, {
          dialogTitle: 'Compartir reporte PDF',
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else if (Platform.OS === 'web') {
        // @ts-ignore
        window.open(finalUri, '_blank');
      } else {
        throw new Error('Este dispositivo no tiene disponible la opcion de compartir archivos.');
      }
    }

    return { uri: finalUri };
  } catch (err) {
    console.error('[pdfService] generateReportPDF error', err);
    throw new Error(
      'No se pudo generar el PDF: ' + (err instanceof Error ? err.message : String(err))
    );
  }
}

export default { generateReportPDF };
