// MÓDULO: modals.js

function openStudentModal(studentId = null) {
  ensureModalLoaded('student-modal');
  const modal = document.getElementById('student-modal');
  const title = document.getElementById('student-modal-title');
  const form = document.getElementById('student-form');
  
  // Populate course options
  const courseSelect = document.getElementById('student-curso');
  courseSelect.innerHTML = cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');

  // Populate day options
  const diaSelect = document.getElementById('student-dia');
  if (diaSelect) {
    diaSelect.innerHTML = dias.map(d => `<option value="${escapeHTML(d.nombre)}">${escapeHTML(d.nombre)} 📅</option>`).join('');
  }

  // Populate schedule options
  const horarioSelect = document.getElementById('student-horario');
  if (horarioSelect) {
    horarioSelect.innerHTML = `<option value="" disabled>Seleccione</option>` + 
      horarios.map(h => {
        const emoji = h.nombre === "a convenir" ? "🤝" : "⏰";
        return `<option value="${escapeHTML(h.nombre)}">${escapeHTML(h.nombre)} ${emoji}</option>`;
      }).join('');
  }

  // Populate coordinator options
  const coordSelect = document.getElementById('student-coordinador');
  if (coordSelect) {
    const listCoordinators = ["Admin CTD", ...asesores.map(a => a.nombre)];
    coordSelect.innerHTML = listCoordinators.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
    
    if (userRole === 'asesor') {
      coordSelect.value = username;
      coordSelect.disabled = true;
    } else {
      coordSelect.disabled = false;
    }
  }

  // Set change event listeners to update cohorts dynamically
  const etapaSelect = document.getElementById('student-etapa');
  const cursoSelect = document.getElementById('student-curso');
  if (etapaSelect) etapaSelect.onchange = updateStudentModalCohortVisibility;
  if (cursoSelect) cursoSelect.onchange = updateStudentModalCohortVisibility;

  if (studentId) {
    // Edit mode
    const student = alumnos.find(a => a.id === studentId);
    if (!student) return;

    editingStudent = student;
    title.innerText = 'Editar Datos de Alumno';

    document.getElementById('student-nombre').value = student.nombre;
    document.getElementById('student-apellido').value = student.apellido || '';
    const cedInput = document.getElementById('student-cedula');
    if (cedInput) cedInput.value = student.cedula || '';
    document.getElementById('student-email').value = student.email || '';
    document.getElementById('student-tel').value = student.tel || '';
    document.getElementById('student-curso').value = student.curso;
    document.getElementById('student-etapa').value = student.etapa;
    document.getElementById('student-prioridad').value = student.prioridad;
    document.getElementById('student-origen').value = student.origen || 'Web';
    document.getElementById('student-instagram').value = student.instagram || '';
    document.getElementById('student-nivel').value = student.nivel || 'Principiante';
    document.getElementById('student-dia').value = student.dia || 'Lunes a Viernes';
    document.getElementById('student-horario').value = student.horario || '9am - 11am';

    if (coordSelect) {
      coordSelect.value = student.coordinador || 'Admin CTD';
    }

    updateStudentModalCohortVisibility();
    const cohortSelect = document.getElementById('student-academic-group');
    if (cohortSelect && student.academicGroup) {
      cohortSelect.value = student.academicGroup;
    }

    document.getElementById('note-initial-group').style.display = 'none';
  } else {
    // Create mode
    editingStudent = null;
    title.innerText = 'Nuevo Alumno';
    form.reset();

    const cedInput = document.getElementById('student-cedula');
    if (cedInput) cedInput.value = '';
    document.getElementById('student-etapa').value = 'Nuevo';
    document.getElementById('student-prioridad').value = 'Media';
    document.getElementById('student-origen').value = 'Web';
    document.getElementById('student-instagram').value = '';
    document.getElementById('student-nivel').value = 'Principiante';
    document.getElementById('student-dia').value = 'Lunes a Viernes';
    document.getElementById('student-horario').value = '9am - 11am';
    
    if (coordSelect && userRole === 'admin') {
      coordSelect.value = username || 'Admin CTD';
    } else if (coordSelect && userRole === 'asesor') {
      coordSelect.value = username;
    }
    
    updateStudentModalCohortVisibility();

    document.getElementById('note-initial-group').style.display = 'block';
  }

  modal.classList.add('open');
}

function closeStudentModal() {
  document.getElementById('student-modal').classList.remove('open');
  editingStudent = null;
}

function updateStudentModalCohortVisibility() {
  const etapaSelect = document.getElementById('student-etapa');
  const cursoSelect = document.getElementById('student-curso');
  const cohortContainer = document.getElementById('student-academic-group-container');
  const cohortSelect = document.getElementById('student-academic-group');

  if (!etapaSelect || !cursoSelect || !cohortContainer || !cohortSelect) return;

  const etapa = etapaSelect.value;
  const cursoId = cursoSelect.value;

  if (etapa === 'Inscrito') {
    cohortContainer.style.display = 'block';

    const courseCohortes = cohortes.filter(c => c.curso === cursoId && c.estatus === 'Activo');
    
    let optionsHtml = '<option value="">-- Sin Grupo (Solo Inscrito) --</option>';
    if (courseCohortes.length > 0) {
      optionsHtml += courseCohortes.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
    }
    
    const currentVal = cohortSelect.value;
    cohortSelect.innerHTML = optionsHtml;
    if (currentVal && Array.from(cohortSelect.options).some(opt => opt.value === currentVal)) {
      cohortSelect.value = currentVal;
    }
  } else {
    cohortContainer.style.display = 'none';
    cohortSelect.value = '';
  }
}

