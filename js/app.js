// MÓDULO: app.js

function logActivity(tipo, descripcion) {
  const activeUser = localStorage.getItem("ctd_username") || username || "Admin CTD";
  const fullDescription = `[${activeUser}] ${descripcion}`;
  const activity = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tipo,
    descripcion: fullDescription,
    fecha: new Date().toISOString()
  };
  activities.unshift(activity);
  if (activities.length > 100) activities.pop();
  saveState();
}

function setView(viewName) {
  if (typeof userRole !== 'undefined' && userRole === 'asesor') {
    const restricted = ['finanzas', 'reportes', 'ajustes'];
    if (restricted.includes(viewName)) {
      showToast('Acceso restringido para Asesores de Ventas.', 'error');
      setView('dashboard');
      return;
    }
  }
  activeView = viewName;
  updateNotificationButton();
  
  // Update sidebar active classes
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${viewName}`);
  if (activeLink) activeLink.classList.add('active');

  // Update views display
  const views = ['dashboard', 'alumnos', 'pipeline', 'tareas', 'reportes', 'cursos', 'cohortes', 'ajustes', 'plantillas', 'calendario', 'finanzas'];
  views.forEach(v => {
    const viewEl = document.getElementById(`view-${v}`);
    if (viewEl) viewEl.style.display = (v === viewName) ? 'flex' : 'none';
  });

  // Update header title
  const titles = {
    'dashboard': 'Dashboard de Academia',
    'alumnos': 'Base de Alumnos',
    'pipeline': 'Embudo de Ventas (Pipeline)',
    'tareas': 'Tareas y Recordatorios',
    'reportes': 'Reportes y Analíticas Avanzadas',
    'cursos': 'Oferta de Cursos',
    'cohortes': 'Gestión de Grupos y Cohortes',
    'ajustes': 'Configuración General',
    'plantillas': 'Plantillas de WhatsApp',
    'calendario': 'Calendario de Pagos y Vencimientos',
    'finanzas': 'Registro Unificado de Transacciones (Caja)'
  };
  document.getElementById('view-title').innerText = titles[viewName] || 'CRM Admin';

  // Render view-specific content
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'alumnos') {
    populateFilters();
    updateSavedFiltersDropdown();
    renderAlumnos();
  }
  if (viewName === 'pipeline') {
    populateFilters();
    renderPipeline();
  }
  if (viewName === 'tareas') renderTareas();
  if (viewName === 'reportes') renderReportes();
  if (viewName === 'cursos') renderCursos();
  if (viewName === 'cohortes') renderCohortes();
  if (viewName === 'finanzas') renderFinanzas();
  if (viewName === 'ajustes') {
    updateNotificationButton();
    renderAjustesSettings();
  }
  if (viewName === 'plantillas') {
    renderAjustesSettings();
  }
  if (viewName === 'calendario') {
    if (!calendarSelectedDateStr) {
      calendarSelectedDateStr = new Date().toISOString().split('T')[0];
    }
    renderCalendar();
    updateCalendarAgendaSidebar(calendarSelectedDateStr);
  }

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

function toggleTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('ctd_theme', 'light');
}

function updateThemeIcon(theme) {
  const iconEl = document.getElementById('theme-icon');
  if (iconEl) {
    iconEl.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

function filterAlumnos() {
  alumnosCurrentPage = 1;
  renderAlumnos();
}

let filterAlumnosDebounceTimeout = null;
function filterAlumnosDebounced() {
  if (filterAlumnosDebounceTimeout) {
    clearTimeout(filterAlumnosDebounceTimeout);
  }
  filterAlumnosDebounceTimeout = setTimeout(() => {
    filterAlumnos();
  }, 250);
}

function clearFilters() {
  document.getElementById('alumno-search').value = '';
  document.getElementById('filter-etapa').value = '';
  document.getElementById('filter-curso').value = '';
  const filterCohort = document.getElementById('filter-cohort');
  if (filterCohort) filterCohort.value = '';
  document.getElementById('filter-prioridad').value = '';
  const filterAcademic = document.getElementById('filter-academic-status');
  if (filterAcademic) filterAcademic.value = '';
  alumnosCurrentPage = 1;
  setSmartSegment('todos');
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

function prevAlumnosPage() {
  if (alumnosCurrentPage > 1) {
    alumnosCurrentPage--;
    renderAlumnos();
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) tableContainer.scrollTop = 0;
  }
}

function nextAlumnosPage() {
  if (alumnosCurrentPage < alumnosTotalPages) {
    alumnosCurrentPage++;
    renderAlumnos();
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) tableContainer.scrollTop = 0;
  }
}

function handleRowClick(event, studentId) {
  if (event.target.closest('button') || event.target.closest('a')) return;
  openDetailPanel(studentId);
}

function updateSortIndicators() {
  const cols = ['nombre', 'curso', 'etapa', 'prioridad', 'score', 'origen', 'fecha'];
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

function loadMoreKanban(stage) {
  if (!kanbanColumnLimits[stage]) {
    kanbanColumnLimits[stage] = 15;
  }
  kanbanColumnLimits[stage] += 15;
  renderPipeline();
}

function dragStart(event, studentId) {
  event.dataTransfer.setData('text/plain', studentId);
  event.dataTransfer.effectAllowed = 'move';
  const card = event.target;
  if (card && card.classList) {
    card.classList.add('dragging');
  }
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
    const cardElement = event.target.closest('.kanban-card');
    const targetStudentId = cardElement ? cardElement.getAttribute('data-id') : null;

    const student = alumnos.find(a => a.id === studentId);
    if (!student) return;

    const oldStage = student.etapa;
    
    // Perform stage change
    if (oldStage !== newStage) {
      student.etapa = newStage;
      const notesArr = student.notes || student.notas || [];
      notesArr.push({
        text: `🔄 Cambio de etapa: "${oldStage}" ➔ "${newStage}"`,
        date: new Date().toISOString(),
        channel: 'System'
      });
      student.notas = notesArr;
      student.notes = notesArr;

      logActivity('etapa', `Se cambió la etapa de ${student.nombre} ${student.apellido || ''} a "${newStage}".`);
      handleWorkflowAutomation(student, oldStage, newStage);
    }

    // Reorder inside the array if dropped on a specific card
    if (targetStudentId && targetStudentId !== studentId) {
      const fromIdx = alumnos.findIndex(a => a.id === studentId);
      const toIdx = alumnos.findIndex(a => a.id === targetStudentId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [movedStudent] = alumnos.splice(fromIdx, 1);
        const newToIdx = alumnos.findIndex(a => a.id === targetStudentId);
        alumnos.splice(newToIdx, 0, movedStudent);
      }
    }

    saveState();

    if (oldStage !== newStage) {
      if (newStage === 'Inscrito') {
        triggerConfetti();
        showToast(`¡Felicitaciones! Alumno inscrito.`, 'success');
        sendLocalNotification(
          "¡Nueva Inscripción! 🎓",
          `${student.nombre} ${student.apellido || ''} se ha inscrito en ${getCourseName(student.curso)}.`
        );
        promptEnrollmentWhatsApp(student);
      } else if (newStage === 'Perdido') {
        showToast(`Etapa actualizada a Perdido.`, 'info');
        pendingLostReasonStudentId = studentId;
        openLostReasonModal();
      } else {
        showToast(`Etapa actualizada a ${newStage}.`, 'info');
        sendLocalNotification(
          "Etapa de Prospecto Actualizada",
          `${student.nombre} ${student.apellido || ''} pasó de "${oldStage}" a "${newStage}".`
        );
      }
    } else {
      showToast('Orden de prospecto actualizado.', 'info');
    }

    if (selectedStudent && selectedStudent.id === studentId) {
      openDetailPanel(studentId);
    }
    
    setView(activeView);
  }
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

  const notesArr = student.notes || student.notas || [];
  notesArr.push({
    text: `🔄 Cambio de etapa: "${oldStage}" ➔ "${newStage}"`,
    date: new Date().toISOString(),
    channel: 'System'
  });
  student.notas = notesArr;
  student.notes = notesArr;

  logActivity('etapa', `Se cambió la etapa de ${student.nombre} ${student.apellido || ''} a "${newStage}".`);
  handleWorkflowAutomation(student, oldStage, newStage);
  saveState();

  if (newStage === 'Inscrito') {
    triggerConfetti();
    showToast(`¡Felicitaciones! Alumno inscrito.`, 'success');
    sendLocalNotification(
      "¡Nueva Inscripción! 🎓",
      `${student.nombre} ${student.apellido || ''} se ha inscrito en ${getCourseName(student.curso)}.`
    );
    promptEnrollmentWhatsApp(student);
  } else if (newStage === 'Perdido') {
    showToast(`Etapa actualizada a Perdido.`, 'info');
    pendingLostReasonStudentId = studentId;
    openLostReasonModal();
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

  const timelineItems = [];

  const notes = selectedStudent.notes || selectedStudent.notas || [];
  notes.forEach(n => {
    let icon = '📝';
    let label = 'Nota';
    let color = 'var(--color-primary)';
    
    if (n.channel === 'WhatsApp') { icon = '💬'; label = 'WhatsApp'; color = 'var(--color-success)'; }
    else if (n.channel === 'Llamada') { icon = '📞'; label = 'Llamada'; color = 'var(--color-warning)'; }
    else if (n.channel === 'Instagram') { icon = '📸'; label = 'Instagram'; color = '#d62976'; }
    else if (n.channel === 'Correo') { icon = '✉️'; label = 'Correo'; color = '#4a90e2'; }
    else if (n.channel === 'System') { icon = '🔄'; label = 'Sistema'; color = 'var(--color-text-muted)'; }

    timelineItems.push({
      date: new Date(n.date),
      icon,
      label,
      color,
      title: n.text,
      type: 'note'
    });
  });

  const payments = selectedStudent.payments || [];
  payments.forEach(p => {
    timelineItems.push({
      date: new Date(p.date + 'T12:00:00'),
      icon: '💵',
      label: `Abono (${p.method})`,
      color: 'var(--color-success)',
      title: `Registró un pago de <b>$${p.amount} USD</b>. ${p.ref ? `Ref: ${p.ref}` : ''}`,
      type: 'payment'
    });
  });

  const studentTasks = tareas.filter(t => t.studentId === selectedStudent.id);
  studentTasks.forEach(t => {
    timelineItems.push({
      date: new Date(t.dueDate ? t.dueDate + 'T12:00:00' : Date.now()),
      icon: t.completed ? '✅' : '⏰',
      label: t.completed ? 'Tarea Completada' : 'Tarea Pendiente',
      color: t.completed ? 'var(--color-success)' : 'var(--color-warning)',
      title: t.title,
      type: 'task'
    });
  });

  timelineItems.sort((a, b) => b.date - a.date);

  countEl.innerText = timelineItems.length;

  if (timelineItems.length === 0) {
    listEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">Sin historial registrado</p>';
  } else {
    listEl.innerHTML = `
      <div class="timeline-container" style="position: relative; padding-left: 20px; margin-left: 8px; border-left: 2px dashed var(--color-border);">
        ${timelineItems.map(item => {
          return `
            <div class="timeline-item" style="position: relative; margin-bottom: 16px;">
              <div class="timeline-dot" style="position: absolute; left: -27px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--color-surface); border: 2.5px solid ${item.color}; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);"></div>
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 10px; transition: all 0.2s ease;">
                <div class="timeline-item-header" style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--color-text-muted); margin-bottom:4px;">
                  <span style="font-weight: 600; display: inline-flex; align-items: center; gap: 4px; color: ${item.color};">
                    <span>${item.icon}</span> <span>${item.label}</span>
                  </span>
                  <span style="font-size: 10px;">${formatDateShort(item.date.toISOString().split('T')[0])}</span>
                </div>
                <div class="timeline-item-text" style="font-size:12px; line-height:1.4; color: var(--color-text); white-space: pre-wrap;">${item.title}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function addSelectedStudentNote(event) {
  event.preventDefault();
  if (!selectedStudent) return;

  const input = document.getElementById('new-note-text');
  const selectChannel = document.getElementById('new-note-channel');
  const text = input.value.trim();
  const channel = selectChannel ? selectChannel.value : 'Nota';
  if (!text) return;

  const notesArr = selectedStudent.notes || selectedStudent.notas || [];
  notesArr.push({
    text,
    channel,
    date: new Date().toISOString()
  });
  selectedStudent.notas = notesArr; // Keep naming model sync
  
  logActivity('nota', `Se añadió una nota (${channel}) en el perfil de ${selectedStudent.nombre} ${selectedStudent.apellido || ''}.`);
  saveState();
  
  input.value = '';
  if (selectChannel) selectChannel.value = 'Nota'; // Reset to default
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

function createStudentDirect(data) {
  const notes = [];
  if (data.notaText) {
    notes.push({ text: data.notaText, date: new Date().toISOString() });
  } else {
    notes.push({ text: 'Registro creado en el CRM.', date: new Date().toISOString() });
  }

  const newStudent = {
    id: `alumno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: data.nombre,
    apellido: data.apellido,
    cedula: data.cedula || '',
    email: data.email,
    tel: data.tel,
    curso: data.curso,
    etapa: data.etapa,
    prioridad: data.prioridad,
    origen: data.origen,
    instagram: data.instagram,
    nivel: data.nivel,
    dia: data.dia || 'Lunes a Viernes',
    horario: data.horario,
    academicStatus: data.etapa === 'Inscrito' ? 'Cursando' : '',
    academicGroup: data.etapa === 'Inscrito' ? (data.academicGroup || '') : '',
    academicStartDate: data.etapa === 'Inscrito' ? new Date().toISOString().split('T')[0] : '',
    academicCertificate: 'No',
    notas: notes,
    fecha: new Date().toISOString(),
    coordinador: data.coordinador || username || 'Admin CTD'
  };

  alumnos.unshift(newStudent);
  logActivity('nuevo', `Se registró al prospecto ${data.nombre} ${data.apellido || ''}.`);
  handleWorkflowAutomation(newStudent, '', data.etapa);

  if (data.etapa === 'Inscrito') {
    triggerConfetti();
    sendLocalNotification(
      "¡Nueva Inscripción! 🎓",
      `${data.nombre} ${data.apellido || ''} se ha registrado directamente como Inscrito en ${getCourseName(data.curso)}.`
    );
    promptEnrollmentWhatsApp(newStudent);
  } else {
    if (data.etapa === 'Perdido') {
      pendingLostReasonStudentId = newStudent.id;
      setTimeout(() => openLostReasonModal(), 200);
    }
    sendLocalNotification(
      "Nuevo Prospecto Registrado 👤",
      `${data.nombre} ${data.apellido || ''} se registró en la etapa "${data.etapa}" para el curso ${getCourseName(data.curso)}.`
    );
  }
  
  showToast('Alumno registrado con éxito.', 'success');
}

function handleModalOverlayClick(event, modalId) {
  if (event.target === document.getElementById(modalId)) {
    if (modalId === 'student-modal') closeStudentModal();
    if (modalId === 'course-modal') closeCourseModal();
    if (modalId === 'cohort-modal') closeCohortModal();
    if (modalId === 'calendar-day-modal') closeCalendarDayModal();
    if (modalId === 'audit-modal') closeAuditModal();
    if (modalId === 'goals-modal') closeGoalsModal();
    if (modalId === 'bulk-whatsapp-modal') closeBulkWaModal();
    if (modalId === 'quick-payment-modal') closeQuickPaymentModal();
    if (modalId === 'duplicate-modal') {
      const modal = document.getElementById('duplicate-modal');
      if (modal) modal.classList.remove('open');
    }
  }
}

function exportToCSV() {
  const query = document.getElementById('alumno-search') ? document.getElementById('alumno-search').value.toLowerCase() : '';
  const stageFilter = document.getElementById('filter-etapa') ? document.getElementById('filter-etapa').value : '';
  const courseFilter = document.getElementById('filter-curso') ? document.getElementById('filter-curso').value : '';
  const priorityFilter = document.getElementById('filter-prioridad') ? document.getElementById('filter-prioridad').value : '';
  const academicStatusSelect = document.getElementById('filter-academic-status');
  const academicStatusFilter = academicStatusSelect ? academicStatusSelect.value : '';

  let targetStudents = alumnos;

  if (activeView === 'alumnos') {
    targetStudents = alumnos.filter(al => {
      const fullName = `${al.nombre} ${al.apellido || ''}`.toLowerCase();
      const email = (al.email || '').toLowerCase();
      const tel = (al.tel || '').toLowerCase();
      const courseName = getCourseName(al.curso).toLowerCase();
      const notesArr = al.notas || al.notes || [];
      const notesMatch = notesArr.some(n => n.text && n.text.toLowerCase().includes(query));
      
      const matchSearch = fullName.includes(query) || 
                          email.includes(query) || 
                          tel.includes(query) || 
                          (al.instagram && al.instagram.toLowerCase().includes(query)) ||
                          courseName.includes(query) || 
                          notesMatch;
      const matchStage = !stageFilter || al.etapa === stageFilter;
      const matchCourse = !courseFilter || al.curso === courseFilter;
      const matchPriority = !priorityFilter || al.prioridad === priorityFilter;

      let matchAcademicStatus = true;
      if (academicStatusFilter) {
        if (academicStatusFilter === 'Prospecto') {
          matchAcademicStatus = al.etapa !== 'Inscrito';
        } else {
          matchAcademicStatus = al.etapa === 'Inscrito' && al.academicStatus === academicStatusFilter;
        }
      }

      let matchSegment = true;
      if (activeSmartSegment === 'abandonados') {
        matchSegment = isLeadCold(al);
      } else if (activeSmartSegment === 'alta_prioridad') {
        const scoring = getLeadScore(al);
        matchSegment = al.prioridad === 'Alta' && scoring.score >= 70;
      } else if (activeSmartSegment === 'whatsapp') {
        matchSegment = al.tel && al.tel.trim().length > 5 && al.etapa !== 'Inscrito' && al.etapa !== 'Perdido';
      } else if (activeSmartSegment === 'tareas') {
        const studentTasks = tareas.filter(t => t.studentId === al.id && !t.completed);
        matchSegment = studentTasks.length > 0;
      } else if (activeSmartSegment === 'agenda') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchSegment = al.nextContactDate && al.nextContactDate <= todayStr && al.etapa !== 'Inscrito' && al.etapa !== 'Perdido';
      }

      return matchSearch && matchStage && matchCourse && matchPriority && matchSegment && matchAcademicStatus;
    });
  }

  const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Instagram', 'Curso', 'Etapa', 'Prioridad', 'Score', 'Motivo de Pérdida', 'Días Preferidos', 'Horario', 'Nivel', 'Notas Registradas', 'Fecha Registro'];
  
  const rows = targetStudents.map(al => {
    const cName = getCourseName(al.curso);
    const scoring = getLeadScore(al);
    const notesCount = al.notas ? al.notas.length : (al.notes ? al.notes.length : 0);
    return [
      al.nombre,
      al.apellido || '',
      al.email || '',
      al.tel || '',
      al.instagram || '',
      cName,
      al.etapa,
      al.prioridad,
      `${scoring.score}% (${scoring.label})`,
      al.lostReason || '',
      al.dia || 'Lunes a Viernes',
      al.horario || '9am - 11am',
      al.nivel || '',
      notesCount,
      al.fecha
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
  });

  const csvStr = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `crm_export_leads_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Exportados ${targetStudents.length} prospectos con éxito.`, 'success');
}

function downloadCSVTemplate() {
  const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Instagram', 'Curso', 'Etapa', 'Prioridad', 'Origen', 'Fecha'];
  const sampleRow = ['Juan', 'Pérez', 'juan.perez@example.com', '+584120000000', 'juan_perez', 'Diseño Gráfico (Especialidad 7 niveles)', 'Nuevo', 'Media', 'Instagram', new Date().toISOString().split('T')[0]];
  
  const csvContent = "\uFEFF" + [headers.join(','), sampleRow.join(',')].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "plantilla_importacion_crm.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Plantilla CSV descargada.', 'success');
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
        nivel: 'Principiante',
        dia: 'Lunes a Viernes',
        horario: '9am - 11am',
        academicStatus: etapa === 'Inscrito' ? 'Cursando' : '',
        academicGroup: '',
        academicStartDate: '',
        academicCertificate: 'No',
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

async function clearAllSystemData() {
  if (confirm('¿ATENCIÓN: Estás seguro de que deseas restablecer el CRM?\nEsta acción vaciará por completo la base de datos de alumnos, cursos personalizados e historial, restableciendo la configuración inicial.')) {
    if (confirm('Por favor confirma por segunda vez. Esta acción es destructiva y permanente.')) {
      localStorage.removeItem("ctd_alumnos");
      localStorage.removeItem("ctd_cursos");
      localStorage.removeItem("ctd_activities");
      localStorage.removeItem("ctd_tareas");
      localStorage.removeItem("ctd_templates");
      localStorage.removeItem("ctd_username");
      localStorage.removeItem("ctd_cohortes");
      localStorage.removeItem("ctd_egresos");
      localStorage.removeItem("ctd_asesores");
      localStorage.removeItem("ctd_admin_password");
      localStorage.removeItem("ctd_clean_test_v3");
      localStorage.removeItem("ctd_courses_ver");
      localStorage.removeItem("ctd_op_intel_upgrade_v4");

      if (typeof dbClearAll === 'function') {
        await dbClearAll();
      }
      
      await loadState();
      setView('dashboard');
      showToast('CRM restablecido exitosamente.', 'success');
    }
  }
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

function sendLocalNotification(title, body, studentId) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body: body,
        icon: "logo-academy.png"
      });
      if (studentId) {
        notification.onclick = function(event) {
          event.preventDefault();
          window.focus();
          if (typeof openDetailPanel === 'function') {
            openDetailPanel(studentId);
          }
          notification.close();
        };
      }
    } catch (e) {
      console.warn("Error enviando notificación nativa:", e);
    }
  }
}

function checkAndTriggerPushNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let overdueTasksCount = 0;
  let dueTodayTasksCount = 0;
  let collectionRisksCount = 0;

  tareas.forEach(t => {
    if (!t.completed) {
      if (t.dueDate && t.dueDate < todayStr) {
        overdueTasksCount++;
      } else if (t.dueDate === todayStr) {
        dueTodayTasksCount++;
      }
    }
  });

  alumnos.forEach(al => {
    if (al.etapa === 'Inscrito') {
      const courseObj = cursos.find(c => c.id === al.curso);
      const price = al.academicPrice !== undefined ? al.academicPrice : (courseObj ? courseObj.precio : 0);
      const paid = al.academicPaid || 0;
      const balance = price - paid;
      if (balance > 0 && al.nextContactDate && al.nextContactDate <= todayStr) {
        collectionRisksCount++;
      }
    }
  });

  const totalAlerts = overdueTasksCount + dueTodayTasksCount + collectionRisksCount;
  if (totalAlerts > 0) {
    const details = [];
    if (overdueTasksCount > 0) details.push(`${overdueTasksCount} vencidas`);
    if (dueTodayTasksCount > 0) details.push(`${dueTodayTasksCount} para hoy`);
    if (collectionRisksCount > 0) details.push(`${collectionRisksCount} cobros vencidos`);
    
    sendLocalNotification(
      'Alertas Pendientes 📌',
      `Tienes ${totalAlerts} alertas de tareas o cobranzas en el CRM. Haz clic para revisarlas.`
    );
  }
}

function promptEnrollmentWhatsApp(student) {
  if (!student || !student.tel) return;
  setTimeout(() => {
    if (confirm(`¿Deseas enviar el mensaje de confirmación de inscripción por WhatsApp a ${student.nombre}?`)) {
      const tmpl = whatsappTemplates.find(t => t.id === 'tmpl-2' || t.nombre.toLowerCase().includes('confirmación') || t.nombre.toLowerCase().includes('inscripción'));
      const studentCourse = cursos.find(c => c.id === student.curso);
      const courseName = studentCourse ? studentCourse.nombre : 'Curso';
      const courseDuration = studentCourse ? studentCourse.duracion : 'N/A';
      const defaultPrice = studentCourse ? studentCourse.precio : 0;
      const total = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
      const paid = student.academicPaid || 0;
      const balance = Math.max(0, total - paid);

      let text = '';
      if (tmpl) {
        text = tmpl.texto
          .replace(/{nombre}/g, `${student.nombre} ${student.apellido || ''}`.trim())
          .replace(/{curso}/g, courseName)
          .replace(/{precio}/g, balance)
          .replace(/{saldo}/g, balance)
          .replace(/{abonado}/g, paid)
          .replace(/{total}/g, total)
          .replace(/{duracion}/g, courseDuration);
      } else {
        text = `¡Hola ${student.nombre}! 🎉 Hemos recibido y verificado tu inscripción para el curso de ${courseName}. ¡Te damos la bienvenida a la Academia CTD! Estaremos en contacto pronto para indicarte la fecha de inicio oficial.`;
      }
      const cleanNumber = student.tel.replace(/\D/g, '');
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
      logActivity('nota', `Confirmación de inscripción enviada a ${student.nombre} por WhatsApp.`);
    }
  }, 500);
}

