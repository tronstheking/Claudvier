// STAGES CONFIGURATION
const stageColors = {
  'Nuevo': '#4f98a3',
  'Contactado': '#5591c7',
  'Interesado': '#e8af34',
  'Negociando': '#fdab43',
  'Inscrito': '#6daa45',
  'Perdido': '#d163a7'
};

// COURSE DEFAULTS & PALETTE
const defaultCourses = [
  { id: "curso-1", nombre: "Diseño Gráfico Profesional", precio: 80, duracion: "10 semanas", desc: "Curso completo de diseño gráfico desglosado en módulos teórico-prácticos." },
  { id: "curso-2", nombre: "Video & CapCut Pro", precio: 60, duracion: "6 semanas", desc: "Edición de video profesional con dispositivos móviles y herramientas avanzadas." },
  { id: "curso-3", nombre: "Fotografía Móvil", precio: 45, duracion: "4 semanas", desc: "Domina la cámara de tu smartphone, composición y revelado digital." },
  { id: "curso-4", nombre: "Marketing Digital", precio: 70, duracion: "8 semanas", desc: "Estrategias de contenido, pauta digital y optimización de redes sociales." }
];

const courseColors = ['#4f98a3', '#5591c7', '#e8af34', '#fdab43', '#6daa45', '#d163a7', '#bb653b', '#8b5cf6'];

// DEMO DATA SETUP
const defaultStudents = [
  { id: "al-1", nombre: "Alejandro", apellido: "Gómez", email: "alejandro@gmail.com", tel: "+584121234567", curso: "curso-1", etapa: "Nuevo", prioridad: "Media", origen: "Instagram", notas: [{ text: "Interesado en el horario nocturno.", date: "2026-06-08T10:00:00.000Z" }], fecha: "2026-06-08T10:00:00.000Z" },
  { id: "al-2", nombre: "María", apellido: "Fernández", email: "maria@hotmail.com", tel: "+584249876543", curso: "curso-2", etapa: "Contactado", prioridad: "Alta", origen: "WhatsApp", notas: [{ text: "Se le envió el plan de estudios y precios por correo.", date: "2026-06-07T14:30:00.000Z" }], fecha: "2026-06-07T14:30:00.000Z" },
  { id: "al-3", nombre: "Carlos", apellido: "Rodríguez", email: "carlos@outlook.com", tel: "+584143332211", curso: "curso-3", etapa: "Interesado", prioridad: "Baja", origen: "Web", notas: [{ text: "Preguntó por facilidades de pago en cuotas.", date: "2026-06-06T09:15:00.000Z" }], fecha: "2026-06-06T09:15:00.000Z" },
  { id: "al-4", nombre: "Gabriela", apellido: "Rivas", email: "gabriela@gmail.com", tel: "+584167778899", curso: "curso-4", etapa: "Negociando", prioridad: "Alta", origen: "Referido", notas: [{ text: "Por confirmar método de pago (Pago Móvil / Zelle).", date: "2026-06-05T16:40:00.000Z" }], fecha: "2026-06-05T16:40:00.000Z" },
  { id: "al-5", nombre: "Daniel", apellido: "Mendoza", email: "daniel@gmail.com", tel: "+584125556677", curso: "curso-1", etapa: "Inscrito", prioridad: "Media", origen: "TikTok", notas: [{ text: "Pago verificado. Agregado al grupo de WhatsApp del curso.", date: "2026-06-04T11:20:00.000Z" }], fecha: "2026-06-04T11:20:00.000Z" },
  { id: "al-6", nombre: "Sofía", apellido: "Martínez", email: "sofia@gmail.com", tel: "+584241112233", curso: "curso-2", etapa: "Perdido", prioridad: "Baja", origen: "Instagram", notas: [{ text: "No cuenta con el tiempo por motivos de trabajo.", date: "2026-06-03T15:10:00.000Z" }], fecha: "2026-06-03T15:10:00.000Z" }
];

const defaultActivities = [
  { id: "act-1", tipo: "nuevo", descripcion: "Se registró al alumno demo Alejandro Gómez.", fecha: "2026-06-08T10:00:00.000Z" },
  { id: "act-2", tipo: "nuevo", descripcion: "Se registró al alumno demo María Fernández.", fecha: "2026-06-07T14:30:00.000Z" },
  { id: "act-3", tipo: "nuevo", descripcion: "Se registró al alumno demo Carlos Rodríguez.", fecha: "2026-06-06T09:15:00.000Z" },
  { id: "act-4", tipo: "nuevo", descripcion: "Se registró al alumno demo Gabriela Rivas.", fecha: "2026-06-05T16:40:00.000Z" },
  { id: "act-5", tipo: "nuevo", descripcion: "Se registró al alumno demo Daniel Mendoza.", fecha: "2026-06-04T11:20:00.000Z" },
  { id: "act-6", tipo: "nuevo", descripcion: "Se registró al alumno demo Sofía Martínez.", fecha: "2026-06-03T15:10:00.000Z" }
];

// STATE VARIABLES
let alumnos = [];
let cursos = [];
let activities = [];
let activeView = 'dashboard';

// Filtering & Sorting State
let sortColumn = 'fecha';
let sortDirection = 'desc';
let selectedStudent = null;
let editingStudent = null;
let editingCourse = null;

// LOCAL STORAGE HANDLERS
function loadState() {
  const storedCursos = localStorage.getItem("ctd_cursos");
  const storedAlumnos = localStorage.getItem("ctd_alumnos");
  const storedActivities = localStorage.getItem("ctd_activities");
  const storedTheme = localStorage.getItem("ctd_theme");

  cursos = storedCursos ? JSON.parse(storedCursos) : [...defaultCourses];
  alumnos = storedAlumnos ? JSON.parse(storedAlumnos) : [...defaultStudents];
  activities = storedActivities ? JSON.parse(storedActivities) : [...defaultActivities];

  if (!storedCursos) localStorage.setItem("ctd_cursos", JSON.stringify(cursos));
  if (!storedAlumnos) localStorage.setItem("ctd_alumnos", JSON.stringify(alumnos));
  if (!storedActivities) localStorage.setItem("ctd_activities", JSON.stringify(activities));

  const activeTheme = storedTheme || 'dark';
  document.documentElement.setAttribute('data-theme', activeTheme);
  updateThemeIcon(activeTheme);
}