function saveStudent(e) {
  e.preventDefault();

  const nombre = document.getElementById('student-nombre').value.trim();
  const apellido = document.getElementById('student-apellido').value.trim();
  const email = document.getElementById('student-email').value.trim();
  let tel = document.getElementById('student-tel').value.trim();
  tel = formatPhoneNumber(tel);

  if (tel && tel.replace(/\D/g, '').length < 10) {
    if (!confirm('⚠️ El número de WhatsApp ingresado parece no incluir código de país o ser demasiado corto. ¿Deseas guardarlo de todas formas?')) {
      return;
    }
  }

  const curso = document.getElementById('student-curso').value;
  const etapa = document.getElementById('student-etapa').value;
  const prioridad = document.getElementById('student-prioridad').value;
  const origen = document.getElementById('student-origen').value;
  const instagram = document.getElementById('student-instagram').value.trim();
  const nivel = document.getElementById('student-nivel').value;
  const dia = document.getElementById('student-dia').value;
  const horario = document.getElementById('student-horario').value;
  const cedula = document.getElementById('student-cedula') ? document.getElementById('student-cedula').value.trim() : '';
  const academicGroup = document.getElementById('student-academic-group') ? document.getElementById('student-academic-group').value : '';
  const coordinadorSelect = document.getElementById('student-coordinador');
  const coordinador = coordinadorSelect ? coordinadorSelect.value : (username || 'Admin CTD');

  if (!nombre || !curso || !etapa) {
    showToast('Nombre, curso y etapa son requeridos.', 'error');
    return;
  }

  if (editingStudent) {
    // Edit flow
    const target = alumnos.find(a => a.id === editingStudent.id);
    if (target) {
      const oldStage = target.etapa;
      const oldCurso = target.curso;
      target.nombre = nombre;
      target.apellido = apellido;
      target.cedula = cedula;
      target.email = email;
      target.tel = tel;
      target.curso = curso;
      target.etapa = etapa;
      target.prioridad = prioridad;
      target.origen = origen;
      target.instagram = instagram;
      target.nivel = nivel;
      target.dia = dia;
      target.horario = horario;
      target.coordinador = coordinador;

      if (oldCurso !== curso) {
        const newCourseObj = cursos.find(c => c.id === curso);
        if (newCourseObj) {
          target.academicPrice = newCourseObj.precio;
        }
      }

      if (etapa === 'Inscrito') {
        target.academicGroup = academicGroup;
        if (!target.academicStatus) target.academicStatus = 'Cursando';
        if (!target.academicStartDate) target.academicStartDate = new Date().toISOString().split('T')[0];
      } else {
        target.academicGroup = '';
        target.academicStatus = '';
        target.academicStartDate = '';
      }

      logActivity('edicion', `Se actualizaron los datos de ${nombre} ${apellido}.`);
      if (oldStage !== etapa) {
        logActivity('etapa', `Se cambió la etapa de ${nombre} ${apellido} a "${etapa}".`);
        handleWorkflowAutomation(target, oldStage, etapa);
        if (etapa === 'Inscrito') {
          triggerConfetti();
          promptEnrollmentWhatsApp(target);
        } else if (etapa === 'Perdido') {
          pendingLostReasonStudentId = target.id;
          setTimeout(() => openLostReasonModal(), 200);
        }
      }

      showToast('Cambios guardados con éxito.', 'success');
    }
  } else {
    // Create flow
    const notaText = document.getElementById('student-nota').value.trim();
    
    // Check duplicates:
    let duplicate = null;
    if (email) {
      duplicate = alumnos.find(a => a.email && a.email.toLowerCase() === email.toLowerCase());
    }
    if (!duplicate && tel) {
      const cleanNewTel = tel.replace(/\D/g, '');
      if (cleanNewTel.length > 5) {
        duplicate = alumnos.find(a => {
          if (!a.tel) return false;
          const cleanExistingTel = a.tel.replace(/\D/g, '');
          return cleanExistingTel === cleanNewTel;
        });
      }
    }

    const studentData = {
      nombre,
      apellido,
      cedula,
      email,
      tel,
      curso,
      etapa,
      prioridad,
      origen,
      instagram,
      nivel,
      dia,
      horario,
      academicGroup,
      notaText,
      coordinador
    };

    if (duplicate) {
      pendingDuplicateStudentData = studentData;

      ensureModalLoaded('duplicate-modal');

      const nameEl = document.getElementById('dup-modal-name');
      const stageEl = document.getElementById('dup-modal-stage');
      const telEl = document.getElementById('dup-modal-tel');
      const emailEl = document.getElementById('dup-modal-email');

      if (nameEl) nameEl.innerText = `${duplicate.nombre} ${duplicate.apellido || ''}`;
      if (stageEl) stageEl.innerText = duplicate.etapa;
      if (telEl) telEl.innerText = duplicate.tel || 'Sin teléfono';
      if (emailEl) emailEl.innerText = duplicate.email || 'Sin email';
      
      const modal = document.getElementById('duplicate-modal');
      if (modal) {
        modal.classList.add('open');
      }
      return;
    }

    createStudentDirect(studentData);
  }

  saveState();
  closeStudentModal();
  setView(activeView);
}