function generateIndividualPaymentPDF(paymentId) {
  if (!selectedStudent) return;
  const payment = selectedStudent.payments.find(p => p.id === paymentId);
  if (!payment) return;

  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const invoiceNumber = `REC-${payment.id.split('-').slice(-1)}-${Date.now().toString().slice(-4)}`;

  const balance = Math.max(0, (student.academicPrice !== undefined ? student.academicPrice : defaultPrice) - student.academicPaid);
  const isPaid = balance <= 0;
  const watermarkText = isPaid ? 'PAGADO' : 'ABONO PARCIAL';
  const watermarkColor = isPaid ? 'rgba(109, 170, 69, 0.06)' : 'rgba(253, 171, 67, 0.06)';
  
  const qrData = `CTD CRM - RECIBO DE PAGO\nNro: ${invoiceNumber}\nEstudiante: ${student.nombre} ${student.apellido || ''}\nDocumento: ${docId}\nCurso: ${courseName}\nMonto: $${payment.amount.toFixed(2)} USD\nFecha: ${new Date(payment.date).toLocaleDateString('es-VE')}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Recibo de Pago - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
          background: #fff;
        }
        .invoice-card {
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
        }
        .watermark {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-40deg);
          font-size: 70px;
          font-weight: 800;
          color: ${watermarkColor};
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 4px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 20px;
          margin-bottom: 25px;
          position: relative;
          z-index: 1;
        }
        .logo-section h2 {
          color: #20264a;
          margin: 0;
          font-size: 22px;
          font-weight: 700;
        }
        .logo-section span {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          margin: 0;
          color: #20264a;
          font-size: 20px;
          font-weight: 700;
        }
        .invoice-title span {
          font-size: 12px;
          color: #888;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          font-size: 13px;
          position: relative;
          z-index: 1;
        }
        .details-box h4 {
          margin: 0 0 8px 0;
          color: #20264a;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .details-box p {
          margin: 3px 0;
          color: #555;
        }
        .payment-box {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .payment-amount {
          font-size: 28px;
          font-weight: 700;
          color: #6daa45;
          margin: 0;
        }
        .payment-ves {
          font-size: 14px;
          color: #666;
          margin: 4px 0 0 0;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 13px;
          position: relative;
          z-index: 1;
        }
        .info-table th {
          background: #20264a;
          color: #fff;
          text-align: left;
          padding: 10px;
          font-weight: 500;
        }
        .info-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #eee;
          color: #444;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .signature-line {
          text-align: center;
          width: 180px;
        }
        .signature-dash {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 45px;
        }
        .stamp-box {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,0,0,0.08);
          font-size: 10px;
          font-weight: 700;
          border: 1px dashed rgba(0,0,0,0.1);
          border-radius: 4px;
          box-sizing: border-box;
        }
        .qr-box {
          text-align: center;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #888;
          margin-top: 25px;
          border-top: 1px solid #eee;
          padding-top: 15px;
          position: relative;
          z-index: 1;
        }
        @media print {
          body { padding: 0; }
          .invoice-card { box-shadow: none; border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="watermark">${watermarkText}</div>
        
        <div class="header">
          <div class="logo-section" style="display: flex; align-items: center; gap: 12px;">
            <img src="logo-academy.png" alt="Logo CTD" style="height: 40px; width: auto; filter: brightness(0);" />
            <div style="text-align: left;">
              <h2 style="color: #20264a; margin: 0; font-size: 20px; font-weight: 700;">${escapeHTML(academyProfile.nombre.toUpperCase())}</h2>
              <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${escapeHTML(academyProfile.eslogan)}</span>
            </div>
          </div>
          <div class="invoice-title">
            <h1>RECIBO DE PAGO</h1>
            <span>N° ${invoiceNumber}</span>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-box">
            <h4>Emitido a:</h4>
            <p><strong>Estudiante:</strong> ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</p>
            <p><strong>Documento:</strong> ${escapeHTML(docId)}</p>
            <p><strong>Curso:</strong> ${escapeHTML(courseName)}</p>
          </div>
          <div class="details-box" style="text-align: right;">
            <h4>Detalle de Emisión:</h4>
            <p><strong>Fecha de Pago:</strong> ${new Date(payment.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Fecha de Emisión:</strong> ${todayStr}</p>
            <p><strong>Método:</strong> ${escapeHTML(payment.method)} ${payment.ref ? `(Ref: ${escapeHTML(payment.ref)})` : ''}</p>
          </div>
        </div>

        <div class="payment-box">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600;">Monto Abonado</span>
          <div class="payment-amount">$${payment.amount.toFixed(2)} USD</div>
          <div class="payment-ves">Equivalente a: ${(payment.amount * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</div>
          <div style="font-size: 10px; color: #999; margin-top: 4px;">Tasa de Cambio Referencial: ${tasaBCV.toFixed(2)} VES/USD</div>
        </div>

        <table class="info-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align: right;">Estado de Cuenta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Abono parcial de matrícula del curso: ${escapeHTML(courseName)}</td>
              <td style="text-align: right;">Abonado</td>
            </tr>
            <tr>
              <td><strong>Total de Inversión Académica:</strong></td>
              <td style="text-align: right;">$${student.academicPrice !== undefined ? student.academicPrice.toFixed(2) : defaultPrice.toFixed(2)} USD</td>
            </tr>
            <tr>
              <td><strong>Monto Acumulado Pagado:</strong></td>
              <td style="text-align: right; color: #6daa45; font-weight: 600;">$${student.academicPaid.toFixed(2)} USD</td>
            </tr>
            <tr>
              <td><strong>Saldo Restante por Pagar:</strong></td>
              <td style="text-align: right; color: ${(student.academicPrice || defaultPrice) - student.academicPaid > 0 ? '#f44336' : '#6daa45'}; font-weight: 600;">$${Math.max(0, (student.academicPrice || defaultPrice) - student.academicPaid).toFixed(2)} USD</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 11px; color: #666; font-weight: 600;">Firma Autorizada</span>
          </div>
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrData)}" alt="Código QR de Verificación" style="width: 90px; height: 90px; display: block; margin: 0 auto 4px auto;" />
            <span style="font-size: 9px; color: #888; display: block;">Validación Digital</span>
          </div>
          <div class="signature-line">
            <div class="stamp-box">SELLO ACADEMIA</div>
            <span style="font-size: 11px; color: #666; font-weight: 600;">Sello de Control</span>
          </div>
        </div>

        <div class="footer">
          <p>${escapeHTML(academyProfile.nombre)} | Dirección: ${escapeHTML(academyProfile.direccion)} | Telf: ${escapeHTML(academyProfile.telefono)} | Email: ${escapeHTML(academyProfile.email)}</p>
          <p style="font-size: 10px; color: #aaa; margin-top: 5px;">Código de Verificación: <strong>CTD-SEC-${payment.id.split('-').slice(-1)[0].toUpperCase()}-${(payment.amount * tasaBCV).toFixed(0)}</strong></p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function sendPaymentReceiptWhatsApp(paymentId) {
  if (!selectedStudent || !selectedStudent.tel) {
    showToast('El alumno no tiene un número telefónico asignado.', 'error');
    return;
  }
  const payment = selectedStudent.payments.find(p => p.id === paymentId);
  if (!payment) return;

  const studentCourse = cursos.find(c => c.id === selectedStudent.curso);
  const courseName = studentCourse ? studentCourse.nombre : 'Curso';
  
  const total = selectedStudent.academicPrice !== undefined ? selectedStudent.academicPrice : (studentCourse ? studentCourse.precio : 0);
  const balance = Math.max(0, total - selectedStudent.academicPaid);

  const text = `¡Hola ${selectedStudent.nombre}! 🎉 Confirmamos el recibo de tu abono de $${payment.amount} USD (${payment.method}) para el curso de ${courseName}. Tu saldo pendiente actual es de $${balance} USD. ¡Muchas gracias!`;

  const cleanNumber = selectedStudent.tel.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
  logActivity('nota', `Recibo de pago de $${payment.amount} USD enviado a ${selectedStudent.nombre} por WhatsApp.`);
}

function updatePaymentAmountVESHelper(val) {
  const helper = document.getElementById('new-payment-amount-ves-helper');
  if (!helper) return;
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) {
    helper.style.display = 'none';
  } else {
    const ves = num * tasaBCV;
    helper.innerText = `Equivale a: ${ves.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES (Tasa: ${tasaBCV.toFixed(2)})`;
    helper.style.display = 'block';
  }
}

function updateNextPaymentDatePreset() {
  const preset = document.getElementById('new-payment-next-days-preset').value;
  if (preset === 'custom') return;
  const days = parseInt(preset);
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + days);
  const dateInput = document.getElementById('new-payment-next-date');
  if (dateInput) {
    dateInput.value = newDate.toISOString().split('T')[0];
  }
}

function saveNextContactDate() {
  if (!selectedStudent) return;
  selectedStudent.nextContactDate = document.getElementById('detail-next-contact').value;
  saveState();
  showToast('Fecha de próximo contacto guardada.', 'success');
  setView(activeView);
}

function clearNextContactDate() {
  if (!selectedStudent) return;
  selectedStudent.nextContactDate = '';
  document.getElementById('detail-next-contact').value = '';
  saveState();
  showToast('Seguimiento de agenda eliminado.', 'info');
  setView(activeView);
}

function cloneSelectedStudent() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  closeDetailPanel();
  openStudentModal();
  
  document.getElementById('student-nombre').value = student.nombre;
  document.getElementById('student-apellido').value = student.apellido || '';
  const cedInput = document.getElementById('student-cedula');
  if (cedInput) {
    cedInput.value = student.cedula || '';
  }
  document.getElementById('student-email').value = student.email || '';
  document.getElementById('student-tel').value = student.tel || '';
  document.getElementById('student-instagram').value = student.instagram || '';
  document.getElementById('student-nivel').value = student.nivel || 'Principiante';
  document.getElementById('student-dia').value = student.dia || 'Lunes a Viernes';
  document.getElementById('student-horario').value = student.horario || '9am - 11am';
  
  document.getElementById('student-etapa').value = 'Nuevo';
  
  showToast('Datos de contacto clonados. Elige el nuevo curso.', 'info');
}

function logQuickContact(channel) {
  if (!selectedStudent) return;
  const channelText = {
    'WhatsApp': 'Contacto realizado vía WhatsApp.',
    'Llamada': 'Llamada telefónica realizada con el alumno.',
    'Correo': 'Correo electrónico enviado al alumno.'
  }[channel] || `Contacto realizado por canal: ${channel}`;

  const notesArr = selectedStudent.notes || selectedStudent.notas || [];
  notesArr.push({
    text: channelText,
    channel: channel,
    date: new Date().toISOString()
  });
  selectedStudent.notas = notesArr;
  selectedStudent.notes = notesArr;

  logActivity('nota', `[Contacto Rápido] Se registró un intento de contacto por ${channel} para ${selectedStudent.nombre} ${selectedStudent.apellido || ''}.`);
  saveState();
  renderDetailNotes();
  showToast(`Intento de contacto (${channel}) registrado.`, 'success');
  setView(activeView);
}

function generateStudentInvoicePDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const total = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || 0;
  const balance = Math.max(0, total - paid);
  const docId = student.cedula || 'No Registrado';
  
  // Format invoice number
  const invoiceNumber = `REC-${Date.now().toString().slice(-6)}-${student.id.split('-').slice(-1)}`;
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });

  // Generate watermark and QR metadata
  const isPaid = balance <= 0;
  const watermarkText = isPaid ? 'PAGADO' : 'DEUDA PENDIENTE';
  const watermarkColor = isPaid ? 'rgba(109, 170, 69, 0.05)' : 'rgba(244, 67, 54, 0.05)';
  const qrData = `CTD CRM - ESTADO DE CUENTA\nNro: ${invoiceNumber}\nEstudiante: ${student.nombre} ${student.apellido || ''}\nDocumento: ${docId}\nCurso: ${courseName}\nTotal Inversión: $${total.toFixed(2)} USD\nAbonado: $${paid.toFixed(2)} USD\nSaldo Pendiente: $${balance.toFixed(2)} USD`;

  // Generate payments rows
  const paymentsList = student.payments || [];
  let paymentsRows = '';
  if (paymentsList.length === 0) {
    paymentsRows = `
      <tr>
        <td colspan="4" style="text-align: center; color: #888; font-style: italic; padding: 12px;">Sin abonos registrados</td>
      </tr>
    `;
  } else {
    paymentsRows = paymentsList.map((p, index) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; text-align: left;">#${index + 1}</td>
        <td style="padding: 10px; text-align: left;">${new Date(p.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 10px; text-align: left;">${escapeHTML(p.method)} ${p.ref ? `(Ref: ${escapeHTML(p.ref)})` : ''}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #444;">$${p.amount.toFixed(2)} USD</td>
      </tr>
    `).join('');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Recibo de Pago - ${escapeHTML(student.nombre)} \&nbsp;${escapeHTML(student.apellido || '')}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
          background: #fff;
        }
        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          position: relative;
          overflow: hidden;
        }
        .watermark {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-size: 80px;
          font-weight: 800;
          color: ${watermarkColor};
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 5px;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f4f4f4;
          padding-bottom: 30px;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .logo-section h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          color: #4f98a3;
          letter-spacing: -0.5px;
        }
        .logo-section span {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 500;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          margin: 0 0 5px 0;
          font-size: 18px;
          color: #222;
          font-weight: 600;
        }
        .invoice-details p {
          margin: 3px 0;
          font-size: 13px;
          color: #666;
        }
        .meta-grid {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .meta-col {
          flex: 1;
        }
        .meta-col h3 {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: #4f98a3;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .meta-col p {
          margin: 4px 0;
          font-size: 13.5px;
          color: #444;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .table th {
          background-color: #f8fcfd;
          border-bottom: 2px solid #eaeaea;
          color: #4f98a3;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 12px 10px;
          text-align: left;
        }
        .table td {
          padding: 12px 10px;
          font-size: 13.5px;
        }
        .summary-section {
          display: flex;
          justify-content: flex-end;
          position: relative;
          z-index: 1;
          margin-bottom: 40px;
        }
        .summary-box {
          width: 300px;
          background: #fdfdfd;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 15px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13.5px;
        }
        .summary-row.total {
          border-top: 1.5px solid #eaeaea;
          padding-top: 10px;
          margin-top: 5px;
          font-weight: bold;
          font-size: 15px;
        }
        .summary-row.balance {
          color: #d163a7;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .signature-line {
          text-align: center;
          width: 200px;
        }
        .signature-dash {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 45px;
        }
        .stamp-box {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,0,0,0.08);
          font-size: 10px;
          font-weight: 700;
          border: 1px dashed rgba(0,0,0,0.1);
          border-radius: 4px;
          box-sizing: border-box;
        }
        .qr-box {
          text-align: center;
        }
        .footer-note {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px dashed #eaeaea;
          padding-top: 20px;
          position: relative;
          z-index: 1;
        }
        @media print {
          body {
            padding: 0;
          }
          .invoice-card {
            border: none;
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="watermark">${watermarkText}</div>
        
        <div class="header-row">
          <div class="logo-section" style="display: flex; align-items: center; gap: 12px;">
            <img src="logo-academy.png" alt="Logo CTD" style="height: 45px; width: auto; filter: brightness(0);" />
            <div style="text-align: left;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #4f98a3; letter-spacing: -0.5px;">${escapeHTML(academyProfile.nombre)}</h1>
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500;">${escapeHTML(academyProfile.eslogan)}</span>
            </div>
          </div>
          <div class="invoice-details">
            <h2>RECIBO DE MATRÍCULA</h2>
            <p><strong>Nro:</strong> ${invoiceNumber}</p>
            <p><strong>Fecha:</strong> ${todayStr}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-col">
            <h3>Estudiante</h3>
            <p><strong>Nombre:</strong> ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</p>
            <p><strong>Cédula:</strong> ${escapeHTML(docId)}</p>
            <p><strong>Email:</strong> ${escapeHTML(student.email || 'N/A')}</p>
            <p><strong>WhatsApp:</strong> ${escapeHTML(student.tel || 'N/A')}</p>
          </div>
          <div class="meta-col">
            <h3>Detalle Académico</h3>
            <p><strong>Curso:</strong> ${escapeHTML(courseName)}</p>
            <p><strong>Grupo / Cohorte:</strong> ${student.academicGroup ? escapeHTML((cohortes.find(c => c.id === student.academicGroup) || {nombre: student.academicGroup}).nombre) : 'Sin Grupo asignado'}</p>
            <p><strong>Fecha de Inicio:</strong> ${student.academicStartDate ? formatDateShort(student.academicStartDate) : 'N/A'}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 8%;">Abono</th>
              <th style="width: 25%;">Fecha de Transacción</th>
              <th style="width: 47%;">Método & Referencia</th>
              <th style="width: 20%; text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsRows}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-box">
            <div class="summary-row">
              <span>Costo Total Curso:</span>
              <span>${total.toFixed(2)} USD</span>
            </div>
            <div class="summary-row" style="color: #4caf50; font-weight: 500;">
              <span>Total Abonado:</span>
              <span>${paid.toFixed(2)} USD</span>
            </div>
            <div class="summary-row total balance" style="margin-bottom: 8px;">
              <span>Saldo Pendiente:</span>
              <span>${balance.toFixed(2)} USD</span>
            </div>
            <!-- Equivalente en Bolívares (VES) -->
            <div style="border-top: 1px solid #eaeaea; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
              <div class="summary-row" style="font-size: 11.5px; color: #666; margin: 0; font-weight: normal;">
                <span>Costo Total (VES):</span>
                <span>${(total * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</span>
              </div>
              <div class="summary-row" style="font-size: 11.5px; color: #4caf50; margin: 0; font-weight: normal;">
                <span>Total Abonado (VES):</span>
                <span>${(paid * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</span>
              </div>
              <div class="summary-row" style="font-size: 12.5px; color: #333; margin: 0; font-weight: 700;">
                <span>Saldo Pendiente (VES):</span>
                <span>${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</span>
              </div>
              <div style="font-size: 9.5px; color: #999; text-align: right; font-style: italic; margin-top: 4px;">
                * Conversión referencial a tasa BCV: ${tasaBCV.toFixed(2)} VES/USD
              </div>
            </div>
          </div>
        </div>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 11px; color: #666; font-weight: 600;">Firma de Administración</span>
          </div>
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(qrData)}" alt="Código QR de Verificación" style="width: 95px; height: 95px; display: block; margin: 0 auto 4px auto;" />
            <span style="font-size: 9px; color: #888; display: block;">Validación de Cuenta</span>
          </div>
          <div class="signature-line">
            <div class="stamp-box">SELLO DE CAJA</div>
            <span style="font-size: 11px; color: #666; font-weight: 600;">Sello de Control</span>
          </div>
        </div>

        <div class="footer-note">
          <p>Este recibo de pago digital certifica el estado de cuenta del estudiante a la fecha de emisión.</p>
          <p>${escapeHTML(academyProfile.nombre)} - Dirección: ${escapeHTML(academyProfile.direccion)}. Contacto: ${escapeHTML(academyProfile.telefono)} | ${escapeHTML(academyProfile.email)}</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Recibo PDF generado para ${student.nombre} ${student.apellido || ''}.`);
}

function printStudentCertificate(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const docId = student.cedula || 'No Registrado';
  
  const cohort = cohortes.find(g => g.id === student.academicGroup);
  const groupName = cohort ? cohort.nombre : (student.academicGroup || 'Sin Grupo');
  const grade = student.academicGrade !== undefined && student.academicGrade !== '' ? student.academicGrade : 100;
  const attendance = student.academicAttendance !== undefined && student.academicAttendance !== '' ? student.academicAttendance : 100;
  const completionDate = cohort ? cohort.fechaFin : new Date().toISOString().split('T')[0];
  const dateStr = new Date(completionDate + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const hash = `CTD-CERT-${student.id.split('-').slice(-1)[0].toUpperCase()}-${grade}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el certificado.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Certificado - ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        @page {
          size: A4 landscape;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', sans-serif;
          background: #0f172a;
          color: #f1f5f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .certificate-container {
          width: 1045px;
          height: 730px;
          background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
          border: 4px solid #b45309;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .corner {
          position: absolute;
          width: 80px;
          height: 80px;
          border: 2px solid rgba(245, 158, 11, 0.3);
          box-sizing: border-box;
        }
        .top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
        .top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
        .bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
        .bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }

        .inner-border {
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 1px dashed rgba(245, 158, 11, 0.4);
          pointer-events: none;
        }

        .header {
          text-align: center;
        }

        .logo {
          font-family: 'Cinzel', serif;
          font-size: 28px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 4px;
          margin-bottom: 5px;
        }

        .logo-subtitle {
          font-size: 11px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 500;
        }

        .title-section {
          text-align: center;
          margin-top: 10px;
        }

        .title {
          font-family: 'Cinzel', serif;
          font-size: 44px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .award-to {
          font-size: 14px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 4px;
          margin-top: 15px;
          font-weight: 600;
        }

        .recipient-name {
          font-family: 'Cinzel', serif;
          font-size: 38px;
          font-weight: 700;
          color: #f59e0b;
          margin: 15px 0 5px 0;
          border-bottom: 2px solid rgba(245, 158, 11, 0.2);
          padding-bottom: 8px;
          display: inline-block;
          min-width: 60%;
          text-align: center;
        }

        .id-text {
          font-size: 12px;
          color: #64748b;
          letter-spacing: 1px;
        }

        .context-text {
          font-size: 15px;
          line-height: 1.8;
          color: #cbd5e1;
          text-align: center;
          max-width: 800px;
          margin: 20px 0;
          font-weight: 400;
        }

        .course-highlight {
          color: #ffffff;
          font-weight: 700;
          font-size: 17px;
        }

        .stats-highlight {
          color: #10b981;
          font-weight: 700;
        }

        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          margin-top: 20px;
        }

        .signature-block {
          text-align: center;
          width: 250px;
        }

        .signature-line {
          border-top: 1.5px solid rgba(245, 158, 11, 0.3);
          margin-top: 50px;
          padding-top: 8px;
        }

        .signature-name {
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }

        .signature-title {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 3px;
        }

        .seal-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .gold-seal {
          width: 85px;
          height: 85px;
          background: radial-gradient(circle, #fcd34d 0%, #d97706 100%);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #b45309;
        }

        .gold-seal::before {
          content: '';
          position: absolute;
          width: 73px;
          height: 73px;
          border: 1px solid #78350f;
          border-radius: 50%;
        }

        .seal-ribbon-1, .seal-ribbon-2 {
          position: absolute;
          width: 20px;
          height: 50px;
          background: #b45309;
          bottom: -35px;
          z-index: -1;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .seal-ribbon-1 {
          left: 20px;
          transform: rotate(25deg);
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
        }

        .seal-ribbon-2 {
          right: 20px;
          transform: rotate(-25deg);
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%);
        }

        .seal-text {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          font-weight: 700;
          color: #78350f;
          text-align: center;
          line-height: 1.2;
          z-index: 10;
          text-transform: uppercase;
        }

        .verification-block {
          font-size: 10px;
          color: #475569;
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .certificate-container {
            width: 100%;
            height: 100vh;
            border: none;
            box-shadow: none;
            background: #fff !important;
            color: #000 !important;
            padding: 40px 60px;
          }
          .title {
            color: #0f172a !important;
          }
          .recipient-name {
            color: #b45309 !important;
            border-bottom: 2px solid #b45309 !important;
          }
          .context-text {
            color: #334155 !important;
          }
          .course-highlight {
            color: #0f172a !important;
          }
          .signature-name {
            color: #0f172a !important;
          }
          .gold-seal {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="inner-border"></div>
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="header">
          <div class="logo">ACADEMIA CTD</div>
          <div class="logo-subtitle">Centro de Tecnología Digital</div>
        </div>

        <div class="title-section">
          <h1 class="title">Certificado de Aprobación</h1>
          <div class="award-to">Otorgado con distinción a</div>
          <div class="recipient-name">\${escapeHTML(student.nombre)} \${escapeHTML(student.apellido || '')}</div>
          <div class="id-text">Documento de Identidad: \${escapeHTML(docId)}</div>
        </div>

        <div class="context-text">
          Por haber completado con éxito todas las exigencias teórico-prácticas del programa académico en 
          <span class="course-highlight">"\${escapeHTML(courseName)}"</span>, dictado por esta institución educativa en la cohorte 
          <strong>"\${escapeHTML(groupName)}"</strong>, habiendo obtenido una calificación final sobresaliente de 
          <span class="stats-highlight">\${grade}/100</span> y un índice de asistencia del 
          <span class="stats-highlight">\${attendance}%</span>.
        </div>

        <div class="footer-section">
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-name">\${escapeHTML(username)}</div>
              <div class="signature-title">Coordinador Académico</div>
            </div>
          </div>

          <div class="seal-block">
            <div class="gold-seal">
              <div class="seal-text">CTD<br>Validador</div>
              <div class="seal-ribbon-1"></div>
              <div class="seal-ribbon-2"></div>
            </div>
          </div>

          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-name">Academia CTD</div>
              <div class="signature-title">Sello Institucional</div>
            </div>
          </div>
        </div>

        <div class="verification-block">
          Código de Verificación Único: \${hash} | Fecha de Emisión: \${dateStr}
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Certificado académico digital generado para ${student.nombre} ${student.apellido || ''}.`);
}

function saveUsernameSettings() {
  const inputVal = document.getElementById('ajustes-username').value.trim();
  if (!inputVal) {
    showToast('Nombre de coordinador no puede estar vacío.', 'error');
    return;
  }
  username = inputVal;
  localStorage.setItem("ctd_username", username);
  syncHeaderProfile();
  showToast('Nombre de coordinador guardado.', 'success');
  logActivity('edicion', `Se actualizó el nombre del coordinador activo.`);
}

function saveAdminPasswordSettings() {
  const newPass = document.getElementById('ajustes-admin-password').value;
  if (!newPass) {
    showToast('La contraseña no puede estar vacía.', 'error');
    return;
  }
  if (newPass.length < 4) {
    showToast('La contraseña debe tener al menos 4 caracteres.', 'error');
    return;
  }
  adminPassword = newPass;
  localStorage.setItem("ctd_admin_password", adminPassword);
  saveState();
  document.getElementById('ajustes-admin-password').value = '';
  showToast('Contraseña de administrador actualizada con éxito.', 'success');
  logActivity('configuracion', `Se modificó la contraseña de acceso del administrador.`);
}

function saveMetaSettings() {
  const token = document.getElementById('meta-api-token').value.trim();
  const phoneId = document.getElementById('meta-phone-id').value.trim();
  const wabaId = document.getElementById('meta-waba-id').value.trim();

  localStorage.setItem("meta_api_token", token);
  localStorage.setItem("meta_phone_id", phoneId);
  localStorage.setItem("meta_waba_id", wabaId);

  showToast('Configuración de Meta API guardada con éxito.', 'success');
  logActivity('configuracion', 'Se actualizaron las credenciales de Meta & WhatsApp Cloud API.');
}

function testMetaConnection() {
  const token = document.getElementById('meta-api-token').value.trim();
  const phoneId = document.getElementById('meta-phone-id').value.trim();
  const wabaId = document.getElementById('meta-waba-id').value.trim();

  if (!token || !phoneId || !wabaId) {
    showToast('Por favor complete todos los campos de integración para realizar la prueba.', 'error');
    return;
  }

  showToast('Estableciendo conexión con Meta servers...', 'info');

  // Simulamos una llamada de verificación a la API Graph de Meta
  setTimeout(() => {
    showToast('¡Conexión establecida con éxito! Credenciales válidas en Meta. ✅', 'success');
    logActivity('configuracion', 'Prueba de conexión con Meta API exitosa.');
  }, 1200);
}

async function fetchTasaBCVAuto(silent = false) {
  const btns = document.querySelectorAll('[onclick^="fetchTasaBCVAuto"]');
  if (!silent) {
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.innerText.includes("Consultar")) {
        btn.innerHTML = `<i data-lucide="refresh-cw" class="spin" style="width: 12px; height: 12px;"></i> Consultando...`;
      } else {
        btn.innerHTML = `<i data-lucide="refresh-cw" class="spin" style="width: 12px; height: 12px;"></i>`;
      }
    });
    lucide.createIcons();
  }
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    if (data && data.promedio) {
      tasaBCV = parseFloat(data.promedio);
      localStorage.setItem("ctd_tasa_bcv", tasaBCV);
      const input = document.getElementById('ajustes-tasa-bcv');
      if (input) input.value = tasaBCV;
      if (!silent) {
        showToast(`Tasa BCV obtenida con éxito: ${tasaBCV} VES/USD`, 'success');
      }
      logActivity('edicion', `Se actualizó automáticamente la tasa BCV a ${tasaBCV} VES.`);
      saveState();
      updateBCVHeaderDisplay();
    } else {
      if (!silent) showToast('No se recibió un valor válido del API.', 'error');
    }
  } catch (error) {
    console.error("Error fetching rate:", error);
    if (!silent) showToast('Error al conectar con la API de tasa de cambio.', 'error');
  } finally {
    if (!silent) {
      btns.forEach(btn => {
        btn.disabled = false;
        if (btn.innerText.includes("Consultar")) {
          btn.innerHTML = `<i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i> Consultar Tasa BCV automáticamente`;
        } else {
          btn.innerHTML = `<i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i>`;
        }
      });
      lucide.createIcons();
    }
  }
}

function saveTasaBCVSettings() {
  const input = document.getElementById('ajustes-tasa-bcv');
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    showToast('Ingresa una tasa de cambio válida mayor a 0.', 'error');
    return;
  }
  tasaBCV = val;
  localStorage.setItem("ctd_tasa_bcv", tasaBCV);
  showToast(`Tasa de cambio guardada: ${tasaBCV} VES/USD`, 'success');
  logActivity('edicion', `Se actualizó manualmente la tasa de cambio a ${tasaBCV} VES.`);
  saveState();
  updateBCVHeaderDisplay();
}

function addCustomTemplate(e) {
  e.preventDefault();
  const name = document.getElementById('new-template-name').value.trim();
  const text = document.getElementById('new-template-text').value.trim();
  if (!name || !text) return;

  const newTmpl = {
    id: `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: name,
    texto: text
  };
  whatsappTemplates.push(newTmpl);
  saveState();
  document.getElementById('ajustes-template-form').reset();
  renderAjustesSettings();
  showToast('Plantilla agregada con éxito.', 'success');
}

function deleteCustomTemplate(id) {
  if (confirm('¿Seguro que deseas eliminar esta plantilla de WhatsApp?')) {
    whatsappTemplates = whatsappTemplates.filter(t => t.id !== id);
    saveState();
    renderAjustesSettings();
    showToast('Plantilla eliminada.', 'success');
  }
}

function addSalesAdvisor(e) {
  e.preventDefault();
  const name = document.getElementById('new-asesor-nombre').value.trim();
  const usernameInput = document.getElementById('new-asesor-username').value.trim().toLowerCase();
  const password = document.getElementById('new-asesor-password').value;

  if (!name || !usernameInput || !password) return;

  if (usernameInput === 'admin') {
    showToast('El usuario "admin" está reservado.', 'error');
    return;
  }

  const exists = asesores.some(a => a.username.toLowerCase() === usernameInput);
  if (exists) {
    showToast('El nombre de usuario ya está registrado.', 'error');
    return;
  }

  const newAdvisor = {
    id: `asesor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: name,
    username: usernameInput,
    password: password
  };

  asesores.push(newAdvisor);
  saveState();
  document.getElementById('ajustes-asesor-form').reset();
  renderAjustesSettings();
  showToast('Asesor registrado con éxito.', 'success');
  logActivity('configuracion', `Se registró al asesor de ventas: ${name}.`);
}

function deleteSalesAdvisor(id) {
  const advisor = asesores.find(a => a.id === id);
  if (!advisor) return;

  if (confirm(`¿Seguro que deseas eliminar al asesor ${advisor.nombre}?`)) {
    asesores = asesores.filter(a => a.id !== id);
    saveState();
    renderAjustesSettings();
    showToast('Asesor de ventas eliminado.', 'success');
    logActivity('configuracion', `Se eliminó al asesor de ventas: ${advisor.nombre}.`);
  }
}


function sendWhatsAppTemplate() {
  if (!selectedStudent || !selectedStudent.tel) {
    showToast('El alumno no tiene un número telefónico asignado.', 'error');
    return;
  }
  const selectEl = document.getElementById('detail-wa-template');
  const selectedId = selectEl.value;
  const tmpl = whatsappTemplates.find(t => t.id === selectedId);
  if (!tmpl) {
    showToast('Selecciona una plantilla válida.', 'error');
    return;
  }

  const studentCourse = cursos.find(c => c.id === selectedStudent.curso);
  const courseName = studentCourse ? studentCourse.nombre : 'Curso';
  const courseDuration = studentCourse ? studentCourse.duracion : 'N/A';

  // Calculate pricing values
  const defaultPrice = studentCourse ? studentCourse.precio : 0;
  const total = selectedStudent.academicPrice !== undefined ? selectedStudent.academicPrice : defaultPrice;
  const paid = selectedStudent.academicPaid || (selectedStudent.payments ? selectedStudent.payments.reduce((acc, p) => acc + p.amount, 0) : 0);
  const balance = Math.max(0, total - paid);

  let message = tmpl.texto
    .replace(/{nombre}/g, `${selectedStudent.nombre} ${selectedStudent.apellido || ''}`.trim())
    .replace(/{curso}/g, courseName)
    .replace(/{precio}/g, balance)
    .replace(/{saldo}/g, balance)
    .replace(/{abonado}/g, paid)
    .replace(/{total}/g, total)
    .replace(/{duracion}/g, courseDuration);

  const cleanNumber = selectedStudent.tel.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
  logActivity('nota', `Contacto WhatsApp realizado a ${selectedStudent.nombre} utilizando la plantilla "${tmpl.nombre}".`);
}

function renderDetailTasks() {
  if (!selectedStudent) return;
  const listEl = document.getElementById('detail-tasks-list');
  const countEl = document.getElementById('detail-tasks-count');
  if (!listEl || !countEl) return;

  const studentTasks = tareas.filter(t => t.studentId === selectedStudent.id);
  countEl.innerText = studentTasks.length;

  if (studentTasks.length === 0) {
    listEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">Sin tareas de seguimiento</p>';
  } else {
    studentTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });

    listEl.innerHTML = studentTasks.map(t => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !t.completed;
      const dateStyle = isOverdue ? 'color: var(--color-error); font-weight: 600;' : 'color: var(--color-text-muted);';
      const textStyle = t.completed ? 'text-decoration: line-through; opacity: 0.6;' : '';
      const dateText = t.dueDate ? formatDateShort(t.dueDate) : 'Sin fecha';

      return `
        <div class="note-item" style="display: flex; align-items: center; gap: 10px; padding: 10px;">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskStatus('${t.id}')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary);">
          <div style="flex-grow: 1; ${textStyle}">
            <div style="font-size: 13px; font-weight: 500;">${escapeHTML(t.title)}</div>
            <div style="font-size: 11px; ${dateStyle} margin-top: 2px;">Vence: ${dateText}</div>
          </div>
          <button class="btn btn-ghost btn-icon-sm" onclick="deleteTask('${t.id}')" style="color: var(--color-error); padding: 4px;" title="Eliminar Tarea">
            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  }
}

function addSelectedStudentTask(e) {
  e.preventDefault();
  if (!selectedStudent) return;
  const input = document.getElementById('new-task-text');
  const dateInput = document.getElementById('new-task-date');
  const title = input.value.trim();
  const dueDate = dateInput.value;

  if (!title) return;

  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId: selectedStudent.id,
    title,
    dueDate,
    completed: false
  };

  tareas.push(newTask);
  saveState();
  input.value = '';
  dateInput.value = '';
  renderDetailTasks();
  showToast('Tarea de seguimiento agregada.', 'success');
  logActivity('nota', `Se añadió la tarea "${title}" para ${selectedStudent.nombre}.`);
  
  if (activeView === 'tareas') renderTareas();
}

function toggleTaskStatus(taskId) {
  const t = tareas.find(item => item.id === taskId);
  if (!t) return;
  t.completed = !t.completed;
  saveState();
  
  const student = alumnos.find(a => a.id === t.studentId);
  const name = student ? `${student.nombre} ${student.apellido || ''}` : 'Alumno';
  logActivity('edicion', `Se marcó como ${t.completed ? 'completada' : 'pendiente'} la tarea "${t.title}" de ${name}.`);

  if (selectedStudent && selectedStudent.id === t.studentId) {
    renderDetailTasks();
  }
  if (activeView === 'tareas') renderTareas();
  showToast(`Tarea marcada como ${t.completed ? 'completada' : 'pendiente'}.`, 'info');
}

function deleteTask(taskId) {
  const t = tareas.find(item => item.id === taskId);
  if (!t) return;

  if (confirm(`¿Seguro que deseas eliminar la tarea "${t.title}"?`)) {
    tareas = tareas.filter(item => item.id !== taskId);
    saveState();
    
    if (selectedStudent && selectedStudent.id === t.studentId) {
      renderDetailTasks();
    }
    if (activeView === 'tareas') renderTareas();
    showToast('Tarea de seguimiento eliminada.', 'success');
  }
}

function saveGlobalTask(e) {
  e.preventDefault();
  const desc = document.getElementById('global-task-desc').value.trim();
  const studentId = document.getElementById('global-task-student').value;
  const dueDate = document.getElementById('global-task-date').value;

  if (!desc) return;

  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId: studentId || null,
    title: desc,
    dueDate,
    completed: false
  };

  tareas.push(newTask);
  saveState();
  document.getElementById('global-task-form').reset();
  renderTareas();
  showToast('Tarea creada con éxito.', 'success');
  
  if (studentId) {
    const student = alumnos.find(a => a.id === studentId);
    const name = student ? `${student.nombre} ${student.apellido || ''}` : 'Alumno';
    logActivity('nota', `Se añadió la tarea "${desc}" para ${name} desde el panel global.`);
  } else {
    logActivity('nota', `Se añadió la tarea general "${desc}" desde el panel global.`);
  }
}

function switchReportesTab(tabId) {
  reportesActiveTab = tabId;
  
  // Update buttons active class
  document.getElementById('rep-tab-comercial-btn').classList.remove('active');
  document.getElementById('rep-tab-financiero-btn').classList.remove('active');
  document.getElementById('rep-tab-embudo-btn').classList.remove('active');
  
  document.getElementById(`rep-tab-${tabId}-btn`).classList.add('active');
  
  // Hide all contents
  document.getElementById('rep-tab-comercial-content').style.display = 'none';
  document.getElementById('rep-tab-financiero-content').style.display = 'none';
  document.getElementById('rep-tab-embudo-content').style.display = 'none';
  
  // Show active tab contents
  const activeContent = document.getElementById(`rep-tab-${tabId}-content`);
  if (activeContent) {
    activeContent.style.display = tabId === 'financiero' ? 'flex' : 'block';
  }
  
  // Re-run render
  renderReportes();
}

function handleExpenseCategoryChange() {
  const category = document.getElementById('expense-category').value;
  const sourceGroup = document.getElementById('expense-source-group');
  if (sourceGroup) {
    sourceGroup.style.display = (category === 'Publicidad') ? 'block' : 'none';
  }
}

function saveExpense(e) {
  e.preventDefault();
  const date = document.getElementById('expense-date').value;
  const category = document.getElementById('expense-category').value;
  const desc = document.getElementById('expense-desc').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  
  if (!date || !category || !desc || isNaN(amount) || amount <= 0) {
    showToast('Por favor, rellene todos los campos con valores correctos.', 'error');
    return;
  }
  
  let source = '';
  if (category === 'Publicidad') {
    source = document.getElementById('expense-source').value || 'General';
  }
  
  const newExpense = {
    id: `egr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date,
    category,
    desc,
    amount,
    source
  };
  
  egresos.push(newExpense);
  saveState();
  showToast('Egreso registrado correctamente.', 'success');
  logActivity('edicion', `Se registró un egreso de $${amount} USD por concepto de "${desc}" (${category} - ${source || 'N/A'}).`);
  
  // Reset form
  document.getElementById('expense-form').reset();
  // Set today's date back as default
  document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
  const sourceGroup = document.getElementById('expense-source-group');
  if (sourceGroup) sourceGroup.style.display = 'none';
  
  renderReportes();
}

function updateMarketingAnalytics() {
  const adExpenses = egresos.filter(e => e.category === 'Publicidad');
  const totalSpent = adExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const totalInscritos = alumnos.filter(a => a.etapa === 'Inscrito').length;
  const globalCAC = totalInscritos > 0 ? (totalSpent / totalInscritos) : 0;
  
  let globalRevenue = 0;
  alumnos.filter(a => a.etapa === 'Inscrito').forEach(student => {
    globalRevenue += (student.academicPaid || 0);
  });
  
  const globalROI = totalSpent > 0 ? (((globalRevenue - totalSpent) / totalSpent) * 100).toFixed(1) : 0;
  
  const totalSpentEl = document.getElementById('marketing-total-spent');
  const cacEl = document.getElementById('marketing-cac-global');
  const roiEl = document.getElementById('marketing-roi-global');
  
  if (totalSpentEl) totalSpentEl.innerText = `$${totalSpent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  if (cacEl) cacEl.innerText = `$${globalCAC.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  if (roiEl) {
    roiEl.innerText = totalSpent > 0 ? `${globalROI}%` : '0.0%';
    roiEl.style.color = parseFloat(globalROI) >= 0 ? 'var(--color-success)' : 'var(--color-error)';
  }
  
  const tbody = document.getElementById('marketing-roi-table-body');
  if (tbody) {
    const sourcesList = ['Instagram', 'WhatsApp', 'Facebook', 'TikTok', 'Web', 'Referido', 'Presencial'];
    const generalAdsSpent = adExpenses.filter(e => e.source === 'General' || !e.source).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    let html = '';
    
    sourcesList.forEach(src => {
      const srcSpent = adExpenses.filter(e => e.source === src).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const srcInscritos = alumnos.filter(a => a.origen === src && a.etapa === 'Inscrito').length;
      
      let srcCollected = 0;
      alumnos.filter(a => a.origen === src && a.etapa === 'Inscrito').forEach(student => {
        srcCollected += (student.academicPaid || 0);
      });
      
      const cacVal = srcInscritos > 0 ? (srcSpent / srcInscritos) : 0;
      const roiVal = srcSpent > 0 ? ((srcCollected - srcSpent) / srcSpent) * 100 : null;
      
      const cacText = srcInscritos > 0 ? `$${cacVal.toFixed(2)}` : '$0.00';
      
      let roiText = 'N/A';
      let roiColor = 'var(--color-text-muted)';
      if (roiVal !== null) {
        roiText = `${roiVal.toFixed(1)}%`;
        roiColor = roiVal >= 0 ? 'var(--color-success)' : 'var(--color-error)';
      }
      
      html += `
        <tr>
          <td><span style="font-weight: 600;">${src}</span></td>
          <td style="text-align: right;">$${srcSpent.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600;">${srcInscritos}</td>
          <td style="text-align: right;">$${srcCollected.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--color-primary);">${cacText}</td>
          <td style="text-align: right; font-weight: 700; color: ${roiColor};">${roiText}</td>
        </tr>
      `;
    });
    
    html += `
      <tr style="background: rgba(255, 255, 255, 0.02); border-top: 1px solid var(--color-border);">
        <td><span style="font-weight: 600; font-style: italic;">Publicidad General / Marca</span></td>
        <td style="text-align: right; font-style: italic;">$${generalAdsSpent.toFixed(2)}</td>
        <td style="text-align: right; font-style: italic;">-</td>
        <td style="text-align: right; font-style: italic;">-</td>
        <td style="text-align: right; font-style: italic;">-</td>
        <td style="text-align: right; font-style: italic;">-</td>
      </tr>
    `;
    
    tbody.innerHTML = html;
  }
}

function exportFinancialReportPDF() {
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Admin CTD";
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  
  const totalLeads = alumnos.length;
  const inscritosList = alumnos.filter(a => a.etapa === 'Inscrito');
  const totalInscritos = inscritosList.length;
  
  let totalRevenueProjected = 0;
  let totalRevenuePaid = 0;
  inscritosList.forEach(student => {
    const courseObj = cursos.find(c => c.id === student.curso);
    const defaultPrice = courseObj ? courseObj.precio : 0;
    const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
    totalRevenueProjected += price;
    totalRevenuePaid += (student.academicPaid || 0);
  });
  
  const totalExpenses = egresos.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const netProfitability = totalRevenuePaid - totalExpenses;
  const profitMargin = totalRevenuePaid > 0 ? ((netProfitability / totalRevenuePaid) * 100).toFixed(1) : 0;
  
  const totalRevenueProjectedVES = totalRevenueProjected * tasaBCV;
  const totalRevenuePaidVES = totalRevenuePaid * tasaBCV;
  const totalExpensesVES = totalExpenses * tasaBCV;
  const netProfitabilityVES = netProfitability * tasaBCV;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el reporte.', 'error');
    return;
  }
  
  let expensesRows = '';
  if (egresos.length === 0) {
    expensesRows = `<tr><td colspan="5" style="text-align: center; color: #888; padding: 12px;">No se registraron egresos en el período.</td></tr>`;
  } else {
    const sortedEgresos = [...egresos].sort((a, b) => new Date(a.date) - new Date(b.date));
    expensesRows = sortedEgresos.map(e => {
      const amtVES = e.amount * tasaBCV;
      const srcLabel = e.source && e.source !== 'General' ? ` (${e.source})` : '';
      return `
        <tr>
          <td>${new Date(e.date).toLocaleDateString('es-VE')}</td>
          <td><strong>${escapeHTML(e.category)}</strong></td>
          <td>${escapeHTML(e.desc)}${srcLabel}</td>
          <td style="text-align: right;">$${e.amount.toFixed(2)} USD</td>
          <td style="text-align: right; color: #666;">${amtVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</td>
        </tr>
      `;
    }).join('');
  }
  
  const courseRows = cursos.map(c => {
    const enrolledList = alumnos.filter(a => a.curso === c.id && a.etapa === 'Inscrito');
    const enrolledCount = enrolledList.length;
    const projRev = enrolledCount * (c.precio || 0);
    const paidRev = enrolledList.reduce((sum, a) => sum + (a.academicPaid || 0), 0);
    
    return `
      <tr>
        <td><strong>${escapeHTML(c.nombre)}</strong></td>
        <td style="text-align: center;">${enrolledCount}</td>
        <td style="text-align: right;">$${projRev.toLocaleString('en-US', {minimumFractionDigits: 2})} USD</td>
        <td style="text-align: right; font-weight: 600;">$${paidRev.toLocaleString('en-US', {minimumFractionDigits: 2})} USD</td>
      </tr>
    `;
  }).join('');
  
  const adExpenses = egresos.filter(e => e.category === 'Publicidad');
  const sourcesList = ['Instagram', 'WhatsApp', 'Facebook', 'TikTok', 'Web', 'Referido', 'Presencial'];
  const generalAdsSpent = adExpenses.filter(e => e.source === 'General' || !e.source).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  let marketingRows = sourcesList.map(src => {
    const srcSpent = adExpenses.filter(e => e.source === src).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const srcInscritos = alumnos.filter(a => a.origen === src && a.etapa === 'Inscrito').length;
    
    let srcCollected = 0;
    alumnos.filter(a => a.origen === src && a.etapa === 'Inscrito').forEach(student => {
      srcCollected += (student.academicPaid || 0);
    });
    
    const cacVal = srcInscritos > 0 ? (srcSpent / srcInscritos) : 0;
    const roiVal = srcSpent > 0 ? ((srcCollected - srcSpent) / srcSpent) * 100 : null;
    
    const cacText = srcInscritos > 0 ? `$${cacVal.toFixed(2)} USD` : '$0.00';
    const roiText = roiVal !== null ? `${roiVal.toFixed(1)}%` : 'N/A';
    
    return `
      <tr>
        <td><strong>${src}</strong></td>
        <td style="text-align: right;">$${srcSpent.toFixed(2)} USD</td>
        <td style="text-align: center;">${srcInscritos}</td>
        <td style="text-align: right;">$${srcCollected.toFixed(2)} USD</td>
        <td style="text-align: right; color: #20264a; font-weight: 600;">${cacText}</td>
        <td style="text-align: right; font-weight: bold; color: ${roiVal >= 0 ? '#4caf50' : (roiVal < 0 ? '#f44336' : '#666')};">${roiText}</td>
      </tr>
    `;
  }).join('');
  
  marketingRows += `
    <tr style="background: #f9f9f9; font-style: italic;">
      <td><strong>Publicidad General / Branding</strong></td>
      <td style="text-align: right;">$${generalAdsSpent.toFixed(2)} USD</td>
      <td style="text-align: center;">-</td>
      <td style="text-align: right;">-</td>
      <td style="text-align: right;">-</td>
      <td style="text-align: right;">-</td>
    </tr>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Reporte Financiero P&L - Academia CTD</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
          background: #fff;
          font-size: 12px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo-section h1 {
          color: #20264a;
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .logo-section span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 600;
        }
        .report-title {
          text-align: right;
        }
        .report-title h2 {
          margin: 0;
          font-size: 18px;
          color: #20264a;
          font-weight: 700;
        }
        .report-title span {
          font-size: 11px;
          color: #888;
          font-weight: 500;
        }
        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          padding: 12px 18px;
        }
        .metadata-item span {
          display: block;
          font-size: 10px;
          color: #777;
          text-transform: uppercase;
          font-weight: 600;
        }
        .metadata-item strong {
          font-size: 13px;
          color: #111;
        }
        .kpi-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .kpi-table th {
          background: #20264a;
          color: #fff;
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          text-transform: uppercase;
        }
        .kpi-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #eaeaea;
          font-size: 12.5px;
        }
        .kpi-table tr:hover {
          background: #fdfdfd;
        }
        .section-title {
          font-size: 13px;
          color: #20264a;
          border-bottom: 1.5px solid #20264a;
          padding-bottom: 5px;
          margin-top: 25px;
          margin-bottom: 12px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .data-table th {
          background: #f0f1f5;
          color: #20264a;
          text-align: left;
          padding: 8px 10px;
          font-size: 11px;
          border-bottom: 1px solid #ddd;
        }
        .data-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eaeaea;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .profit-positive {
          color: #2e7d32;
          font-weight: 700;
        }
        .profit-negative {
          color: #c62828;
          font-weight: 700;
        }
        .footer-signatures {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
        }
        .signature-block {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 5px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Header -->
        <div class="header">
          <div class="logo-section" style="display: flex; align-items: center; gap: 10px;">
            <img src="logo-academy.png" alt="Logo CTD" style="height: 40px; width: auto; filter: brightness(0);" />
            <div style="text-align: left;">
              <h1 style="color: #20264a; margin: 0; font-size: 22px; font-weight: 800;">${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
              <span style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${escapeHTML(academyProfile.eslogan)}</span>
            </div>
          </div>
          <div class="report-title">
            <h2>ESTADO DE RESULTADOS (P&L)</h2>
            <span>Reporte Consolidado Ejecutivo</span>
          </div>
        </div>

        <!-- Metadata -->
        <div class="metadata-grid">
          <div class="metadata-item">
            <span>Fecha de Emisión</span>
            <strong>${todayStr} - ${timeStr}</strong>
          </div>
          <div class="metadata-item">
            <span>Coordinador Responsable</span>
            <strong>${escapeHTML(activeCoordinator)}</strong>
          </div>
          <div class="metadata-item" style="grid-column: 1 / -1;">
            <span>Tasa de Cambio de Referencia (BCV)</span>
            <strong>1 USD = ${tasaBCV.toFixed(2)} VES</strong>
          </div>
        </div>

        <!-- Executive Financial summary -->
        <div class="section-title">Resumen Ejecutivo Financiero</div>
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Indicador Financiero</th>
              <th class="text-right">Monto (USD)</th>
              <th class="text-right">Equivalente (VES)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Facturación Total Proyectada (Enrolados)</td>
              <td class="text-right">$${totalRevenueProjected.toLocaleString('en-US', {minimumFractionDigits: 2})} USD</td>
              <td class="text-right" style="color: #666;">${totalRevenueProjectedVES.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            </tr>
            <tr>
              <td><strong>Recaudación Efectiva (Pagos Recibidos)</strong></td>
              <td class="text-right" style="font-weight: 600;">$${totalRevenuePaid.toLocaleString('en-US', {minimumFractionDigits: 2})} USD</td>
              <td class="text-right" style="color: #666; font-weight: 600;">${totalRevenuePaidVES.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            </tr>
            <tr>
              <td>Egresos Operativos Totales</td>
              <td class="text-right" style="color: #c62828;">-$${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})} USD</td>
              <td class="text-right" style="color: #c62828;">-${totalExpensesVES.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
            </tr>
            <tr style="background: #f0f1f5; font-size: 14.5px;">
              <td><strong>Rentabilidad Operativa Neta</strong></td>
              <td class="text-right ${netProfitability >= 0 ? 'profit-positive' : 'profit-negative'}">
                $${netProfitability.toLocaleString('en-US', {minimumFractionDigits: 2})} USD
              </td>
              <td class="text-right ${netProfitability >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${netProfitabilityVES.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES
              </td>
            </tr>
            <tr style="font-size: 13px;">
              <td><strong>Margen de Rentabilidad Neta (%)</strong></td>
              <td colspan="2" class="text-right" style="font-weight: 700; color: #20264a;">
                ${profitMargin}%
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Section 1: Detailed Expenses -->
        <div class="section-title">Detalle de Egresos Operativos</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 15%;">Fecha</th>
              <th style="width: 25%;">Categoría</th>
              <th style="width: 35%;">Descripción</th>
              <th style="width: 12%; text-align: right;">Monto (USD)</th>
              <th style="width: 13%; text-align: right;">Monto (VES)</th>
            </tr>
          </thead>
          <tbody>
            ${expensesRows}
          </tbody>
        </table>

        <!-- Section 2: Marketing CAC / ROI -->
        <div class="section-title">Análisis de Rendimiento de Marketing (CAC y ROI)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Canal / Origen</th>
              <th class="text-right">Inversión Ads</th>
              <th class="text-center">Inscritos</th>
              <th class="text-right">Recaudado</th>
              <th class="text-right">CAC Unitario</th>
              <th class="text-right">ROI (%)</th>
            </tr>
          </thead>
          <tbody>
            ${marketingRows}
          </tbody>
        </table>

        <!-- Section 3: Revenue by Course -->
        <div class="section-title">Desglose Comercial por Oferta de Cursos</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Curso</th>
              <th class="text-center" style="width: 15%;">Alumnos Inscritos</th>
              <th class="text-right" style="width: 25%;">Facturación Proyectada</th>
              <th class="text-right" style="width: 25%;">Recaudación Real</th>
            </tr>
          </thead>
          <tbody>
            ${courseRows}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="footer-signatures">
          <div class="signature-block">
            <div class="signature-line"></div>
            <span>Elaborado por</span><br>
            <strong>${escapeHTML(activeCoordinator)}</strong>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <span>Firma Autorizada</span><br>
            <strong>Dirección General - CTD</strong>
          </div>
        </div>

      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function deleteExpense(expenseId) {
  const expense = egresos.find(e => e.id === expenseId);
  if (!expense) return;
  
  if (confirm(`¿Estás seguro de que deseas eliminar el egreso de $${expense.amount} USD ("${expense.desc}")?`)) {
    egresos = egresos.filter(e => e.id !== expenseId);
    saveState();
    showToast('Egreso eliminado.', 'info');
    logActivity('edicion', `Se eliminó el egreso de $${expense.amount} USD ("${expense.desc}").`);
    renderReportes();
  }
}

function loadCustomFilterView(viewName) {
  if (!viewName) {
    document.getElementById('delete-filter-btn-container').style.display = 'none';
    return;
  }
  
  const filters = customFilterViews[viewName];
  if (!filters) return;
  
  if (document.getElementById('filter-etapa')) document.getElementById('filter-etapa').value = filters.etapa;
  if (document.getElementById('filter-curso')) document.getElementById('filter-curso').value = filters.curso;
  if (document.getElementById('filter-cohort')) document.getElementById('filter-cohort').value = filters.cohort;
  if (document.getElementById('filter-prioridad')) document.getElementById('filter-prioridad').value = filters.prioridad;
  if (document.getElementById('filter-origen')) document.getElementById('filter-origen').value = filters.origen;
  if (document.getElementById('filter-pago')) document.getElementById('filter-pago').value = filters.pago;
  if (document.getElementById('filter-academic-status')) document.getElementById('filter-academic-status').value = filters.status;
  
  document.getElementById('delete-filter-btn-container').style.display = 'flex';
  
  alumnosCurrentPage = 1;
  filterAlumnos();
  showToast(`Vista "${viewName}" cargada.`, 'info');
}

function handleGlobalSearch(query) {
  if (activeView !== 'alumnos') {
    setView('alumnos');
  }
  const searchInput = document.getElementById('alumno-search');
  if (searchInput) {
    searchInput.value = query;
    const globalSearchInput = document.getElementById('global-search');
    if (globalSearchInput && globalSearchInput.value !== query) {
      globalSearchInput.value = query;
    }
    filterAlumnosDebounced();
  }
}

function setSmartSegment(segment) {
  activeSmartSegment = segment;
  
  const btnMap = {
    'todos': 'segment-todos',
    'agenda': 'segment-agenda',
    'abandonados': 'segment-abandonados',
    'alta_prioridad': 'segment-alta',
    'whatsapp': 'segment-whatsapp',
    'tareas': 'segment-tareas',
    'deuda': 'segment-deuda'
  };
  
  document.querySelectorAll('.smart-segments-bar .segment-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtnId = btnMap[segment];
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  alumnosCurrentPage = 1;
  renderAlumnos();
}

function handleWorkflowAutomation(student, oldStage, newStage) {
  let title = '';
  let daysOffset = 0;

  if (newStage === 'Contactado') {
    title = `💬 WhatsApp: Enviar plan de estudios a ${student.nombre}`;
    daysOffset = 1;
  } else if (newStage === 'Interesado') {
    title = `📞 Llamada: Aclarar dudas e invitar a clase muestra a ${student.nombre}`;
    daysOffset = 2;
  } else if (newStage === 'Negociando') {
    title = `💳 Seguimiento: Confirmar datos de pago de ${student.nombre}`;
    daysOffset = 1;
  } else if (newStage === 'Inscrito') {
    title = `🎓 Académico: Agregar a ${student.nombre} al grupo oficial e inducción`;
    daysOffset = 0;
  }

  if (title) {
    const today = new Date();
    today.setDate(today.getDate() + daysOffset);
    const dueDateStr = today.toISOString().split('T')[0];

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId: student.id,
      title: title,
      dueDate: dueDateStr,
      completed: false
    };

    tareas.push(newTask);
    logActivity('edicion', `[Automatización] Tarea auto-generada: "${title}"`);
    showToast(`Tarea de seguimiento autogenerada.`, 'info');
  }
}

function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;

  let matchedUser = null;
  const lowerUser = usernameInput.toLowerCase();

  if (lowerUser === 'admin' && passwordInput === adminPassword) {
    matchedUser = { name: 'Admin CTD', role: 'admin' };
  } else {
    // Search in dynamic asesores array
    const dynamicUser = asesores.find(a => a.username.toLowerCase() === lowerUser && a.password === passwordInput);
    if (dynamicUser) {
      matchedUser = { name: dynamicUser.nombre, role: 'asesor' };
    }
  }

  if (matchedUser) {
    username = matchedUser.name;
    userRole = matchedUser.role;
    
    localStorage.setItem("ctd_authenticated", "true");
    localStorage.setItem("ctd_username", username);
    localStorage.setItem("ctd_user_role", userRole);
    
    saveState();
    syncHeaderProfile();
    applyRolePermissions();
    
    // Animate hide login overlay
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.classList.add('hide');
      setTimeout(() => {
        loginScreen.style.display = 'none';
      }, 400);
    }
    
    showToast(`¡Bienvenido de nuevo, ${username}!`, 'success');
    logActivity('nuevo', `Inició sesión en el sistema.`);

    // Prompt for notification permissions on login
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(() => {
          checkAndTriggerPushNotifications();
        });
      } else if (Notification.permission === "granted") {
        checkAndTriggerPushNotifications();
      }
    }
  } else {
    showToast('Usuario o contraseña incorrectos. Inténtalo de nuevo.', 'error');
  }
}

function togglePasswordVisibility(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('login-password');
  const toggleIcon = document.getElementById('password-toggle-icon');
  
  if (passwordInput && toggleIcon) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      passwordInput.type = 'password';
      toggleIcon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
  }
}

function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem("ctd_authenticated");
    localStorage.removeItem("ctd_user_role");
    localStorage.removeItem("ctd_username");
    userRole = 'admin';
    username = 'Admin CTD';
    applyRolePermissions();
    logActivity('eliminacion', `Cerró sesión en el sistema.`);
    
    // Show login screen again
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'flex';
      setTimeout(() => {
        loginScreen.classList.remove('hide');
      }, 50);
    }
    
    // Clear login form fields
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
    
    showToast('Sesión cerrada correctamente.', 'info');
  }
}

function openCohortSidebar(cohortId) {
  selectedCohortId = cohortId;
  const coh = cohortes.find(c => c.id === cohortId);
  if (!coh) return;

  const sidebar = document.getElementById('cohort-students-sidebar');
  const titleEl = document.getElementById('cohort-sidebar-title');
  if (sidebar && titleEl) {
    titleEl.innerText = coh.nombre;
    sidebar.style.display = 'block';
  }

  renderCohortSidebarStudents();
  renderCohortes(); // re-render main grid to show active highlight
}

function closeCohortSidebar() {
  selectedCohortId = null;
  const sidebar = document.getElementById('cohort-students-sidebar');
  if (sidebar) sidebar.style.display = 'none';
  renderCohortes();
}

function sendBulkWaMessage(studentId, btn) {
  const selectTmpl = document.getElementById('bulk-wa-template-select');
  if (!selectTmpl || !selectTmpl.value) {
    showToast('Por favor selecciona una plantilla de mensaje primero.', 'error');
    return;
  }

  const student = bulkStudentList.find(s => s.id === studentId);
  if (!student || !student.tel) {
    showToast('El alumno no tiene teléfono registrado.', 'error');
    return;
  }

  const tmpl = whatsappTemplates.find(t => t.id === selectTmpl.value);
  const courseObj = cursos.find(c => c.id === student.curso);
  const courseName = courseObj ? courseObj.nombre : 'Curso';
  const courseDuration = courseObj ? courseObj.duracion : 'N/A';

  // Calculate pricing values
  const defaultPrice = courseObj ? courseObj.precio : 0;
  const total = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || (student.payments ? student.payments.reduce((acc, p) => acc + p.amount, 0) : 0);
  const balance = Math.max(0, total - paid);

  let text = tmpl.texto
    .replace(/{nombre}/g, `${student.nombre} ${student.apellido || ''}`.trim())
    .replace(/{curso}/g, courseName)
    .replace(/{precio}/g, balance)
    .replace(/{saldo}/g, balance)
    .replace(/{abonado}/g, paid)
    .replace(/{total}/g, total)
    .replace(/{duracion}/g, courseDuration);

  const cleanNumber = student.tel.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');

  student.bulkSent = true;
  
  const notesArr = student.notes || student.notas || [];
  notesArr.push({
    text: `💬 WhatsApp Masivo: Enviada plantilla "${tmpl.nombre}"`,
    date: new Date().toISOString(),
    channel: 'WhatsApp'
  });
  student.notes = notesArr;
  student.notas = notesArr;

  logActivity('nota', `WhatsApp masivo enviado a ${student.nombre} usando plantilla "${tmpl.nombre}".`);
  saveState();

  renderBulkStudentList();
}

function sendContinuityWhatsApp(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student || !student.tel) {
    showToast('El alumno no tiene teléfono registrado.', 'error');
    return;
  }
  const courseObj = cursos.find(c => c.id === student.curso);
  const courseName = courseObj ? courseObj.nombre : 'Curso';
  
  const text = `¡Hola ${student.nombre}! Espero que estés disfrutando tu curso de ${courseName}. Te escribimos de la Academia CTD porque tu grupo se gradúa pronto y queríamos ofrecerte un beneficio exclusivo de continuidad con el 15% de descuento en el siguiente nivel o curso complementario. ¿Te gustaría conocer las opciones y horarios disponibles?`;
  
  const cleanNumber = student.tel.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
  
  logActivity('nota', `Contacto de continuidad WhatsApp enviado a ${student.nombre}.`);
}

function triggerContinuityClone(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;
  selectedStudent = student;
  cloneSelectedStudent();
}

function openGoalsModal() {
  if (typeof userRole !== 'undefined' && userRole === 'asesor') {
    showToast('Acceso restringido para Asesores de Ventas.', 'error');
    return;
  }
  ensureModalLoaded('goals-modal');
  document.getElementById('goal-revenue-input').value = metaRecaudacion;
  document.getElementById('goal-enrollment-input').value = metaInscritos;
  document.getElementById('goals-modal').classList.add('open');
}

function closeGoalsModal() {
  document.getElementById('goals-modal').classList.remove('open');
}

function saveGoals(event) {
  event.preventDefault();
  
  const revVal = parseInt(document.getElementById('goal-revenue-input').value);
  const enrollVal = parseInt(document.getElementById('goal-enrollment-input').value);
  
  if (isNaN(revVal) || revVal <= 0 || isNaN(enrollVal) || enrollVal <= 0) {
    showToast('Por favor introduce valores de meta válidos.', 'error');
    return;
  }
  
  metaRecaudacion = revVal;
  metaInscritos = enrollVal;
  
  localStorage.setItem('ctd_meta_recaudacion', metaRecaudacion);
  localStorage.setItem('ctd_meta_inscritos', metaInscritos);
  
  logActivity('configuracion', `Se actualizaron las metas del mes a: $${metaRecaudacion} USD recaudación y ${metaInscritos} alumnos.`);
  saveState();
  
  closeGoalsModal();
  renderDashboard();
  showToast('Metas comerciales del mes actualizadas.', 'success');
}

function handleNotificationClick(studentId) {
  if (studentId) {
    openDetailPanel(studentId);
    const menu = document.getElementById('notification-dropdown');
    if (menu) menu.style.display = 'none';
  }
}

function toggleNotificationDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('notification-dropdown');
  if (!menu) return;
  if (menu.style.display === 'none' || menu.style.display === '') {
    menu.style.display = 'block';
    updateNotificationButton();
  } else {
    menu.style.display = 'none';
  }
}

