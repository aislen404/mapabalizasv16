/**
 * Utilidades para exportar datos
 */

/**
 * Exporta balizas a formato JSON
 * @param {Array} balizas - Array de balizas a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportToJSON(balizas, filename = 'balizas') {
  const dataStr = JSON.stringify({ balizas }, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convierte una baliza a formato CSV
 * @param {Object} baliza - Objeto baliza
 * @returns {string} - Línea CSV
 */
function balizaToCSV(baliza) {
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '';
    const string = String(str);
    if (string.includes(',') || string.includes('"') || string.includes('\n')) {
      return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
  };

  return [
    escapeCSV(baliza.id),
    escapeCSV(baliza.lat),
    escapeCSV(baliza.lon),
    escapeCSV(baliza.status),
    escapeCSV(baliza.carretera),
    escapeCSV(baliza.pk),
    escapeCSV(baliza.sentido),
    escapeCSV(baliza.orientacion),
    escapeCSV(baliza.firstSeen),
    escapeCSV(baliza.lastSeen),
    escapeCSV(baliza.comunidad),
    escapeCSV(baliza.provincia),
    escapeCSV(baliza.municipio)
  ].join(',');
}

/**
 * Exporta balizas a formato CSV
 * @param {Array} balizas - Array de balizas a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportToCSV(balizas, filename = 'balizas') {
  const headers = [
    'ID',
    'Latitud',
    'Longitud',
    'Estado',
    'Carretera',
    'PK',
    'Sentido',
    'Orientación',
    'Primera Vez Vista',
    'Última Vez Vista',
    'Comunidad',
    'Provincia',
    'Municipio'
  ];

  const csvRows = [
    headers.join(','),
    ...balizas.map(balizaToCSV)
  ];

  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