function openCourseModal(courseId = null) {
  ensureModalLoaded('course-modal');
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
    const durValue = course.duracion ? parseInt(course.duracion) : '';
    document.getElementById('course-duracion').value = isNaN(durValue) ? '' : durValue;
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
  const duracionVal = document.getElementById('course-duracion').value.trim();
  const duracion = duracionVal ? `${duracionVal} semanas` : '';
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
      const oldPrecio = target.precio;
      target.nombre = nombre;
      target.precio = precio;
      target.duracion = duracion;
      target.desc = desc;

      // Propagate price change to students who have no payments or whose price matched the old price
      alumnos.forEach(a => {
        if (a.curso === target.id) {
          if (a.academicPrice === oldPrecio || !a.academicPrice || a.academicPrice === 0 || (a.academicPaid || 0) === 0) {
            a.academicPrice = precio;
          }
        }
      });

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

function openCohortModal(cohortId = null) {
  ensureModalLoaded('cohort-modal');
  const select = document.getElementById('cohort-curso');
  if (select) {
    select.innerHTML = '<option value="" disabled selected>Selecciona un curso...</option>' +
      cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
  }

  const titleEl = document.getElementById('cohort-modal-title');
  const submitBtn = document.getElementById('cohort-submit-btn');
  const form = document.getElementById('cohort-form');

  if (cohortId) {
    const coh = cohortes.find(c => c.id === cohortId);
    if (!coh) return;

    editingCohort = coh;
    if (titleEl) titleEl.innerText = 'Editar Cohorte / Grupo';
    if (submitBtn) submitBtn.innerText = 'Guardar Cambios';

    document.getElementById('cohort-nombre').value = coh.nombre;
    document.getElementById('cohort-curso').value = coh.curso;
    document.getElementById('cohort-inicio').value = coh.fechaInicio;
    document.getElementById('cohort-fin').value = coh.fechaFin;
    document.getElementById('cohort-capacidad').value = coh.capacidad !== undefined ? coh.capacidad : 15;
    document.getElementById('cohort-estatus').value = coh.estatus;
  } else {
    editingCohort = null;
    if (titleEl) titleEl.innerText = 'Crear Cohorte / Grupo';
    if (submitBtn) submitBtn.innerText = 'Crear Grupo';

    if (form) form.reset();
  }

  const modal = document.getElementById('cohort-modal');
  if (modal) modal.classList.add('open');
}

function closeCohortModal() {
  editingCohort = null;
  const modal = document.getElementById('cohort-modal');
  if (modal) modal.classList.remove('open');
}

function saveCohort(event) {
  event.preventDefault();

  const nombre = document.getElementById('cohort-nombre').value.trim();
  const curso = document.getElementById('cohort-curso').value;
  const fechaInicio = document.getElementById('cohort-inicio').value;
  const fechaFin = document.getElementById('cohort-fin').value;
  const capacidad = parseInt(document.getElementById('cohort-capacidad').value) || 15;
  const estatus = document.getElementById('cohort-estatus').value;

  if (!nombre || !curso || !fechaInicio || !fechaFin || !estatus) {
    showToast('Por favor, completa todos los campos requeridos.', 'error');
    return;
  }

  if (editingCohort) {
    const oldStatus = editingCohort.estatus;
    editingCohort.nombre = nombre;
    editingCohort.curso = curso;
    editingCohort.fechaInicio = fechaInicio;
    editingCohort.fechaFin = fechaFin;
    editingCohort.capacidad = capacidad;
    editingCohort.estatus = estatus;

    // Premium Automation: If Cohort becomes "Graduado" and it wasn't before, prompt user to auto-graduate assigned students!
    if (estatus === 'Graduado' && oldStatus !== 'Graduado') {
      const assignedStudents = alumnos.filter(a => a.academicGroup === editingCohort.id && a.etapa === 'Inscrito');
      if (assignedStudents.length > 0) {
        if (confirm(`El estatus del grupo ahora es "Graduado". ¿Deseas cambiar el Estado Académico de los ${assignedStudents.length} alumnos de este grupo a "Graduado 🎓" automáticamente?`)) {
          assignedStudents.forEach(a => {
            a.academicStatus = 'Graduado';
          });
          showToast(`Se graduaron automáticamente ${assignedStudents.length} alumnos.`, 'success');
          logActivity('edicion', `Se graduaron automáticamente los alumnos del grupo "${nombre}".`);
        }
      }
    }

    logActivity('edicion', `Se editó el grupo/cohorte "${nombre}".`);
    showToast('Grupo actualizado con éxito.', 'success');
  } else {
    const newCohort = {
      id: `coh-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      nombre,
      curso,
      fechaInicio,
      fechaFin,
      capacidad,
      estatus
    };
    cohortes.push(newCohort);
    logActivity('nuevo', `Se creó el grupo/cohorte "${nombre}".`);
    showToast('Grupo creado exitosamente.', 'success');
  }

  saveState();
  closeCohortModal();
  renderCohortes();
  
  // Update detail view dropdown option if it's currently open
  if (selectedStudent) {
    openDetailPanel(selectedStudent.id);
  }
}

function deleteCohort(cohortId) {
  const coh = cohortes.find(c => c.id === cohortId);
  if (!coh) return;

  const assignedCount = alumnos.filter(a => a.academicGroup === cohortId).length;
  let confirmMsg = `¿Estás seguro de que deseas eliminar el grupo "${coh.nombre}"?`;
  if (assignedCount > 0) {
    confirmMsg += `\n⚠️ Advertencia: Hay ${assignedCount} alumnos asignados a este grupo. Quedarán marcados como "Sin Grupo".`;
  }

  if (confirm(confirmMsg)) {
    cohortes = cohortes.filter(c => c.id !== cohortId);
    
    // Dissociate students
    alumnos.forEach(a => {
      if (a.academicGroup === cohortId) {
        a.academicGroup = '';
      }
    });

    logActivity('eliminacion', `Se eliminó el grupo/cohorte "${coh.nombre}".`);
    saveState();
    renderCohortes();
    if (selectedCohortId === cohortId) {
      closeCohortSidebar();
    }
    showToast('Grupo eliminado correctamente.', 'success');
  }
}

function openBulkWaModal(cohortId) {
  ensureModalLoaded('bulk-whatsapp-modal');
  bulkCohortId = cohortId;
  const coh = cohortes.find(c => c.id === cohortId);
  if (!coh) return;

  const titleEl = document.getElementById('bulk-wa-title');
  if (titleEl) titleEl.innerText = `Envío Masivo: WhatsApp (${coh.nombre})`;

  const selectTmpl = document.getElementById('bulk-wa-template-select');
  if (selectTmpl) {
    selectTmpl.innerHTML = '<option value="" disabled selected>Selecciona una plantilla...</option>' +
      whatsappTemplates.map(t => `<option value="${t.id}">${escapeHTML(t.nombre)}</option>`).join('');
  }

  const studentListEl = document.getElementById('bulk-wa-student-list');
  const countEl = document.getElementById('bulk-wa-student-count');
  bulkStudentList = alumnos.filter(a => a.academicGroup === cohortId && a.etapa === 'Inscrito');
  
  if (countEl) countEl.innerText = `Destinatarios (${bulkStudentList.length} Alumnos)`;

  if (bulkStudentList.length === 0) {
    if (studentListEl) studentListEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">No hay alumnos inscritos en este grupo.</p>';
  } else {
    renderBulkStudentList();
  }

  document.getElementById('bulk-whatsapp-modal').classList.add('open');
  previewBulkWaMessage();
}

function closeBulkWaModal() {
  document.getElementById('bulk-whatsapp-modal').classList.remove('open');
  bulkCohortId = null;
  bulkStudentList = [];
}

function openQuickPaymentModal(studentId) {
  if (typeof userRole !== 'undefined' && userRole === 'asesor') {
    showToast('Acceso restringido para Asesores de Ventas.', 'error');
    return;
  }
  ensureModalLoaded('quick-payment-modal');
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const courseObj = cursos.find(c => c.id === student.curso);
  const courseName = courseObj ? courseObj.nombre : 'N/A';
  const price = student.academicPrice !== undefined ? student.academicPrice : (courseObj ? courseObj.precio : 0);
  const paid = student.academicPaid || 0;
  const balance = price - paid;

  document.getElementById('quick-payment-student-id').value = student.id;
  document.getElementById('quick-payment-student-name').innerText = `${student.nombre} ${student.apellido || ''}`;
  document.getElementById('quick-payment-student-course').innerText = courseName;
  document.getElementById('quick-payment-student-balance').innerText = `$${balance.toFixed(2)} USD (~ ${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)`;

  document.getElementById('quick-payment-amount').value = balance.toFixed(2);
  document.getElementById('quick-payment-amount').max = balance.toFixed(2);
  document.getElementById('quick-payment-date').value = new Date().toISOString().split('T')[0];

  const modal = document.getElementById('quick-payment-modal');
  if (modal) {
    modal.classList.add('open');
  }
}

function closeQuickPaymentModal() {
  const modal = document.getElementById('quick-payment-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function saveQuickPayment(e) {
  e.preventDefault();
  const studentId = document.getElementById('quick-payment-student-id').value;
  const amount = parseFloat(document.getElementById('quick-payment-amount').value);
  const date = document.getElementById('quick-payment-date').value;

  if (isNaN(amount) || amount <= 0) {
    showToast('Por favor introduce un monto válido.', 'error');
    return;
  }

  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const courseObj = cursos.find(c => c.id === student.curso);
  const price = student.academicPrice !== undefined ? student.academicPrice : (courseObj ? courseObj.precio : 0);
  const currentPaid = student.academicPaid || 0;
  const balance = price - currentPaid;

  if (amount > balance + 0.01) {
    showToast(`El monto del abono ($${amount} USD) no puede ser superior al saldo pendiente ($${balance} USD).`, 'error');
    return;
  }

  // Register payment
  student.payments = student.payments || [];
  const newPaymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  student.payments.push({
    id: newPaymentId,
    amount,
    method: 'Pago Móvil',
    date,
    ref: 'Abono Rápido'
  });

  // Keep academicPaid in sync
  student.academicPaid = student.payments.reduce((acc, p) => acc + p.amount, 0);

  // Auto-schedule next contact if balance remains
  const newBalance = Math.max(0, price - student.academicPaid);
  if (newBalance > 0) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 15);
    student.nextContactDate = nextDate.toISOString().split('T')[0];
  } else {
    student.nextContactDate = '';
  }

  saveState();
  closeQuickPaymentModal();
  showToast('Abono registrado con éxito.', 'success');
  logActivity('nota', `[Abono Rápido] Se registró un abono de $${amount} USD para ${student.nombre} ${student.apellido || ''}.`);

  // Refresh view
  if (activeView === 'reportes') {
    renderReportes();
  } else if (activeView === 'dashboard') {
    renderDashboard();
  }

  // Prompt to send WhatsApp receipt
  setTimeout(() => {
    if (confirm(`¿Deseas enviar el recibo de pago de $${amount} USD por WhatsApp a ${student.nombre}?`)) {
      sendPaymentReceiptWhatsApp(newPaymentId);
    }
  }, 400);
}

function openLostReasonModal() {
  ensureModalLoaded('lost-reason-modal');
  const modal = document.getElementById('lost-reason-modal');
  if (modal) {
    document.getElementById('lost-reason-select').value = 'Precio Alto';
    document.getElementById('lost-reason-other-input').value = '';
    document.getElementById('lost-reason-other-group').style.display = 'none';
    modal.classList.add('open');
  }
}

function closeLostReasonModal() {
  const modal = document.getElementById('lost-reason-modal');
  if (modal) modal.classList.remove('open');
  pendingLostReasonStudentId = null;
}

function saveLostReason(e) {
  e.preventDefault();
  if (!pendingLostReasonStudentId) return;

  const student = alumnos.find(a => a.id === pendingLostReasonStudentId);
  if (student) {
    const selectVal = document.getElementById('lost-reason-select').value;
    let reason = selectVal;
    if (selectVal === 'Otro') {
      const otherInput = document.getElementById('lost-reason-other-input').value.trim();
      reason = otherInput || 'Otro Motivo';
    }
    
    student.lostReason = reason;
    logActivity('nota', `Motivo de descarte para ${student.nombre}: ${reason}`);
    
    const notesArr = student.notes || student.notas || [];
    notesArr.push({
      text: `❌ Prospecto marcado como Perdido. Motivo: ${reason}`,
      date: new Date().toISOString()
    });
    student.notas = notesArr;
    
    saveState();
    showToast('Motivo de pérdida guardado.', 'success');
    
    if (selectedStudent && selectedStudent.id === student.id) {
      openDetailPanel(student.id);
    }
    setView(activeView);
  }
  closeLostReasonModal();
}

function saveAcademicInfo() {
  if (!selectedStudent) return;
  
  const targetGroup = document.getElementById('detail-academic-group').value;
  if (targetGroup) {
    const coh = cohortes.find(c => c.id === targetGroup);
    if (coh) {
      const cap = coh.capacidad || 15;
      const currentEnrolled = alumnos.filter(a => a.academicGroup === coh.id && a.etapa === 'Inscrito' && a.id !== selectedStudent.id).length;
      if (currentEnrolled >= cap) {
        showToast(`❌ Error: El grupo "${coh.nombre}" ha alcanzado su límite de capacidad máxima de ${cap} alumnos. Asignación bloqueada.`, 'error');
        alert(`❌ Operación Cancelada: El grupo "${coh.nombre}" ha alcanzado su capacidad máxima (${cap} alumnos).`);
        return;
      }
    }
  }

  selectedStudent.academicStatus = document.getElementById('detail-academic-status').value;
  selectedStudent.academicGroup = targetGroup;
  selectedStudent.academicStartDate = document.getElementById('detail-academic-start-date').value;
  selectedStudent.academicCertificate = document.getElementById('detail-academic-certificate').value;
  
  const attVal = document.getElementById('detail-academic-attendance').value;
  selectedStudent.academicAttendance = attVal !== '' ? parseInt(attVal) : '';
  const gradeVal = document.getElementById('detail-academic-grade').value;
  selectedStudent.academicGrade = gradeVal !== '' ? parseInt(gradeVal) : '';
  
  selectedStudent.academicPrice = parseFloat(document.getElementById('detail-payment-cost').value) || 0;
  
  saveState();
  updatePaymentUI();
  
  const printCertContainer = document.getElementById('print-certificate-container');
  if (printCertContainer) {
    printCertContainer.style.display = (selectedStudent.academicStatus === 'Graduado') ? 'block' : 'none';
  }
  
  showToast('Datos académicos y de pago guardados.', 'success');
  
  if (selectedStudent.academicStatus === 'Graduado') {
    logActivity('edicion', `${selectedStudent.nombre} ${selectedStudent.apellido || ''} se ha graduado.`);
  }
  
  setView(activeView);
}

function deleteStudentPayment(paymentId) {
  if (!selectedStudent || !selectedStudent.payments) return;

  const paymentIndex = selectedStudent.payments.findIndex(p => p.id === paymentId);
  if (paymentIndex === -1) return;

  const payment = selectedStudent.payments[paymentIndex];
  if (confirm(`¿Estás seguro de que deseas eliminar el abono de $${payment.amount} USD?`)) {
    selectedStudent.payments.splice(paymentIndex, 1);
    
    // Keep academicPaid in sync
    selectedStudent.academicPaid = selectedStudent.payments.reduce((acc, p) => acc + p.amount, 0);

    saveState();
    showToast('Abono eliminado.', 'info');
    
    // Refresh Detail panel UI
    updatePaymentUI();
  }
}

function addStudentPayment(event) {
  event.preventDefault();
  if (!selectedStudent) return;

  const amountInput = document.getElementById('new-payment-amount');
  const methodSelect = document.getElementById('new-payment-method');
  const dateInput = document.getElementById('new-payment-date');
  const refInput = document.getElementById('new-payment-ref');

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) return;

  const method = methodSelect.value;
  const date = dateInput.value || new Date().toISOString().split('T')[0];
  const ref = refInput.value.trim();

  selectedStudent.payments = selectedStudent.payments || [];
  const newPaymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  selectedStudent.payments.push({
    id: newPaymentId,
    amount,
    method,
    date,
    ref
  });

  // Keep academicPaid in sync
  selectedStudent.academicPaid = selectedStudent.payments.reduce((acc, p) => acc + p.amount, 0);

  // Auto-schedule next contact and task if balance remains
  const total = selectedStudent.academicPrice !== undefined ? selectedStudent.academicPrice : (cursos.find(c => c.id === selectedStudent.curso)?.precio || 0);
  const balance = Math.max(0, total - selectedStudent.academicPaid);

  const nextDateInput = document.getElementById('new-payment-next-date');
  const nextDateStr = nextDateInput ? nextDateInput.value : '';

  if (balance > 0 && nextDateStr) {
    selectedStudent.nextContactDate = nextDateStr;

    // Create a collection task automatically
    const taskTitle = `📞 Cobro de saldo pendiente: Recaudar $${balance} USD para ${selectedStudent.nombre} ${selectedStudent.apellido || ''}`;
    const hasActiveCollectionTask = tareas.some(t => t.studentId === selectedStudent.id && !t.completed && t.title.startsWith('📞 Cobro de saldo pendiente'));
    if (!hasActiveCollectionTask) {
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId: selectedStudent.id,
        title: taskTitle,
        dueDate: nextDateStr,
        completed: false
      };
      tareas.push(newTask);
      logActivity('edicion', `[Automatización] Tarea de cobranza auto-generada: "${taskTitle}"`);
    }
  }

  saveState();
  showToast('Abono registrado con éxito.', 'success');

  // Reset fields
  amountInput.value = '';
  const helperVal = document.getElementById('new-payment-amount-ves-helper');
  if (helperVal) helperVal.style.display = 'none';
  refInput.value = '';
  dateInput.value = new Date().toISOString().split('T')[0];

  // Refresh Detail panel UI
  updatePaymentUI();
  
  // Register in activity history
  logActivity('nota', `Se registró un pago de $${amount} USD por ${method} para ${selectedStudent.nombre} ${selectedStudent.apellido || ''}.`);

  // Prompt to send WhatsApp receipt
  setTimeout(() => {
    if (confirm(`¿Deseas enviar el recibo de pago de $${amount} USD por WhatsApp a ${selectedStudent.nombre}?`)) {
      sendPaymentReceiptWhatsApp(newPaymentId);
    }
  }, 400);
}

function saveCustomFilterView() {
  const nameInput = document.getElementById('save-filter-name');
  if (!nameInput) return;
  const name = nameInput.value.trim();
  
  if (!name) {
    showToast('Ingresa un nombre para guardar la vista.', 'error');
    return;
  }
  
  const filters = {
    etapa: document.getElementById('filter-etapa')?.value || '',
    curso: document.getElementById('filter-curso')?.value || '',
    cohort: document.getElementById('filter-cohort')?.value || '',
    prioridad: document.getElementById('filter-prioridad')?.value || '',
    origen: document.getElementById('filter-origen')?.value || '',
    pago: document.getElementById('filter-pago')?.value || '',
    status: document.getElementById('filter-academic-status')?.value || ''
  };
  
  customFilterViews[name] = filters;
  localStorage.setItem('ctd_custom_filter_views', JSON.stringify(customFilterViews));
  showToast(`Vista "${name}" guardada con éxito.`, 'success');
  nameInput.value = '';
  
  updateSavedFiltersDropdown();
}

function deleteCustomFilterView() {
  const select = document.getElementById('saved-filters-select');
  if (!select) return;
  const viewName = select.value;
  if (!viewName || !customFilterViews[viewName]) return;
  
  if (confirm(`¿Estás seguro de que deseas eliminar la vista guardada "${viewName}"?`)) {
    delete customFilterViews[viewName];
    localStorage.setItem('ctd_custom_filter_views', JSON.stringify(customFilterViews));
    showToast(`Vista "${viewName}" eliminada.`, 'info');
    
    updateSavedFiltersDropdown();
    clearFilters();
  }
}

function insertQuickNote(text) {
  const textarea = document.getElementById('new-note-text');
  if (textarea) {
    textarea.value = text;
    textarea.focus();
  }
}

function proceedDuplicateRegistration() {
  if (pendingDuplicateStudentData) {
    createStudentDirect(pendingDuplicateStudentData);
    saveState();
    closeStudentModal();
    setView(activeView);
  }
  closeDuplicateModal();
}

function closeDuplicateModal() {
  const modal = document.getElementById('duplicate-modal');
  if (modal) modal.classList.remove('open');
  pendingDuplicateStudentData = null;
}

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
  const cedulaEl = document.getElementById('detail-cedula');
  if (cedulaEl) {
    cedulaEl.innerText = student.cedula || 'No registrado';
  }
  document.getElementById('detail-tel').innerText = student.tel || 'Sin teléfono';

  const waLink = document.getElementById('detail-wa-link');
  if (student.tel) {
    const cleanNumber = student.tel.replace(/\D/g, '');
    waLink.href = `https://wa.me/${cleanNumber}`;
    waLink.style.display = 'inline-flex';
  } else {
    waLink.style.display = 'none';
  }

  // Populate WhatsApp Template Select
  const waSelect = document.getElementById('detail-wa-template');
  if (waSelect) {
    waSelect.innerHTML = whatsappTemplates.map(tmpl => `<option value="${tmpl.id}">${escapeHTML(tmpl.nombre)}</option>`).join('');
  }

  // Instagram custom field
  const instagramText = student.instagram || 'Sin instagram';
  const igTextEl = document.getElementById('detail-instagram');
  const igLink = document.getElementById('detail-ig-link');
  if (igTextEl) igTextEl.innerText = instagramText;
  
  if (student.instagram && student.instagram.trim().length > 0) {
    let cleanIg = student.instagram.replace('@', '').trim();
    const url = `https://instagram.com/${cleanIg}`;
    if (igLink) {
      igLink.href = url;
      igLink.style.display = 'inline-flex';
    }
    if (igTextEl) {
      igTextEl.href = url;
      igTextEl.style.pointerEvents = 'auto';
      igTextEl.style.opacity = '1';
      igTextEl.style.color = 'var(--color-primary)';
      igTextEl.style.textDecoration = 'underline';
    }
  } else {
    if (igLink) {
      igLink.style.display = 'none';
    }
    if (igTextEl) {
      igTextEl.href = '#';
      igTextEl.style.pointerEvents = 'none';
      igTextEl.style.opacity = '0.6';
      igTextEl.style.color = 'inherit';
      igTextEl.style.textDecoration = 'none';
    }
  }

  document.getElementById('detail-curso').innerText = getCourseName(student.curso);
  document.getElementById('detail-origen').innerText = student.origen || 'Web';

  const priorityBadge = document.getElementById('detail-prioridad');
  priorityBadge.innerText = student.prioridad;
  priorityBadge.className = `badge priority-badge-${student.prioridad.toLowerCase()}`;

  const scoring = getLeadScore(student);
  const scoreBadge = document.getElementById('detail-score-badge');
  if (scoreBadge) {
    scoreBadge.innerHTML = `${scoring.icon} ${scoring.score}% (${scoring.label})`;
    scoreBadge.className = `score-badge ${scoring.class}`;
  }

  // Custom Nivel, Dia and Horario
  document.getElementById('detail-nivel').innerText = student.nivel || 'Principiante';
  document.getElementById('detail-dia').innerText = student.dia || 'Lunes a Viernes';
  document.getElementById('detail-horario').innerText = student.horario || '9am - 11am';

  document.getElementById('detail-fecha').innerText = formatDateFull(student.fecha);

  const lostReasonItem = document.getElementById('detail-lost-reason-item');
  if (lostReasonItem) {
    if (student.etapa === 'Perdido') {
      lostReasonItem.style.display = 'block';
      document.getElementById('detail-lost-reason').innerText = student.lostReason || 'No especificado';
    } else {
      lostReasonItem.style.display = 'none';
    }
  }

  // Render next contact date
  const nextContactInput = document.getElementById('detail-next-contact');
  if (nextContactInput) {
    nextContactInput.value = student.nextContactDate || '';
  }

  // Render Academic Post-Sale Section
  const academicSection = document.getElementById('detail-academic-section');
  const paymentsSection = document.getElementById('detail-payments-section');
  if (academicSection) {
    if (student.etapa === 'Inscrito') {
      academicSection.style.display = 'block';
      if (paymentsSection) {
        paymentsSection.style.display = (typeof userRole !== 'undefined' && userRole === 'asesor') ? 'none' : 'block';
      }
      
      // Initialize if needed
      if (!student.academicStatus) student.academicStatus = 'Cursando';
      if (!student.academicGroup) student.academicGroup = '';
      if (!student.academicStartDate) student.academicStartDate = '';
      if (!student.academicCertificate) student.academicCertificate = 'No';
      
      document.getElementById('detail-academic-status').value = student.academicStatus;
      
      const groupSelect = document.getElementById('detail-academic-group');
      if (groupSelect) {
        const courseCohortes = cohortes.filter(c => c.curso === student.curso);
        let optionsHtml = '<option value="">Sin Grupo / Cohorte</option>';
        optionsHtml += courseCohortes.map(coh => `<option value="${coh.id}">${escapeHTML(coh.nombre)}</option>`).join('');
        
        if (student.academicGroup && !courseCohortes.some(c => c.id === student.academicGroup)) {
          const matchedCohort = cohortes.find(c => c.nombre === student.academicGroup);
          if (matchedCohort) {
            student.academicGroup = matchedCohort.id;
          } else {
            optionsHtml += `<option value="${escapeHTML(student.academicGroup)}">${escapeHTML(student.academicGroup)}</option>`;
          }
        }
        
        groupSelect.innerHTML = optionsHtml;
        groupSelect.value = student.academicGroup || '';
      }
      
      document.getElementById('detail-academic-start-date').value = student.academicStartDate || '';
      document.getElementById('detail-academic-certificate').value = student.academicCertificate || 'No';
      document.getElementById('detail-academic-attendance').value = student.academicAttendance !== undefined ? student.academicAttendance : '';
      document.getElementById('detail-academic-grade').value = student.academicGrade !== undefined ? student.academicGrade : '';

      const printCertContainer = document.getElementById('print-certificate-container');
      if (printCertContainer) {
        printCertContainer.style.display = (student.academicStatus === 'Graduado') ? 'block' : 'none';
      }

      // Payment Tracking Initialization
      const targetCourse = cursos.find(c => c.id === student.curso);
      const basePrice = targetCourse ? targetCourse.precio : 0;
      if (student.academicPrice === undefined || student.academicPrice === '') {
        student.academicPrice = basePrice;
      }
      
      student.payments = student.payments || [];
      student.academicPaid = student.payments.reduce((acc, p) => acc + p.amount, 0);

      document.getElementById('detail-payment-cost').value = student.academicPrice;
      
      // Set today's date as default in the form
      const newPaymentDateInput = document.getElementById('new-payment-date');
      if (newPaymentDateInput) {
        newPaymentDateInput.value = new Date().toISOString().split('T')[0];
      }

      // Initialize next payment/remind date to 30 days
      const newPaymentNextDateInput = document.getElementById('new-payment-next-date');
      if (newPaymentNextDateInput) {
        const defaultNext = new Date();
        defaultNext.setDate(defaultNext.getDate() + 30);
        newPaymentNextDateInput.value = defaultNext.toISOString().split('T')[0];
      }
      const presetSelect = document.getElementById('new-payment-next-days-preset');
      if (presetSelect) {
        presetSelect.value = '30';
      }

      // Update UI balance and render history
      updatePaymentUI();
    } else {
      academicSection.style.display = 'none';
      if (paymentsSection) paymentsSection.style.display = 'none';
    }
  }

  // Render Notes List
  renderDetailNotes();

  // Render Tasks List
  renderDetailTasks();

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

function handleLostReasonSelectChange() {
  const select = document.getElementById('lost-reason-select').value;
  const otherGroup = document.getElementById('lost-reason-other-group');
  if (otherGroup) {
    otherGroup.style.display = (select === 'Otro') ? 'block' : 'none';
  }
}

function assignStudentToCohort(studentId, cohortId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  const coh = cohortes.find(c => c.id === cohortId);
  if (coh) {
    const capacity = coh.capacidad || 15;
    const assignedCount = alumnos.filter(a => a.academicGroup === cohortId && a.etapa === 'Inscrito').length;
    if (assignedCount >= capacity) {
      showToast(`❌ Error: El grupo "${coh.nombre}" ha alcanzado su límite de capacidad máxima de ${capacity} alumnos. Asignación bloqueada.`, 'error');
      alert(`❌ Operación Cancelada: El grupo "${coh.nombre}" ha alcanzado su capacidad máxima (${capacity} alumnos).`);
      return;
    }
  }

  student.academicGroup = cohortId;
  saveState();
  renderCohortSidebarStudents();
  renderCohortes();
  showToast(`${student.nombre} asignado al grupo con éxito.`, 'success');
}

function unassignStudentFromCohort(studentId) {
  const student = alumnos.find(a => a.id === studentId);
  if (!student) return;

  student.academicGroup = '';
  saveState();
  renderCohortSidebarStudents();
  renderCohortes();
  showToast(`${student.nombre} removido del grupo.`, 'info');
}

function openCohortViewStudentsModal(cohortId) {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  ensureModalLoaded('cohort-view-students-modal');
  const modal = document.getElementById('cohort-view-students-modal');
  const title = document.getElementById('cohort-view-students-modal-title');
  const tbody = document.getElementById('cohort-view-students-tbody');
  const tableContainer = document.getElementById('cohort-view-students-table-container');
  const emptyState = document.getElementById('cohort-view-students-empty-state');

  if (!modal || !title || !tbody || !tableContainer || !emptyState) return;

  const coh = cohortes.find(c => c.id === cohortId);
  if (!coh) return;

  title.innerText = `Alumnos en: ${coh.nombre}`;

  // Filter students whose academicGroup matches this cohort's ID
  const groupStudents = alumnos.filter(a => a.academicGroup === cohortId);

  if (groupStudents.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    tbody.innerHTML = groupStudents.map(student => {
      // Payment status helper logic
      const price = student.academicPrice || 0;
      const paid = student.academicPaid || 0;
      let badgeHtml = '';
      if (paid >= price && price > 0) {
        badgeHtml = `<span class="badge" style="background: rgba(76, 175, 80, 0.15); color: var(--color-success); border: 1px solid rgba(76, 175, 80, 0.3);">Completado 🟢</span>`;
      } else if (paid > 0) {
        badgeHtml = `<span class="badge" style="background: rgba(253, 171, 67, 0.15); color: #fdab43; border: 1px solid rgba(253, 171, 67, 0.3);">Abono Parcial 🟡</span>`;
      } else {
        badgeHtml = `<span class="badge" style="background: rgba(244, 67, 54, 0.15); color: var(--color-error); border: 1px solid rgba(244, 67, 54, 0.3);">Pendiente 🔴</span>`;
      }

      const cleanTel = student.tel ? student.tel.replace(/\D/g, '') : '';
      const waLink = cleanTel ? `<a href="https://wa.me/${cleanTel}" target="_blank" style="color: var(--color-success); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="message-circle" style="width: 14px; height: 14px;"></i> ${escapeHTML(student.tel)}</a>` : '<span style="color: var(--color-text-muted); font-style: italic;">Sin teléfono</span>';

      const statusSelect = `
        <select onchange="updateStudentAcademicStatus('${student.id}', this.value)" style="padding: 4px 8px; font-size: 11px; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: var(--border-radius-sm); outline: none; cursor: pointer;">
          <option value="Cursando" ${student.academicStatus === 'Cursando' ? 'selected' : ''}>Cursando 📖</option>
          <option value="Graduado" ${student.academicStatus === 'Graduado' ? 'selected' : ''}>Graduado 🎓</option>
          <option value="Retirado" ${student.academicStatus === 'Retirado' ? 'selected' : ''}>Retirado ❌</option>
        </select>
      `;

      return `
        <tr>
          <td style="font-weight: 600; color: var(--color-text);">${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</td>
          <td>${escapeHTML(student.cedula || 'N/A')}</td>
          <td>${waLink}</td>
          <td style="text-align: center;">${badgeHtml}</td>
          <td>${statusSelect}</td>
          <td style="text-align: right;">
            <button class="btn btn-ghost btn-sm" onclick="closeCohortViewStudentsModal(); openDetailPanel('${student.id}');" title="Ver Detalles" style="padding: 4px 8px; font-size: 11px;">
              <i data-lucide="eye" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Ver Ficha
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  modal.classList.add('open');
  lucide.createIcons();
}

function updateStudentAcademicStatus(studentId, newStatus) {
  const student = alumnos.find(a => a.id === studentId);
  if (student) {
    const oldStatus = student.academicStatus || 'Cursando';
    student.academicStatus = newStatus;
    
    // Log activity
    logActivity('academico', `Se cambió el estado académico de ${student.nombre} ${student.apellido || ''} de "${oldStatus}" a "${newStatus}"`);
    
    // If they have the detail panel open and it matches this student, update it in UI too
    const detailStatusInput = document.getElementById('detail-academic-status');
    if (detailStatusInput && selectedStudent && selectedStudent.id === studentId) {
      detailStatusInput.value = newStatus;
      const printCertContainer = document.getElementById('print-certificate-container');
      if (printCertContainer) {
        printCertContainer.style.display = (newStatus === 'Graduado') ? 'block' : 'none';
      }
    }
    
    saveState();
    showToast(`Estado de ${student.nombre} cambiado a: ${newStatus}`, 'success');
  }
}

function closeCohortViewStudentsModal() {
  const modal = document.getElementById('cohort-view-students-modal');
  if (modal) modal.classList.remove('open');
}

function openCourseViewEnrolledModal(courseId) {
  ensureModalLoaded('course-view-enrolled-modal');
  const modal = document.getElementById('course-view-enrolled-modal');
  const title = document.getElementById('course-view-enrolled-modal-title');
  const filterSelect = document.getElementById('course-view-enrolled-filter');

  if (!modal || !title) return;

  modal.dataset.courseId = courseId;
  if (filterSelect) filterSelect.value = 'todos';

  const c = cursos.find(item => item.id === courseId);
  if (!c) return;

  title.innerText = `Alumnos del Curso: ${c.nombre}`;

  renderCourseEnrolledStudentsList(courseId, 'todos');
  modal.classList.add('open');
}

function closeCourseViewEnrolledModal() {
  const modal = document.getElementById('course-view-enrolled-modal');
  if (modal) modal.classList.remove('open');
}

function filterCourseViewEnrolledStudents() {
  const modal = document.getElementById('course-view-enrolled-modal');
  if (!modal) return;
  const courseId = modal.dataset.courseId;
  const filterSelect = document.getElementById('course-view-enrolled-filter');
  if (!courseId || !filterSelect) return;

  renderCourseEnrolledStudentsList(courseId, filterSelect.value);
}

function renderCourseEnrolledStudentsList(courseId, filterType) {
  const tbody = document.getElementById('course-view-enrolled-tbody');
  const tableContainer = document.getElementById('course-view-enrolled-table-container');
  const emptyState = document.getElementById('course-view-enrolled-empty-state');

  if (!tbody || !tableContainer || !emptyState) return;

  // Filter students: associated with this course in any stage
  let filtered = alumnos.filter(a => a.curso === courseId);

  if (filterType !== 'todos') {
    if (filterType === 'interesados') {
      filtered = filtered.filter(a => ['Nuevo', 'Contactado', 'Interesado', 'Negociando'].includes(a.etapa));
    } else if (filterType === 'Perdido') {
      filtered = filtered.filter(a => a.etapa === 'Perdido');
    } else {
      // Cursando, Graduado, Retirado (Must be stage Inscrito)
      filtered = filtered.filter(a => a.etapa === 'Inscrito' && (a.academicStatus || 'Cursando') === filterType);
    }
  }

  if (filtered.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(student => {
      // Payment status helper
      const price = student.academicPrice || 0;
      const paid = student.academicPaid || 0;
      let badgeHtml = '';
      
      // Payment badges only make sense if they are Inscribed (or sometimes Lost/Prospects if they paid something, but let's show status for everyone)
      if (paid >= price && price > 0) {
        badgeHtml = `<span class="badge" style="background: rgba(76, 175, 80, 0.15); color: var(--color-success); border: 1px solid rgba(76, 175, 80, 0.3);">Completado 🟢</span>`;
      } else if (paid > 0) {
        badgeHtml = `<span class="badge" style="background: rgba(253, 171, 67, 0.15); color: #fdab43; border: 1px solid rgba(253, 171, 67, 0.3);">Abono Parcial 🟡</span>`;
      } else {
        badgeHtml = `<span class="badge" style="background: rgba(244, 67, 54, 0.15); color: var(--color-error); border: 1px solid rgba(244, 67, 54, 0.3);">Pendiente 🔴</span>`;
      }

      // WhatsApp link
      const cleanTel = student.tel ? student.tel.replace(/\D/g, '') : '';
      const waLink = cleanTel ? `<a href="https://wa.me/${cleanTel}" target="_blank" style="color: var(--color-success); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="message-circle" style="width: 14px; height: 14px;"></i> ${escapeHTML(student.tel)}</a>` : '<span style="color: var(--color-text-muted); font-style: italic;">Sin teléfono</span>';

      // Cohorte / Group name
      const coh = cohortes.find(g => g.id === student.academicGroup);
      const cohortName = coh ? escapeHTML(coh.nombre) : '<span style="color: var(--color-text-muted); font-style: italic;">Sin Grupo</span>';

      // Academic Status Badge / Stage Badge
      let statusBadge = '';
      if (['Nuevo', 'Contactado', 'Interesado', 'Negociando'].includes(student.etapa)) {
        statusBadge = `<span class="badge" style="background: rgba(255, 193, 7, 0.15); color: #b78103; border: 1px solid rgba(255, 193, 7, 0.3); font-weight: 700;">Prospecto (${student.etapa}) 💡</span>`;
      } else if (student.etapa === 'Perdido') {
        statusBadge = `<span class="badge" style="background: rgba(244, 67, 54, 0.15); color: var(--color-error); border: 1px solid rgba(244, 67, 54, 0.3); font-weight: 700;">Perdido ❌</span>`;
      } else {
        const actStat = student.academicStatus || 'Cursando';
        if (actStat === 'Graduado') {
          statusBadge = `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 700;">Graduado 🎓</span>`;
        } else if (actStat === 'Retirado') {
          statusBadge = `<span class="badge" style="background: rgba(120, 144, 156, 0.15); color: #78909c; border: 1px solid rgba(120, 144, 156, 0.3); font-weight: 700;">Retirado 🛑</span>`;
        } else {
          statusBadge = `<span class="badge" style="background: rgba(33, 150, 243, 0.15); color: #2196f3; border: 1px solid rgba(33, 150, 243, 0.3); font-weight: 700;">Cursando 📖</span>`;
        }
      }

      return `
        <tr>
          <td style="font-weight: 600; color: var(--color-text);">${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</td>
          <td>${escapeHTML(student.cedula || 'N/A')}</td>
          <td>${waLink}</td>
          <td>${cohortName}</td>
          <td style="text-align: center;">${statusBadge}</td>
          <td style="text-align: center;">${badgeHtml}</td>
          <td style="text-align: right;">
            <button class="btn btn-ghost btn-sm" onclick="closeCourseViewEnrolledModal(); openDetailPanel('${student.id}');" title="Ver Detalles" style="padding: 4px 8px; font-size: 11px;">
              <i data-lucide="eye" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Ver Ficha
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
  lucide.createIcons();
}

// AUDIT TRAIL MODAL CONTROLLER
function openAuditModal() {
  ensureModalLoaded('audit-modal');
  const modal = document.getElementById('audit-modal');
  if (!modal) return;
  
  // Fill the user dropdown dynamically
  const userSelect = document.getElementById('audit-filter-user');
  if (userSelect) {
    const users = new Set();
    activities.forEach(act => {
      const userMatch = act.descripcion.match(/^\[(.*?)\]/);
      if (userMatch) {
        users.add(userMatch[1]);
      } else {
        users.add('Sistema');
      }
    });

    let options = '<option value="all">Todos</option>';
    Array.from(users).sort().forEach(user => {
      options += `<option value="${escapeHTML(user)}">${escapeHTML(user)}</option>`;
    });
    userSelect.innerHTML = options;
  }

  // Reset inputs
  const searchInput = document.getElementById('audit-search');
  if (searchInput) searchInput.value = '';
  const typeSelect = document.getElementById('audit-filter-type');
  if (typeSelect) typeSelect.value = 'all';

  renderAuditTable();
  modal.classList.add('open');
}

function closeAuditModal() {
  const modal = document.getElementById('audit-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function renderAuditTable() {
  const tableBody = document.getElementById('audit-table-body');
  const resultsCount = document.getElementById('audit-results-count');
  if (!tableBody) return;

  const searchQuery = (document.getElementById('audit-search')?.value || '').toLowerCase().trim();
  const filterType = document.getElementById('audit-filter-type')?.value || 'all';
  const filterUser = document.getElementById('audit-filter-user')?.value || 'all';

  const filtered = activities.filter(act => {
    // 1. Filter by category type
    if (filterType !== 'all' && act.tipo !== filterType) return false;

    // Parse user & clean description text
    let user = 'Sistema';
    let text = act.descripcion;
    const userMatch = act.descripcion.match(/^\[(.*?)\]\s*(.*)$/);
    if (userMatch) {
      user = userMatch[1];
      text = userMatch[2];
    }

    // 2. Filter by user
    if (filterUser !== 'all' && user !== filterUser) return false;

    // 3. Filter by search query
    if (searchQuery) {
      const matchesSearch = text.toLowerCase().includes(searchQuery) || 
                            user.toLowerCase().includes(searchQuery) ||
                            act.tipo.toLowerCase().includes(searchQuery);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Render rows
  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--color-text-muted); padding: 32px 0;">
          No se encontraron registros de auditoría que coincidan con los filtros.
        </td>
      </tr>
    `;
  } else {
    const activityColorClasses = {
      'nuevo': 'rgba(79, 152, 163, 0.15)',
      'edicion': 'rgba(253, 171, 67, 0.15)',
      'etapa': 'rgba(109, 170, 69, 0.15)',
      'nota': 'rgba(33, 150, 243, 0.15)',
      'eliminacion': 'rgba(244, 67, 54, 0.15)',
      'importacion': 'rgba(156, 39, 176, 0.15)',
      'configuracion': 'rgba(139, 92, 246, 0.15)'
    };
    
    const activityTextColors = {
      'nuevo': '#4f98a3',
      'edicion': '#fdab43',
      'etapa': '#6daa45',
      'nota': '#2196f3',
      'eliminacion': 'var(--color-error)',
      'importacion': '#9c27b0',
      'configuracion': '#8b5cf6'
    };

    tableBody.innerHTML = filtered.map(act => {
      let user = 'Sistema';
      let text = act.descripcion;
      const userMatch = act.descripcion.match(/^\[(.*?)\]\s*(.*)$/);
      if (userMatch) {
        user = userMatch[1];
        text = userMatch[2];
      }

      const categoryBg = activityColorClasses[act.tipo] || 'rgba(255,255,255,0.05)';
      const categoryColor = activityTextColors[act.tipo] || 'var(--color-text-muted)';
      const formattedDate = formatDateFull(act.fecha);

      let cleanDesc = escapeHTML(text);
      cleanDesc = cleanDesc.replace(/"(.*?)"/g, '<strong style="color: var(--color-text); font-weight: 600;">"$1"</strong>');

      return `
        <tr style="cursor: default;">
          <td style="padding: 10px; color: var(--color-text-muted); font-size: 12px; white-space: nowrap; border-bottom: 1px solid var(--color-border);">
            ${formattedDate}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid var(--color-border);">
            <span class="badge" style="background: ${categoryBg}; color: ${categoryColor}; border: 1px solid rgba(255,255,255,0.02); font-size: 11px; font-weight: 600; text-transform: capitalize; padding: 2px 6px; border-radius: var(--border-radius-sm);">
              ${act.tipo}
            </span>
          </td>
          <td style="padding: 10px; font-weight: 500; color: var(--color-text); border-bottom: 1px solid var(--color-border);">
            ${escapeHTML(user)}
          </td>
          <td style="padding: 10px; color: var(--color-text-muted); white-space: normal; line-height: 1.4; border-bottom: 1px solid var(--color-border);">
            ${cleanDesc}
          </td>
        </tr>
      `;
    }).join('');
  }

  if (resultsCount) {
    resultsCount.innerText = `Mostrando ${filtered.length} de ${activities.length} registros`;
  }
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

function clearAuditTrail() {
  if (confirm("⚠️ ¿Estás totalmente seguro de que deseas limpiar el historial de auditoría? Esta acción borrará permanentemente todos los logs y no podrá revertirse.")) {
    activities = [];
    saveState();
    showToast('Bitácora de auditoría vaciada.', 'info');
    
    // Refresh parent dashboard view feed
    if (activeView === 'dashboard') {
      renderDashboard();
    }
    
    // Refresh modal
    renderAuditTable();
  }
}

