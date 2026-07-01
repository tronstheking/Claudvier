// BUSINESS & PREDICTIVE ANALYTICS ENGINE

function getLeadScore(student) {
  if (student.etapa === 'Inscrito') return { score: 100, label: 'Inscrito', class: 'score-inscrito', icon: '🎓' };
  if (student.etapa === 'Perdido') return { score: 0, label: 'Perdido', class: 'score-perdido', icon: '❌' };

  let score = 0;
  
  if (student.tel && student.tel.trim().length > 5) score += 20;
  if (student.email && student.email.includes('@')) score += 15;
  if (student.instagram && student.instagram.trim().length > 1) score += 10;
  
  if (student.prioridad === 'Alta') score += 20;
  else if (student.prioridad === 'Media') score += 10;
  else if (student.prioridad === 'Baja') score += 5;
  
  const studentNotes = student.notas || student.notes || [];
  if (studentNotes.length >= 2) score += 20;
  else if (studentNotes.length === 1) score += 10;
  
  const studentTasks = tareas.filter(t => t.studentId === student.id);
  if (studentTasks.length > 0) score += 15;

  let label = 'Frío';
  let scoreClass = 'score-cold';
  let icon = '❄️';

  if (score >= 70) {
    label = 'Caliente';
    scoreClass = 'score-hot';
    icon = '🔥';
  } else if (score >= 40) {
    label = 'Tibio';
    scoreClass = 'score-warm';
    icon = '⚡';
  }

  return { score, label, class: scoreClass, icon };
}

function isLeadCold(al) {
  if (al.etapa === 'Inscrito' || al.etapa === 'Perdido') return false;
  
  let lastActivityTime = new Date(al.fecha).getTime();
  const notes = al.notas || al.notes || [];
  if (notes.length > 0) {
    notes.forEach(n => {
      const nt = new Date(n.date).getTime();
      if (nt > lastActivityTime) lastActivityTime = nt;
    });
  }
  
  const diffDays = (Date.now() - lastActivityTime) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}

function updateWhatIfSimulation() {
  const convInput = document.getElementById('whatif-conversion');
  const priceInput = document.getElementById('whatif-price-increase');
  const leadsInput = document.getElementById('whatif-new-leads');

  if (!convInput || !priceInput || !leadsInput) return;

  const convRate = parseFloat(convInput.value);
  const priceIncrease = parseFloat(priceInput.value);
  const newLeads = parseInt(leadsInput.value);

  // Update slider value labels
  document.getElementById('val-whatif-conversion').innerText = `${convRate}%`;
  document.getElementById('val-whatif-price-increase').innerText = priceIncrease >= 0 ? `+$${priceIncrease}` : `-$${Math.abs(priceIncrease)}`;
  document.getElementById('val-whatif-new-leads').innerText = newLeads;

  // Calculo de nuevos inscritos est.
  const projectedEnrolled = Math.round(newLeads * (convRate / 100));
  
  // Calculate average course price
  const avgCoursePrice = cursos.reduce((acc, c) => acc + (c.precio || 0), 0) / (cursos.length || 1);
  const newAvgPrice = Math.max(0, avgCoursePrice + priceIncrease);
  
  // Facturacion extra est.
  const extraRevenue = Math.round(projectedEnrolled * newAvgPrice);

  // Current projected revenue
  let currentProjectedRevenue = 0;
  alumnos.forEach(a => {
    if (a.etapa === 'Inscrito' && a.academicPrice) {
      currentProjectedRevenue += a.academicPrice;
    }
  });

  const totalProjected = currentProjectedRevenue + extraRevenue;
  const totalProjectedVES = totalProjected * tasaBCV;

  // Render to results
  document.getElementById('result-whatif-enrolled').innerText = projectedEnrolled;
  document.getElementById('result-whatif-revenue').innerText = `$${extraRevenue.toLocaleString()}`;
  document.getElementById('result-whatif-total').innerText = `$${totalProjected.toLocaleString()} USD`;
  document.getElementById('result-whatif-total-ves').innerText = `${totalProjectedVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
}

function saveMonthlyGoals() {
  const metaIInput = document.getElementById('input-meta-inscritos');
  const metaRInput = document.getElementById('input-meta-recaudacion');
  if (metaIInput && metaRInput) {
    const valI = parseInt(metaIInput.value);
    const valR = parseInt(metaRInput.value);
    
    if (isNaN(valI) || valI <= 0 || isNaN(valR) || valR <= 0) {
      showToast('Por favor introduce valores válidos mayores a cero.', 'error');
      return;
    }
    
    metaInscritos = valI;
    metaRecaudacion = valR;
    localStorage.setItem('ctd_meta_inscritos', metaInscritos);
    localStorage.setItem('ctd_meta_recaudacion', metaRecaudacion);
    
    showToast('Objetivos comerciales actualizados.', 'success');
    logActivity('edicion', `Se actualizaron las metas del mes: ${metaInscritos} inscritos y $${metaRecaudacion} USD de recaudación.`);
    renderReportes();
  }
}

function generateDebtTasks(event) {
  if (event) event.stopPropagation();

  const debtors = alumnos.filter(al => al.etapa === 'Inscrito' && al.academicPrice && ((al.academicPaid || 0) < al.academicPrice));
  if (debtors.length === 0) {
    showToast('No hay alumnos con saldo pendiente.', 'info');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let tasksCreated = 0;

  debtors.forEach(student => {
    const debt = student.academicPrice - (student.academicPaid || 0);
    const title = `🚨 Cobro Urgente: Recaudar saldo de $${debt} USD para ${student.nombre} ${student.apellido || ''}`;
    
    const alreadyHasTask = tareas.some(t => t.studentId === student.id && !t.completed && t.title.includes('Cobro Urgente'));
    if (!alreadyHasTask) {
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${tasksCreated}`,
        studentId: student.id,
        title: title,
        dueDate: todayStr,
        completed: false
      };
      tareas.push(newTask);
      tasksCreated++;
    }
  });

  if (tasksCreated > 0) {
    saveState();
    logActivity('edicion', `Se generaron automáticamente ${tasksCreated} tareas urgentes de cobranza.`);
    showToast(`Se crearon ${tasksCreated} tareas de cobranza urgentes.`, 'success');
    renderDashboard();
    if (activeView === 'tareas') {
      renderTareas();
    }
  } else {
    showToast('Las tareas de cobranza para estos alumnos ya están registradas.', 'info');
  }
}

function updateCommissionCalculator(totalRevenuePaidOverride = null) {
  let paidBase = totalRevenuePaidOverride;
  if (paidBase === null) {
    paidBase = 0;
    alumnos.filter(a => a.etapa === 'Inscrito').forEach(student => {
      paidBase += (student.academicPaid || 0);
    });
  }
  
  const rateSlider = document.getElementById('commission-rate');
  if (!rateSlider) return;
  
  const rate = parseInt(rateSlider.value);
  document.getElementById('commission-rate-val').innerText = `${rate}%`;
  
  const commission = paidBase * (rate / 100);
  const commissionVES = commission * tasaBCV;
  
  document.getElementById('comm-base-recaudado').innerText = `$${paidBase.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  document.getElementById('comm-total-value').innerText = `$${commission.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
  document.getElementById('comm-total-value-ves').innerText = `${commissionVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
}
