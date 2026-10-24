# 🌍 Terremotos del mundo

Aplicación web que consulta los **datos abiertos del USGS** (Servicio Geológico de EE. UU.) y muestra los terremotos registrados en un intervalo de fechas en una **tabla**, en un **mapa** y en un **gráfico**.

Proyecto del módulo **M06 UF4 · Comunicación asíncrona cliente-servidor**.

![Captura de la aplicación](img/captura.png)

> 🔗 **Demo en línea:** `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`
> *(sustituye este enlace cuando actives GitHub Pages; instrucciones más abajo)*

---

## ✨ Funcionalidades

- **Consulta bajo demanda** con `fetch`: los datos se piden cada vez que se pulsa **Obtener datos**.
- **Filtros**: intervalo de fechas y magnitud mínima, más botones de **rango rápido** (24 h, 7 días, 30 días).
- **Aviso de actualización** que desaparece a los 5 segundos.
- **Tabla dinámica** generada con JavaScript:
  - se ordena de mayor a menor (y al revés) al pulsar *Fecha*, *Magnitud* o *Profundidad*;
  - al pulsar una fila, el mapa vuela hasta ese terremoto.
- **Mapa con Leaflet y OpenStreetMap**:
  - un marcador por terremoto, con la opción `title` y un popup con el detalle y el enlace al USGS;
  - color y tamaño según la magnitud (verde, naranja, rojo).
- **Gráfico con Google Charts**: número de terremotos por tramo de magnitud.
- **Diseño responsive**, pensado también para el móvil.

## 🛠️ Tecnologías

| Tecnología | Uso |
| --- | --- |
| HTML5, CSS3, JavaScript (ES6+) | Estructura, estilos y lógica, sin frameworks |
| [Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API) | Peticiones asíncronas |
| [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) | Mapa interactivo |
| [Google Charts](https://developers.google.com/chart) | Gráfico |

## 📡 Fuente de datos

[USGS Earthquake Catalog](https://earthquake.usgs.gov/fdsnws/event/1/): API pública, sin clave, en formato GeoJSON. Ejemplo de consulta:

```text
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-10-01&endtime=2026-10-25&minmagnitude=4
```

**Notas sobre los datos:**

- Cada consulta se limita a los **500 terremotos más recientes** del intervalo.
- Fuera de Estados Unidos, el catálogo es fiable sobre todo a partir de **magnitud 4.5**. Por eso en zonas de baja sismicidad, como España, hay pocos o ningún resultado.

## 🚀 Cómo ejecutarlo en local

No hace falta instalar nada. Clona el repositorio y sirve la carpeta con cualquier servidor estático:

```bash
git clone https://github.com/TU-USUARIO/NOMBRE-DEL-REPOSITORIO.git
cd NOMBRE-DEL-REPOSITORIO
```

Opción 1: en VS Code, instala la extensión **Live Server** y pulsa *Go Live*.

Opción 2: con Python instalado:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

> Conviene evitar abrir `index.html` con doble clic (`file://`), porque algunos navegadores limitan las peticiones y las librerías en ese modo.

## 🌐 Publicarlo con GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En *Build and deployment*, elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
4. Guarda. En uno o dos minutos la web estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

## 📁 Estructura del proyecto

```text
.
├── index.html     # Estructura de la página
├── style.css      # Estilos (variables CSS, tarjetas, responsive)
├── script.js      # Lógica: fetch, tabla, mapa y gráfico
├── img/
│   └── captura.png   # Captura de pantalla para el README
├── LICENSE
└── README.md
```

## 🔮 Posibles mejoras

- Filtrar por país o por zona del mapa.
- Modo oscuro.
- Agrupar marcadores cercanos (*clustering*).
- Añadir otras fuentes de datos, como el catálogo del Instituto Geográfico Nacional para España.

## 📄 Licencia y créditos

Código publicado bajo licencia [MIT](LICENSE).

- Datos: [USGS](https://earthquake.usgs.gov/), dominio público.
- Mapa: © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright).
- Autor: *tu nombre*