function saveState() {
  localStorage.setItem("ctd_alumnos", JSON.stringify(alumnos));
  localStorage.setItem("ctd_cursos", JSON.stringify(cursos));
  localStorage.setItem("ctd_activities", JSON.stringify(activities));
}

// CORE LOGGING & NOTIFICATION
function logActivity(tipo, descripcion) {
  const activity = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tipo,
    descripcion,
    fecha: new Date().toISOString()
  };
  activities.unshift(activity);
  if (activities.length > 100) activities.pop();
  saveState();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'x-circle';
  if (type === 'info') icon = 'info';

  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon ${type}"></i>
    <div class="toast-content">
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === container) container.removeChild(toast);
    }, 300);
  }, 3000);
}

// VIEW ROUTING
function setView(viewName) {
  activeView = viewName;
  
  // Update sidebar active classes
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${viewName}`);
  if (activeLink) activeLink.classList.add('active');

  // Update views display
  const views = ['dashboard', 'alumnos', 'pipeline', 'cursos', 'ajustes'];
  views.forEach(v => {
    const viewEl = document.getElementById(`view-${v}`);
    if (viewEl) viewEl.style.display = (v === viewName) ? 'flex' : 'none';
  });

  // Update header title
  const titles = {
    'dashboard': 'Dashboard de Academia',
    'alumnos': 'Base de Alumnos',
    'pipeline': 'Embudo de Ventas (Pipeline)',
    'cursos': 'Oferta de Cursos',
    'ajustes': 'Configuración General'
  };
  document.getElementById('view-title').innerText = titles[viewName] || 'CRM Admin';

  // Render view-specific content
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'alumnos') {
    populateFilters();
    renderAlumnos();
  }
  if (viewName === 'pipeline') renderPipeline();
  if (viewName === 'cursos') renderCursos();
  if (viewName === 'ajustes') updateNotificationButton();

  // Close mobile drawer on navigation
  document.getElementById('app-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');

  lucide.createIcons();
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// THEME HANDLING
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('ctd_theme', target);
  updateThemeIcon(target);
  showToast(`Tema cambiado a ${target === 'dark' ? 'Oscuro' : 'Claro'}.`, 'info');
  setView(activeView); // Refresh to adapt chart elements
}

function updateThemeIcon(theme) {
  const iconEl = document.getElementById('theme-icon');
  if (iconEl) {
    iconEl.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

// DASHBOARD RENDERING
function renderDashboard() {
  // Calculadora de KPIs
  const total = alumnos.length;
  const inscritos = alumnos.filter(a => a.etapa === 'Inscrito').length;
  const conversion = total > 0 ? ((inscritos / total) * 100).toFixed(0) : 0;
  const alta = alumnos.filter(a => a.prioridad === 'Alta').length;
  const perdidos = alumnos.filter(a => a.etapa === 'Perdido').length;

  document.getElementById('kpi-total-prospectos').innerText = total;
  document.getElementById('kpi-inscritos').innerText = `${inscritos}`;
  document.getElementById('kpi-conversion').innerText = `${conversion}% de conversión`;
  document.getElementById('kpi-alta-prioridad').innerText = alta;
  document.getElementById('kpi-perdidos').innerText = perdidos;
  document.getElementById('kpi-cursos-activos').innerText = cursos.length;

  // HORIZONTAL BAR CHART - ETAPAS
  const barContainer = document.getElementById('pipeline-bar-chart');
  const stagesList = Object.keys(stageColors);
  const stageCounts = stagesList.map(st => alumnos.filter(a => a.etapa === st).length);
  const maxCount = Math.max(...stageCounts, 1);

  barContainer.innerHTML = stagesList.map((stage, idx) => {
    const count = stageCounts[idx];
    const color = stageColors[stage];
    return `
      <div class="bar-item">
        <div class="bar-label-row">
          <span>${stage}</span>
          <span style="font-weight:600; color: ${color}">${count}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" id="bar-${idx}" style="background-color: ${color}; width: 0%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Trigger width transition for rendering animation
  setTimeout(() => {
    stagesList.forEach((_, idx) => {
      const fillEl = document.getElementById(`bar-${idx}`);
      if (fillEl) {
        const pct = (stageCounts[idx] / maxCount) * 100;
        fillEl.style.width = `${pct}%`;
      }
    });
  }, 50);

  // SVG DONUT CHART
  const svg = document.getElementById('donut-svg');
  const legendContainer = document.getElementById('donut-legend-container');
  const centerValue = document.getElementById('donut-center-value');

  centerValue.innerText = total;

  if (total === 0) {
    // Empty state chart
    svg.innerHTML = `<circle class="donut-circle-bg" cx="50" cy="50" r="35"></circle>`;
    legendContainer.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center;">Sin prospectos registrados</p>';
  } else {
    svg.innerHTML = `<circle class="donut-circle-bg" cx="50" cy="50" r="35"></circle>`;
    
    let accumulatedPercent = 0;
    const legendItems = [];
    
    cursos.forEach((curso, idx) => {
      const count = alumnos.filter(a => a.curso === curso.id).length;
      if (count === 0) return;

      const pct = count / total;
      const color = courseColors[idx % courseColors.length];
      const radius = 35;
      const circumference = 2 * Math.PI * radius; // ~219.91
      const strokeDash = pct * circumference;
      const strokeOffset = -accumulatedPercent * circumference;

      svg.innerHTML += `
        <circle class="donut-circle-slice" cx="50" cy="50" r="${radius}"
          stroke="${color}"
          stroke-dasharray="${strokeDash} ${circumference}"
          stroke-dashoffset="${strokeOffset}">
        </circle>
      `;

      legendItems.push(`
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${color}"></span>
          <span class="legend-name" title="${escapeHTML(curso.nombre)}">${escapeHTML(curso.nombre)}</span>
          <span class="legend-count">${count} (${(pct * 100).toFixed(0)}%)</span>
        </div>
      `);

      accumulatedPercent += pct;
    });

    legendContainer.innerHTML = legendItems.join('');
  }

  // RECENT FEED RENDER
  const feedContainer = document.getElementById('activity-feed');
  const feedCount = document.getElementById('activity-count');
  const recent = activities.slice(0, 8);
  
  feedCount.innerText = activities.length;

  if (recent.length === 0) {
    feedContainer.innerHTML = '<p style="padding:16px 0; font-size:13px; color:var(--color-text-muted); text-align:center;">No hay actividad en el sistema.</p>';
  } else {
    const activityIcons = {
      'nuevo': 'user-plus',
      'edicion': 'edit-2',
      'etapa': 'git-commit',
      'nota': 'message-square',
      'eliminacion': 'trash-2',
      'importacion': 'upload-cloud'
    };

    const activityColorClasses = {
      'nuevo': 'primary',
      'edicion': 'warning',
      'etapa': 'success',
      'nota': 'primary',
      'eliminacion': 'danger',
      'importacion': 'warning'
    };

    feedContainer.innerHTML = recent.map(act => {
      const icon = activityIcons[act.tipo] || 'info';
      const colorClass = activityColorClasses[act.tipo] || 'primary';
      const iconColor = colorClass === 'primary' ? 'var(--color-primary)' : 
                        colorClass === 'warning' ? 'var(--color-warning)' :
                        colorClass === 'success' ? 'var(--color-success)' : 'var(--color-error)';
      const iconBg = colorClass === 'primary' ? 'rgba(79, 152, 163, 0.15)' : 
                     colorClass === 'warning' ? 'rgba(253, 171, 67, 0.15)' :
                     colorClass === 'success' ? 'rgba(109, 170, 69, 0.15)' : 'rgba(209, 99, 167, 0.15)';

      return `
        <div class="activity-item">
          <div class="activity-item-icon" style="background: ${iconBg}; color: ${iconColor};">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="activity-item-content">
            <span class="activity-item-desc">${escapeHTML(act.descripcion)}</span>
            <span class="activity-item-time">${timeAgo(act.fecha)}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ALUMNOS TABLE RENDERING
function populateFilters() {
  const select = document.getElementById('filter-curso');
  const currentVal = select.value;
  
  select.innerHTML = '<option value="">Todos los cursos</option>' + 
    cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
  
  if (currentVal && cursos.some(c => c.id === currentVal)) {
    select.value = currentVal;
  }
}

function filterAlumnos() {
  renderAlumnos();
}

function clearFilters() {
  document.getElementById('alumno-search').value = '';
  document.getElementById('filter-etapa').value = '';
  document.getElementById('filter-curso').value = '';
  document.getElementById('filter-prioridad').value = '';
  renderAlumnos();
}

function handleSort(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  renderAlumnos();
}

function getCourseName(courseId) {
  const c = cursos.find(item => item.id === courseId);
  return c ? c.nombre : 'Curso no encontrado';
}

function renderAlumnos() {
  const query = document.getElementById('alumno-search').value.toLowerCase();
  const stageFilter = document.getElementById('filter-etapa').value;
  const courseFilter = document.getElementById('filter-curso').value;
  const priorityFilter = document.getElementById('filter-prioridad').value;

  let filtered = alumnos.filter(al => {
    const fullName = `${al.nombre} ${al.apellido || ''}`.toLowerCase();
    const email = (al.email || '').toLowerCase();
    const tel = (al.tel || '').toLowerCase();
    
    const matchSearch = fullName.includes(query) || email.includes(query) || tel.includes(query);
    const matchStage = !stageFilter || al.etapa === stageFilter;
    const matchCourse = !courseFilter || al.curso === courseFilter;
    const matchPriority = !priorityFilter || al.prioridad === priorityFilter;

    return matchSearch && matchStage && matchCourse && matchPriority;
  });

  // Sort logic
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'nombre') {
      comparison = `${a.nombre} ${a.apellido || ''}`.localeCompare(`${b.nombre} ${b.apellido || ''}`);
    } else if (sortColumn === 'curso') {
      comparison = getCourseName(a.curso).localeCompare(getCourseName(b.curso));
    } else if (sortColumn === 'etapa') {
      const list = ['Nuevo', 'Contactado', 'Interesado', 'Negociando', 'Inscrito', 'Perdido'];
      comparison = list.indexOf(a.etapa) - list.indexOf(b.etapa);
    } else if (sortColumn === 'prioridad') {
      const list = ['Alta', 'Media', 'Baja'];
      comparison = list.indexOf(a.prioridad) - list.indexOf(b.prioridad);
    } else if (sortColumn === 'origen') {
      comparison = (a.origen || '').localeCompare(b.origen || '');
    } else if (sortColumn === 'fecha') {
      comparison = new Date(a.fecha) - new Date(b.fecha);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const tbody = document.getElementById('alumnos-table-body');
  const emptyState = document.getElementById('table-empty-state');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(al => {
      const color = stageColors[al.etapa] || 'var(--color-primary)';
      const initials = calculateInitials(al.nombre, al.apellido);
      const priorityClass = `priority-badge-${al.prioridad.toLowerCase()}`;
      
      let sourceIcon = 'globe';
      if (al.origen === 'Instagram') sourceIcon = 'instagram';
      if (al.origen === 'WhatsApp') sourceIcon = 'message-circle';
      if (al.origen === 'TikTok') sourceIcon = 'video';
      if (al.origen === 'Facebook') sourceIcon = 'facebook';
      if (al.origen === 'Referido') sourceIcon = 'users';
      if (al.origen === 'Presencial') sourceIcon = 'map-pin';

      return `
        <tr onclick="handleRowClick(event, '${al.id}')">
          <td>
            <div class="user-cell">
              <div class="user-avatar-sm" style="background-color: ${color}">${initials}</div>
              <div>
                <span class="user-info-name">${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}</span>
                <span class="user-info-email">${escapeHTML(al.email || 'Sin email')}</span>
              </div>
            </div>
          </td>
          <td>${escapeHTML(getCourseName(al.curso))}</td>
          <td>
            <span class="badge" style="background: ${color}1a; color: ${color}; border: 1px solid ${color}33;">
              ${al.etapa}
            </span>
          </td>
          <td>
            <span class="badge ${priorityClass}">${al.prioridad}</span>
          </td>
          <td>
            <span class="source-badge">
              <i data-lucide="${sourceIcon}"></i>
              ${al.origen || 'Web'}
            </span>
          </td>
          <td>${formatDateShort(al.fecha)}</td>
          <td style="text-align: right;">
            <div class="table-actions">
              <button class="btn btn-ghost btn-icon-sm" onclick="openStudentModal('${al.id}')" title="Editar">
                <i data-lucide="edit-2" style="width:14px; height:14px;"></i>
              </button>
              <button class="btn btn-ghost btn-icon-sm" onclick="deleteStudentDirect('${al.id}')" title="Eliminar" style="color: var(--color-error)">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateSortIndicators();
}

function handleRowClick(event, studentId) {
  if (event.target.closest('button') || event.target.closest('a')) return;
  openDetailPanel(studentId);
}

function updateSortIndicators() {
  const cols = ['nombre', 'curso', 'etapa', 'prioridad', 'origen', 'fecha'];
  cols.forEach(c => {
    const span = document.getElementById(`sort-icon-${c}`);
    if (!span) return;
    if (sortColumn === c) {
      span.innerHTML = sortDirection === 'asc' ? '▲' : '▼';
      span.style.color = 'var(--color-primary)';
    } else {
      span.innerHTML = '';
      span.style.color = 'inherit';
    }
  });
  lucide.createIcons();
}

// PIPELINE (KANBAN BOARD) RENDERING
function renderPipeline() {
  const container = document.getElementById('kanban-board-container');
  const stagesList = Object.keys(stageColors);

  container.innerHTML = stagesList.map(stage => {
    const stageAlumnos = alumnos.filter(a => a.etapa === stage);
    const color = stageColors[stage];

    return `
      <div class="kanban-column" data-stage="${stage}" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondrop="handleDrop(event)">
        <div class="kanban-column-header">
          <div class="column-title-group">
            <span class="column-dot" style="background-color: ${color}"></span>
            <span class="column-title">${stage}</span>
          </div>
          <span class="badge-count">${stageAlumnos.length}</span>
        </div>
        <div class="kanban-column-cards">
          ${stageAlumnos.length === 0 ? `
            <div class="kanban-empty-card">Sin alumnos</div>
          ` : stageAlumnos.map(al => {
            const priorityClass = `priority-badge-${al.prioridad.toLowerCase()}`;
            return `
              <div class="kanban-card" draggable="true" ondragstart="dragStart(event, '${al.id}')" onclick="openDetailPanel('${al.id}')">
                <div class="kanban-card-title">${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}</div>
                <div class="kanban-card-course">
                  <i data-lucide="graduation-cap"></i>
                  <span>${escapeHTML(getCourseName(al.curso))}</span>
                </div>
                <div class="kanban-card-footer">
                  <span class="badge ${priorityClass}">${al.prioridad}</span>
                  <span class="kanban-card-date">${formatDateShort(al.fecha)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// DRAG AND DROP KANBAN
function dragStart(event, studentId) {
  event.dataTransfer.setData('text/plain', studentId);
  event.dataTransfer.effectAllowed = 'move';
}
function allowDrop(event) {
  event.preventDefault();
}
function dragEnter(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}
function dragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}
function handleDrop(event) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('drag-over');

  const studentId = event.dataTransfer.getData('text/plain');
  const newStage = col.getAttribute('data-stage');

  if (studentId && newStage) {
    changeStudentStage(studentId, newStage);
  }
}

// STUDENT DETAIL SLIDE-IN PANEL
function openDetailPanel(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  selectedStudent = student;

  // Meta Header
  document.getElementById('detail-nombre-completo').innerText = `${student.nombre} ${student.apellido || ''}`;
  
  const avatar = document.getElementById('detail-avatar');
  avatar.innerText = calculateInitials(student.nombre, student.apellido);
  avatar.style.backgroundColor = stageColors[student.etapa];

  const stageBadge = document.getElementById('detail-etapa-badge');
  stageBadge.innerText = student.etapa;
  stageBadge.style.backgroundColor = `${stageColors[student.etapa]}1a`;
  stageBadge.style.color = stageColors[student.etapa];
  stageBadge.style.borderColor = `${stageColors[student.etapa]}33`;
  stageBadge.style.borderStyle = 'solid';
  stageBadge.style.borderWidth = '1px';

  // Quick Mark enrolled
  const quickBtn = document.getElementById('btn-quick-inscribe');
  quickBtn.style.display = student.etapa === 'Inscrito' ? 'none' : 'inline-flex';

  // Render Stage Pills
  const pillsContainer = document.getElementById('detail-stage-pills');
  pillsContainer.innerHTML = Object.keys(stageColors).map(stage => {
    const isActive = student.etapa === stage;
    const color = stageColors[stage];
    const style = isActive
      ? `background: ${color}; color: var(--color-bg); border: 1px solid ${color}; font-weight:600;`
      : `background: transparent; color: ${color}; border: 1px solid ${color}80;`;
    
    return `<span class="stage-pill" style="${style}" onclick="changeStudentStage('${student.id}', '${stage}')">${stage}</span>`;
  }).join('');

  // Info Fields
  document.getElementById('detail-email').innerText = student.email || 'Sin correo';
  document.getElementById('detail-tel').innerText = student.tel || 'Sin teléfono';

  const waLink = document.getElementById('detail-wa-link');
  if (student.tel) {
    const cleanNumber = student.tel.replace(/\D/g, '');
    waLink.href = `https://wa.me/${cleanNumber}`;
    waLink.style.display = 'inline-flex';
  } else {
    waLink.style.display = 'none';
  }

  document.getElementById('detail-curso').innerText = getCourseName(student.curso);
  document.getElementById('detail-origen').innerText = student.origen || 'Web';

  const priorityBadge = document.getElementById('detail-prioridad');
  priorityBadge.innerText = student.prioridad;
  priorityBadge.className = `badge priority-badge-${student.prioridad.toLowerCase()}`;

  document.getElementById('detail-fecha').innerText = formatDateFull(student.fecha);

  // Render Notes List
  renderDetailNotes();

  // View animations toggled
  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('detail-panel-overlay').classList.add('active');

  lucide.createIcons();
}

function closeDetailPanel() {
  selectedStudent = null;
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('detail-panel-overlay').classList.remove('active');
}

function copyDetailEmail() {
  if (!selectedStudent || !selectedStudent.email) return;
  navigator.clipboard.writeText(selectedStudent.email).then(() => {
    showToast('Email copiado al portapapeles', 'info');
  }).catch(() => {
    showToast('Fallo al copiar email', 'error');
  });
}

function changeStudentStage(studentId, newStage) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  if (student.etapa === newStage) return;

  const oldStage = student.etapa;
  student.etapa = newStage;

  logActivity('etapa', `Se cambió la etapa de ${student.nombre} ${student.apellido || ''} a "${newStage}".`);
  saveState();

  if (newStage === 'Inscrito') {
    triggerConfetti();
    showToast(`¡Felicitaciones! Alumno inscrito.`, 'success');
    sendLocalNotification(
      "¡Nueva Inscripción! 🎓",
      `${student.nombre} ${student.apellido || ''} se ha inscrito en ${getCourseName(student.curso)}.`
    );
  } else {
    showToast(`Etapa actualizada a ${newStage}.`, 'info');
    sendLocalNotification(
      "Etapa de Prospecto Actualizada",
      `${student.nombre} ${student.apellido || ''} pasó de "${oldStage}" a "${newStage}".`
    );
  }

  // Live updates
  if (selectedStudent && selectedStudent.id === studentId) {
    openDetailPanel(studentId); // Redraw
  }
  
  setView(activeView);
}

function renderDetailNotes() {
  if (!selectedStudent) return;
  
  const countEl = document.getElementById('detail-notes-count');
  const listEl = document.getElementById('detail-notes-list');

  countEl.innerText = selectedStudent.notes ? selectedStudent.notes.length : selectedStudent.notas.length;
  const notes = selectedStudent.notes || selectedStudent.notas || [];

  if (notes.length === 0) {
    listEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">Sin notas registradas</p>';
  } else {
    listEl.innerHTML = notes.map(n => `
      <div class="note-item">
        <div class="note-item-header">
          <span>Admin</span>
          <span>${formatDateFull(n.date)}</span>
        </div>
        <div class="note-item-text">${escapeHTML(n.text)}</div>
      </div>
    `).join('');

    setTimeout(() => {
      listEl.scrollTop = listEl.scrollHeight;
    }, 30);
  }
}

function addSelectedStudentNote(event) {
  event.preventDefault();
  if (!selectedStudent) return;

  const input = document.getElementById('new-note-text');
  const text = input.value.trim();
  if (!text) return;

  const notesArr = selectedStudent.notes || selectedStudent.notas || [];
  notesArr.push({
    text,
    date: new Date().toISOString()
  });
  selectedStudent.notas = notesArr; // Keep naming model sync
  
  logActivity('nota', `Se añadió una nota en el perfil de ${selectedStudent.nombre} ${selectedStudent.apellido || ''}.`);
  saveState();
  
  input.value = '';
  renderDetailNotes();
  showToast('Nota añadida.', 'success');
  setView(activeView);
}

function markSelectedAsEnrolled() {
  if (!selectedStudent) return;
  changeStudentStage(selectedStudent.id, 'Inscrito');
}

function editSelectedStudent() {
  if (!selectedStudent) return;
  openStudentModal(selectedStudent.id);
}

function deleteSelectedStudent() {
  if (!selectedStudent) return;
  const name = `${selectedStudent.nombre} ${selectedStudent.apellido || ''}`;
  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${name}"?`)) {
    alumnos = alumnos.filter(a => a.id !== selectedStudent.id);
    logActivity('eliminacion', `Se eliminó al alumno ${name}.`);
    saveState();
    closeDetailPanel();
    setView(activeView);
    showToast('Alumno eliminado correctamente.', 'success');
  }
}

function deleteStudentDirect(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;
  
  const name = `${student.nombre} ${student.apellido || ''}`;
  if (confirm(`¿Deseas eliminar permanentemente a "${name}"?`)) {
    alumnos = alumnos.filter(a => a.id !== studentId);
    logActivity('eliminacion', `Se eliminó al alumno ${name}.`);
    saveState();

    if (selectedStudent && selectedStudent.id === studentId) {
      closeDetailPanel();
    }

    setView(activeView);
    showToast('Alumno eliminado.', 'success');
  }
}

// STUDENT MODAL INTERACTION
function openStudentModal(studentId = null) {
  const modal = document.getElementById('student-modal');
  const title = document.getElementById('student-modal-title');
  const form = document.getElementById('student-form');
  
  // Populate course options
  const courseSelect = document.getElementById('student-curso');
  courseSelect.innerHTML = cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');

  if (studentId) {
    // Edit mode
    const student = alumnos.find(a => a.id === studentId);
    if (!student) return;

    editingStudent = student;
    title.innerText = 'Editar Datos de Alumno';

    document.getElementById('student-nombre').value = student.nombre;
    document.getElementById('student-apellido').value = student.apellido || '';
    document.getElementById('student-email').value = student.email || '';
    document.getElementById('student-tel').value = student.tel || '';
    document.getElementById('student-curso').value = student.curso;
    document.getElementById('student-etapa').value = student.etapa;
    document.getElementById('student-prioridad').value = student.prioridad;
    document.getElementById('student-origen').value = student.origen || 'Web';

    document.getElementById('note-initial-group').style.display = 'none';
  } else {
    // Create mode
    editingStudent = null;
    title.innerText = 'Nuevo Alumno';
    form.reset();

    document.getElementById('student-etapa').value = 'Nuevo';
    document.getElementById('student-prioridad').value = 'Media';
    document.getElementById('student-origen').value = 'Web';
    
    document.getElementById('note-initial-group').style.display = 'block';
  }

  modal.classList.add('open');
}

function closeStudentModal() {
  document.getElementById('student-modal').classList.remove('open');
  editingStudent = null;
}

function saveStudent(e) {
  e.preventDefault();

  const nombre = document.getElementById('student-nombre').value.trim();
  const apellido = document.getElementById('student-apellido').value.trim();
  const email = document.getElementById('student-email').value.trim();
  const tel = document.getElementById('student-tel').value.trim();
  const curso = document.getElementById('student-curso').value;
  const etapa = document.getElementById('student-etapa').value;
  const prioridad = document.getElementById('student-prioridad').value;
  const origen = document.getElementById('student-origen').value;

  if (!nombre || !curso || !etapa) {
    showToast('Nombre, curso y etapa son requeridos.', 'error');
    return;
  }

  if (editingStudent) {
    // Edit flow
    const target = alumnos.find(a => a.id === editingStudent.id);
    if (target) {
      const oldStage = target.etapa;
      target.nombre = nombre;
      target.apellido = apellido;
      target.email = email;
      target.tel = tel;
      target.curso = curso;
      target.etapa = etapa;
      target.prioridad = prioridad;
      target.origen = origen;

      logActivity('edicion', `Se actualizaron los datos de ${nombre} ${apellido}.`);
      if (oldStage !== etapa) {
        logActivity('etapa', `Se cambió la etapa de ${nombre} ${apellido} a "${etapa}".`);
        if (etapa === 'Inscrito') triggerConfetti();
      }

      showToast('Cambios guardados con éxito.', 'success');
    }
  } else {
    // Create flow
    const notaText = document.getElementById('student-nota').value.trim();
    const notes = [];
    
    if (notaText) {
      notes.push({ text: notaText, date: new Date().toISOString() });
    } else {
      notes.push({ text: 'Registro creado en el CRM.', date: new Date().toISOString() });
    }

    const newStudent = {
      id: `alumno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre,
      apellido,
      email,
      tel,
      curso,
      etapa,
      prioridad,
      origen,
      notas: notes,
      fecha: new Date().toISOString()
    };

    alumnos.unshift(newStudent);
    logActivity('nuevo', `Se registró al prospecto ${nombre} ${apellido}.`);
    if (etapa === 'Inscrito') {
      triggerConfetti();
      sendLocalNotification(
        "¡Nueva Inscripción! 🎓",
        `${nombre} ${apellido || ''} se ha registrado directamente como Inscrito en ${getCourseName(curso)}.`
      );
    } else {
      sendLocalNotification(
        "Nuevo Prospecto Registrado 👤",
        `${nombre} ${apellido || ''} se registró en la etapa "${etapa}" para el curso ${getCourseName(curso)}.`
      );
    }
    
    showToast('Alumno registrado con éxito.', 'success');
  }

  const savedId = editingStudent ? editingStudent.id : null;
  saveState();
  closeStudentModal();
  setView(activeView);

  // If active student detail is open, sync details
  if (selectedStudent && savedId && selectedStudent.id === savedId) {
    openDetailPanel(savedId);
  }
}

function handleModalOverlayClick(event, modalId) {
  if (event.target === document.getElementById(modalId)) {
    if (modalId === 'student-modal') closeStudentModal();
    if (modalId === 'course-modal') closeCourseModal();
  }
}

// COURSES MANAGEMENT
function renderCursos() {
  const container = document.getElementById('courses-grid-container');

  container.innerHTML = cursos.map((c, idx) => {
    const interesados = alumnos.filter(a => a.curso === c.id && ['Nuevo', 'Contactado', 'Interesado', 'Negociando'].includes(a.etapa)).length;
    const inscritos = alumnos.filter(a => a.curso === c.id && a.etapa === 'Inscrito').length;
    const color = courseColors[idx % courseColors.length];
    
    // Disabled deletion if students allocated
    const hasStudents = alumnos.some(a => a.curso === c.id);

    return `
      <div class="course-card">
        <div class="course-card-accent" style="background-color: ${color}"></div>
        <div class="course-card-header">
          <div class="course-icon-wrapper" style="background-color: ${color}1a; color: ${color}">
            <i data-lucide="graduation-cap"></i>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="course-edit-btn" onclick="openCourseModal('${c.id}')" title="Editar Curso">
              <i data-lucide="edit-2" style="width:18px; height:18px;"></i>
            </button>
            <button class="course-delete-btn" onclick="deleteCourse('${c.id}')" ${hasStudents ? 'disabled' : ''} 
              title="${hasStudents ? 'No se puede eliminar con alumnos asignados' : 'Eliminar Curso'}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
        <div class="course-title">${escapeHTML(c.nombre)}</div>
        <div class="course-desc">${escapeHTML(c.desc || 'Sin descripción.')}</div>
        <div class="course-details-row">
          <div class="course-detail-item">
            <i data-lucide="dollar-sign"></i>
            <span>${c.precio} USD</span>
          </div>
          <div class="course-detail-item">
            <i data-lucide="clock"></i>
            <span>${escapeHTML(c.duracion)}</span>
          </div>
        </div>
        <div class="course-stats">
          <div class="stat-group">
            <span class="stat-label">Interesados</span>
            <span class="stat-value">${interesados}</span>
          </div>
          <div class="stat-group">
            <span class="stat-label">Inscritos</span>
            <span class="stat-value success">${inscritos}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function openCourseModal(courseId = null) {
  const modal = document.getElementById('course-modal');
  const title = document.getElementById('course-modal-title');
  const submitBtn = document.getElementById('course-submit-btn');

  if (courseId) {
    const course = cursos.find(c => c.id === courseId);
    if (!course) return;

    editingCourse = course;
    if (title) title.innerText = 'Editar Curso';
    if (submitBtn) submitBtn.innerText = 'Guardar Cambios';

    document.getElementById('course-nombre').value = course.nombre;
    document.getElementById('course-precio').value = course.precio;
    document.getElementById('course-duracion').value = course.duracion;
    document.getElementById('course-desc').value = course.desc || '';
  } else {
    editingCourse = null;
    if (title) title.innerText = 'Agregar Curso';
    if (submitBtn) submitBtn.innerText = 'Crear Curso';
    document.getElementById('course-form').reset();
  }

  modal.classList.add('open');
}

function closeCourseModal() {
  document.getElementById('course-modal').classList.remove('open');
  document.getElementById('course-form').reset();
  editingCourse = null;
}

function saveCourse(e) {
  e.preventDefault();

  const nombre = document.getElementById('course-nombre').value.trim();
  const precio = parseFloat(document.getElementById('course-precio').value);
  const duracion = document.getElementById('course-duracion').value.trim();
  const desc = document.getElementById('course-desc').value.trim();

  if (!nombre || isNaN(precio) || !duracion) {
    showToast('Por favor, llene los campos obligatorios.', 'error');
    return;
  }

  if (editingCourse) {
    // Edit flow
    const target = cursos.find(c => c.id === editingCourse.id);
    if (target) {
      const oldNombre = target.nombre;
      target.nombre = nombre;
      target.precio = precio;
      target.duracion = duracion;
      target.desc = desc;

      logActivity('edicion', `Se modificó el curso "${oldNombre}" a "${nombre}".`);
      showToast(`Curso "${nombre}" actualizado correctamente.`, 'success');
    }
  } else {
    // Create flow
    const newCourse = {
      id: `curso-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre,
      precio,
      duracion,
      desc
    };

    cursos.push(newCourse);
    logActivity('edicion', `Se añadió el curso "${nombre}".`);
    showToast(`Curso "${nombre}" creado exitosamente.`, 'success');
  }

  saveState();
  closeCourseModal();
  setView(activeView);
}

function deleteCourse(courseId) {
  const c = cursos.find(item => item.id === courseId);
  if (!c) return;

  const hasStudents = alumnos.some(a => a.curso === courseId);
  if (hasStudents) {
    showToast('El curso tiene alumnos asignados y no puede borrarse.', 'error');
    return;
  }

  if (confirm(`¿Seguro que deseas eliminar el curso "${c.nombre}"?`)) {
    cursos = cursos.filter(item => item.id !== courseId);
    logActivity('edicion', `Se eliminó el curso "${c.nombre}".`);
    saveState();
    setView(activeView);
    showToast('Curso eliminado correctamente.', 'success');
  }
}

// SETTINGS / AJUSTES: IMPORT & EXPORT CSV
function exportToCSV() {
  const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Curso', 'Etapa', 'Prioridad', 'Origen', 'Fecha Registro'];
  
  const rows = alumnos.map(al => {
    const cName = getCourseName(al.curso);
    return [
      al.nombre,
      al.apellido || '',
      al.email || '',
      al.tel || '',
      cName,
      al.etapa,
      al.prioridad,
      al.origen || 'Web',
      al.fecha
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
  });

  // Excel UTF-8 BOM representation
  const csvStr = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `crm_alumnos_academia_ctd_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Descarga iniciada.', 'success');
}

function handleCSVFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) importFromCSV(files[0]);
}

function importFromCSV(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/);
    
    if (lines.length <= 1) {
      showToast('El archivo CSV está vacío o no es válido.', 'error');
      return;
    }

    const headers = parseCSVLine(lines[0]);
    const findHeaderIdx = (names) => {
      return headers.findIndex(h => names.some(n => h.toLowerCase().trim() === n.toLowerCase()));
    };

    const idxNombre = findHeaderIdx(['nombre', 'name', 'first name']);
    const idxApellido = findHeaderIdx(['apellido', 'last name', 'surname']);
    const idxEmail = findHeaderIdx(['email', 'correo', 'mail']);
    const idxTel = findHeaderIdx(['tel', 'teléfono', 'telefono', 'phone', 'whatsapp']);
    const idxCurso = findHeaderIdx(['curso', 'course']);
    const idxEtapa = findHeaderIdx(['etapa', 'stage', 'status', 'estado']);
    const idxPrioridad = findHeaderIdx(['prioridad', 'priority']);
    const idxOrigen = findHeaderIdx(['origen', 'source', 'medio']);
    const idxFecha = findHeaderIdx(['fecha', 'fecha registro', 'date', 'created_at']);

    let importedCount = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowText = lines[i].trim();
      if (!rowText) continue;

      const values = parseCSVLine(rowText);
      const getVal = (idx, fallback = '') => (idx !== -1 && values[idx]) ? values[idx].trim() : fallback;

      const nombre = getVal(idxNombre);
      if (!nombre) {
        errors++;
        continue;
      }

      const apellido = getVal(idxApellido);
      const email = getVal(idxEmail);
      const tel = getVal(idxTel);
      const cursoStr = getVal(idxCurso);
      const etapaRaw = getVal(idxEtapa, 'Nuevo');
      const prioridadRaw = getVal(idxPrioridad, 'Media');
      const origenRaw = getVal(idxOrigen, 'Web');
      const fechaStr = getVal(idxFecha, new Date().toISOString());

      // Map course. Create if not found
      let cursoId = '';
      if (cursoStr) {
        const matchedC = cursos.find(c => c.nombre.toLowerCase().trim() === cursoStr.toLowerCase().trim());
        if (matchedC) {
          cursoId = matchedC.id;
        } else {
          // Auto-creation of course
          cursoId = `curso-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          cursos.push({
            id: cursoId,
            nombre: cursoStr,
            precio: 0,
            duracion: 'N/A',
            desc: 'Creado automáticamente al importar CSV'
          });
        }
      } else {
        cursoId = cursos.length > 0 ? cursos[0].id : '';
      }

      // Validate Stage
      let etapa = 'Nuevo';
      if (['Nuevo', 'Contactado', 'Interesado', 'Negociando', 'Inscrito', 'Perdido'].includes(etapaRaw)) {
        etapa = etapaRaw;
      }

      // Validate Priority
      let prioridad = 'Media';
      if (['Alta', 'Media', 'Baja'].includes(prioridadRaw)) {
        prioridad = prioridadRaw;
      }

      // Validate Origin
      let origen = 'Web';
      if (['Instagram', 'WhatsApp', 'Referido', 'Web', 'Presencial', 'Facebook', 'TikTok'].includes(origenRaw)) {
        origen = origenRaw;
      }

      // Construct object
      const newStudent = {
        id: `alumno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nombre,
        apellido,
        email,
        tel,
        curso: cursoId,
        etapa,
        prioridad,
        origen,
        notas: [{ text: 'Prospecto importado del archivo CSV.', date: new Date().toISOString() }],
        fecha: fechaStr
      };

      alumnos.push(newStudent);
      importedCount++;
    }

    if (importedCount > 0) {
      logActivity('importacion', `Se importaron ${importedCount} alumnos desde archivo CSV.`);
      saveState();
      setView(activeView);
      showToast(`Importados ${importedCount} alumnos. Errores/Omitidos: ${errors}`, 'success');
      sendLocalNotification(
        "Importación Exitosa 📥",
        `Se importaron exitosamente ${importedCount} prospectos desde el archivo CSV.`
      );
    } else {
      showToast('No se detectaron filas válidas para importar.', 'error');
    }
  };

  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

function clearAllSystemData() {
  if (confirm('¿ATENCIÓN: Estás seguro de que deseas restablecer el CRM?\nEsta acción vaciará por completo la base de datos de alumnos, cursos personalizados e historial, restableciendo la configuración inicial.')) {
    if (confirm('Por favor confirma por segunda vez. Esta acción es destructiva y permanente.')) {
      localStorage.removeItem("ctd_alumnos");
      localStorage.removeItem("ctd_cursos");
      localStorage.removeItem("ctd_activities");
      
      loadState();
      setView('dashboard');
      showToast('CRM restablecido exitosamente.', 'success');
    }
  }
}

// BROWSER NOTIFICATIONS SYSTEM
function updateNotificationButton() {
  const btn = document.getElementById('btn-toggle-notifications');
  const iconWrapper = document.getElementById('notif-icon-wrapper');
  if (!btn) return;

  if (!("Notification" in window)) {
    btn.innerHTML = `<i data-lucide="bell-off"></i> No Soportado`;
    btn.disabled = true;
    btn.className = "btn btn-secondary btn-full";
    return;
  }

  if (Notification.permission === "granted") {
    btn.innerHTML = `<i data-lucide="check-circle"></i> Notificaciones Activas`;
    btn.className = "btn btn-success btn-full";
    btn.disabled = true;
    if (iconWrapper) {
      iconWrapper.className = "ajustes-icon-wrapper success";
    }
  } else if (Notification.permission === "denied") {
    btn.innerHTML = `<i data-lucide="bell-off"></i> Notificaciones Bloqueadas`;
    btn.className = "btn btn-danger btn-full";
    btn.title = "Para activarlas, cambia los permisos del sitio en la configuración del navegador.";
  } else {
    btn.innerHTML = `<i data-lucide="bell"></i> Activar Notificaciones`;
    btn.className = "btn btn-primary btn-full";
  }
  lucide.createIcons();
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("Tu navegador no soporta notificaciones locales.", "error");
    return;
  }

  Notification.requestPermission().then(permission => {
    updateNotificationButton();
    if (permission === "granted") {
      showToast("¡Notificaciones activadas!", "success");
      sendLocalNotification(
        "Notificaciones CTD 🔔",
        "Las notificaciones de escritorio están habilitadas para esta sesión."
      );
    } else if (permission === "denied") {
      showToast("Permiso de notificaciones denegado.", "error");
    }
  });
}

function sendLocalNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: "https://unpkg.com/lucide@latest/icons/bell.svg"
      });
    } catch (e) {
      console.warn("Error enviando notificación nativa:", e);
    }
  }
}

