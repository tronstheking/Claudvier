// STAGES CONFIGURATION
const stageColors = {
  'Nuevo': '#20264a',
  'Contactado': '#5591c7',
  'Interesado': '#f7ac05',
  'Negociando': '#fdab43',
  'Inscrito': '#6daa45',
  'Perdido': '#d163a7'
};

// COURSE DEFAULTS & PALETTE
const defaultCourses = [
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

const defaultDias = [
  { nombre: "Lunes a Viernes" },
  { nombre: "Lunes a Sábado" },
  { nombre: "Lunes" },
  { nombre: "Martes" },
  { nombre: "Miércoles" },
  { nombre: "Jueves" },
  { nombre: "Viernes" },
  { nombre: "Sábado" }
];

const defaultHorarios = [
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

const courseColors = ['#20264a', '#f7ac05', '#5591c7', '#bb653b', '#8b5cf6', '#4f98a3', '#fdab43', '#e91e63'];

// DEMO DATA SETUP
const defaultStudents = [];
const defaultActivities = [];

// STATE VARIABLES
let alumnos = [];
Object.defineProperty(window, 'alumnosGlobal', {
  get: () => alumnos,
  set: (v) => { alumnos = v; }
});
let cursos = [];
let cohortes = [];
let dias = [];
let horarios = [];
let selectedCohortId = null;
let editingCohort = null;
let activities = [];
let activeView = 'dashboard';
let metaRecaudacion = parseInt(localStorage.getItem('ctd_meta_recaudacion')) || 2000;
let metaInscritos = parseInt(localStorage.getItem('ctd_meta_inscritos')) || 10;
let tareas = [];
let whatsappTemplates = [];
let asesores = JSON.parse(localStorage.getItem('ctd_asesores')) || [];
let adminPassword = localStorage.getItem('ctd_admin_password') || 'admin';

let username = 'Admin CTD';
let userRole = 'admin';
let tasaBCV = parseFloat(localStorage.getItem('ctd_tasa_bcv')) || 36.50;
let calendarCurrentDate = new Date();
let egresos = [];
let reportesActiveTab = 'comercial';

// New Configurable parameters
let academyProfile = JSON.parse(localStorage.getItem('ctd_academy_profile')) || {
  nombre: "ACADEMIA CTD",
  eslogan: "Centro de Tecnología y Diseño",
  direccion: "San Antonio de los Altos, Edo. Miranda",
  telefono: "+58 412-1234567",
  email: "contacto@academiactd.com"
};
let fetchBCVOnStartup = localStorage.getItem('ctd_fetch_bcv_startup') !== 'false';
let backupReminderFrequency = localStorage.getItem('ctd_backup_freq') || 'semanal';
let lastBackupDate = localStorage.getItem('ctd_last_backup_date') || '';

const defaultTemplates = [
  { id: "tmpl-1", nombre: "Información General", texto: "Hola {nombre}, te escribo de Academia CTD. Nos indicaste tu interés en el curso de {curso}. Te comento que la inversión es de {precio} USD y tiene una duración de {duracion}. ¿Te gustaría que te reservemos un cupo?" },
  { id: "tmpl-2", nombre: "Confirmación de Inscripción", texto: "¡Hola {nombre}! 🎉 Hemos recibido y verificado tu inscripción para el curso de {curso}. ¡Te damos la bienvenida a la Academia CTD! Estaremos en contacto pronto para indicarte la fecha de inicio oficial." },
  { id: "tmpl-3", nombre: "Recordatorio de Pago", texto: "Hola {nombre}, espero que estés muy bien. Te escribimos para recordarte que tienes una cuota pendiente del curso {curso} ({precio} USD). Si requieres los datos de pago actualizados, por favor avísanos." }
];

// Filtering & Sorting State
let sortColumn = 'fecha';
let sortDirection = 'desc';
let activeSmartSegment = 'todos';
let pendingDuplicateStudentData = null;
let kanbanColumnLimits = {};
let alumnosCurrentPage = 1;
let alumnosTotalPages = 1;
const alumnosPageSize = 30;
let selectedStudent = null;
let editingStudent = null;
let editingCourse = null;

// IndexedDB parameters
const DB_NAME = 'CTD_CRM_DB';
const DB_VERSION = 1;
const STORE_NAME = 'crm_state';
let db = null;

// Other workflow states
let pendingLostReasonStudentId = null;
let calendarSelectedDateStr = '';
let bulkCohortId = null;
let bulkStudentList = [];
let customFilterViews = JSON.parse(localStorage.getItem('ctd_custom_filter_views')) || {};
let notifiedAlerts = new Set();