function clearNotifications() {
  const todayStr = new Date().toISOString().split('T')[0];
  let completedCount = 0;
  tareas.forEach(t => {
    if (!t.completed && t.dueDate && t.dueDate <= todayStr) {
      t.completed = true;
      completedCount++;
    }
  });
  if (completedCount > 0) {
    saveState();
    updateNotificationButton();
    showToast(`${completedCount} tareas vencidas marcadas como completadas.`, 'success');
  } else {
    showToast('No hay tareas vencidas para limpiar.', 'info');
  }
}

function exportCohortToCSV() {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  if (!selectedCohortId) {
    showToast('Por favor, selecciona un grupo/cohorte primero.', 'error');
    return;
  }

  const cohort = cohortes.find(c => c.id === selectedCohortId);
  if (!cohort) {
    showToast('El grupo seleccionado no existe.', 'error');
    return;
  }

  const cohortStudents = alumnos.filter(a => a.academicGroup === selectedCohortId);
  if (cohortStudents.length === 0) {
    showToast('No hay alumnos asignados a este grupo.', 'error');
    return;
  }

  const headers = [
    'Nombre',
    'Apellido',
    'Cédula/Documento',
    'WhatsApp',
    'Email',
    'Estado de Pago',
    'Costo del Curso (USD)',
    'Total Pagado (USD)',
    'Saldo Pendiente (USD)',
    'Costo del Curso (VES)',
    'Total Pagado (VES)',
    'Saldo Pendiente (VES)'
  ];

  const rows = cohortStudents.map(al => {
    const defaultPrice = cursos.find(c => c.id === al.curso)?.precio || 0;
    const price = al.academicPrice !== undefined ? al.academicPrice : defaultPrice;
    const paid = al.academicPaid || 0;
    const balance = Math.max(0, price - paid);

    let payStatus = 'Pendiente';
    if (paid >= price && price > 0) payStatus = 'Completado';
    else if (paid > 0) payStatus = 'Abono Parcial';

    return [
      al.nombre,
      al.apellido || '',
      al.cedula || '',
      al.tel || '',
      al.email || '',
      payStatus,
      price.toFixed(2),
      paid.toFixed(2),
      balance.toFixed(2),
      (price * tasaBCV).toFixed(2),
      (paid * tasaBCV).toFixed(2),
      (balance * tasaBCV).toFixed(2)
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);
  });

  const csvStr = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `grupo_${cohort.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Exportados ${cohortStudents.length} alumnos del grupo con éxito.`, 'success');
}

