/**
 * Utilidades para filtrar balizas
 */

/**
 * Filtra balizas según los criterios proporcionados
 * @param {Array} balizas - Array de balizas a filtrar
 * @param {Object} filters - Objeto con los filtros a aplicar
 * @returns {Array} - Array de balizas filtradas
 */
export function filterBalizas(balizas, filters) {
  if (!balizas || !Array.isArray(balizas)) {
    return [];
  }

  return balizas.filter(baliza => {
    // Filtro por provincia
    if (filters.provincia && filters.provincia !== 'todas') {
      if (baliza.provincia !== filters.provincia) {
        return false;
      }
    }

    // Filtro por comunidad autónoma
    if (filters.comunidad && filters.comunidad !== 'todas') {
      if (baliza.comunidad !== filters.comunidad) {
        return false;
      }
    }

    // Filtro por carretera
    if (filters.carretera && filters.carretera.trim() !== '') {
      const carreteraFilter = filters.carretera.toLowerCase();
      if (!baliza.carretera || !baliza.carretera.toLowerCase().includes(carreteraFilter)) {
        return false;
      }
    }

    // Filtro por estado
    if (filters.estado && filters.estado !== 'todas') {
      if (baliza.status !== filters.estado) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Busca balizas por texto
 * @param {Array} balizas - Array de balizas a buscar
 * @param {string} searchText - Texto de búsqueda
 * @returns {Array} - Array de balizas que coinciden
 */
export function searchBalizas(balizas, searchText) {
  if (!searchText || searchText.trim() === '') {
    return balizas;
  }

  const searchLower = searchText.toLowerCase();

  return balizas.filter(baliza => {
    const carretera = (baliza.carretera || '').toLowerCase();
    const municipio = (baliza.municipio || '').toLowerCase();
    const provincia = (baliza.provincia || '').toLowerCase();
    const comunidad = (baliza.comunidad || '').toLowerCase();
    const pk = (baliza.pk || '').toLowerCase();

    return carretera.includes(searchLower) ||
           municipio.includes(searchLower) ||
           provincia.includes(searchLower) ||
           comunidad.includes(searchLower) ||
           pk.includes(searchLower);
  });
}

/**
 * Obtiene lista única de provincias de las balizas
 * @param {Array} balizas - Array de balizas
 * @returns {Array} - Array de provincias únicas ordenadas
 */
export function getProvincias(balizas) {
  if (!balizas || !Array.isArray(balizas)) {
    return [];
  }

  const provincias = new Set();
  balizas.forEach(b => {
    if (b.provincia && b.provincia !== 'N/A') {
      provincias.add(b.provincia);
    }
  });

  return Array.from(provincias).sort();
}

/**
 * Obtiene lista única de comunidades autónomas de las balizas
 * @param {Array} balizas - Array de balizas
 * @returns {Array} - Array de comunidades únicas ordenadas
 */
export function getComunidades(balizas) {
  if (!balizas || !Array.isArray(balizas)) {
    return [];
  }

  const comunidades = new Set();
  balizas.forEach(b => {
    if (b.comunidad && b.comunidad !== 'N/A') {
      comunidades.add(b.comunidad);
    }
  });

  return Array.from(comunidades).sort();
}

/**
 * Obtiene lista única de carreteras de las balizas
 * @param {Array} balizas - Array de balizas
 * @returns {Array} - Array de carreteras únicas ordenadas
 */
export function getCarreteras(balizas) {
  if (!balizas || !Array.isArray(balizas)) {
    return [];
  }

  const carreteras = new Set();
  balizas.forEach(b => {
    if (b.carretera && b.carretera !== 'N/A') {
      carreteras.add(b.carretera);
    }
  });

  return Array.from(carreteras).sort();
}

