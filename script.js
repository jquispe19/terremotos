/* ==========================================================
   Terremotos del mundo · lógica de la aplicación
   Fuente de datos: USGS Earthquake Catalog (GeoJSON)
   ========================================================== */

const URL_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const LIMITE = 500; // máximo de terremotos que se piden por consulta

/* ----------------------------------------------------------
   1. Referencias al DOM
   ---------------------------------------------------------- */
const formulario = document.getElementById('formulario');
const inputInicio = document.getElementById('inicio');
const inputFin = document.getElementById('fin');
const selectMagnitud = document.getElementById('magnitud');
const aviso = document.getElementById('aviso');
const tbody = document.querySelector('#tabla tbody');

/* ----------------------------------------------------------
   2. Estado de la aplicación
   ---------------------------------------------------------- */
let datosActuales = [];     // terremotos que se están mostrando
let campoOrden = null;      // columna por la que está ordenada la tabla
let ordenDescendente = true;
let temporizadorAviso;
const marcadores = new Map(); // id del terremoto -> marcador de Leaflet

/* ----------------------------------------------------------
   3. Utilidades
   ---------------------------------------------------------- */

// Fecha local en formato AAAA-MM-DD (para los campos <input type="date">)
function formatoLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Suma (o resta) días a una cadena AAAA-MM-DD y devuelve otra cadena AAAA-MM-DD
function sumarDias(cadena, dias) {
  const fecha = new Date(`${cadena}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Color según la magnitud (se usa en marcadores, tabla y gráfico)
function colorMagnitud(mag) {
  if (mag < 4) return '#2ecc71';  // verde
  if (mag < 5) return '#f39c12';  // naranja
  return '#e74c3c';               // rojo
}

// Muestra un mensaje que desaparece a los 5 segundos
function mostrarAviso(texto, esError = false) {
  aviso.textContent = texto;
  aviso.style.color = esError ? '#c0392b' : '#1e8449';
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => {
    aviso.textContent = '';
  }, 5000);
}

/* ----------------------------------------------------------
   4. Fechas por defecto: últimos 30 días
   ---------------------------------------------------------- */
function aplicarRango(dias) {
  const hoy = new Date();
  const inicio = new Date();
  inicio.setDate(hoy.getDate() - dias);
  inputInicio.value = formatoLocal(inicio);
  inputFin.value = formatoLocal(hoy);
}
aplicarRango(30);

/* ----------------------------------------------------------
   5. Mapa (se crea UNA sola vez)
   ---------------------------------------------------------- */
const mapa = L.map('mapa', {
  minZoom: 2,
  maxZoom: 12,
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 1.0
}).setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 12,
  noWrap: true,
  attribution: '&copy; colaboradores de OpenStreetMap'
}).addTo(mapa);

const capaMarcadores = L.layerGroup().addTo(mapa);

/* ----------------------------------------------------------
   6. Google Charts
   ---------------------------------------------------------- */
google.charts.load('current', { packages: ['corechart'] });

/* ----------------------------------------------------------
   7. Petición de datos con fetch
   ---------------------------------------------------------- */
async function obtenerDatos(inicio, fin, magMin) {
  // El USGS interpreta endtime como las 00:00 de ese día, así que se suma
  // un día para que la fecha "Hasta" quede incluida.
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: inicio,
    endtime: sumarDias(fin, 1),
    minmagnitude: magMin,
    orderby: 'time',
    limit: LIMITE
  });

  const respuesta = await fetch(`${URL_API}?${params}`);
  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }
  const json = await respuesta.json();

  return json.features
    .filter(f => f.properties.mag !== null)
    .map(f => ({
      id: f.id,
      fecha: new Date(f.properties.time),
      lugar: f.properties.place || 'Lugar desconocido',
      mag: f.properties.mag,
      url: f.properties.url || '',
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      prof: f.geometry.coordinates[2]
    }));
}

/* ----------------------------------------------------------
   8. Tabla dinámica
   ---------------------------------------------------------- */
function pintarTabla(datos) {
  tbody.innerHTML = '';

  datos.forEach(d => {
    const fila = document.createElement('tr');
    fila.dataset.id = d.id;
    fila.title = 'Ver en el mapa';

    // Fecha
    const tdFecha = document.createElement('td');
    tdFecha.textContent = d.fecha.toLocaleString('es-ES');
    fila.appendChild(tdFecha);

    // Lugar
    const tdLugar = document.createElement('td');
    tdLugar.textContent = d.lugar;
    fila.appendChild(tdLugar);

    // Magnitud (con etiqueta de color)
    const tdMag = document.createElement('td');
    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta-mag';
    etiqueta.style.background = colorMagnitud(d.mag);
    etiqueta.textContent = d.mag.toFixed(1);
    tdMag.appendChild(etiqueta);
    fila.appendChild(tdMag);

    // Profundidad
    const tdProf = document.createElement('td');
    tdProf.textContent = d.prof;
    fila.appendChild(tdProf);

    // Clic en la fila: el mapa vuela hasta ese terremoto
    fila.addEventListener('click', () => irAlMarcador(d.id));

    tbody.appendChild(fila);
  });
}

/* ----------------------------------------------------------
   9. Ordenar la tabla al pulsar una cabecera
   ---------------------------------------------------------- */
function ordenarPor(campo) {
  if (campo === campoOrden) {
    ordenDescendente = !ordenDescendente;   // mismo campo: invierte el orden
  } else {
    campoOrden = campo;
    ordenDescendente = true;                // campo nuevo: de mayor a menor
  }

  datosActuales.sort((a, b) => {
    const diferencia = a[campo] - b[campo]; // vale para números y para Date
    return ordenDescendente ? -diferencia : diferencia;
  });

  pintarTabla(datosActuales);
  marcarCabecera();
}

function marcarCabecera() {
  document.querySelectorAll('#tabla th[data-campo]').forEach(th => {
    th.classList.remove('orden-desc', 'orden-asc');
    if (th.dataset.campo === campoOrden) {
      th.classList.add(ordenDescendente ? 'orden-desc' : 'orden-asc');
    }
  });
}

document.querySelectorAll('#tabla th[data-campo]').forEach(th => {
  th.addEventListener('click', () => ordenarPor(th.dataset.campo));
  th.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      ordenarPor(th.dataset.campo);
    }
  });
});

/* ----------------------------------------------------------
   10. Mapa: marcadores coloreados con popup
   ---------------------------------------------------------- */
function crearIcono(mag) {
  // El tamaño crece con la magnitud, entre 14 y 34 píxeles
  const tamanio = Math.max(14, Math.min(34, Math.round(14 + (mag - 2) * 4)));
  return L.divIcon({
    className: 'marcador-sismo',
    html: `<span style="background:${colorMagnitud(mag)}"></span>`,
    iconSize: [tamanio, tamanio],
    iconAnchor: [tamanio / 2, tamanio / 2],
    popupAnchor: [0, -tamanio / 2]
  });
}

// Contenido del popup, construido con el DOM para no interpretar HTML externo
function crearPopup(d) {
  const contenedor = document.createElement('div');

  const titulo = document.createElement('strong');
  titulo.textContent = d.lugar;
  contenedor.appendChild(titulo);

  const detalle = document.createElement('div');
  detalle.textContent = `Magnitud ${d.mag.toFixed(1)} · Profundidad ${d.prof} km`;
  contenedor.appendChild(detalle);

  const fecha = document.createElement('div');
  fecha.textContent = d.fecha.toLocaleString('es-ES');
  contenedor.appendChild(fecha);

  if (d.url.startsWith('https://')) {
    const enlace = document.createElement('a');
    enlace.href = d.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Ver en el USGS';
    contenedor.appendChild(enlace);
  }

  return contenedor;
}

function pintarMapa(datos) {
  capaMarcadores.clearLayers();
  marcadores.clear();

  datos.forEach(d => {
    const marcador = L.marker([d.lat, d.lon], {
      title: `M${d.mag.toFixed(1)} - ${d.lugar} (${d.fecha.toLocaleDateString('es-ES')})`,
      icon: crearIcono(d.mag)
    });
    marcador.bindPopup(crearPopup(d));
    marcador.addTo(capaMarcadores);
    marcadores.set(d.id, marcador);
  });

  if (datos.length > 0) {
    const limites = L.latLngBounds(datos.map(d => [d.lat, d.lon]));
    mapa.fitBounds(limites, { padding: [30, 30], maxZoom: 6 });
  } else {
    mapa.setView([20, 0], 2);
  }
}

function irAlMarcador(id) {
  const marcador = marcadores.get(id);
  if (!marcador) return;

  document.getElementById('mapa').scrollIntoView({ behavior: 'smooth', block: 'center' });
  mapa.flyTo(marcador.getLatLng(), Math.max(mapa.getZoom(), 6));
  marcador.openPopup();
}

/* ----------------------------------------------------------
   11. Gráfico con Google Charts: terremotos por tramo de magnitud
   ---------------------------------------------------------- */
function pintarGrafico(datos) {
  const contenedor = document.getElementById('grafico');

  // 1) Contar terremotos por tramo de magnitud
  const conteo = {};
  datos.forEach(d => {
    const tramo = Math.floor(d.mag);
    conteo[tramo] = (conteo[tramo] || 0) + 1;
  });

  // 2) Convertir el objeto en filas para Google Charts (con color por tramo)
  const filas = Object.keys(conteo)
    .sort((a, b) => a - b)
    .map(k => [`M ${k}.0 - ${k}.9`, conteo[k], `color: ${colorMagnitud(Number(k))}`]);

  if (filas.length === 0) {
    contenedor.innerHTML = '<p class="ayuda">Sin datos para el gráfico.</p>';
    return;
  }

  // 3) Dibujar cuando la librería esté lista
  google.charts.setOnLoadCallback(() => {
    const tabla = new google.visualization.DataTable();
    tabla.addColumn('string', 'Magnitud');
    tabla.addColumn('number', 'Terremotos');
    tabla.addColumn({ type: 'string', role: 'style' });
    tabla.addRows(filas);

    const opciones = {
      title: 'Terremotos por tramo de magnitud',
      legend: { position: 'none' },
      hAxis: { title: 'Magnitud' },
      vAxis: { title: 'Número de terremotos', minValue: 0 }
    };
    new google.visualization.ColumnChart(contenedor).draw(tabla, opciones);
  });
}

/* ----------------------------------------------------------
   12. Eventos del formulario
   ---------------------------------------------------------- */

// Botones de rango rápido: rellenan las fechas y lanzan la consulta
document.querySelectorAll('button[data-dias]').forEach(boton => {
  boton.addEventListener('click', () => {
    aplicarRango(Number(boton.dataset.dias));
    formulario.requestSubmit();
  });
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const inicio = inputInicio.value;
  const fin = inputFin.value;

  if (inicio > fin) {
    mostrarAviso('La fecha de inicio debe ser anterior a la de fin', true);
    return;
  }

  try {
    const datos = await obtenerDatos(inicio, fin, selectMagnitud.value);

    datosActuales = datos;
    campoOrden = null;
    marcarCabecera();

    pintarTabla(datos);
    pintarMapa(datos);
    pintarGrafico(datos);
    mostrarAviso(`Datos actualizados: ${datos.length} terremotos`);
  } catch (error) {
    console.error(error);
    mostrarAviso('No se han podido obtener los datos', true);
  }
});