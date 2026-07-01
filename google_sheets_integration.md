# Integración de Google Sheets como Base de Datos en la Nube

Esta guía explica detalladamente cómo conectar el CRM con una hoja de cálculo en la nube de Google Sheets de forma gratuita. Esto habilitará la sincronización en tiempo real para que múltiples coordinadores y asesores puedan colaborar de forma coordinada.

---

## 🛠️ Paso 1: Crear la Hoja de Cálculo

1. Entra a [Google Sheets](https://sheets.google.com) e inicia sesión con tu cuenta de Google.
2. Crea una **Hoja de cálculo en blanco**.
3. Ponle el nombre que quieras (ej: `Base de Datos CTD CRM`).

---

## 📝 Paso 2: Configurar Google Apps Script

1. En el menú superior de la hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
2. Borra todo el código que aparezca en el editor por defecto (`Código.gs`).
3. Copia y pega el siguiente código completo:

```javascript
/**
 * Google Apps Script para integración con CTD CRM
 * Desplegar como: Web App (Aplicación Web)
 * Acceso: Cualquier persona (Anyone)
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "load") {
    const state = loadStateFromSheets();
    return ContentService.createTextOutput(JSON.stringify(state))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Acción no reconocida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === "save") {
      saveStateToSheets(postData.state);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- FUNCIONES INTERNAS DE GUARDADO Y CARGA ---

function saveStateToSheets(state) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Guardar cada entidad en su pestaña correspondiente
  writeTableToSheet(ss, "Alumnos", state.alumnos);
  writeTableToSheet(ss, "Cursos", state.cursos);
  writeTableToSheet(ss, "Cohortes", state.cohortes);
  writeTableToSheet(ss, "Tareas", state.tareas);
  writeTableToSheet(ss, "Egresos", state.egresos);
  writeTableToSheet(ss, "Asesores", state.asesores);
  writeTableToSheet(ss, "Dias", state.dias);
  writeTableToSheet(ss, "Horarios", state.horarios);
  
  // Guardar configuración general
  const configSheet = getOrCreateSheet(ss, "Configuracion");
  configSheet.clear();
  configSheet.appendRow(["Clave", "Valor"]);
  configSheet.appendRow(["adminPassword", state.adminPassword || "admin"]);
  configSheet.appendRow(["username", state.username || "Admin CTD"]);
  configSheet.appendRow(["metaRecaudacion", state.metaRecaudacion || 2000]);
  configSheet.appendRow(["metaInscritos", state.metaInscritos || 10]);
  configSheet.appendRow(["academyProfile", JSON.stringify(state.academyProfile || {})]);
  configSheet.appendRow(["whatsappTemplates", JSON.stringify(state.whatsappTemplates || [])]);
  configSheet.appendRow(["activities", JSON.stringify(state.activities || [])]);
}

function loadStateFromSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Pre-populate Cursos if empty
  let cursos = readTableFromSheet(ss, "Cursos");
  if (cursos.length === 0) {
    cursos = [
      { id: "curso-1", nombre: "Diseño Gráfico (Especialidad 7 niveles)", precio: 80, duracion: "12 semanas", desc: "Curso integral de diseño gráfico avanzado estructurado en 7 niveles profesionales." },
      { id: "curso-2", nombre: "Edición de Videos (Capcut)", precio: 55, duracion: "4 semanas", desc: "Edición móvil ágil y profesional para creación de contenido vertical de redes sociales." },
      { id: "curso-3", nombre: "Diseño Web", precio: 75, duracion: "8 semanas", desc: "Creación de interfaces web responsivas, HTML, CSS y fundamentos de UX/UI." },
      { id: "curso-4", nombre: "Marketing Digital 5.0", precio: 70, duracion: "8 semanas", desc: "Estrategias de marketing actualizadas, embudos de venta y uso de herramientas de IA." },
      { id: "curso-5", nombre: "Diseño Kids/Junior", precio: 50, duracion: "6 semanas", desc: "Introducción creativa al diseño y herramientas digitales para niños y jóvenes." },
      { id: "curso-6", nombre: "Diseño Redes Sociales", precio: 60, duracion: "6 semanas", desc: "Creación de contenido visual de alto impacto optimizado para plataformas digitales." },
      { id: "curso-7", nombre: "Excel Básico", precio: 40, duracion: "4 semanas", desc: "Fundamentos de hojas de cálculo, fórmulas esenciales y gestión de tablas de datos." },
      { id: "curso-8", nombre: "Excel Intermedio", precio: 50, duracion: "5 semanas", desc: "Fórmulas avanzadas, bases de datos y creación de dashboards y gráficos." },
      { id: "curso-9", nombre: "Excel Avanzado (Especialidad IA)", precio: 65, duracion: "6 semanas", desc: "Automatización de reportes, macros y análisis predictivo integrado con Inteligencia Artificial." },
      { id: "curso-10", nombre: "Excel Master Pro", precio: 80, duracion: "8 semanas", desc: "Modelado financiero, paneles interactivos avanzados y visualización de datos." },
      { id: "curso-11", nombre: "Microsoft Word", precio: 35, duracion: "4 semanas", desc: "Redacción, diagramación profesional de documentos, plantillas e informes." },
      { id: "curso-12", nombre: "Programación desde cero", precio: 90, duracion: "10 semanas", desc: "Fundamentos de lógica de programación y desarrollo de software con Python y JavaScript." },
      { id: "curso-13", nombre: "Edición de Video I y II", precio: 70, duracion: "8 semanas", desc: "Montaje, efectos visuales y corrección de color en software profesional de escritorio." },
      { id: "curso-14", nombre: "Herramienta Escolar Kids/Junior", precio: 45, duracion: "6 semanas", desc: "Desarrollo de habilidades de ofimática para potenciar el rendimiento escolar." },
      { id: "curso-15", nombre: "Inteligencia Artificial", precio: 85, duracion: "6 semanas", desc: "Generación de contenido, automatización de tareas y optimización de flujos con modelos de IA." }
    ];
    writeTableToSheet(ss, "Cursos", cursos);
  }

  // Pre-populate Dias if empty
  let dias = readTableFromSheet(ss, "Dias");
  if (dias.length === 0) {
    dias = [
      { nombre: "Lunes a Viernes" },
      { nombre: "Lunes a Sábado" },
      { nombre: "Lunes" },
      { nombre: "Martes" },
      { nombre: "Miércoles" },
      { nombre: "Jueves" },
      { nombre: "Viernes" },
      { nombre: "Sábado" }
    ];
    writeTableToSheet(ss, "Dias", dias);
  }

  // Pre-populate Horarios if empty
  let horarios = readTableFromSheet(ss, "Horarios");
  if (horarios.length === 0) {
    horarios = [
      { nombre: "9am - 11am" },
      { nombre: "10am - 12pm" },
      { nombre: "11am - 1pm" },
      { nombre: "2pm - 5pm" },
      { nombre: "2pm - 3:30pm" },
      { nombre: "3:30pm - 5pm" },
      { nombre: "5:15pm - 7:00pm" },
      { nombre: "9am - 12pm" },
      { nombre: "9am - 1pm" },
      { nombre: "a convenir" }
    ];
    writeTableToSheet(ss, "Horarios", horarios);
  }

  const state = {
    alumnos: readTableFromSheet(ss, "Alumnos"),
    cursos: cursos,
    cohortes: readTableFromSheet(ss, "Cohortes"),
    tareas: readTableFromSheet(ss, "Tareas"),
    egresos: readTableFromSheet(ss, "Egresos"),
    asesores: readTableFromSheet(ss, "Asesores"),
    dias: dias,
    horarios: horarios,
    adminPassword: "admin",
    username: "Admin CTD",
    metaRecaudacion: 2000,
    metaInscritos: 10,
    academyProfile: {},
    whatsappTemplates: [],
    activities: []
  };
  
  const configSheet = ss.getSheetByName("Configuracion");
  if (configSheet) {
    const rows = configSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const key = rows[i][0];
      const val = rows[i][1];
      
      if (key === "adminPassword") state.adminPassword = val;
      else if (key === "username") state.username = val;
      else if (key === "metaRecaudacion") state.metaRecaudacion = Number(val);
      else if (key === "metaInscritos") state.metaInscritos = Number(val);
      else if (key === "academyProfile") {
        try { state.academyProfile = JSON.parse(val); } catch(e) {}
      }
      else if (key === "whatsappTemplates") {
        try { state.whatsappTemplates = JSON.parse(val); } catch(e) {}
      }
      else if (key === "activities") {
        try { state.activities = JSON.parse(val); } catch(e) {}
      }
    }
  }
  
  return state;
}

// --- UTILERÍAS ---

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function writeTableToSheet(ss, sheetName, dataList) {
  const sheet = getOrCreateSheet(ss, sheetName);
  sheet.clear();
  
  if (!dataList || dataList.length === 0) {
    sheet.appendRow(["Datos (Vacio)"]);
    return;
  }
  
  // Obtener todas las claves únicas para las columnas de cabecera
  const headers = [];
  dataList.forEach(item => {
    Object.keys(item).forEach(key => {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
  });
  
  sheet.appendRow(headers);
  
  const rows = dataList.map(item => {
    return headers.map(header => {
      const val = item[header];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    });
  });
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function readTableFromSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  if (headers.length === 1 && headers[0] === "Datos (Vacio)") return [];
  
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    headers.forEach((header, colIdx) => {
      const cellVal = row[colIdx];
      if (cellVal === "") {
        obj[header] = "";
      } else if (typeof cellVal === "string" && (cellVal.startsWith("{") || cellVal.startsWith("["))) {
        try {
          obj[header] = JSON.parse(cellVal);
        } catch (e) {
          obj[header] = cellVal;
        }
      } else {
        obj[header] = cellVal;
      }
    });
    list.push(obj);
  }
  
  return list;
}
```

---

## 🚀 Paso 3: Desplegar como Aplicación Web

Para que el CRM pueda conectarse, debes publicar este script:

1. Haz clic en el botón superior derecho **Implementar** (o *Deploy*) y selecciona **Nueva implementación** (*New deployment*).
2. Haz clic en el engranaje de configuración y selecciona **Aplicación web** (*Web app*).
3. Configura los siguientes campos obligatorios:
   * **Descripción**: `CTD CRM API`.
   * **Ejecutar como**: `Yo` (Tu correo de Google).
   * **Quién tiene acceso**: `Cualquier persona` (Ojo: es indispensable que elijas **Anyone** o **Cualquier persona**, de lo contrario el CRM no podrá ingresar).
4. Haz clic en **Implementar**.
5. Google te pedirá autorizar los permisos. Haz clic en **Autorizar acceso**, elige tu cuenta de Google, ve a **Configuración avanzada** (abajo), selecciona **Ir a CTD CRM API (no seguro)** y haz clic en **Permitir**.
6. **Copia la URL de la aplicación web** generada (debe terminar en `/exec`).

---

## 💻 Paso 4: Activar en el CRM

1. Abre el CRM en tu navegador.
2. Ve al panel de **Ajustes** en la barra lateral.
3. Busca la tarjeta **Sincronización en la Nube (Google Sheets)**.
4. Pega la URL del Web App de Google que copiaste en el paso anterior.
5. Haz clic en **Conectar**.
6. Marca la casilla **Activar Sincronización en la Nube**.
7. ¡Listo! El CRM cargará los datos existentes en la hoja (si los hay) y a partir de ese momento, cualquier cambio local se guardará en segundo plano automáticamente.
