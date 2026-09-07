const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../client/src/locales/en.json');
const esPath = path.join(__dirname, '../client/src/locales/es.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));

enData.feedback = {
  delete_success: "Item deleted successfully",
  delete_failed: "Failed to delete item",
  save_success: "Changes saved successfully",
  save_failed: "Failed to save changes",
  server_error: "Server encountered an unexpected error",
  password_updated: "Password updated successfully",
  upload_failed: "Document upload failed",
  wo_generated: "Work order generated successfully",
  wo_generate_failed: "Failed to generate work order",
  part_consumed_success: "Part consumed and stock auto-deducted",
  part_consumed_failed: "Failed to record part consumption",
  part_removed_success: "Part entry removed and stock refunded",
  part_removed_failed: "Failed to remove consumed part"
};

esData.feedback = {
  delete_success: "Elemento eliminado con éxito",
  delete_failed: "Error al eliminar el elemento",
  save_success: "Cambios guardados con éxito",
  save_failed: "Error al guardar los cambios",
  server_error: "El servidor encontró un error inesperado",
  password_updated: "Contraseña actualizada con éxito",
  upload_failed: "Error al subir el documento",
  wo_generated: "Orden de trabajo generada con éxito",
  wo_generate_failed: "Error al generar la orden de trabajo",
  part_consumed_success: "Repuesto registrado y stock descontado automáticamente",
  part_consumed_failed: "Error al registrar consumo de repuesto",
  part_removed_success: "Registro de repuesto eliminado y stock reintegrado",
  part_removed_failed: "Error al eliminar repuesto consumido"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');

console.log('Successfully added feedback translations!');