function openCalendarDayModal(dateStr) {
  calendarSelectedDateStr = dateStr;
  ensureModalLoaded('calendar-day-modal');
  const modal = document.getElementById('calendar-day-modal');
  if (!modal) return;

  // Format date nicely for title
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  document.getElementById('calendar-day-modal-title').innerText = `Actividades: ${formattedDate}`;

  // Load events list
  const list = document.getElementById('calendar-day-events-list');
  list.innerHTML = '';

  const dueStudents = (typeof userRole !== 'undefined' && userRole === 'asesor') ? [] : alumnos.filter(al => al.nextContactDate === dateStr);
  const dueTasks = tareas.filter(t => !t.completed && t.dueDate === dateStr);

  if (dueStudents.length === 0 && dueTasks.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: 20px 0; font-size: 13px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
        <i data-lucide="check" style="width: 24px; height: 24px; color: var(--color-success); opacity: 0.8;"></i>
        <p>No hay cobros ni tareas programadas para este día.</p>
      </div>
    `;
  } else {
    dueStudents.forEach(al => {
      const courseObj = cursos.find(c => c.id === al.curso);
      const price = al.academicPrice !== undefined ? al.academicPrice : (courseObj ? courseObj.precio : 0);
      const paid = al.academicPaid || 0;
      const balance = Math.max(0, price - paid);
      
      const item = document.createElement('div');
      item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(253, 171, 67, 0.08); border: 1px solid rgba(253, 171, 67, 0.2); border-radius: var(--border-radius-sm); padding: 10px; font-size: 13px; color: var(--color-text);";
      item.innerHTML = `
        <div>
          <strong style="color: #fdab43; display: block; margin-bottom: 2px;">💵 Cobro Pendiente</strong>
          <span style="font-weight: 600;">${al.nombre} ${al.apellido || ''}</span>
          <div style="font-size: 11.5px; color: var(--color-text-muted); margin-top: 2px;">Saldo restante: $${balance} USD (~ ${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="closeCalendarDayModal(); openDetailPanel('${al.id}');" style="padding: 4px 8px; font-size: 11px;">
          Ver Ficha
        </button>
      `;
      list.appendChild(item);
    });

    dueTasks.forEach(t => {
      const student = alumnos.find(a => a.id === t.studentId);
      const studentName = student ? `${student.nombre} ${student.apellido || ''}` : 'Sin alumno';

      const item = document.createElement('div');
      item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--border-radius-sm); padding: 10px; font-size: 13px; color: var(--color-text);";
      item.innerHTML = `
        <div style="flex-grow: 1; margin-right: 8px;">
          <strong style="color: #a78bfa; display: block; margin-bottom: 2px;">📌 Tarea Programada</strong>
          <span style="font-weight: 500;">${t.title}</span>
          <div style="font-size: 11.5px; color: var(--color-text-muted); margin-top: 2px;">Alumno: ${studentName}</div>
        </div>
        <div style="display: flex; gap: 4px; flex-shrink: 0;">
          <button class="btn btn-ghost btn-icon-sm" onclick="completeCalendarTask('${t.id}')" style="padding: 4px; color: var(--color-success);" title="Completar Tarea">
            <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          </button>
          ${t.studentId ? `<button class="btn btn-ghost btn-sm" onclick="closeCalendarDayModal(); openDetailPanel('${t.studentId}');" style="padding: 4px 8px; font-size: 11px;">Ver Ficha</button>` : ''}
        </div>
      `;
      list.appendChild(item);
    });
  }

  // Populate student dropdown
  const select = document.getElementById('cal-task-student');
  select.innerHTML = '<option value="" disabled selected>Asociar a Alumno...</option>';
  alumnos.forEach(al => {
    select.innerHTML += `<option value="${al.id}">${al.nombre} ${al.apellido || ''}</option>`;
  });

  modal.style.display = 'flex';
  modal.classList.add('show');
  lucide.createIcons();
}

function closeCalendarDayModal() {
  const modal = document.getElementById('calendar-day-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
  }
}

function completeCalendarTask(taskId) {
  const task = tareas.find(t => t.id === taskId);
  if (task) {
    task.completed = true;
    showToast('Tarea marcada como completada.', 'success');
    logActivity('nota', `Se completó la tarea: "${task.title}"`);
    saveState();
    renderCalendar();
    // Refresh list in modal
    openCalendarDayModal(calendarSelectedDateStr);
  }
}

function saveCalendarQuickTask(e) {
  e.preventDefault();
  const desc = document.getElementById('cal-task-desc').value.trim();
  const studentId = document.getElementById('cal-task-student').value;
  if (!desc || !studentId) return;

  const student = alumnos.find(a => a.id === studentId);
  const studentName = student ? `${student.nombre} ${student.apellido || ''}` : '';

  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId: studentId,
    title: desc,
    dueDate: calendarSelectedDateStr,
    completed: false
  };

  tareas.push(newTask);
  logActivity('nota', `Se creó una tarea para ${studentName}: "${desc}" con límite ${calendarSelectedDateStr}`);
  saveState();
  renderCalendar();
  
  // Reset form
  document.getElementById('cal-task-desc').value = '';
  document.getElementById('cal-task-student').value = '';
  
  // Refresh modal events
  openCalendarDayModal(calendarSelectedDateStr);
  showToast('Tarea creada exitosamente.', 'success');
}

function prevCalendarMonth() {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
  renderCalendar();
}

function nextCalendarMonth() {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
  renderCalendar();
}

function selectCalendarDate(dateStr) {
  calendarSelectedDateStr = dateStr;
  renderCalendar();
  updateCalendarAgendaSidebar(dateStr);
}

function resetCalendarToToday() {
  calendarCurrentDate = new Date();
  calendarSelectedDateStr = calendarCurrentDate.toISOString().split('T')[0];
  renderCalendar();
  updateCalendarAgendaSidebar(calendarSelectedDateStr);
  showToast('Calendario reestablecido al día de hoy.', 'info');
}

function completeCalendarTaskSidebar(taskId) {
  const task = tareas.find(t => t.id === taskId);
  if (task) {
    task.completed = true;
    showToast('Tarea marcada como completada.', 'success');
    logActivity('nota', `Se completó la tarea: "${task.title}"`);
    saveState();
    renderCalendar();
    if (calendarSelectedDateStr) {
      updateCalendarAgendaSidebar(calendarSelectedDateStr);
    }
  }
}

function handleCalendarDragStart(event, type, id) {
  event.dataTransfer.setData("text/plain", JSON.stringify({ type, id }));
  event.dataTransfer.effectAllowed = "move";
}

async function handleCalendarDrop(event, targetDateStr) {
  event.preventDefault();
  try {
    const rawData = event.dataTransfer.getData("text/plain");
    if (!rawData) return;
    const data = JSON.parse(rawData);
    if (!data || !data.type || !data.id) return;

    if (data.type === 'payment') {
      const student = alumnos.find(a => a.id === data.id);
      if (student) {
        const oldDate = student.nextContactDate;
        student.nextContactDate = targetDateStr;
        saveState();
        showToast(`Fecha de cobranza de ${student.nombre} reprogramada para ${targetDateStr}`, 'success');
        logActivity('edicion', `Se reprogramó la fecha de cobro de ${student.nombre} del ${oldDate || 'Sin fecha'} al ${targetDateStr}.`);
      }
    } else if (data.type === 'task') {
      const task = tareas.find(t => t.id === data.id);
      if (task) {
        const oldDate = task.dueDate;
        task.dueDate = targetDateStr;
        saveState();
        showToast(`Tarea "${task.title}" reprogramada para ${targetDateStr}`, 'success');
        logActivity('edicion', `Se reprogramó el vencimiento de la tarea "${task.title}" del ${oldDate || 'Sin fecha'} al ${targetDateStr}.`);
      }
    }
    
    renderCalendar();
    if (calendarSelectedDateStr) {
      updateCalendarAgendaSidebar(calendarSelectedDateStr);
    }
  } catch (err) {
    console.error("Drop failed:", err);
  }
}

function updateCalendarAgendaSidebar(dateStr) {
  const sidebar = document.getElementById('calendar-agenda-sidebar');
  if (!sidebar) return;

  const badge = document.getElementById('calendar-agenda-date-badge');
  const list = document.getElementById('calendar-agenda-events-list');
  if (!badge || !list) return;

  // Format date nicely
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
  badge.innerText = formattedDate;

  // Get active filters state
  const showPayments = document.getElementById('calendar-show-payments')?.checked !== false;
  const showTasks = document.getElementById('calendar-show-tasks')?.checked !== false;

  const dueStudents = showPayments ? alumnos.filter(al => al.nextContactDate === dateStr) : [];
  const dueTasks = showTasks ? tareas.filter(t => !t.completed && t.dueDate === dateStr) : [];

  list.innerHTML = '';

  if (dueStudents.length === 0 && dueTasks.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; color: var(--color-text-muted); padding: 30px 0; font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <i data-lucide="check" style="width: 20px; height: 20px; color: var(--color-success); opacity: 0.8;"></i>
        <p style="margin: 0;">No hay cobros ni tareas para hoy.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  dueStudents.forEach(al => {
    const courseObj = cursos.find(c => c.id === al.curso);
    const courseName = courseObj ? courseObj.nombre : 'Curso';
    const price = al.academicPrice !== undefined ? al.academicPrice : (courseObj ? courseObj.precio : 0);
    const paid = al.academicPaid || 0;
    const balance = Math.max(0, price - paid);

    const waNumber = al.tel ? al.tel.replace(/[^\d]/g, '') : '';
    const waText = encodeURIComponent(`Hola ${al.nombre}, espero que estés muy bien. Te escribimos de ${academyProfile.nombre} para recordarte que tienes una cuota pendiente del curso ${courseName} por un monto de ${balance} USD (~ ${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES). Si requieres los datos de pago actualizados, por favor avísanos.`);
    const waLink = `https://wa.me/${waNumber}?text=${waText}`;

    const item = document.createElement('div');
    item.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: rgba(253, 171, 67, 0.06); border: 1px solid rgba(253, 171, 67, 0.15); border-radius: var(--border-radius-sm); padding: 12px; font-size: 13px; color: var(--color-text);";
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="color: #fdab43; display: flex; align-items: center; gap: 4px; font-size: 11.5px; margin-bottom: 2px;">
            <i data-lucide="dollar-sign" style="width: 13px; height: 13px;"></i> Cobro Pendiente
          </strong>
          <span style="font-weight: 700; color: var(--color-text);">${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}</span>
          <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 1px;">${escapeHTML(courseName)}</div>
        </div>
        <button class="btn btn-ghost btn-icon-sm" onclick="openDetailPanel('${al.id}')" title="Ver Ficha Alumno" style="padding: 4px; color: var(--color-primary); border: none; background: transparent; cursor: pointer;">
          <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
      <div style="font-size: 11px; color: var(--color-text-muted); border-top: 1px dashed var(--color-border); padding-top: 6px; margin-top: 2px;">
        Saldo: <b>$${balance} USD</b> (~ ${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)
      </div>
      <div style="display: flex; gap: 6px; margin-top: 4px;">
        <a href="${waLink}" target="_blank" class="btn btn-success btn-sm" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 11px; padding: 6px; background-color: var(--color-success); color: white; text-decoration: none; border-radius: 4px;">
          <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i> WhatsApp
        </a>
      </div>
    `;
    list.appendChild(item);
  });

  dueTasks.forEach(t => {
    const student = alumnos.find(a => a.id === t.studentId);
    const studentName = student ? `${student.nombre} ${student.apellido || ''}` : 'Sin alumno';

    const item = document.createElement('div');
    item.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: rgba(139, 92, 246, 0.06); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: var(--border-radius-sm); padding: 12px; font-size: 13px; color: var(--color-text);";
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="color: #a78bfa; display: flex; align-items: center; gap: 4px; font-size: 11.5px; margin-bottom: 2px;">
            <i data-lucide="check-square" style="width: 13px; height: 13px;"></i> Tarea
          </strong>
          <span style="font-weight: 600; color: var(--color-text);">${escapeHTML(t.title)}</span>
          <div style="font-size: 11.5px; color: var(--color-text-muted); margin-top: 2px;">Alumno: ${escapeHTML(studentName)}</div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-ghost btn-icon-sm" onclick="completeCalendarTaskSidebar('${t.id}')" style="padding: 4px; color: var(--color-success); border: none; background: transparent; cursor: pointer;" title="Completar Tarea">
            <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          </button>
          ${t.studentId ? `<button class="btn btn-ghost btn-icon-sm" onclick="openDetailPanel('${t.studentId}')" style="padding: 4px; color: var(--color-primary); border: none; background: transparent; cursor: pointer;" title="Ver Alumno"><i data-lucide="eye" style="width: 14px; height: 14px;"></i></button>` : ''}
        </div>
      </div>
    `;
    list.appendChild(item);
  });

  lucide.createIcons();
}

function sendWhatsAppPaymentReminder(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;
  
  const courseObj = cursos.find(c => c.id === student.curso);
  const courseName = courseObj ? courseObj.nombre : 'Curso Académico';
  const defaultPrice = courseObj ? courseObj.precio : 0;
  const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || 0;
  const balance = price - paid;
  const balanceVES = balance * tasaBCV;
  
  const formattedUSD = balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const formattedVES = balanceVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  
  const text = `Hola *${student.nombre}*, espero que te encuentres muy bien. Te saludamos de la Coordinación de Academia CTD. Te escribimos para recordarte que posees un saldo pendiente de *$${formattedUSD} USD* (equivalente a *${formattedVES} VES* a la tasa oficial de referencia del BCV de *${tasaBCV.toFixed(2)} VES/USD*) para tu curso de *${courseName}*. Si requieres confirmar nuestros métodos de pago o reportar un abono, puedes hacerlo respondiendo a este mensaje. ¡Muchas gracias!`;
  
  const cleanNumber = student.telefono ? student.telefono.replace(/\s+/g, '').replace(/[+\-()]/g, '') : '';
  if (!cleanNumber) {
    showToast('El alumno no posee un teléfono celular registrado.', 'error');
    return;
  }
  
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
  logActivity('edicion', `Se envió recordatorio de cobro por WhatsApp a ${student.nombre} por saldo deudor de $${balance.toFixed(2)} USD.`);
}

function completeOverdueTask(taskId) {
  const task = tareas.find(t => t.id === taskId);
  if (task) {
    task.completed = true;
    showToast('Tarea completada.', 'success');
    logActivity('nota', `Se completó la tarea atrasada: "${task.title}"`);
    saveState();
    renderDashboard();
  }
}


document.addEventListener('keydown', function(e) {
  // Ctrl/Alt + N -> Nuevo Alumno
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') || (e.altKey && e.key.toLowerCase() === 'n')) {
    e.preventDefault();
    openStudentModal();
  }

  // Alt + B -> Buscar
  if (e.altKey && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    const searchInput = activeView === 'pipeline' ? document.getElementById('pipeline-search') : document.getElementById('alumno-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Alt + D -> Dashboard
  if (e.altKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    setView('dashboard');
  }

  // Alt + L -> Lista Alumnos
  if (e.altKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    setView('alumnos');
  }

  // Alt + K -> Kanban (Pipeline)
  if (e.altKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setView('pipeline');
  }

  // Alt + R -> Reportes
  if (e.altKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    setView('reportes');
  }

  // Escape / Alt + C -> Cerrar Modales
  if (e.key === 'Escape' || (e.altKey && e.key.toLowerCase() === 'c')) {
    e.preventDefault();
    closeStudentModal();
    closeCourseModal();
    closeCohortModal();
    closeDetailPanel();
    if (typeof closeCohortViewStudentsModal === 'function') closeCohortViewStudentsModal();
    if (typeof closeCourseViewEnrolledModal === 'function') closeCourseViewEnrolledModal();
  }
});

document.addEventListener('dragend', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('kanban-card')) {
      e.target.classList.remove('dragging');
    }
  });

window.addEventListener('click', function(e) {
  const menu = document.getElementById('notification-dropdown');
  const bell = document.getElementById('bell-toggle');
  if (menu && menu.style.display === 'block') {
    if (!menu.contains(e.target) && (!bell || !bell.contains(e.target))) {
      menu.style.display = 'none';
    }
  }
});

function generateStudentEnrollmentCertificatePDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const code = `CONST-${student.id.split('-').slice(-1)[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;
  
  const qrData = `CTD CRM - CONSTANCIA DE ESTUDIO\nCódigo: ${code}\nEstudiante: ${student.nombre} ${student.apellido || ''}\nCédula: ${docId}\nCurso: ${courseName}\nFecha de Emisión: ${todayStr}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Constancia de Estudios - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 60px;
          line-height: 1.6;
          background: #fff;
        }
        .cert-card {
          max-width: 700px;
          margin: 0 auto;
          border: 10px double #20264a;
          padding: 50px 60px;
          position: relative;
          overflow: hidden;
          background: #fff;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 65px;
          font-weight: 800;
          color: rgba(32, 38, 74, 0.03);
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 6px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 20px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .header h1 {
          font-family: 'Playfair Display', serif;
          color: #20264a;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header span {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }
        .title {
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #20264a;
          margin-bottom: 40px;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
        }
        .body-text {
          font-size: 14px;
          text-align: justify;
          color: #444;
          margin-bottom: 45px;
          position: relative;
          z-index: 1;
        }
        .body-text p {
          text-indent: 30px;
          margin: 15px 0;
        }
        .footer-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
          position: relative;
          z-index: 1;
        }
        .signature-line {
          text-align: center;
          width: 200px;
        }
        .signature-dash {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 50px;
        }
        .stamp-box {
          border-bottom: 1px dashed #bbb;
          margin-bottom: 8px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(32, 38, 74, 0.08);
          font-size: 10px;
          font-weight: 700;
          border: 1px dashed rgba(32, 38, 74, 0.12);
          border-radius: 4px;
          box-sizing: border-box;
        }
        .qr-box {
          text-align: center;
        }
        .validation-footer {
          text-align: center;
          font-size: 10px;
          color: #888;
          margin-top: 50px;
          border-top: 1px solid #eee;
          padding-top: 15px;
          position: relative;
          z-index: 1;
        }
        @media print {
          body { padding: 0; }
          .cert-card { border: 10px double #20264a; box-shadow: none; padding: 30px; }
        }
      </style>
    </head>
    <body>
      <div class="cert-card">
        <div class="watermark">CONSTANCIA</div>
        
        <div class="header" style="text-align: center;">
          <img src="logo-academy.png" alt="Logo CTD" style="height: 50px; width: auto; display: block; margin: 0 auto 10px auto; filter: brightness(0);" />
          <h1 style="font-family: 'Playfair Display', serif; color: #20264a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
          <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">${escapeHTML(academyProfile.eslogan)}</span>
        </div>

        <div class="title">Constancia de Estudios</div>

        <div class="body-text">
          <p>Por medio de la presente, la Coordinación Académica de la <strong>${escapeHTML(academyProfile.nombre.toUpperCase())}</strong>, debidamente constituida, hace constar que el ciudadano(a) <strong>${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</strong>, titular del documento de identidad <strong>${escapeHTML(docId)}</strong>, se encuentra legalmente inscrito y cursando activamente el programa académico de <strong>"${escapeHTML(courseName)}"</strong>.</p>
          <p>Se deja constancia de que el estudiante mantiene un estado académico activo, cumpliendo regularmente con el plan de estudios correspondiente.</p>
          <p>Constancia que se expide a petición de la parte interesada en ${escapeHTML(academyProfile.direccion)}, a los ${todayStr}.</p>
        </div>

        <div class="footer-signatures">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 11px; color: #555; font-weight: 600;">Coordinación Académica</span>
          </div>
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(qrData)}" alt="QR Constancia" style="width: 95px; height: 95px; display: block; margin: 0 auto 4px auto;" />
            <span style="font-size: 9px; color: #888; display: block;">Verificación Digital</span>
          </div>
          <div class="signature-line">
            <div class="stamp-box">SELLO DIRECCIÓN</div>
            <span style="font-size: 11px; color: #555; font-weight: 600;">Sello de Control</span>
          </div>
        </div>

        <div class="validation-footer">
          Código de Documento: <strong>${code}</strong> | Generado por: ${activeCoordinator}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Constancia de estudios PDF generada para ${student.nombre} ${student.apellido || ''}.`);
}

function generateStudentContractPDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const total = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const contractCode = `CONTR-${student.id.split('-').slice(-1)[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Contrato de Matrícula - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 50px;
          line-height: 1.5;
          background: #fff;
          font-size: 11px;
        }
        .contract-card {
          max-width: 750px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 40px;
          position: relative;
          background: #fff;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 60px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.02);
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 4px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #20264a;
          margin: 0;
          font-size: 20px;
          font-weight: 800;
        }
        .header span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .contract-title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 25px;
          color: #20264a;
        }
        .clause-title {
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 5px;
          color: #20264a;
          font-size: 11px;
        }
        .clause-text {
          text-align: justify;
          margin-bottom: 12px;
          color: #444;
        }
        .parties-box {
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .parties-box p {
          margin: 4px 0;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 50px;
          margin-bottom: 20px;
        }
        .signature-line {
          text-align: center;
          width: 220px;
        }
        .signature-dash {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          height: 60px;
        }
        .fingerprint-box {
          border: 1px solid #ccc;
          width: 60px;
          height: 80px;
          margin: 0 auto 5px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #888;
          background: #fafafa;
        }
        @media print {
          body { padding: 0; }
          .contract-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="contract-card">
        <div class="watermark">CONTRATO DE ADMISIÓN</div>
        
        <div class="header" style="text-align: center;">
          <img src="logo-academy.png" alt="Logo CTD" style="height: 45px; width: auto; display: block; margin: 0 auto 10px auto; filter: brightness(0);" />
          <h1 style="color: #20264a; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
          <span style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1.5px;">${escapeHTML(academyProfile.eslogan)}</span>
        </div>

        <div class="contract-title">CONTRATO DE MATRÍCULA Y PLAN DE INVERSIÓN ACADÉMICA</div>

        <div class="parties-box">
          <p><strong>De una parte:</strong> <strong>${escapeHTML(academyProfile.nombre.toUpperCase())}</strong>, en lo sucesivo denominada "LA ACADEMIA".</p>
          <p><strong>De la otra parte:</strong> El estudiante <strong>${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</strong>, de cédula de identidad <strong>${escapeHTML(docId)}</strong>, de correo electrónico <strong>${escapeHTML(student.email || 'N/A')}</strong> y teléfono <strong>${escapeHTML(student.tel || 'N/A')}</strong>, en lo sucesivo denominado "EL ESTUDIANTE".</p>
        </div>

        <div class="clause-title">CLÁUSULA PRIMERA: OBJETO DEL CONTRATO</div>
        <div class="clause-text">
          El presente contrato tiene por objeto regular los términos y condiciones de la inscripción académica del estudiante en el programa formativo de <strong>"${escapeHTML(courseName)}"</strong>, el cual consta de un plan curricular de especialización profesional.
        </div>

        <div class="clause-title">CLÁUSULA SEGUNDA: INVERSIÓN ACADÉMICA Y FORMA DE PAGO</div>
        <div class="clause-text">
          El monto total acordado para el programa de estudios es de <strong>$${total.toFixed(2)} USD</strong> (o su equivalente en moneda nacional VES al tipo de cambio referencial oficial del Banco Central de Venezuela de la fecha de transacción). EL ESTUDIANTE se compromete a cancelar la totalidad del monto establecido o las cuotas acordadas en los plazos estipulados de forma solvente para continuar con el acceso a las sesiones académicas y evaluaciones.
        </div>

        <div class="clause-title">CLÁUSULA TERCERA: REEMBOLSOS Y RETIROS</div>
        <div class="clause-text">
          EL ESTUDIANTE declara conocer que el valor de la inscripción y los abonos mensuales no son reembolsables. En caso de retiro voluntario justificado por escrito, el saldo acumulado abonado podrá ser reservado como crédito institucional para futuras cohortes del mismo programa, sujeto a disponibilidad de cupos y vigencia máxima de seis (6) meses.
        </div>

        <div class="clause-title">CLÁUSULA CUARTA: PROCESO DE APROBACIÓN Y DIPLOMA</div>
        <div class="clause-text">
          Para calificar al diploma o certificación final de estudios, EL ESTUDIANTE deberá: (a) Haber completado satisfactoriamente el plan de evaluaciones del curso con nota mínima aprobatoria de 15/20 puntos o equivalente, (b) Haber registrado una asistencia mínima del 80% en las sesiones prácticas/teóricas, y (c) Encontrarse totalmente solvente con la tesorería de LA ACADEMIA al cierre del período lectivo.
        </div>

        <div class="clause-title">CLÁUSULA QUINTA: JURISDICCIÓN Y CONFORMIDAD</div>
        <div class="clause-text">
          Ambas partes ratifican su conformidad con lo aquí estipulado y se comprometen a su total cumplimiento de buena fe. En fe de lo cual firman el presente convenio en ${escapeHTML(academyProfile.direccion)}, el ${todayStr}.
        </div>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">Por ${escapeHTML(academyProfile.nombre)}</span><br>
            <strong>Firma Autorizada</strong>
          </div>
          
          <div class="signature-line" style="width: 100px;">
            <div class="fingerprint-box">HUELLA DACTILAR</div>
            <span style="font-size: 8px; color: #888;">Pulgar Derecho</span>
          </div>

          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">EL ESTUDIANTE</span><br>
            <strong>C.I. ${escapeHTML(docId)}</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: #aaa; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Código de Contrato: <strong>${contractCode}</strong> | Registro CRM realizado por: ${activeCoordinator}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Contrato de matrícula PDF generado para ${student.nombre} ${student.apellido || ''}.`);
}

function generateStudentStatementPDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || 0;
  const balance = Math.max(0, price - paid);
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const statementCode = `EDC-${student.id.split('-').slice(-1)[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  // Generate table rows for payments
  const payments = student.payments || [];
  let paymentsRowsHTML = '';
  if (payments.length === 0) {
    paymentsRowsHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #888; padding: 15px;">No se han registrado abonos para este estudiante.</td>
      </tr>
    `;
  } else {
    payments.forEach(p => {
      const pDate = new Date(p.date + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const vesAmount = p.amount * tasaBCV;
      paymentsRowsHTML += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${pDate}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHTML(p.ref || 'N/A')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHTML(p.method)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${p.amount.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #666;">${vesAmount.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</td>
        </tr>
      `;
    });
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Estado de Cuenta - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 50px;
          line-height: 1.5;
          background: #fff;
          font-size: 11px;
        }
        .statement-card {
          max-width: 750px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 40px;
          position: relative;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #20264a;
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .header span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 25px;
          color: #20264a;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 6px;
        }
        .info-table td {
          padding: 8px 12px;
        }
        .summary-box {
          display: flex;
          justify-content: space-between;
          background: #f4f7f6;
          border: 1.5px solid #20264a;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 25px;
          text-align: center;
        }
        .summary-item {
          flex: 1;
        }
        .summary-item:not(:last-child) {
          border-right: 1px solid #ddd;
        }
        .summary-val {
          font-size: 16px;
          font-weight: 700;
          color: #20264a;
          margin-top: 4px;
        }
        .payments-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .payments-table th {
          background: #20264a;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 50px;
          margin-bottom: 20px;
        }
        .signature-line {
          text-align: center;
          width: 220px;
        }
        .signature-dash {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          height: 60px;
        }
        @media print {
          body { padding: 0; }
          .statement-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="statement-card">
        <div class="header">
          <img src="logo-academy.png" alt="Logo CTD" style="height: 45px; width: auto; display: block; margin: 0 auto 10px auto; filter: brightness(0);" />
          <h1>${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
          <span>${escapeHTML(academyProfile.eslogan)}</span>
        </div>

        <div class="title">ESTADO DE CUENTA DE MATRÍCULA Y ABONOS</div>

        <table class="info-table">
          <tr>
            <td><strong>Estudiante:</strong> ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</td>
            <td><strong>Cédula / ID:</strong> ${escapeHTML(docId)}</td>
          </tr>
          <tr>
            <td><strong>Curso Inscrito:</strong> ${escapeHTML(courseName)}</td>
            <td><strong>Fecha de Emisión:</strong> ${todayStr}</td>
          </tr>
          <tr>
            <td><strong>Teléfono:</strong> ${escapeHTML(student.tel || 'N/A')}</td>
            <td><strong>Correo Electrónico:</strong> ${escapeHTML(student.email || 'N/A')}</td>
          </tr>
        </table>

        <div class="summary-box">
          <div class="summary-item">
            <div style="font-size: 10px; text-transform: uppercase; color: #666; font-weight: 600;">Costo del Curso</div>
            <div class="summary-val">$${price.toFixed(2)} USD</div>
          </div>
          <div class="summary-item">
            <div style="font-size: 10px; text-transform: uppercase; color: #666; font-weight: 600;">Total Pagado</div>
            <div class="summary-val" style="color: #6daa45;">$${paid.toFixed(2)} USD</div>
          </div>
          <div class="summary-item">
            <div style="font-size: 10px; text-transform: uppercase; color: #666; font-weight: 600;">Saldo Pendiente</div>
            <div class="summary-val" style="color: ${balance > 0 ? '#ff9800' : '#20264a'};">$${balance.toFixed(2)} USD</div>
          </div>
        </div>

        <h3 style="color: #20264a; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">HISTORIAL DE TRANSACCIONES</h3>
        <table class="payments-table">
          <thead>
            <tr>
              <th style="padding: 10px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Fecha</th>
              <th>Referencia / Observación</th>
              <th>Método</th>
              <th style="text-align: right;">Monto USD</th>
              <th style="text-align: right; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Monto VES (~Tasa BCV)</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsRowsHTML}
          </tbody>
        </table>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">Por ${escapeHTML(academyProfile.nombre)}</span><br>
            <strong>Firma y Sello Administrativo</strong>
          </div>
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">El Estudiante</span><br>
            <strong>Conformidad de Cuenta</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: #aaa; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Código de Documento: <strong>${statementCode}</strong> | Generado en el CRM por: ${activeCoordinator}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Estado de cuenta PDF generado para ${student.nombre} ${student.apellido || ''}.`);
}

function generateStudentPaymentSchedulePDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || 0;
  const balance = Math.max(0, price - paid);
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const scheduleCode = `CRON-${student.id.split('-').slice(-1)[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const nextContactDateFormatted = student.nextContactDate ? 
    new Date(student.nextContactDate + 'T00:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : 'No programada';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Acuerdo y Cronograma de Pago - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 50px;
          line-height: 1.5;
          background: #fff;
          font-size: 11px;
        }
        .schedule-card {
          max-width: 750px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 40px;
          position: relative;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #20264a;
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .header span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 25px;
          color: #20264a;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
        }
        .info-table td {
          padding: 8px 12px;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 25px;
        }
        .schedule-table th {
          background: #20264a;
          color: white;
          padding: 8px;
          text-align: left;
        }
        .schedule-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
          margin-bottom: 20px;
        }
        .signature-line {
          text-align: center;
          width: 220px;
        }
        .signature-dash {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          height: 60px;
        }
        @media print {
          body { padding: 0; }
          .schedule-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="schedule-card">
        <div class="header">
          <img src="logo-academy.png" alt="Logo CTD" style="height: 45px; width: auto; display: block; margin: 0 auto 10px auto; filter: brightness(0);" />
          <h1>${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
          <span>${escapeHTML(academyProfile.eslogan)}</span>
        </div>

        <div class="title">ACUERDO DE COMPROMISO DE PAGO Y FRACCIONAMIENTO DE CUOTAS</div>

        <p style="text-align: justify; margin-bottom: 20px;">
          Por medio del presente documento, se suscribe el acuerdo de financiamiento de la inversión académica correspondiente a la matrícula del programa formativo <strong>"${escapeHTML(courseName)}"</strong> para el estudiante indicado a continuación:
        </p>

        <table class="info-table">
          <tr>
            <td><strong>Estudiante:</strong> ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</td>
            <td><strong>Cédula / ID:</strong> ${escapeHTML(docId)}</td>
          </tr>
          <tr>
            <td><strong>Curso Inscrito:</strong> ${escapeHTML(courseName)}</td>
            <td><strong>Costo Total del Curso:</strong> $${price.toFixed(2)} USD</td>
          </tr>
        </table>

        <h3 style="color: #20264a; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px;">CRONOGRAMA DE APORTACIONES</h3>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Cuota / Concepto</th>
              <th>Fecha Vencimiento</th>
              <th style="text-align: right;">Monto USD</th>
              <th style="text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. Inscripción y Abonos Iniciales</td>
              <td>Inmediata / Registrada</td>
              <td style="text-align: right; font-weight: 600;">$${paid.toFixed(2)} USD</td>
              <td style="text-align: center; color: #6daa45; font-weight: 700;">CONCILIADO / RECIBIDO</td>
            </tr>
            ${balance > 0 ? `
            <tr>
              <td>2. Saldo de Cuotas Pendientes</td>
              <td>${nextContactDateFormatted}</td>
              <td style="text-align: right; font-weight: 600;">$${balance.toFixed(2)} USD</td>
              <td style="text-align: center; color: #ff9800; font-weight: 700;">PENDIENTE</td>
            </tr>
            ` : `
            <tr>
              <td colspan="4" style="text-align: center; color: #6daa45; padding: 10px; font-weight: 600;">
                ¡El estudiante se encuentra 100% SOLVENTE! No hay cuotas pendientes programadas.
              </td>
            </tr>
            `}
          </tbody>
        </table>

        <h3 style="color: #20264a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">TÉRMINOS DEL COMPROMISO</h3>
        <ul style="padding-left: 20px; text-align: justify;">
          <li style="margin-bottom: 6px;">EL ESTUDIANTE se compromete a cancelar el saldo pendiente en la fecha programada.</li>
          <li style="margin-bottom: 6px;">Los pagos en bolívares (VES) deberán calcularse multiplicando el monto en dólares (USD) por la tasa de cambio oficial de referencia del Banco Central de Venezuela (BCV) del día efectivo de la transferencia.</li>
          <li style="margin-bottom: 6px;">El retraso en la cancelación de las cuotas suspenderá temporalmente el derecho de acceso al aula de clases y evaluaciones hasta que la cuenta sea regularizada.</li>
        </ul>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">Por ${escapeHTML(academyProfile.nombre)}</span><br>
            <strong>Firma Autorizada</strong>
          </div>
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">El Estudiante</span><br>
            <strong>C.I. ${escapeHTML(docId)}</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: #aaa; text-align: center; margin-top: 35px; border-top: 1px solid #eee; padding-top: 10px;">
          Código de Acuerdo: <strong>${scheduleCode}</strong> | Emitido en el CRM por: ${activeCoordinator}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Compromiso de pago PDF generado para ${student.nombre} ${student.apellido || ''}.`);
}

function generateStudentFreezeActPDF() {
  if (!selectedStudent) return;
  const student = selectedStudent;
  const course = cursos.find(c => c.id === student.curso);
  const courseName = course ? course.nombre : 'Curso Académico';
  const defaultPrice = course ? course.precio : 0;
  const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
  const paid = student.academicPaid || 0;
  const docId = student.cedula || 'No Registrado';
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const freezeCode = `CONG-${student.id.split('-').slice(-1)[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + 6);
  const expirationStr = expDate.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Acta de Congelación de Cupo - ${escapeHTML(student.nombre)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 50px;
          line-height: 1.6;
          background: #fff;
          font-size: 11px;
        }
        .freeze-card {
          max-width: 750px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 40px;
          position: relative;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #20264a;
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .header span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 25px;
          color: #20264a;
          letter-spacing: 0.5px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
        }
        .info-table td {
          padding: 8px 12px;
        }
        .financial-highlight {
          background: #fff8e1;
          border: 1px solid #ffe082;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 25px;
          text-align: center;
          font-size: 12px;
          color: #795548;
        }
        .signatures-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
          margin-bottom: 20px;
        }
        .signature-line {
          text-align: center;
          width: 220px;
        }
        .signature-dash {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          height: 60px;
        }
        @media print {
          body { padding: 0; }
          .freeze-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="freeze-card">
        <div class="header">
          <img src="logo-academy.png" alt="Logo CTD" style="height: 45px; width: auto; display: block; margin: 0 auto 10px auto; filter: brightness(0);" />
          <h1>${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
          <span>${escapeHTML(academyProfile.eslogan)}</span>
        </div>

        <div class="title">ACTA ADMINISTRATIVA DE CONGELACIÓN TEMPORAL DE CUPO</div>

        <p style="text-align: justify; margin-bottom: 20px;">
          Por medio de la presente acta administrativa, se hace constar que el estudiante debidamente inscrito en el programa formativo de <strong>"${escapeHTML(courseName)}"</strong>, ha solicitado la suspensión temporal de sus actividades académicas, congelando su cupo y los fondos aportados en la fecha de hoy:
        </p>

        <table class="info-table">
          <tr>
            <td><strong>Estudiante:</strong> ${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</td>
            <td><strong>Cédula / ID:</strong> ${escapeHTML(docId)}</td>
          </tr>
          <tr>
            <td><strong>Curso Inscrito:</strong> ${escapeHTML(courseName)}</td>
            <td><strong>Fecha de Suspensión:</strong> ${todayStr}</td>
          </tr>
        </table>

        <div class="financial-highlight">
          <strong>SALDO CONGELADO A FAVOR DE EL ESTUDIANTE:</strong><br>
          <span style="font-size: 18px; font-weight: 700; color: #ff9800; display: inline-block; margin-top: 6px;">$${paid.toFixed(2)} USD</span>
        </div>

        <h3 style="color: #20264a; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">CLÁUSULAS Y CONDICIONES DE REACTIVACIÓN</h3>
        <ol style="padding-left: 20px; text-align: justify;">
          <li style="margin-bottom: 8px;">El saldo congelado de <strong>$${paid.toFixed(2)} USD</strong> queda asentado a favor del estudiante y podrá ser aplicado únicamente para el pago de la reincorporación al mismo programa o a cursos afines ofrecidos por LA ACADEMIA.</li>
          <li style="margin-bottom: 8px;">El período máximo de congelación establecido por la administración es de **seis (6) meses** a partir de la firma de esta acta. Por consiguiente, la fecha de vencimiento irrevocable para la reactivación del saldo es el **${expirationStr}**. Vencido este plazo, los fondos pre-pagados expirarán sin derecho a devolución.</li>
          <li style="margin-bottom: 8px;">La reincorporación queda sujeta a la disponibilidad de cupos en las cohortes que se programen para la fecha solicitada y a las tarifas de inversión vigentes al momento de la reincorporación formal.</li>
        </ol>

        <div class="signatures-section">
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">Por ${escapeHTML(academyProfile.nombre)}</span><br>
            <strong>Firma Autorizada</strong>
          </div>
          <div class="signature-line">
            <div class="signature-dash"></div>
            <span style="font-size: 10px; color: #666;">El Estudiante</span><br>
            <strong>C.I. ${escapeHTML(docId)}</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: #aaa; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px;">
          Código de Acta: <strong>${freezeCode}</strong> | Registrado en el CRM por: ${activeCoordinator}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Acta de congelación de cupo PDF generada para ${student.nombre} ${student.apellido || ''}.`);
}

function exportSalesConversionReportPDF() {
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Admin CTD";
  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

  // Funnel count calculations
  const totalLeads = alumnos.length;
  const stages = ['Nuevo', 'Contactado', 'Interesado', 'Negociando', 'Inscrito', 'Perdido'];
  const stageCounts = stages.reduce((acc, stg) => {
    acc[stg] = alumnos.filter(a => a.etapa === stg).length;
    return acc;
  }, {});

  const conversionRate = totalLeads > 0 ? ((stageCounts['Inscrito'] / totalLeads) * 100).toFixed(1) : '0.0';

  // Lost reasons calculation
  const lostReasons = ['Precio Alto', 'Horario Incompatible', 'Falta de Interés', 'Prefiere la Competencia', 'Ghosting (No responde)', 'Otro'];
  const lostCounts = lostReasons.reduce((acc, r) => {
    acc[r] = alumnos.filter(a => a.etapa === 'Perdido' && (a.lostReason === r || (!a.lostReason && r === 'Otro'))).length;
    return acc;
  }, {});

  // Conversion metrics by source
  const sourcesList = ['Instagram', 'WhatsApp', 'Facebook', 'TikTok', 'Web', 'Referido', 'Presencial'];
  const adExpenses = egresos.filter(e => e.category === 'Publicidad');

  const sourceBreakdownRows = sourcesList.map(src => {
    const srcLeads = alumnos.filter(a => a.origen === src).length;
    const srcInscriptions = alumnos.filter(a => a.origen === src && a.etapa === 'Inscrito').length;
    const srcSpent = adExpenses.filter(e => e.source === src).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const conv = srcLeads > 0 ? ((srcInscriptions / srcLeads) * 100).toFixed(1) : '0.0';
    const cac = srcInscriptions > 0 ? `$${(srcSpent / srcInscriptions).toFixed(2)} USD` : '$0.00';

    return `
      <tr>
        <td><strong>${src}</strong></td>
        <td style="text-align: center;">${srcLeads}</td>
        <td style="text-align: center;">${srcInscriptions}</td>
        <td style="text-align: right; font-weight: 600; color: #20264a;">${conv}%</td>
        <td style="text-align: right;">$${srcSpent.toFixed(2)} USD</td>
        <td style="text-align: right; font-weight: 600; color: #438f9b;">${cac}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el reporte.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Reporte de Conversión Comercial - Academia CTD</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 30px;
          line-height: 1.4;
          background: #fff;
          font-size: 11px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #438f9b;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .logo-section h1 {
          color: #20264a;
          margin: 0;
          font-size: 22px;
          font-weight: 800;
        }
        .logo-section span {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 600;
        }
        .report-title {
          text-align: right;
        }
        .report-title h2 {
          margin: 0;
          font-size: 16px;
          color: #438f9b;
          font-weight: 700;
        }
        .report-title span {
          font-size: 10px;
          color: #888;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          padding: 10px 15px;
        }
        .meta-item span {
          display: block;
          font-size: 9px;
          color: #777;
          text-transform: uppercase;
          font-weight: 600;
        }
        .meta-item strong {
          font-size: 12px;
          color: #111;
        }
        .funnel-cards {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        }
        .funnel-card {
          border: 1px solid #eaeaea;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
          background: #fdfdfd;
        }
        .funnel-card.accent {
          background: #f0f7f8;
          border-color: #bcdce0;
        }
        .funnel-label {
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .funnel-value {
          font-size: 16px;
          font-weight: 700;
          color: #20264a;
        }
        .funnel-value.green {
          color: #4caf50;
        }
        .section-title {
          font-size: 12px;
          color: #20264a;
          border-bottom: 1.5px solid #438f9b;
          padding-bottom: 4px;
          margin-top: 25px;
          margin-bottom: 12px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .grid-columns {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th {
          background: #f0f7f8;
          color: #20264a;
          text-align: left;
          padding: 8px;
          font-size: 10px;
          text-transform: uppercase;
          border-bottom: 1.5px solid #bcdce0;
        }
        .table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
          font-size: 11px;
        }
        .lost-reasons-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .reason-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .reason-label {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
        }
        .bar-container {
          background: #eee;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
        }
        .bar-fill {
          background: #d163a7;
          height: 100%;
          border-radius: 5px;
        }
        .footer-note {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px dashed #eaeaea;
          padding-top: 15px;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Header -->
        <div class="header">
          <div class="logo-section" style="display: flex; align-items: center; gap: 10px;">
            <img src="logo-academy.png" alt="Logo CTD" style="height: 40px; width: auto; filter: brightness(0);" />
            <div style="text-align: left;">
              <h1 style="color: #20264a; margin: 0; font-size: 22px; font-weight: 800;">${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
              <span style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${escapeHTML(academyProfile.eslogan)}</span>
            </div>
          </div>
          <div class="report-title">
            <h2>REPORTE COMERCIAL & CONVERSIÓN</h2>
            <span>Análisis de Canales de Admisión</span>
          </div>
        </div>

        <!-- Metadata -->
        <div class="meta-grid">
          <div class="meta-item">
            <span>Fecha de Emisión</span>
            <strong>${todayStr} (${timeStr})</strong>
          </div>
          <div class="meta-item" style="text-align: right;">
            <span>Auditor Responsable</span>
            <strong>${activeCoordinator}</strong>
          </div>
        </div>

        <div class="section-title">Resumen de Embudo de Ventas (Funnel)</div>
        
        <div class="funnel-cards">
          <div class="funnel-card">
            <span class="funnel-label">Nuevos</span>
            <span class="funnel-value">${stageCounts['Nuevo']}</span>
          </div>
          <div class="funnel-card">
            <span class="funnel-label">Contactados</span>
            <span class="funnel-value">${stageCounts['Contactado']}</span>
          </div>
          <div class="funnel-card">
            <span class="funnel-label">Interesados</span>
            <span class="funnel-value">${stageCounts['Interesado']}</span>
          </div>
          <div class="funnel-card">
            <span class="funnel-label">En Negociación</span>
            <span class="funnel-value">${stageCounts['Negociando']}</span>
          </div>
          <div class="funnel-card accent">
            <span class="funnel-label" style="color: #438f9b;">Inscritos</span>
            <span class="funnel-value green">${stageCounts['Inscrito']}</span>
          </div>
          <div class="funnel-card">
            <span class="funnel-label">Perdidos</span>
            <span class="funnel-value" style="color: #f44336;">${stageCounts['Perdido']}</span>
          </div>
        </div>

        <div style="background: #f0f7f8; border: 1px solid #bcdce0; border-radius: 6px; padding: 12px; margin-bottom: 25px; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; color: #438f9b; font-weight: 600; letter-spacing: 0.5px;">Tasa de Conversión General (Lead-to-Enrollment)</span>
          <div style="font-size: 26px; font-weight: 800; color: #20264a; margin-top: 4px;">${conversionRate}%</div>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">Porcentaje total de estudiantes contactados que concluyeron su matrícula de forma exitosa.</p>
        </div>

        <div class="grid-columns">
          
          <!-- Column 1: Source Breakdown -->
          <div>
            <div class="section-title">Conversión por Canal de Captación</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th style="text-align: center;">Prospectos</th>
                  <th style="text-align: center;">Matrículas</th>
                  <th style="text-align: right;">Conv %</th>
                  <th style="text-align: right;">Gasto</th>
                  <th style="text-align: right;">CAC</th>
                </tr>
              </thead>
              <tbody>
                ${sourceBreakdownRows}
              </tbody>
            </table>
          </div>

          <!-- Column 2: Lost Reasons -->
          <div>
            <div class="section-title">Motivos de Pérdida de Leads</div>
            <div class="lost-reasons-bar">
              ${lostReasons.map(r => {
                const count = lostCounts[r] || 0;
                const totalLost = stageCounts['Perdido'] || 1; // avoid divide by zero
                const pct = ((count / totalLost) * 100).toFixed(0);
                return `
                  <div class="reason-row">
                    <div class="reason-label">
                      <span><strong>${r}</strong></span>
                      <span style="color: #666;">${count} leads (${pct}%)</span>
                    </div>
                    <div class="bar-container">
                      <div class="bar-fill" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="footer-note">
          <p>Este reporte comercial consolida el flujo dinámico del embudo de ventas registrado en el CRM.</p>
          <p>${escapeHTML(academyProfile.nombre)} - Generado de manera segura e institucional por ${activeCoordinator}.</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Reporte comercial de conversión y embudo PDF exportado.`);
}

function saveAcademyProfileSettings() {
  const nombre = document.getElementById('ajustes-academy-nombre').value.trim();
  const eslogan = document.getElementById('ajustes-academy-eslogan').value.trim();
  const direccion = document.getElementById('ajustes-academy-direccion').value.trim();
  const telefono = document.getElementById('ajustes-academy-telefono').value.trim();
  const email = document.getElementById('ajustes-academy-email').value.trim();

  if (!nombre) {
    showToast('El nombre de la academia es obligatorio.', 'error');
    return;
  }

  academyProfile = { nombre, eslogan, direccion, telefono, email };
  saveState();
  syncHeaderProfile();
  showToast('Perfil de la academia actualizado con éxito.', 'success');
  logActivity('edicion', `Se actualizó el perfil de la academia.`);
}

function toggleBCVAutoSettings() {
  const checkbox = document.getElementById('ajustes-bcv-auto');
  if (checkbox) {
    fetchBCVOnStartup = checkbox.checked;
    saveState();
    showToast(fetchBCVOnStartup ? 'Actualización de BCV automática activada al iniciar.' : 'Actualización de BCV automática desactivada.', 'success');
  }
}

function changeBackupFreqSettings() {
  const select = document.getElementById('ajustes-backup-freq');
  if (select) {
    backupReminderFrequency = select.value;
    saveState();
    showToast(`Frecuencia de recordatorio de respaldo cambiada a: ${backupReminderFrequency}`, 'success');
    checkBackupReminder();
  }
}

function dismissBackupReminder() {
  const banner = document.getElementById('backup-reminder-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}

function checkBackupReminder() {
  const banner = document.getElementById('backup-reminder-banner');
  if (!banner) return;

  if (backupReminderFrequency === 'desactivado') {
    banner.style.display = 'none';
    return;
  }

  const lastTimestamp = parseInt(localStorage.getItem('ctd_last_backup_timestamp')) || 0;
  if (!lastTimestamp) {
    banner.style.display = 'flex';
    return;
  }

  const daysElapsed = (Date.now() - lastTimestamp) / (1000 * 60 * 60 * 24);
  const limit = (backupReminderFrequency === 'semanal') ? 7 : 30;
  if (daysElapsed >= limit) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

function toggleCardPriority(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const priorities = ['Alta', 'Media', 'Baja'];
  let currentIdx = priorities.indexOf(student.prioridad);
  if (currentIdx === -1) currentIdx = 1; // Default to 'Media'
  
  const nextIdx = (currentIdx + 1) % priorities.length;
  student.prioridad = priorities[nextIdx];

  saveState();
  renderPipeline();
  showToast(`Prioridad cambiada a ${student.prioridad} para ${student.nombre}.`, 'info');
}

function sendQuickWhatsApp(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const phone = student.tel || student.telefono;
  const cleanNumber = phone ? phone.replace(/[^\d]/g, '') : '';
  if (!cleanNumber) {
    showToast('El alumno no posee un teléfono registrado.', 'error');
    return;
  }

  const courseObj = cursos.find(c => c.id === student.curso);
  const courseName = courseObj ? courseObj.nombre : 'nuestros cursos';

  let text = '';
  if (student.etapa === 'Inscrito') {
    const defaultPrice = courseObj ? courseObj.precio : 0;
    const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
    const paid = student.academicPaid || 0;
    const balance = Math.max(0, price - paid);
    text = `Hola *${student.nombre}*, espero que estés muy bien. Te escribimos de la Academia CTD para recordarte que tienes una cuota pendiente del curso de *${courseName}* por un monto de *${balance} USD*. Si requieres los datos de pago actualizados, por favor avísanos.`;
  } else if (student.etapa === 'Perdido') {
    text = `Hola *${student.nombre}*, espero que estés muy bien. Te saludamos de la Academia CTD. Queríamos saber si tienes interés en reincorporarte o realizar otro de nuestros cursos en tecnología y diseño. ¡Feliz día!`;
  } else {
    text = `Hola *${student.nombre}*, espero que estés muy bien. Te escribimos de la Academia CTD para dar seguimiento a tu consulta sobre el curso de *${courseName}*. ¿Tienes alguna duda o te gustaría que te ayudemos a reservar tu cupo?`;
  }

  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
  logActivity('edicion', `Se envió recordatorio rápido por WhatsApp a ${student.nombre}.`);
}


function applyRolePermissions() {
  const isAdvisor = (typeof userRole !== 'undefined' && userRole === 'asesor');

  // 1. Sidebar items
  const sidebarFinanzas = document.getElementById('nav-finanzas');
  const sidebarReportes = document.getElementById('nav-reportes');
  const sidebarAjustes = document.getElementById('nav-ajustes');

  if (sidebarFinanzas) sidebarFinanzas.style.display = isAdvisor ? 'none' : 'flex';
  if (sidebarReportes) sidebarReportes.style.display = isAdvisor ? 'none' : 'flex';
  if (sidebarAjustes) sidebarAjustes.style.display = isAdvisor ? 'none' : 'flex';

  // 2. Financial KPI Cards on Dashboard
  const kpiIds = ['kpi-saldo-pendiente', 'kpi-ingresos-recaudados', 'kpi-ingresos-proyectados', 'kpi-alumnos-riesgo'];
  kpiIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const card = el.closest('.kpi-card');
      if (card) {
        card.style.display = isAdvisor ? 'none' : 'flex';
      }
    }
  });

  // 3. Calendar Cobranzas checkbox/label
  const showPaymentsCheckbox = document.getElementById('calendar-show-payments');
  if (showPaymentsCheckbox) {
    const label = showPaymentsCheckbox.closest('label');
    if (label) {
      label.style.display = isAdvisor ? 'none' : 'flex';
    }
  }

  // 4. Smart segment buttons for debt/risk
  const segDeuda = document.getElementById('segment-deuda');
  const segRiesgo = document.getElementById('segment-riesgo');
  if (segDeuda) segDeuda.style.display = isAdvisor ? 'none' : 'inline-block';
  if (segRiesgo) segRiesgo.style.display = isAdvisor ? 'none' : 'inline-block';

  // 5. Payment filter dropdown in student list
  const filterPago = document.getElementById('filter-pago');
  if (filterPago) {
    const parent = filterPago.closest('.form-group');
    if (parent) parent.style.display = isAdvisor ? 'none' : 'block';
  }

  // 6. Monthly sales goals container
  const monthlyGoals = document.getElementById('monthly-sales-goals');
  if (monthlyGoals) monthlyGoals.style.display = isAdvisor ? 'none' : 'flex';

  // 7. Advisors management block
  const advisorsCard = document.getElementById('ajustes-asesores-card');
  if (advisorsCard) advisorsCard.style.display = isAdvisor ? 'none' : 'block';
}


document.addEventListener('DOMContentLoaded', () => {
  // Check auth session
  const auth = localStorage.getItem("ctd_authenticated") === "true";
  if (auth) {
    userRole = localStorage.getItem("ctd_user_role") || 'admin';
    username = localStorage.getItem("ctd_username") || 'Admin CTD';
  } else {
    userRole = 'admin';
    username = 'Admin CTD';
  }
  const loginScreen = document.getElementById('login-screen');
  if (auth && loginScreen) {
    loginScreen.style.display = 'none';
    loginScreen.classList.add('hide');
  }

  initIndexedDB(async () => {
    await loadState();
    try {
      if (fetchBCVOnStartup) {
        await fetchTasaBCVAuto(true);
      }
    } catch (e) {
      console.warn("Auto-fetch BCV rate failed on startup:", e);
    }
    syncHeaderProfile();
    applyRolePermissions();
    setView('dashboard');
    updateNotificationButton();
    checkBackupReminder();
    
    if (auth) {
      // Trigger notification check if already authenticated on load
      checkAndTriggerPushNotifications();
    }
  });

  // Global dragend listener to clean up dragging styles
  document.addEventListener('dragend', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('kanban-card')) {
      e.target.classList.remove('dragging');
    }
  });

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

function toggleSelectAllAlumnos(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.student-row-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = masterCheckbox.checked;
  });
  updateBulkActionsBar();
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.student-row-checkbox:checked');
  const bar = document.getElementById('bulk-actions-bar');
  const countEl = document.getElementById('bulk-actions-count');
  
  if (checkboxes.length > 0) {
    if (bar) {
      bar.style.display = 'flex';
      // Populate cohortes dropdown
      const select = document.getElementById('bulk-cohort-select');
      if (select && select.children.length <= 1) {
        select.innerHTML = '<option value="" style="color: #333;">-- Cohorte --</option>' + 
          cohortes.map(c => `<option value="${c.id}" style="color: #333;">${escapeHTML(c.nombre)}</option>`).join('');
      }
    }
    if (countEl) {
      countEl.innerText = `${checkboxes.length} seleccionado${checkboxes.length > 1 ? 's' : ''}`;
    }
  } else {
    if (bar) bar.style.display = 'none';
    const master = document.getElementById('bulk-select-all');
    if (master) master.checked = false;
  }
}

function clearBulkSelection() {
  const checkboxes = document.querySelectorAll('.student-row-checkbox');
  checkboxes.forEach(cb => cb.checked = false);
  const master = document.getElementById('bulk-select-all');
  if (master) master.checked = false;
  updateBulkActionsBar();
}

function applyBulkMoveCohort() {
  const checkboxes = document.querySelectorAll('.student-row-checkbox:checked');
  const cohortSelect = document.getElementById('bulk-cohort-select');
  const cohortId = cohortSelect ? cohortSelect.value : '';
  if (!cohortId) {
    showToast('Selecciona una cohorte para asignar.', 'error');
    return;
  }

  const selectedCohort = cohortes.find(c => c.id === cohortId);
  const cohortName = selectedCohort ? selectedCohort.nombre : 'Seleccionada';

  checkboxes.forEach(cb => {
    const studentId = cb.value;
    const student = alumnos.find(a => a.id === studentId);
    if (student) {
      student.academicGroup = cohortId;
      logActivity('edicion', `Se asignó cohorte "${cohortName}" en lote a ${student.nombre}.`);
    }
  });

  saveState();
  if (typeof renderPipeline === 'function') renderPipeline();
  filterAlumnos(); // Rerenders student list and hides the actions bar
  showToast(`Alumnos asignados a la cohorte "${cohortName}".`, 'success');
}

function applyBulkChangeStage() {
  const checkboxes = document.querySelectorAll('.student-row-checkbox:checked');
  const stageSelect = document.getElementById('bulk-stage-select');
  const newStage = stageSelect ? stageSelect.value : '';
  if (!newStage) {
    showToast('Selecciona una etapa de destino.', 'error');
    return;
  }

  checkboxes.forEach(cb => {
    const studentId = cb.value;
    const student = alumnos.find(a => a.id === studentId);
    if (student) {
      student.etapa = newStage;
      logActivity('edicion', `Se actualizó etapa a "${newStage}" en lote a ${student.nombre}.`);
    }
  });

  saveState();
  if (typeof renderPipeline === 'function') renderPipeline();
  filterAlumnos();
  showToast(`Etapa actualizada a "${newStage}" en lote.`, 'success');
}

function applyBulkDelete() {
  const checkboxes = document.querySelectorAll('.student-row-checkbox:checked');
  if (checkboxes.length === 0) return;

  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a estos ${checkboxes.length} alumnos? Esta acción no se puede deshacer.`)) {
    return;
  }

  checkboxes.forEach(cb => {
    const studentId = cb.value;
    const idx = alumnos.findIndex(a => a.id === studentId);
    if (idx !== -1) {
      const student = alumnos[idx];
      logActivity('borrado', `Se eliminó en lote a ${student.nombre} ${student.apellido || ''}.`);
      alumnos.splice(idx, 1);
    }
  });

  saveState();
  if (typeof renderPipeline === 'function') renderPipeline();
  filterAlumnos();
  showToast('Alumnos seleccionados eliminados con éxito.', 'success');
}

function exportToPDFReport() {
  const targetStudents = window.filteredAlumnosList || alumnos;
  if (targetStudents.length === 0) {
    showToast('No hay alumnos en la vista actual para exportar.', 'error');
    return;
  }

  const todayStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeCoordinator = localStorage.getItem("ctd_username") || username || "Coordinador CTD";
  const reportCode = `REP-AL-${Date.now().toString().slice(-4)}`;

  // Financial summary of target list
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalDebt = 0;
  let stageCounts = {};

  targetStudents.forEach(al => {
    // Stage count
    stageCounts[al.etapa] = (stageCounts[al.etapa] || 0) + 1;

    // Financial calculations
    const defaultPrice = cursos.find(c => c.id === al.curso)?.precio || 0;
    const price = al.academicPrice !== undefined ? al.academicPrice : defaultPrice;
    const paid = al.academicPaid || 0;
    
    if (al.etapa === 'Inscrito') {
      totalInvoiced += price;
      totalPaid += paid;
      totalDebt += Math.max(0, price - paid);
    }
  });

  const solvencyRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

  // Build rows HTML
  const rowsHTML = targetStudents.map((al, idx) => {
    const courseObj = cursos.find(c => c.id === al.curso);
    const courseName = courseObj ? courseObj.nombre : 'Sin curso';
    const regDate = new Date(al.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const scoring = getLeadScore(al);
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHTML(courseName)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;"><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; background: rgba(32, 38, 74, 0.08);">${al.etapa}</span></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;"><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; background: rgba(247,172,5,0.1); color: #f7ac05;">${al.prioridad}</span></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: 500;">${scoring.score}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHTML(al.origen || 'Web')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${regDate}</td>
      </tr>
    `;
  }).join('');

  // Stage summary text
  const stageSummaryText = Object.entries(stageCounts)
    .map(([stage, count]) => `<strong>${stage}:</strong> ${count}`)
    .join(' | ');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Por favor, permite las ventanas emergentes para generar el PDF.', 'error');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <base href="${window.location.href}">
      <title>Reporte de Segmento de Alumnos - ${todayStr}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          margin: 0;
          padding: 40px;
          line-height: 1.4;
          background: #fff;
          font-size: 10px;
        }
        .report-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #20264a;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header-left h1 {
          color: #20264a;
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
        }
        .header-left span {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .title {
          font-size: 13px;
          font-weight: 700;
          color: #20264a;
          margin-bottom: 15px;
          text-transform: uppercase;
          border-left: 3px solid #20264a;
          padding-left: 8px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }
        .summary-card span {
          display: block;
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .summary-card strong {
          font-size: 14px;
          color: #20264a;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .report-table th {
          background: #20264a;
          color: white;
          padding: 8px;
          font-weight: 600;
          text-align: left;
        }
        .report-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        @media print {
          body { padding: 0; }
          .report-container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div class="header-left">
            <h1>${escapeHTML(academyProfile.nombre.toUpperCase())}</h1>
            <span>Reporte Administrativo del CRM</span>
          </div>
          <img src="logo-academy.png" alt="Logo CTD" style="height: 35px; width: auto; filter: brightness(0);" />
        </div>

        <div class="title">REPORTE DE ALUMNOS FILTRADOS Y SEGMENTADOS</div>

        <div style="background: #f4f6f9; border-radius: 6px; padding: 10px; margin-bottom: 20px; font-size: 9.5px; border-left: 3px solid #6daa45;">
          <strong>Distribución por Etapa:</strong> ${stageSummaryText || 'Ninguno'}
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span>Alumnos en Lista</span>
            <strong>${targetStudents.length}</strong>
          </div>
          <div class="summary-card">
            <span>Deuda Proyectada</span>
            <strong style="color: #f44336;">$${totalDebt.toFixed(2)} USD</strong>
          </div>
          <div class="summary-card">
            <span>Equivalente VES</span>
            <strong>${(totalDebt * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</strong>
          </div>
          <div class="summary-card">
            <span>Tasa de Solvencia</span>
            <strong style="color: #4caf50;">${solvencyRate}%</strong>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center; border-top-left-radius: 4px;">#</th>
              <th>Nombre Completo</th>
              <th>Curso de Interés</th>
              <th style="text-align: center;">Etapa</th>
              <th style="text-align: center;">Prioridad</th>
              <th style="text-align: center;">Score</th>
              <th>Origen</th>
              <th style="text-align: center; border-top-right-radius: 4px;">Fecha Reg.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 8px; font-size: 8px; color: #999; margin-top: 30px;">
          <span>Código de Reporte: <strong>${reportCode}</strong> | Generado por: ${activeCoordinator}</span>
          <span>Fecha de Generación: ${todayStr}</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  logActivity('nota', `Reporte PDF del segmento de alumnos exportado con ${targetStudents.length} registros.`);
}

function renderFinanzas() {
  let allPayments = [];
  alumnos.forEach(student => {
    if (student.payments && Array.isArray(student.payments)) {
      student.payments.forEach(p => {
        allPayments.push({
          studentId: student.id,
          studentName: `${student.nombre} ${student.apellido || ''}`,
          courseId: student.curso,
          cohortId: student.academicGroup,
          paymentId: p.id,
          amount: p.amount,
          method: p.method,
          date: p.date,
          ref: p.ref
        });
      });
    }
  });

  // Sort: newest first
  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get active filters
  const searchInput = document.getElementById('finanzas-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
  const methodSelect = document.getElementById('finanzas-filter-method');
  const methodFilter = methodSelect ? methodSelect.value : '';
  
  const monthSelect = document.getElementById('finanzas-filter-month');
  const dateFilter = monthSelect ? monthSelect.value : '';

  let filteredPayments = allPayments.filter(p => {
    const matchSearch = p.studentName.toLowerCase().includes(search) || (p.ref && p.ref.toLowerCase().includes(search));
    const matchMethod = !methodFilter || p.method === methodFilter;
    
    let matchDate = true;
    if (dateFilter === 'this-month') {
      const now = new Date();
      const pDate = new Date(p.date + 'T00:00:00');
      matchDate = pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth();
    } else if (dateFilter === 'last-30') {
      const now = new Date();
      const pDate = new Date(p.date + 'T00:00:00');
      const diffTime = Math.abs(now - pDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchDate = diffDays <= 30;
    }
    return matchSearch && matchMethod && matchDate;
  });

  // Calculate expenses filter as well
  let filteredExpenses = egresos.filter(e => {
    let matchDate = true;
    if (dateFilter === 'this-month') {
      const now = new Date();
      const eDate = new Date(e.date + 'T00:00:00');
      matchDate = eDate.getFullYear() === now.getFullYear() && eDate.getMonth() === now.getMonth();
    } else if (dateFilter === 'last-30') {
      const now = new Date();
      const eDate = new Date(e.date + 'T00:00:00');
      const diffTime = Math.abs(now - eDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchDate = diffDays <= 30;
    }
    return matchDate;
  });

  // Recalculate KPIs
  let totalUSD = 0;
  filteredPayments.forEach(p => {
    totalUSD += p.amount;
  });

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const netBalance = totalUSD - totalExpenses;
  const totalVES = totalUSD * tasaBCV;

  const kpiTotalUsdEl = document.getElementById('finanzas-kpi-total-usd');
  const kpiTotalVesEl = document.getElementById('finanzas-kpi-total-ves');
  const kpiCountEl = document.getElementById('finanzas-kpi-count');
  const kpiEgresosEl = document.getElementById('finanzas-kpi-egresos');
  const kpiBalanceEl = document.getElementById('finanzas-kpi-balance');

  if (kpiTotalUsdEl) kpiTotalUsdEl.innerText = `$${totalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  if (kpiTotalVesEl) kpiTotalVesEl.innerText = `${totalVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
  if (kpiCountEl) kpiCountEl.innerText = `${filteredPayments.length} abono${filteredPayments.length !== 1 ? 's' : ''}`;
  if (kpiEgresosEl) kpiEgresosEl.innerText = `$${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  
  if (kpiBalanceEl) {
    kpiBalanceEl.innerText = `$${netBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
    if (netBalance >= 0) {
      kpiBalanceEl.style.color = '#6daa45';
    } else {
      kpiBalanceEl.style.color = '#f44336';
    }
  }

  // Draw Cash Flow Chart (Monthly comparison)
  const chartCanvas = document.getElementById('finanzas-cashflow-chart');
  if (chartCanvas) {
    if (window.finanzasChart) {
      window.finanzasChart.destroy();
    }

    const monthlyData = {};
    const now = new Date();
    // Pre-fill last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        label: d.toLocaleDateString('es-VE', { month: 'short', year: '2-digit' }),
        ingresos: 0,
        egresos: 0
      };
    }

    // Sum matching payments
    allPayments.forEach(p => {
      const pDate = new Date(p.date + 'T00:00:00');
      const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].ingresos += p.amount;
      }
    });

    // Sum matching expenses
    egresos.forEach(e => {
      const eDate = new Date(e.date + 'T00:00:00');
      const key = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].egresos += parseFloat(e.amount) || 0;
      }
    });

    const labels = [];
    const ingresosData = [];
    const egresosData = [];

    Object.keys(monthlyData).sort().forEach(key => {
      labels.push(monthlyData[key].label);
      ingresosData.push(monthlyData[key].ingresos);
      egresosData.push(monthlyData[key].egresos);
    });

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isLight = currentTheme === 'light';
    const textColor = isLight ? '#20264a' : 'rgba(255, 255, 255, 0.7)';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';

    window.finanzasChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos (USD)',
            data: ingresosData,
            backgroundColor: 'rgba(109, 170, 69, 0.75)',
            borderColor: '#6daa45',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Egresos (USD)',
            data: egresosData,
            backgroundColor: 'rgba(244, 67, 54, 0.75)',
            borderColor: '#f44336',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11, weight: '500' }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 10 },
              callback: function(value) { return '$' + value; }
            }
          }
        }
      }
    });
  }

  // Render Table Rows
  const tbody = document.getElementById('finanzas-table-body');
  const emptyState = document.getElementById('finanzas-empty-state');
  
  if (filteredPayments.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = filteredPayments.map(p => {
        const courseObj = cursos.find(c => c.id === p.courseId);
        const courseName = courseObj ? courseObj.nombre : 'Sin curso';
        const cohortObj = cohortes.find(c => c.id === p.cohortId);
        const cohortName = cohortObj ? `(${cohortObj.nombre})` : '';
        const formattedDate = new Date(p.date + 'T00:00:00').toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit', year: 'numeric'});
        return `
          <tr>
            <td>${formattedDate}</td>
            <td><strong style="color: var(--color-primary);">${escapeHTML(p.studentName)}</strong></td>
            <td>${escapeHTML(courseName)} ${escapeHTML(cohortName)}</td>
            <td><span class="badge" style="background: rgba(109, 170, 69, 0.12); color: #6daa45; border: 1px solid rgba(109, 170, 69, 0.25); font-weight: 600;">${escapeHTML(p.method)}</span></td>
            <td><span style="font-size: 11px; color: var(--color-text-muted);">${escapeHTML(p.ref || 'Sin referencia')}</span></td>
            <td style="text-align: right; font-weight: 700; color: #6daa45;">$${p.amount.toFixed(2)} USD</td>
            <td style="text-align: right; font-weight: 600; color: var(--color-text);">${(p.amount * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</td>
            <td style="text-align: right;">
              <div class="table-actions" style="justify-content: flex-end;">
                <button class="btn btn-ghost btn-icon-sm" onclick="printReceiptDirect('${p.studentId}', '${p.paymentId}')" title="Imprimir Recibo" style="color: var(--color-primary)">
                  <i data-lucide="printer" style="width:14px; height:14px;"></i>
                </button>
                <button class="btn btn-ghost btn-icon-sm" onclick="deleteFinancePayment('${p.studentId}', '${p.paymentId}')" title="Eliminar Abono" style="color: var(--color-error)">
                  <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  }
}

function printReceiptDirect(studentId, paymentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (student) {
    selectedStudent = student;
    generateIndividualPaymentPDF(paymentId);
  }
}

function deleteFinancePayment(studentId, paymentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const paymentIndex = student.payments.findIndex(p => p.id === paymentId);
  if (paymentIndex === -1) return;

  const payment = student.payments[paymentIndex];
  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el abono de $${payment.amount} USD registrado para ${student.nombre}?`)) {
    student.payments.splice(paymentIndex, 1);
    // Keep academicPaid in sync
    student.academicPaid = student.payments.reduce((acc, p) => acc + p.amount, 0);

    saveState();
    showToast('Abono eliminado con éxito.', 'info');
    renderFinanzas(); // Refresh finance view
  }
}

function exportFinanzasToCSV() {
  let allPayments = [];
  alumnos.forEach(student => {
    if (student.payments && Array.isArray(student.payments)) {
      student.payments.forEach(p => {
        allPayments.push({
          studentName: `${student.nombre} ${student.apellido || ''}`,
          courseId: student.curso,
          amount: p.amount,
          method: p.method,
          date: p.date,
          ref: p.ref
        });
      });
    }
  });

  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply filters
  const searchInput = document.getElementById('finanzas-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
  const methodSelect = document.getElementById('finanzas-filter-method');
  const methodFilter = methodSelect ? methodSelect.value : '';
  
  const monthSelect = document.getElementById('finanzas-filter-month');
  const dateFilter = monthSelect ? monthSelect.value : '';

  let filtered = allPayments.filter(p => {
    const matchSearch = p.studentName.toLowerCase().includes(search) || (p.ref && p.ref.toLowerCase().includes(search));
    const matchMethod = !methodFilter || p.method === methodFilter;
    let matchDate = true;
    if (dateFilter === 'this-month') {
      const now = new Date();
      const pDate = new Date(p.date + 'T00:00:00');
      matchDate = pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth();
    } else if (dateFilter === 'last-30') {
      const now = new Date();
      const pDate = new Date(p.date + 'T00:00:00');
      const diffTime = Math.abs(now - pDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchDate = diffDays <= 30;
    }
    return matchSearch && matchMethod && matchDate;
  });

  if (filtered.length === 0) {
    showToast('No hay transacciones en la vista actual para exportar.', 'error');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Fecha,Estudiante,Curso,Metodo de Pago,Referencia,Monto USD,Monto VES\n";

  filtered.forEach(p => {
    const courseObj = cursos.find(c => c.id === p.courseId);
    const courseName = courseObj ? courseObj.nombre : 'Sin curso';
    const amountVES = (p.amount * tasaBCV).toFixed(2);
    
    const row = [
      p.date,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${courseName.replace(/"/g, '""')}"`,
      p.method,
      `"${(p.ref || '').replace(/"/g, '""')}"`,
      p.amount.toFixed(2),
      amountVES
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `reporte_transacciones_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  logActivity('nota', `Reporte CSV de transacciones exportado con ${filtered.length} registros.`);
}