// HELPER FUNCTIONS & FORMATTERS
function calculateInitials(nombre, apellido) {
  let initials = '';
  if (nombre) initials += nombre[0].toUpperCase();
  if (apellido) initials += apellido[0].toUpperCase();
  return initials || 'U';
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatDateFull(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-VE', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 0) return 'Hace un momento';
  if (seconds < 60) return `Hace ${seconds} seg`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  
  return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
}

function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// INSCRIPTION CELEBRATION (CONFETTI ANIMATION)
function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  container.innerHTML = '';
  const colors = ['#4f98a3', '#5591c7', '#e8af34', '#fdab43', '#6daa45', '#d163a7'];
  const limit = 60;

  for (let i = 0; i < limit; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';

    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = Math.random() * 1.5 + 1.2;
    const rotate = Math.random() * 360;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.backgroundColor = color;
    particle.style.transform = `rotate(${rotate}deg)`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;

    const shapeType = Math.floor(Math.random() * 3);
    if (shapeType === 0) {
      particle.style.borderRadius = '50%';
    } else if (shapeType === 1) {
      particle.style.width = '0';
      particle.style.height = '0';
      particle.style.backgroundColor = 'transparent';
      particle.style.borderLeft = `${size / 2}px solid transparent`;
      particle.style.borderRight = `${size / 2}px solid transparent`;
      particle.style.borderBottom = `${size}px solid ${color}`;
    }

    container.appendChild(particle);
  }

  setTimeout(() => {
    container.innerHTML = '';
  }, 3200);
}

// KEYBOARD SHORTCUTS & DROP ZONE REGISTRATION
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openStudentModal();
  }
  if (e.key === 'Escape') {
    closeStudentModal();
    closeCourseModal();
    closeDetailPanel();
  }
});

// INIT SETUP
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setView('dashboard');
  updateNotificationButton();

  // Drag and drop CSV area adjustments
  const dropZone = document.getElementById('csv-drop-zone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) importFromCSV(files[0]);
    }, false);

    dropZone.addEventListener('click', () => {
      document.getElementById('csv-file-input').click();
    });
  }
});
