const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../client/src/locales/en.json');
const esPath = path.join(__dirname, '../client/src/locales/es.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Nav
enData.nav.audit_log = "Audit Trail";
enData.nav.scan_qr = "Scan QR";

esData.nav.audit_log = "Historial de Auditoría";
esData.nav.scan_qr = "Escanear QR";

// QR
enData.qr = {
  modal_title: "Equipment QR Asset Tag",
  scanner_title: "Scan Machine Asset QR",
  scanner_hint: "Point camera at any machine QR sticker to open equipment details, manuals, and service logs.",
  manual_lookup_label: "Or Lookup by Asset Tag",
  print_btn: "Print Sticker",
  download_btn: "Download PNG",
  scan_asset_btn: "Scan QR",
  view_qr_btn: "QR Tag"
};

esData.qr = {
  modal_title: "Etiqueta QR de Activo",
  scanner_title: "Escanear QR de Maquinaria",
  scanner_hint: "Apunte la cámara a la etiqueta QR de cualquier máquina para abrir detalles, manuales y registros.",
  manual_lookup_label: "O buscar por Placa de Activo",
  print_btn: "Imprimir Etiqueta",
  download_btn: "Descargar PNG",
  scan_asset_btn: "Escanear QR",
  view_qr_btn: "Etiqueta QR"
};

// Quick Add
enData.quick_add = {
  title: "Rapid Quick-Add Equipment",
  subtitle: "Fast-entry form with instant serial duplicate detection",
  save_and_add_another: "Save & Add Another",
  quick_add_btn: "Quick Add"
};

esData.quick_add = {
  title: "Alta Rápida de Maquinaria",
  subtitle: "Formulario rápido con validación de números de serie duplicados",
  save_and_add_another: "Guardar y Agregar Otra",
  quick_add_btn: "Alta Rápida"
};

// Audit
enData.audit = {
  title: "System Audit Trail & Compliance Log",
  subtitle: "Permanent append-only record of mutations, logins, and maintenance events across all plant assets",
  search_placeholder: "Search username, action, entity, details...",
  all_actions: "All Actions",
  all_entities: "All Entities",
  col_timestamp: "Timestamp",
  col_user: "User",
  col_action: "Action",
  col_entity: "Entity",
  col_details: "Details",
  export_btn: "Export CSV",
  no_records: "No audit log records found matching your filters."
};

esData.audit = {
  title: "Historial de Auditoría y Cumplimiento",
  subtitle: "Registro inmutable de mutaciones, inicios de sesión y eventos de mantenimiento en la planta",
  search_placeholder: "Buscar usuario, acción, entidad, detalles...",
  all_actions: "Todas las Acciones",
  all_entities: "Todas las Entidades",
  col_timestamp: "Fecha y Hora",
  col_user: "Usuario",
  col_action: "Acción",
  col_entity: "Entidad",
  col_details: "Detalles",
  export_btn: "Exportar CSV",
  no_records: "No se encontraron registros de auditoría con los filtros seleccionados."
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');

console.log('Successfully updated en.json and es.json with Phase 6 translations!');
