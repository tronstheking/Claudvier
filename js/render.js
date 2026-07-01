// MÓDULO: render.js

function renderDashboard() {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  // Calculadora de KPIs
  const total = alumnos.length;
  const inscritos = alumnos.filter(a => a.etapa === 'Inscrito').length;
  const conversion = total > 0 ? ((inscritos / total) * 100).toFixed(0) : 0;
  const alta = alumnos.filter(a => a.prioridad === 'Alta').length;
  const perdidos = alumnos.filter(a => a.etapa === 'Perdido').length;
  const activeCohortsCount = cohortes.filter(c => c.estatus === 'Activo').length;

  let totalOutstanding = 0;
  let studentsWithDebt = 0;
  let totalRevenuePaid = 0;
  let totalRevenueProjected = 0;

  alumnos.forEach(a => {
    if (a.etapa === 'Inscrito' && a.academicPrice) {
      totalRevenueProjected += a.academicPrice;
      const paid = a.academicPaid || 0;
      totalRevenuePaid += paid;
      const bal = a.academicPrice - paid;
      if (bal > 0) {
        totalOutstanding += bal;
        studentsWithDebt++;
      }
    }
  });

  let alumnosRiesgoCount = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  alumnos.forEach(a => {
    if (a.etapa === 'Inscrito') {
      const price = a.academicPrice || 0;
      const paid = a.academicPaid || 0;
      const bal = price - paid;
      const isOverdue = a.nextContactDate && a.nextContactDate < todayStr;
      if (bal > 0 && isOverdue) {
        alumnosRiesgoCount++;
      }
    }
  });

  const collectionEfficiency = totalRevenueProjected > 0 ? ((totalRevenuePaid / totalRevenueProjected) * 100).toFixed(0) : 100;

  document.getElementById('kpi-total-prospectos').innerText = total;
  document.getElementById('kpi-inscritos').innerText = `${inscritos}`;
  document.getElementById('kpi-conversion').innerText = `${conversion}% de conversión`;
  document.getElementById('kpi-alta-prioridad').innerText = alta;
  document.getElementById('kpi-perdidos').innerText = perdidos;
  document.getElementById('kpi-cursos-activos').innerText = cursos.length;
  document.getElementById('kpi-grupos-activos').innerText = activeCohortsCount;
  document.getElementById('kpi-saldo-pendiente').innerText = `$${totalOutstanding} USD`;

  const recEl = document.getElementById('kpi-ingresos-recaudados');
  if (recEl) recEl.innerText = `$${totalRevenuePaid} USD`;
  const projEl = document.getElementById('kpi-ingresos-proyectados');
  if (projEl) projEl.innerText = `$${totalRevenueProjected} USD`;
  const riskEl = document.getElementById('kpi-alumnos-riesgo');
  if (riskEl) riskEl.innerText = alumnosRiesgoCount;
  
  const saldoSub = document.getElementById('kpi-saldo-pendiente-sub');
  if (saldoSub) {
    saldoSub.innerText = `Cobrado: $${totalRevenuePaid} / Proyectado: $${totalRevenueProjected} (${collectionEfficiency}% efec.)`;
  }

  // Monthly goals calculation and display
  const goalRevenueStatus = document.getElementById('goal-revenue-status');
  const goalRevenueBar = document.getElementById('goal-revenue-bar');
  const goalEnrollmentStatus = document.getElementById('goal-enrollment-status');
  const goalEnrollmentBar = document.getElementById('goal-enrollment-bar');
  const goalsTimeRemaining = document.getElementById('goals-time-remaining');

  if (goalRevenueStatus && goalRevenueBar && goalEnrollmentStatus && goalEnrollmentBar) {
    const revGoal = metaRecaudacion;
    const enrollGoal = metaInscritos;
    
    const revPct = Math.min((totalRevenuePaid / revGoal) * 100, 100);
    const enrollPct = Math.min((inscritos / enrollGoal) * 100, 100);
    
    goalRevenueStatus.innerText = `$${totalRevenuePaid} / $${revGoal} USD (${revPct.toFixed(0)}%)`;
    goalRevenueBar.style.width = `${revPct}%`;
    
    goalEnrollmentStatus.innerText = `${inscritos} / ${enrollGoal} Alumnos (${enrollPct.toFixed(0)}%)`;
    goalEnrollmentBar.style.width = `${enrollPct}%`;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month
    const diffTime = endOfMonth - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (goalsTimeRemaining) {
      if (diffDays > 0) {
        goalsTimeRemaining.innerText = `⏳ Quedan ${diffDays} días para finalizar el mes`;
      } else {
        goalsTimeRemaining.innerText = `🏁 Mes finalizado`;
      }
    }
  }

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

  // HORIZONTAL BAR CHART - MOTIVOS DE PÉRDIDA
  const lostReasonsContainer = document.getElementById('lost-reasons-bar-chart');
  if (lostReasonsContainer) {
    const lostStudents = alumnos.filter(a => a.etapa === 'Perdido');
    const reasonCounts = {};
    lostStudents.forEach(a => {
      const r = a.lostReason || 'No especificado';
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });

    const reasonsList = Object.keys(reasonCounts);
    if (reasonsList.length === 0) {
      lostReasonsContainer.innerHTML = '<p style="padding:16px 0; font-size:13px; color:var(--color-text-muted); text-align:center;">No hay registros de alumnos perdidos.</p>';
    } else {
      reasonsList.sort((a, b) => reasonCounts[b] - reasonCounts[a]);
      const maxReasonCount = Math.max(...Object.values(reasonCounts), 1);

      lostReasonsContainer.innerHTML = reasonsList.map((reason, idx) => {
        const count = reasonCounts[reason];
        return `
          <div class="bar-item">
            <div class="bar-label-row">
              <span>${escapeHTML(reason)}</span>
              <span style="font-weight:600; color: var(--color-error)">${count}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" id="lost-bar-${idx}" style="background-color: var(--color-error); width: 0%"></div>
            </div>
          </div>
        `;
      }).join('');

      setTimeout(() => {
        reasonsList.forEach((_, idx) => {
          const fillEl = document.getElementById(`lost-bar-${idx}`);
          if (fillEl) {
            const count = reasonCounts[reasonsList[idx]];
            const pct = (count / maxReasonCount) * 100;
            fillEl.style.width = `${pct}%`;
          }
        });
      }, 50);
    }
  }

  // HORIZONTAL BAR CHART - RENDIMIENTO POR CANAL
  const channelContainer = document.getElementById('channel-performance-chart');
  if (channelContainer) {
    const channels = ['Instagram', 'WhatsApp', 'TikTok', 'Web', 'Referido'];
    const channelStats = channels.map(ch => {
      const chStudents = alumnos.filter(a => (a.origen || 'Web') === ch);
      const totalCount = chStudents.length;
      const convertedCount = chStudents.filter(a => a.etapa === 'Inscrito').length;
      const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;
      return { channel: ch, total: totalCount, converted: convertedCount, rate: conversionRate };
    });

    channelStats.sort((a, b) => b.rate - a.rate);

    channelContainer.innerHTML = channelStats.map((stat, idx) => {
      const color = stat.rate >= 50 ? 'var(--color-success)' : (stat.rate >= 20 ? 'var(--color-primary)' : 'var(--color-text-muted)');
      return `
        <div class="bar-item">
          <div class="bar-label-row">
            <span>${stat.channel} <span style="font-size: 11px; color: var(--color-text-muted);">(${stat.converted}/${stat.total} leads)</span></span>
            <span style="font-weight:600; color: ${color}">${stat.rate}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" id="channel-bar-${idx}" style="background-color: ${color}; width: 0%"></div>
          </div>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      channelStats.forEach((stat, idx) => {
        const fillEl = document.getElementById(`channel-bar-${idx}`);
        if (fillEl) {
          fillEl.style.width = `${stat.rate}%`;
        }
      });
    }, 50);
  }

  // OPTION A: SEMÁFORO DE INERCIA COMERCIAL
  const stagnationContainer = document.getElementById('stagnation-heatmap-container');
  if (stagnationContainer) {
    const activeLeads = alumnos.filter(a => a.etapa !== 'Inscrito' && a.etapa !== 'Perdido');
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;
    const criticalLeads = [];

    activeLeads.forEach(al => {
      const dates = [new Date(al.fecha)];
      const notes = al.notes || al.notas || [];
      notes.forEach(n => dates.push(new Date(n.date)));
      
      const maxDate = new Date(Math.max(...dates));
      const diffDays = Math.floor((new Date() - maxDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        greenCount++;
      } else if (diffDays <= 3) {
        yellowCount++;
      } else {
        redCount++;
        criticalLeads.push({ id: al.id, nombre: `${al.nombre} ${al.apellido || ''}`, days: diffDays, etapa: al.etapa });
      }
    });

    criticalLeads.sort((a, b) => b.days - a.days);

    const totalLeads = activeLeads.length || 1;
    const greenPct = (greenCount / totalLeads) * 100;
    const yellowPct = (yellowCount / totalLeads) * 100;
    const redPct = (redCount / totalLeads) * 100;

    let html = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--color-text-muted);">
          <span>Estado de Atención del Pipeline</span>
          <span>${activeLeads.length} leads activos</span>
        </div>
        <div style="height: 10px; border-radius: 5px; overflow: hidden; display: flex; background: var(--color-border);">
          <div style="width: ${greenPct}%; background-color: var(--color-success);" title="Bajo Control (< 24h): ${greenCount}"></div>
          <div style="width: ${yellowPct}%; background-color: var(--color-warning);" title="Alerta (1-3 días): ${yellowCount}"></div>
          <div style="width: ${redPct}%; background-color: var(--color-error);" title="Congelados (>3 días): ${redCount}"></div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 11px; text-align: center;">
        <div style="background: rgba(109, 170, 69, 0.1); border: 1px solid rgba(109, 170, 69, 0.2); padding: 6px; border-radius: 4px; color: var(--color-success);">
          <div style="font-weight: 700; font-size: 14px;">${greenCount}</div>
          <span>Bajo Control</span>
        </div>
        <div style="background: rgba(253, 171, 67, 0.1); border: 1px solid rgba(253, 171, 67, 0.2); padding: 6px; border-radius: 4px; color: var(--color-warning);">
          <div style="font-weight: 700; font-size: 14px;">${yellowCount}</div>
          <span>Alerta (1-3d)</span>
        </div>
        <div style="background: rgba(209, 99, 167, 0.1); border: 1px solid rgba(209, 99, 167, 0.2); padding: 6px; border-radius: 4px; color: var(--color-error);">
          <div style="font-weight: 700; font-size: 14px;">${redCount}</div>
          <span>Congelados</span>
        </div>
      </div>
    `;

    if (criticalLeads.length > 0) {
      html += `
        <div style="margin-top: 8px; border-top: 1px solid var(--color-border); padding-top: 10px;">
          <h4 style="font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 8px; font-weight: 700;">⚠️ Leads más Estancados</h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${criticalLeads.slice(0, 3).map(cl => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--color-border);">
                <div>
                  <span style="font-weight: 600; cursor: pointer; color: var(--color-primary); text-decoration: underline;" onclick="openDetailPanel('${cl.id}')">${escapeHTML(cl.nombre)}</span>
                  <span style="font-size: 10px; color: var(--color-text-muted); display: block;">Etapa: ${cl.etapa}</span>
                </div>
                <span class="badge badge-danger" style="background: rgba(244, 67, 54, 0.1); color: var(--color-error); border: 1px solid rgba(244, 67, 54, 0.2); font-weight: 700; padding: 2px 6px; border-radius: 4px;">Hace ${cl.days}d</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      html += `
        <p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0; margin-top:8px;">✅ ¡Excelente! No tienes leads congelados hoy.</p>
      `;
    }

    stagnationContainer.innerHTML = html;
  }

  // OPTION B: MONITOR DE OCUPACIÓN DE COHORTES
  const cohortFillContainer = document.getElementById('cohort-fill-rate-container');
  if (cohortFillContainer) {
    const activeCohorts = cohortes.filter(c => c.estatus === 'Activo');
    
    if (activeCohorts.length === 0) {
      cohortFillContainer.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">No hay cohortes activas registradas.</p>';
    } else {
      cohortFillContainer.innerHTML = activeCohorts.map(coh => {
        const enrolled = alumnos.filter(a => a.etapa === 'Inscrito' && a.academicGroup === coh.id).length;
        const capacity = coh.capacidad || 15;
        const pct = Math.min((enrolled / capacity) * 100, 100);
        
        let color = 'var(--color-primary)';
        if (pct >= 80) color = 'var(--color-success)';
        else if (pct < 30) color = '#ff9800';

        return `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: 600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 200px;" title="${escapeHTML(coh.nombre)}">${escapeHTML(coh.nombre)}</span>
              <span style="font-weight: 700; color: ${color};">${enrolled} / ${capacity} alumnos (${pct.toFixed(0)}%)</span>
            </div>
            <div class="bar-track" style="height: 8px; border-radius: 4px; background: var(--color-border); overflow: hidden;">
              <div class="bar-fill" style="background-color: ${color}; width: ${pct}%; height: 100%; border-radius: 4px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // OPTION C: PANEL DE CONTINUIDAD Y RE-INSCRIPCIONES (Retención)
  const continuityContainer = document.getElementById('continuity-funnel-container');
  if (continuityContainer) {
    const cursandoStudents = alumnos.filter(a => a.etapa === 'Inscrito' && a.academicStatus === 'Cursando');
    
    if (cursandoStudents.length === 0) {
      continuityContainer.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">No hay alumnos cursando activos actualmente.</p>';
    } else {
      continuityContainer.innerHTML = cursandoStudents.slice(0, 3).map(student => {
        const courseObj = cursos.find(c => c.id === student.curso);
        const courseName = courseObj ? courseObj.nombre : 'Curso';
        
        let cohortName = 'Sin grupo';
        let endDateStr = 'N/A';
        if (student.academicGroup) {
          const coh = cohortes.find(c => c.id === student.academicGroup);
          if (coh) {
            cohortName = coh.nombre;
            endDateStr = formatDateShort(coh.fechaFin);
          }
        }

        return `
          <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 4px; border: 1px solid var(--color-border); margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span style="font-weight: 600; cursor: pointer; color: var(--color-primary); text-decoration: underline;" onclick="openDetailPanel('${student.id}')">${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</span>
                <span style="font-size: 10px; color: var(--color-text-muted); display: block;">Cursando: ${escapeHTML(courseName)} (${escapeHTML(cohortName)})</span>
              </div>
              <span style="font-size: 10.5px; color: var(--color-text-muted); font-weight: 500;">Fin: ${endDateStr}</span>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px; justify-content: flex-end;">
              <button class="btn btn-ghost btn-sm" onclick="sendContinuityWhatsApp('${student.id}')" style="font-size: 11px; padding: 4px 8px; color: var(--color-success); border-color: rgba(109, 170, 69, 0.2); background: rgba(109, 170, 69, 0.05); display: inline-flex; align-items: center; gap: 4px; height: 26px;">
                <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i> WhatsApp
              </button>
              <button class="btn btn-primary btn-sm" onclick="triggerContinuityClone('${student.id}')" style="font-size: 11px; padding: 4px 8px; font-weight: 500; height: 26px; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="copy" style="width: 12px; height: 12px;"></i> Re-Inscribir
              </button>
            </div>
          </div>
        `;
      }).join('');
      lucide.createIcons();
    }
  }

  // GAMIFICATION SYSTEM
  const badgesGrid = document.getElementById('gamification-badges-grid');
  if (badgesGrid) {
    const badges = [
      {
        id: 'star-closer',
        title: 'Cerrador Estrella',
        desc: 'Inscribir a 5 o más alumnos en total.',
        target: 5,
        current: inscritos,
        icon: 'trophy',
        color: '#fdab43',
        check: inscritos >= 5
      },
      {
        id: 'gold-hunter',
        title: 'Cazador de Leads',
        desc: 'Registrar 30 o más prospectos en la base de datos.',
        target: 30,
        current: total,
        icon: 'zap',
        color: '#4f98a3',
        check: total >= 30
      },
      {
        id: 'efficiency-pro',
        title: 'Maestro de la Recaudación',
        desc: 'Lograr una eficiencia de cobro de 85% o más (mín. $500 proyectados).',
        target: 85,
        current: totalRevenueProjected >= 500 ? parseFloat(collectionEfficiency) : 0,
        unit: '%',
        icon: 'award',
        color: '#6daa45',
        check: totalRevenueProjected >= 500 && parseFloat(collectionEfficiency) >= 85
      },
      {
        id: 'cohort-builder',
        title: 'Constructor de Cohortes',
        desc: 'Tener al menos 2 cohortes activas simultáneamente.',
        target: 2,
        current: activeCohortsCount,
        icon: 'layers',
        color: '#8b5cf6',
        check: activeCohortsCount >= 2
      }
    ];

    badgesGrid.innerHTML = badges.map(b => {
      const pct = Math.min((b.current / b.target) * 100, 100);
      const isUnlocked = b.check;
      const opacity = isUnlocked ? '1' : '0.6';
      const badgeStyle = isUnlocked 
        ? `border: 2px solid ${b.color}; background: rgba(${isUnlocked ? '109, 170, 69' : '255, 255, 255'}, 0.03);`
        : `border: 1px solid var(--color-border); background: var(--color-surface);`;

      return `
        <div class="kpi-card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px; transition: all var(--transition-smooth); ${badgeStyle} opacity: ${opacity}; text-align: left; width: 100%;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="kpi-icon-wrapper" style="background: ${isUnlocked ? b.color + '20' : 'rgba(255,255,255,0.05)'}; color: ${isUnlocked ? b.color : 'var(--color-text-muted)'}; margin: 0; width: 36px; height: 36px; min-width: 36px;">
                <i data-lucide="${b.icon}" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <span style="font-weight: 700; font-size: 13.5px; color: var(--color-text); display: block;">${b.title}</span>
                <span style="font-size: 11px; color: var(--color-text-muted); display: block; line-height: 1.2; margin-top: 2px;">${b.desc}</span>
              </div>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: ${isUnlocked ? 'var(--color-success)' : 'var(--color-text-muted)'}; background: ${isUnlocked ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.05)'}; padding: 2px 6px; border-radius: var(--border-radius-sm);">
              ${isUnlocked ? 'Logrado' : 'En Progreso'}
            </span>
          </div>
          <div style="margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: var(--color-text-muted);">
              <span>Progreso: ${Math.round(b.current)}${b.unit || ''} / ${b.target}${b.unit || ''}</span>
              <span>${pct.toFixed(0)}%</span>
            </div>
            <div class="bar-track" style="height: 6px; border-radius: 3px; background: var(--color-border); overflow: hidden;">
              <div style="background-color: ${isUnlocked ? 'var(--color-success)' : b.color}; width: ${pct}%; height: 100%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
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
      const iconBg = colorClass === 'primary' ? 'rgba(79, 152, 163, 0.12)' : 
                     colorClass === 'warning' ? 'rgba(253, 171, 67, 0.12)' :
                     colorClass === 'success' ? 'rgba(109, 170, 69, 0.12)' : 'rgba(209, 99, 167, 0.12)';

      // Parse metadata from description
      let user = 'Sistema';
      let text = act.descripcion;
      let isAutomation = false;

      const userMatch = act.descripcion.match(/^\[(.*?)\]\s*(.*)$/);
      if (userMatch) {
        user = userMatch[1];
        text = userMatch[2];
      }

      const autoMatch = text.match(/^\[Automatización\]\s*(.*)$/);
      if (autoMatch) {
        isAutomation = true;
        text = autoMatch[1];
      }

      // Safe HTML escaping
      let escapedText = escapeHTML(text);

      // Highlight key terms like quotes, stage names, actions
      escapedText = escapedText.replace(/"(.*?)"/g, '<strong style="color: var(--color-text); font-weight: 600;">"$1"</strong>');
      escapedText = escapedText.replace(/(inició sesión|cerró sesión|se cambió la etapa|se actualizó|se marcó como completada)/gi, '<span style="color: var(--color-text); font-weight: 500;">$1</span>');

      return `
        <div class="activity-item">
          <div class="activity-item-icon" style="background: ${iconBg}; color: ${iconColor};">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="activity-item-content">
            <div class="activity-item-header">
              <span class="activity-item-desc">${escapedText}</span>
              <span class="activity-item-time">${timeAgo(act.fecha)}</span>
            </div>
            <div class="activity-item-meta">
              <span class="activity-item-user">
                <i data-lucide="user" style="width: 10px; height: 10px; display: inline-block; margin-right: 3px; vertical-align: middle;"></i>
                ${escapeHTML(user)}
              </span>
              ${isAutomation ? `
                <span class="activity-item-tag automation-tag">
                  <i data-lucide="cpu" style="width: 10px; height: 10px; display: inline-block; margin-right: 3px; vertical-align: middle;"></i>
                  Auto
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // SMART ASSISTANT INSIGHTS
  const insightsList = [];

  // 1. Overdue tasks
  const overdueTasksCount = tareas.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date().setHours(0,0,0,0)).length;
  if (overdueTasksCount > 0) {
    insightsList.push({
      text: `Tienes <b>${overdueTasksCount} tareas pendientes atrasadas</b> de realizar.`,
      icon: '⏰',
      color: '#f44336',
      bg: 'rgba(244, 67, 54, 0.1)',
      action: "setView('tareas')"
    });
  }

  // 1.2. Outstanding Balance Alert
  if (studentsWithDebt > 0) {
    insightsList.push({
      text: `💸 Cobranza: Hay <b>${studentsWithDebt} alumnos con saldo pendiente</b> (Total: <b>$${totalOutstanding} USD</b>). <button class="btn" onclick="event.stopPropagation(); generateDebtTasks();" style="padding: 2px 8px; margin-left: 8px; font-size: 11px; cursor: pointer; border: 1px solid var(--color-primary); background: transparent; color: var(--color-primary); border-radius: var(--border-radius-sm); font-weight: 600; display: inline-block;">⚡ Crear Tareas</button>`,
      icon: '💵',
      color: '#2196f3',
      bg: 'rgba(33, 150, 243, 0.1)',
      action: "setSmartSegment('deuda'); setView('alumnos');"
    });
  }

  // 1.3. Upcoming Cohort Graduations (within next 30 days)
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const upcomingGraduations = cohortes.filter(c => {
    if (c.estatus !== 'Activo') return false;
    const endDate = new Date(c.fechaFin);
    return endDate >= today && endDate <= thirtyDaysLater;
  });
  upcomingGraduations.forEach(coh => {
    insightsList.push({
      text: `🎓 El grupo <b>${escapeHTML(coh.nombre)}</b> finaliza clases el <b>${escapeHTML(coh.fechaFin)}</b>. ¡Prepara su graduación y re-inscripción!`,
      icon: '🎓',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      action: "setView('cohortes')"
    });
  });

  // 1.4. Active Cohorts with 0 Students
  const emptyCohorts = cohortes.filter(c => {
    if (c.estatus !== 'Activo') return false;
    const count = alumnos.filter(a => a.academicGroup === c.id && a.etapa === 'Inscrito').length;
    return count === 0;
  });
  emptyCohorts.forEach(coh => {
    insightsList.push({
      text: `👥 Alerta de Grupo: El grupo activo <b>${escapeHTML(coh.nombre)}</b> no tiene alumnos asignados actualmente.`,
      icon: '⚠️',
      color: '#f44336',
      bg: 'rgba(244, 67, 54, 0.1)',
      action: `selectedCohortId='${coh.id}'; renderCohortSidebarStudents(); document.getElementById('cohort-students-sidebar').style.display='block'; setView('cohortes');`
    });
  });

  // 1.5. Scheduled follow-ups (Agenda)
  const pendingFollowups = alumnos.filter(al => {
    if (al.etapa === 'Inscrito' || al.etapa === 'Perdido') return false;
    return al.nextContactDate && al.nextContactDate <= todayStr;
  });
  if (pendingFollowups.length > 0) {
    insightsList.push({
      text: `Tienes <b>${pendingFollowups.length} prospectos</b> con seguimiento agendado para hoy o días anteriores.`,
      icon: '📅',
      color: '#f7ac05',
      bg: 'rgba(247, 172, 5, 0.1)',
      action: "setSmartSegment('agenda'); setView('alumnos');"
    });
  }

  // 2. Hot leads turning cold
  const hotAndCold = alumnos.filter(al => {
    if (al.etapa === 'Inscrito' || al.etapa === 'Perdido') return false;
    const scoring = getLeadScore(al);
    return scoring.score >= 70 && isLeadCold(al);
  });
  if (hotAndCold.length > 0) {
    insightsList.push({
      text: `Hay <b>${hotAndCold.length} prospectos Calientes</b> (Score ≥ 70%) que se están enfriando por falta de actividad reciente.`,
      icon: '❄️',
      color: '#2196f3',
      bg: 'rgba(33, 150, 243, 0.1)',
      action: "setSmartSegment('abandonados'); setView('alumnos');"
    });
  }

  // Churn Prevention Warning (Retention Alert)
  const churnRiskStudents = alumnos.filter(al => {
    if (al.etapa !== 'Inscrito') return false;
    if (al.academicStatus === 'Graduado' || al.academicStatus === 'Retirado') return false;
    
    const notes = al.notes || al.notas || [];
    const dates = [new Date(al.fecha)];
    notes.forEach(n => dates.push(new Date(n.date)));
    if (al.payments) {
      al.payments.forEach(p => dates.push(new Date(p.date + 'T12:00:00')));
    }
    
    const maxDate = new Date(Math.max(...dates));
    const diffTime = Math.abs(new Date() - maxDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      al.daysInactive = diffDays;
      return true;
    }
    return false;
  });

  if (churnRiskStudents.length > 0) {
    if (churnRiskStudents.length <= 2) {
      churnRiskStudents.forEach(al => {
        insightsList.push({
          text: `⚠️ <b>Riesgo de Deserción:</b> El alumno inscrito <b>${al.nombre} ${al.apellido || ''}</b> lleva <b>${al.daysInactive} días sin actividad</b>.`,
          icon: '🛑',
          color: '#e91e63',
          bg: 'rgba(233, 30, 99, 0.1)',
          action: `openDetailPanel('${al.id}')`
        });
      });
    } else {
      insightsList.push({
        text: `⚠️ <b>Riesgo de Deserción:</b> Hay <b>${churnRiskStudents.length} alumnos inscritos sin actividad</b> en los últimos 7 días.`,
        icon: '🛑',
        color: '#e91e63',
        bg: 'rgba(233, 30, 99, 0.1)',
        action: `setView('alumnos')`
      });
    }
  }

  // Alertas de Próximo Pago de Nivel (Especializaciones - Ciclos de 6 semanas)
  alumnos.forEach(al => {
    if (al.etapa === 'Inscrito') {
      const courseObj = cursos.find(c => c.id === al.curso);
      const isSpecialization = courseObj && (
        courseObj.nombre.toLowerCase().includes('especialidad') || 
        courseObj.nombre.toLowerCase().includes('nivel')
      );
      
      if (isSpecialization) {
        const enrolDate = new Date(al.fecha);
        const diffTime = Math.abs(new Date() - enrolDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Cada nivel dura 6 semanas = 42 días
        const levelNumber = Math.floor(diffDays / 42) + 1;
        const daysIntoCurrentLevel = diffDays % 42;
        
        // Alerta entre los días 30 y 42 de cada nivel (semanas 5 y 6)
        if (daysIntoCurrentLevel >= 30 && daysIntoCurrentLevel <= 42) {
          const nextLevel = levelNumber + 1;
          const daysRemaining = 42 - daysIntoCurrentLevel;
          insightsList.push({
            text: `🎓 <b>Cobro Especialidad:</b> El alumno <b>${al.nombre} ${al.apellido || ''}</b> está cursando el <b>Nivel ${levelNumber}</b> y está a <b>${daysRemaining} días</b> de culminarlo. Debes gestionar el pago del <b>Nivel ${nextLevel}</b>.`,
            icon: '💳',
            color: '#f7ac05',
            bg: 'rgba(247, 172, 5, 0.1)',
            action: `openDetailPanel('${al.id}')`
          });
        }
      }
    }
  });


  const missingPhoneLeads = alumnos.filter(al => {
    if (al.etapa === 'Inscrito' || al.etapa === 'Perdido') return false;
    return al.prioridad === 'Alta' && (!al.tel || al.tel.trim().length < 5);
  });
  if (missingPhoneLeads.length > 0) {
    insightsList.push({
      text: `Existen <b>${missingPhoneLeads.length} leads de prioridad Alta sin teléfono</b> registrado para contacto rápido.`,
      icon: '📱',
      color: '#ff9800',
      bg: 'rgba(255, 152, 0, 0.1)',
      action: "setView('alumnos')"
    });
  }

  // 4. Conversion rate feedback
  if (conversion >= 20) {
    insightsList.push({
      text: `🎉 ¡Buen trabajo! Tu tasa de conversión está en <b>${conversion}%</b> (óptimo desempeño de ventas).`,
      icon: '📈',
      color: '#4caf50',
      bg: 'rgba(76, 175, 80, 0.1)',
      action: null
    });
  } else if (conversion > 0 && conversion < 10) {
    insightsList.push({
      text: `⚠️ La tasa de conversión está baja (<b>${conversion}%</b>). Intenta reactivar prospectos en el canal de ventas.`,
      icon: '⚠️',
      color: '#f44336',
      bg: 'rgba(244, 67, 54, 0.1)',
      action: null
    });
  }

  // Fallback if no notifications
  if (insightsList.length === 0) {
    insightsList.push({
      text: `¡Felicidades! Todo está al día en la Academia. No se detectan anomalías de ventas hoy.`,
      icon: '✅',
      color: '#4caf50',
      bg: 'rgba(76, 175, 80, 0.1)',
      action: null
    });
  }

  // Render to DOM
  const listEl = document.getElementById('assistant-insights-list');
  const countEl = document.getElementById('assistant-insight-count');
  if (listEl && countEl) {
    countEl.innerText = `${insightsList.length} Alertas`;
    listEl.innerHTML = insightsList.map(ins => {
      const cursorStyle = ins.action ? 'cursor: pointer;' : 'cursor: default;';
      const onClickAttr = ins.action ? `onclick="${ins.action}"` : '';
      return `
        <div class="insight-alert-item" style="background: ${ins.bg}; color: var(--color-text); padding: 12px 16px; border-radius: var(--border-radius-sm); border: 1px solid ${ins.color}20; display: flex; align-items: center; gap: 10px; font-size: 13px; line-height: 1.4; ${cursorStyle}" ${onClickAttr}>
          <span style="font-size: 18px;">${ins.icon}</span>
          <div style="flex-grow: 1;">${ins.text}</div>
          ${ins.action ? `<span style="font-size: 11px; font-weight: 700; color: ${ins.color}; text-decoration: underline;">Atender ➔</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // Populate Overdue Tasks (Opción A)
  const overdueTasksList = document.getElementById('overdue-tasks-list');
  const overdueTasksCountEl = document.getElementById('overdue-tasks-count');
  if (overdueTasksList && overdueTasksCountEl) {
    const overdueTasks = tareas.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
    overdueTasksCountEl.innerText = `${overdueTasks.length} Pendientes`;
    
    if (overdueTasks.length === 0) {
      overdueTasksList.innerHTML = `<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">✅ ¡Excelente! No tienes seguimientos vencidos hoy.</p>`;
    } else {
      overdueTasksList.innerHTML = overdueTasks.map(task => {
        const student = task.studentId ? alumnos.find(a => a.id === task.studentId) : null;
        const name = student ? `${student.nombre} ${student.apellido || ''}` : 'General';
        const assignedHTML = student 
          ? `Asignado a: <strong style="cursor: pointer; color: var(--color-primary); text-decoration: underline;" onclick="openDetailPanel('${task.studentId}')">${escapeHTML(name)}</strong>`
          : `<span style="font-style: italic;">Tarea General</span>`;
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; background: rgba(244, 67, 54, 0.03); padding: 8px 12px; border-radius: var(--border-radius-sm); border: 1px solid rgba(244, 67, 54, 0.15); gap: 8px;">
            <div style="flex-grow: 1; min-width: 0; text-align: left;">
              <span style="font-weight: 700; color: var(--color-text); text-overflow: ellipsis; overflow: hidden; display: block;" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</span>
              <span style="font-size: 11px; color: var(--color-text-muted); display: block;">${assignedHTML}</span>
              <span style="font-size: 10px; color: var(--color-error); font-weight: 700; display: block; margin-top: 2px;">Venció el: ${escapeHTML(task.dueDate)}</span>
            </div>
            <button class="btn btn-secondary btn-icon-sm" onclick="completeOverdueTask('${task.id}')" style="background: rgba(76, 175, 80, 0.15); border: 1px solid rgba(76, 175, 80, 0.25); color: #4caf50; height: 28px; width: 28px; padding: 0; min-width: auto; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer;" title="Marcar como Completada">
              <i data-lucide="check" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        `;
      }).join('');
      
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }
}

function renderAlumnos() {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  const query = document.getElementById('alumno-search').value.toLowerCase();
  const stageFilter = document.getElementById('filter-etapa').value;
  const courseFilter = document.getElementById('filter-curso').value;
  const cohortFilterEl = document.getElementById('filter-cohort');
  const cohortFilter = cohortFilterEl ? cohortFilterEl.value : '';
  const priorityFilter = document.getElementById('filter-prioridad').value;
  const academicStatusSelect = document.getElementById('filter-academic-status');
  const academicStatusFilter = academicStatusSelect ? academicStatusSelect.value : '';

  const originFilterEl = document.getElementById('filter-origen');
  const originFilter = originFilterEl ? originFilterEl.value : '';
  const paymentFilterEl = document.getElementById('filter-pago');
  const paymentFilter = paymentFilterEl ? paymentFilterEl.value : '';

  let filtered = alumnos.filter(al => {
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
    const matchCohort = !cohortFilter || al.academicGroup === cohortFilter;
    const matchPriority = !priorityFilter || al.prioridad === priorityFilter;
    const matchOrigin = !originFilter || al.origen === originFilter;

    let matchPayment = true;
    if (paymentFilter) {
      const price = al.academicPrice || 0;
      const paid = al.academicPaid || 0;
      if (paymentFilter === 'completado') {
        matchPayment = al.etapa === 'Inscrito' && paid >= price && price > 0;
      } else if (paymentFilter === 'parcial') {
        matchPayment = al.etapa === 'Inscrito' && paid > 0 && paid < price;
      } else if (paymentFilter === 'pendiente') {
        matchPayment = al.etapa === 'Inscrito' && paid === 0;
      }
    }

    let matchAcademicStatus = true;
    if (academicStatusFilter) {
      if (academicStatusFilter === 'Prospecto') {
        matchAcademicStatus = al.etapa !== 'Inscrito';
      } else {
        matchAcademicStatus = al.etapa === 'Inscrito' && al.academicStatus === academicStatusFilter;
      }
    }

    // Smart segment filtering
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
    } else if (activeSmartSegment === 'deuda') {
      matchSegment = al.etapa === 'Inscrito' && al.academicPrice && ((al.academicPaid || 0) < al.academicPrice);
    } else if (activeSmartSegment === 'riesgo_cobro') {
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = al.nextContactDate && al.nextContactDate < todayStr;
      matchSegment = al.etapa === 'Inscrito' && ((al.academicPaid || 0) < (al.academicPrice || 0)) && isOverdue;
    }

    return matchSearch && matchStage && matchCourse && matchCohort && matchPriority && matchOrigin && matchPayment && matchSegment && matchAcademicStatus;
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
    } else if (sortColumn === 'score') {
      comparison = getLeadScore(a).score - getLeadScore(b).score;
    } else if (sortColumn === 'origen') {
      comparison = (a.origen || '').localeCompare(b.origen || '');
    } else if (sortColumn === 'fecha') {
      comparison = new Date(a.fecha) - new Date(b.fecha);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  window.filteredAlumnosList = filtered;

  const totalRecords = filtered.length;
  alumnosTotalPages = Math.ceil(totalRecords / alumnosPageSize) || 1;
  if (alumnosCurrentPage > alumnosTotalPages) alumnosCurrentPage = alumnosTotalPages;
  if (alumnosCurrentPage < 1) alumnosCurrentPage = 1;

  const startRecord = (alumnosCurrentPage - 1) * alumnosPageSize;
  const endRecord = Math.min(startRecord + alumnosPageSize, totalRecords);

  const paginated = filtered.slice(startRecord, endRecord);

  const tbody = document.getElementById('alumnos-table-body');
  const emptyState = document.getElementById('table-empty-state');
  const paginationBar = document.getElementById('table-pagination-bar');

  if (totalRecords === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    if (paginationBar) paginationBar.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (paginationBar) {
      paginationBar.style.display = 'flex';
      const infoEl = document.getElementById('pagination-info');
      const pageNumEl = document.getElementById('pagination-current-page');
      const prevBtn = document.getElementById('btn-prev-page');
      const nextBtn = document.getElementById('btn-next-page');

      if (infoEl) infoEl.innerText = `Mostrando ${startRecord + 1}-${endRecord} de ${totalRecords} alumnos`;
      if (pageNumEl) pageNumEl.innerText = `${alumnosCurrentPage} / ${alumnosTotalPages}`;
      if (prevBtn) prevBtn.disabled = (alumnosCurrentPage === 1);
      if (nextBtn) nextBtn.disabled = (alumnosCurrentPage === alumnosTotalPages);
    }

    if (tbody) {
      tbody.innerHTML = paginated.map(al => {
        const color = stageColors[al.etapa] || 'var(--color-primary)';
        const initials = calculateInitials(al.nombre, al.apellido);
        const priorityClass = `priority-badge-${al.prioridad.toLowerCase()}`;
        const scoring = getLeadScore(al);
        
        let sourceIcon = 'globe';
        if (al.origen === 'Instagram') sourceIcon = 'instagram';
        if (al.origen === 'WhatsApp') sourceIcon = 'message-circle';
        if (al.origen === 'TikTok') sourceIcon = 'video';
        if (al.origen === 'Facebook') sourceIcon = 'facebook';
        if (al.origen === 'Referido') sourceIcon = 'users';
        if (al.origen === 'Presencial') sourceIcon = 'map-pin';

        return `
          <tr onclick="handleRowClick(event, '${al.id}')">
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <input type="checkbox" class="student-row-checkbox" value="${al.id}" onchange="updateBulkActionsBar()" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary);">
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar-sm" style="background-color: ${color}">${initials}</div>
                <div>
                  <span class="user-info-name">
                    ${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}
                    ${isLeadCold(al) ? `<span class="lead-cold-indicator" title="Sin actividad por más de 3 días"><i data-lucide="clock" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i>Frío</span>` : ''}
                    ${(al.nextContactDate && al.nextContactDate <= new Date().toISOString().split('T')[0] && al.etapa !== 'Inscrito' && al.etapa !== 'Perdido') ? `<span class="lead-cold-indicator" style="background: rgba(247,172,5,0.15); color: #f7ac05; border-color: rgba(247,172,5,0.3);" title="Seguimiento agendado para hoy o retrasado"><i data-lucide="calendar" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i>Agenda</span>` : ''}
                  </span>
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
              <span class="score-badge ${scoring.class}">
                ${scoring.icon} ${scoring.score}%
              </span>
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
  }

  // Uncheck bulk-select-all header checkbox on page change / rerender
  const bulkAllCheckbox = document.getElementById('bulk-select-all');
  if (bulkAllCheckbox) {
    bulkAllCheckbox.checked = false;
  }
  const actionsBar = document.getElementById('bulk-actions-bar');
  if (actionsBar) {
    actionsBar.style.display = 'none';
  }

  // Update dynamic financial summary banner
  const countEl = document.getElementById('summary-filtered-count');
  const debtEl = document.getElementById('summary-filtered-debt');
  const debtVesEl = document.getElementById('summary-filtered-debt-ves');
  const solvencyEl = document.getElementById('summary-filtered-solvency');

  if (countEl && debtEl && debtVesEl && solvencyEl) {
    let totalDebt = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    filtered.forEach(al => {
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
    
    countEl.innerText = filtered.length;
    debtEl.innerText = `$${totalDebt.toFixed(2)} USD`;
    debtVesEl.innerText = `${(totalDebt * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES`;
    solvencyEl.innerText = `${solvencyRate}%`;
  }

  updateSortIndicators();
}

function renderPipeline() {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  const container = document.getElementById('kanban-board-container');
  if (!container) return;
  const stagesList = Object.keys(stageColors);

  // Retrieve filter values
  const searchInput = document.getElementById('pipeline-search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const courseFilter = document.getElementById('pipeline-filter-curso') ? document.getElementById('pipeline-filter-curso').value : '';
  const priorityFilter = document.getElementById('pipeline-filter-prioridad') ? document.getElementById('pipeline-filter-prioridad').value : '';
  const hideArchived = document.getElementById('pipeline-hide-archived') ? document.getElementById('pipeline-hide-archived').checked : false;

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  container.innerHTML = stagesList.map(stage => {
    // Filter students for this stage (hide graduated/retired from active pipeline board)
    let stageAlumnos = alumnos.filter(a => {
      if (a.etapa === stage) {
        if (stage === 'Inscrito') {
          return a.academicStatus !== 'Graduado' && a.academicStatus !== 'Retirado';
        }
        return true;
      }
      return false;
    });

    // Apply search query
    if (searchQuery) {
      stageAlumnos = stageAlumnos.filter(a => {
        const courseName = getCourseName(a.curso).toLowerCase();
        const notesArr = a.notas || a.notes || [];
        const notesMatch = notesArr.some(n => n.text && n.text.toLowerCase().includes(searchQuery));
        return a.nombre.toLowerCase().includes(searchQuery) ||
               (a.apellido && a.apellido.toLowerCase().includes(searchQuery)) ||
               (a.email && a.email.toLowerCase().includes(searchQuery)) ||
               (a.tel && a.tel.includes(searchQuery)) ||
               (a.instagram && a.instagram.toLowerCase().includes(searchQuery)) ||
               courseName.includes(searchQuery) ||
               notesMatch;
      });
    }

    // Apply course filter
    if (courseFilter) {
      stageAlumnos = stageAlumnos.filter(a => a.curso === courseFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      stageAlumnos = stageAlumnos.filter(a => a.prioridad === priorityFilter);
    }

    // Apply auto-archive hide old completed leads (only for Inscrito / Perdido)
    if (hideArchived && (stage === 'Inscrito' || stage === 'Perdido')) {
      stageAlumnos = stageAlumnos.filter(a => {
        const updateDate = new Date(a.fecha);
        return updateDate >= fifteenDaysAgo;
      });
    }

    const totalFilteredCount = stageAlumnos.length;

    // Apply pagination limit
    const limit = kanbanColumnLimits[stage] || 15;
    const displayedAlumnos = stageAlumnos.slice(0, limit);
    const hasMore = totalFilteredCount > limit;
    const remainingCount = totalFilteredCount - limit;

    const color = stageColors[stage];

    // Work In Progress (WIP) Limits config
    const wipLimits = {
      'Nuevo': 25,
      'Contactado': 15,
      'Interesado': 10,
      'Negociando': 8
    };
    const maxWip = wipLimits[stage];
    const isOverLimit = maxWip && totalFilteredCount > maxWip;
    const limitLabel = maxWip ? `/${maxWip}` : '';
    const overLimitStyle = isOverLimit ? 'border: 1.5px solid rgba(244, 67, 54, 0.45); box-shadow: 0 0 10px rgba(244, 67, 54, 0.1); background: rgba(244, 67, 54, 0.01);' : '';

    const cardsHtml = displayedAlumnos.length === 0 ? `
      <div class="kanban-empty-card">Sin alumnos</div>
    ` : displayedAlumnos.map(al => {
      const priorityClass = `priority-badge-${al.prioridad.toLowerCase()}`;
      const scoring = getLeadScore(al);
      return `
        <div class="kanban-card" data-id="${al.id}" draggable="true" ondragstart="dragStart(event, '${al.id}')" onclick="openDetailPanel('${al.id}')" style="border-left: 3.5px solid ${color};">
          <div class="kanban-card-title" style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap: wrap;">
            <span>${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')}</span>
            <div style="display:flex; gap:4px; align-items:center;">
              ${isLeadCold(al) ? `<span class="lead-cold-indicator" title="Sin actividad por más de 3 días"><i data-lucide="clock" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i>Frío</span>` : ''}
              ${(al.nextContactDate && al.nextContactDate <= new Date().toISOString().split('T')[0] && al.etapa !== 'Inscrito' && al.etapa !== 'Perdido') ? `<span class="lead-cold-indicator" style="background: rgba(247,172,5,0.15); color: #f7ac05; border-color: rgba(247,172,5,0.3);" title="Seguimiento agendado"><i data-lucide="calendar" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i>Agenda</span>` : ''}
            </div>
          </div>
          <div class="kanban-card-course">
            <i data-lucide="graduation-cap"></i>
            <span>${escapeHTML(getCourseName(al.curso))}</span>
          </div>
          <div class="kanban-card-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:4px; align-items:center;">
              <span class="badge ${priorityClass}">${al.prioridad}</span>
              <span class="score-badge ${scoring.class}" style="font-size: 9px; padding: 1px 6px;">
                ${scoring.icon} ${scoring.score}%
              </span>
            </div>
            <span class="kanban-card-date">${formatDateShort(al.fecha)}</span>
          </div>
          <div class="kanban-card-quick-actions" style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px dashed var(--color-border); padding-top: 8px; justify-content: flex-end;">
            <button onclick="event.stopPropagation(); toggleCardPriority('${al.id}')" title="Cambiar Prioridad" style="padding: 3px 6px; font-size: 10px; display: flex; align-items: center; gap: 4px; background: rgba(32, 38, 74, 0.04); border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s;" onmouseover="this.style.background='rgba(247, 172, 5, 0.1)'; this.style.color='#f7ac05';" onmouseout="this.style.background='rgba(32, 38, 74, 0.04)'; this.style.color='var(--color-text-muted)';">
              <i data-lucide="star" style="width: 11px; height: 11px; fill: ${al.prioridad === 'Alta' ? '#f7ac05' : 'transparent'}; color: ${al.prioridad === 'Alta' ? '#f7ac05' : 'currentColor'};"></i> Prio
            </button>
            <button onclick="event.stopPropagation(); sendQuickWhatsApp('${al.id}')" title="WhatsApp Rápido" style="padding: 3px 6px; font-size: 10px; display: flex; align-items: center; gap: 4px; background: rgba(109, 170, 69, 0.06); border: 1px solid rgba(109, 170, 69, 0.15); border-radius: 4px; cursor: pointer; color: var(--color-success); transition: all 0.15s;" onmouseover="this.style.background='var(--color-success)'; this.style.color='white';" onmouseout="this.style.background='rgba(109, 170, 69, 0.06)'; this.style.color='var(--color-success)';">
              <i data-lucide="message-circle" style="width: 11px; height: 11px;"></i> WhatsApp
            </button>
          </div>
        </div>
      `;
    }).join('');

    const loadMoreButtonHtml = hasMore ? `
      <button class="load-more-kanban-btn" onclick="loadMoreKanban('${stage}')" style="width: 100%; margin-top: 10px; font-size: 11px; padding: 8px; border: 1px dashed var(--color-border); border-radius: var(--border-radius-sm); color: var(--color-text-muted); background: transparent; cursor: pointer; transition: all 0.2s;">
        Cargar más (+${remainingCount} restantes)
      </button>
    ` : '';

    return `
      <div class="kanban-column" data-stage="${stage}" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondrop="handleDrop(event)" style="${overLimitStyle}">
        <div class="kanban-column-header">
          <div class="column-title-group">
            <span class="column-dot" style="background-color: ${color}"></span>
            <span class="column-title">${stage}</span>
          </div>
          <span class="badge-count" style="${isOverLimit ? 'background: var(--color-error); color: white;' : ''}">${totalFilteredCount}${limitLabel}</span>
        </div>
        <div class="kanban-column-cards">
          ${cardsHtml}
          ${loadMoreButtonHtml}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderTareas() {
  const tbody = document.getElementById('global-tareas-tbody');
  const emptyState = document.getElementById('tareas-empty-state');
  const globalFormStudentSelect = document.getElementById('global-task-student');

  if (globalFormStudentSelect) {
    globalFormStudentSelect.innerHTML = '<option value="">General (Sin Alumno)</option>' + alumnos.map(al => `<option value="${al.id}">${escapeHTML(al.nombre)} ${escapeHTML(al.apellido || '')} (${escapeHTML(getCourseName(al.curso))})</option>`).join('');
  }

  const pendingTasks = tareas.filter(t => !t.completed);
  const completedTasks = tareas.filter(t => t.completed);
  const allTasksSorted = [...pendingTasks, ...completedTasks];

  if (allTasksSorted.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = allTasksSorted.map(t => {
        const student = t.studentId ? alumnos.find(al => al.id === t.studentId) : null;
        const studentName = student ? `${student.nombre} ${student.apellido || ''}` : 'General / Sin Alumno';
        const dateText = t.dueDate ? formatDateShort(t.dueDate) : 'Sin fecha';
        const textStyle = t.completed ? 'text-decoration: line-through; opacity: 0.6;' : '';
        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !t.completed;
        const dateStyle = isOverdue ? 'color: var(--color-error); font-weight:600;' : 'color: var(--color-text-muted);';

        const studentLink = student
          ? `<a href="#" onclick="openDetailPanel('${t.studentId}'); return false;" style="color: var(--color-primary); font-weight: 500; text-decoration: none;">${escapeHTML(studentName)}</a>`
          : `<span style="color: var(--color-text-muted); font-style: italic;">Tarea General</span>`;

        return `
          <tr>
            <td style="width: 40px; text-align: center; vertical-align: middle;">
              <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskStatus('${t.id}')" style="cursor: pointer; width: 18px; height: 18px; accent-color: var(--color-primary);">
            </td>
            <td style="${textStyle}">
              <span style="font-weight: 500;">${escapeHTML(t.title)}</span>
            </td>
            <td>
              ${studentLink}
            </td>
            <td style="${dateStyle}">${dateText}</td>
            <td style="text-align: right;">
              <button class="btn btn-ghost btn-icon-sm" onclick="deleteTask('${t.id}')" style="color: var(--color-error)">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
    lucide.createIcons();
  }
}

function renderReportes() {
  const totalLeads = alumnos.length;
  const inscritosCount = alumnos.filter(a => a.etapa === 'Inscrito').length;
  const conversionRate = totalLeads > 0 ? ((inscritosCount / totalLeads) * 100).toFixed(1) : 0;

  let totalRevenueProjected = 0;
  let totalRevenuePaid = 0;
  alumnos.filter(a => a.etapa === 'Inscrito').forEach(student => {
    const courseObj = cursos.find(c => c.id === student.curso);
    const defaultPrice = courseObj ? courseObj.precio : 0;
    const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
    totalRevenueProjected += price;
    totalRevenuePaid += (student.academicPaid || 0);
  });

  // Calculate expenses and net profitability
  const totalExpenses = egresos.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const netProfitability = totalRevenuePaid - totalExpenses;
  const profitMargin = totalRevenuePaid > 0 ? ((netProfitability / totalRevenuePaid) * 100).toFixed(1) : 0;

  const revEl = document.getElementById('rep-ingresos-totales');
  const revPaidEl = document.getElementById('rep-ingresos-recaudados');
  const convEl = document.getElementById('rep-tasa-conversion');
  const egresosEl = document.getElementById('rep-egresos-totales');
  const netProfitEl = document.getElementById('rep-rentabilidad-neta');
  const netMarginEl = document.getElementById('rep-rentabilidad-margen');

  if (revEl) revEl.innerText = `$${totalRevenueProjected.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
  if (revPaidEl) revPaidEl.innerText = `$${totalRevenuePaid.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
  if (convEl) convEl.innerText = `${conversionRate}%`;
  if (egresosEl) egresosEl.innerText = `$${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})} USD`;
  
  if (netProfitEl) {
    netProfitEl.innerText = `$${netProfitability.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})} USD`;
    netProfitEl.style.color = netProfitability >= 0 ? 'var(--color-success)' : 'var(--color-error)';
  }
  if (netMarginEl) {
    netMarginEl.innerText = `Margen neto: ${profitMargin}%`;
  }

  // Update targets UI (Opción B)
  const inputMetaInscritos = document.getElementById('input-meta-inscritos');
  const inputMetaRecaudacion = document.getElementById('input-meta-recaudacion');
  if (inputMetaInscritos) inputMetaInscritos.value = metaInscritos;
  if (inputMetaRecaudacion) inputMetaRecaudacion.value = metaRecaudacion;

  const pctInscritos = metaInscritos > 0 ? Math.min(100, Math.round((inscritosCount / metaInscritos) * 100)) : 0;
  const pctRecaudacion = metaRecaudacion > 0 ? Math.min(100, Math.round((totalRevenuePaid / metaRecaudacion) * 100)) : 0;

  const textInscritos = document.getElementById('goal-progress-inscritos-text');
  const barInscritos = document.getElementById('goal-progress-inscritos-bar');
  if (textInscritos) textInscritos.innerText = `${inscritosCount} / ${metaInscritos} (${pctInscritos}%)`;
  if (barInscritos) barInscritos.style.width = `${pctInscritos}%`;

  const textRecaudacion = document.getElementById('goal-progress-recaudacion-text');
  const barRecaudacion = document.getElementById('goal-progress-recaudacion-bar');
  if (textRecaudacion) textRecaudacion.innerText = `$${totalRevenuePaid.toLocaleString('en-US', {minimumFractionDigits:0})} / $${metaRecaudacion.toLocaleString('en-US', {minimumFractionDigits:0})} (${pctRecaudacion}%)`;
  if (barRecaudacion) barRecaudacion.style.width = `${pctRecaudacion}%`;

  // Theme-aware Chart.js styling variables
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isLight = currentTheme === 'light';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
  const labelColor = isLight ? '#20264a' : 'rgba(255, 255, 255, 0.7)';
  const chartBorderColor = isLight ? '#ffffff' : '#1e1e24';

  if (reportesActiveTab === 'comercial') {
    renderComercialCharts(gridColor, labelColor, chartBorderColor);
  } else if (reportesActiveTab === 'financiero') {
    renderExpensesTab(totalRevenuePaid);
  } else if (reportesActiveTab === 'embudo') {
    renderEmbudoTab();
  }
}

function renderCursos() {
  const container = document.getElementById('courses-grid-container');

  container.innerHTML = cursos.map((c, idx) => {
    const interesados = alumnos.filter(a => a.curso === c.id && ['Nuevo', 'Contactado', 'Interesado', 'Negociando'].includes(a.etapa)).length;
    const inscritos = alumnos.filter(a => a.curso === c.id && a.etapa === 'Inscrito').length;
    const color = courseColors[idx % courseColors.length];
    
    // Disabled deletion if students allocated
    const hasStudents = alumnos.some(a => a.curso === c.id);

    return `
      <div class="course-card" onclick="openCourseViewEnrolledModal('${c.id}')" style="cursor: pointer; position: relative;">
        <div class="course-card-accent" style="background-color: ${color}"></div>
        <div class="course-card-header">
          <div class="course-icon-wrapper" style="background-color: ${color}1a; color: ${color}">
            <i data-lucide="graduation-cap"></i>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="course-edit-btn" onclick="event.stopPropagation(); openCourseModal('${c.id}')" title="Editar Curso">
              <i data-lucide="edit-2" style="width:18px; height:18px;"></i>
            </button>
            <button class="course-delete-btn" onclick="event.stopPropagation(); deleteCourse('${c.id}')" ${hasStudents ? 'disabled' : ''} 
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

function renderCohortes() {
  const originalAlumnos = window.alumnosGlobal;
  const alumnos = userRole === 'asesor' ? originalAlumnos.filter(a => a.coordinador === username) : originalAlumnos;

  const gridContainer = document.getElementById('cohorts-grid-container');
  if (!gridContainer) return;

  if (cohortes.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center; width: 100%;">
        <i data-lucide="layers" class="empty-icon" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 12px; margin-left: auto; margin-right: auto; display: block;"></i>
        <p style="color: var(--color-text-muted); font-size: 14px; margin-bottom: 12px;">No hay grupos o cohortes creadas aún.</p>
        <button class="btn btn-primary btn-sm" onclick="openCohortModal()" style="margin-top: 12px;">Crear tu primer grupo</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Render cards
  gridContainer.innerHTML = cohortes.map(coh => {
    const cursoName = getCourseName(coh.curso);
    // Count students assigned to this cohort ID
    const assignedCount = alumnos.filter(a => a.academicGroup === coh.id && a.etapa === 'Inscrito').length;
    
    const capacity = coh.capacidad || 15;
    const occupancyRate = Math.min((assignedCount / capacity) * 100, 100);
    const hue = Math.max(0, 120 - (occupancyRate * 1.2));
    const barColor = `hsl(${hue}, 75%, 45%)`;
    
    // Status color badge
    let statusBg = 'rgba(109, 170, 69, 0.15)';
    let statusColor = '#6daa45';
    if (coh.estatus === 'Graduado') {
      statusBg = 'rgba(139, 92, 246, 0.15)';
      statusColor = '#8b5cf6';
    } else if (coh.estatus === 'Cancelado') {
      statusBg = 'rgba(244, 67, 54, 0.15)';
      statusColor = '#f44336';
    }

    const isActiveStyle = selectedCohortId === coh.id ? 'border: 2px solid var(--color-primary); transform: translateY(-2px);' : '';

    return `
      <div class="course-card" onclick="openCohortViewStudentsModal('${coh.id}')" style="${isActiveStyle} cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; transition: all var(--transition-smooth);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <span class="badge" style="background: ${statusBg}; color: ${statusColor}; font-weight: 700; font-size: 11px;">
              ${coh.estatus}
            </span>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-ghost btn-icon-sm" onclick="event.stopPropagation(); openCohortModal('${coh.id}')" title="Editar Grupo" style="padding: 4px;">
                <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-ghost btn-icon-sm" onclick="event.stopPropagation(); deleteCohort('${coh.id}')" title="Eliminar Grupo" style="color: var(--color-error); padding: 4px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-text); margin-bottom: 8px; line-height: 1.3;">
            ${escapeHTML(coh.nombre)}
          </h3>
          <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
            <i data-lucide="graduation-cap" style="width: 14px; height: 14px;"></i> ${escapeHTML(cursoName)}
          </p>
          <div style="font-size: 12px; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--color-border); padding-top: 10px; margin-top: 10px;">
            <span>📅 <b>Inicio:</b> ${formatDateShort(coh.fechaInicio)}</span>
            <span>📅 <b>Fin:</b> ${formatDateShort(coh.fechaFin)}</span>
          </div>
          <!-- Barra de ocupación visual -->
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--color-text-muted); margin-bottom: 4px;">
              <span>Ocupación del Grupo</span>
              <span style="font-weight: 700; color: ${barColor}">${occupancyRate.toFixed(0)}%</span>
            </div>
            <div style="height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden;">
              <div style="background-color: ${barColor}; width: ${occupancyRate}%; height: 100%; border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: 12px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--color-text);">
            👥 ${assignedCount} / ${capacity} Alumnos
          </span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openCohortSidebar('${coh.id}')" style="font-size: 12px; padding: 6px 12px; margin-right: 4px;">
            <i data-lucide="users" style="width: 12px; height: 12px; margin-right: 4px;"></i> Asignar
          </button>
          <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); openBulkWaModal('${coh.id}')" style="font-size: 12px; padding: 6px 12px; background-color: var(--color-success); color: white;">
            <i data-lucide="message-circle" style="width: 12px; height: 12px; margin-right: 4px;"></i> WhatsApp
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearEl = document.getElementById('calendar-month-year');
  if (!grid || !monthYearEl) return;

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();

  const monthsSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  monthYearEl.innerText = `${monthsSpanish[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  let html = '';

  // Prev month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    html += `
      <div style="background: var(--color-bg); opacity: 0.3; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 8px; min-height: 80px; text-align: left; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 11px; font-weight: 600; color: var(--color-text-muted);">${day}</span>
      </div>
    `;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const showPayments = document.getElementById('calendar-show-payments')?.checked !== false;
  const showTasks = document.getElementById('calendar-show-tasks')?.checked !== false;

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // Filter students with nextContactDate === dateStr
    const dueStudents = (showPayments && !(typeof userRole !== 'undefined' && userRole === 'asesor')) ? alumnos.filter(al => al.nextContactDate === dateStr) : [];
    
    // Filter tasks with dueDate === dateStr
    const dueTasks = showTasks ? tareas.filter(t => !t.completed && t.dueDate === dateStr) : [];

    let dayItemsHTML = '';

    dueStudents.forEach(al => {
      const courseObj = cursos.find(c => c.id === al.curso);
      const price = al.academicPrice !== undefined ? al.academicPrice : (courseObj ? courseObj.precio : 0);
      const paid = al.academicPaid || 0;
      const balance = Math.max(0, price - paid);
      const displayText = balance > 0 ? `$${balance} - ${al.nombre}` : `Cobro: ${al.nombre}`;

      dayItemsHTML += `
        <div draggable="true" ondragstart="handleCalendarDragStart(event, 'payment', '${al.id}')" style="background: rgba(253, 171, 67, 0.15); color: #fdab43; border: 1px solid rgba(253, 171, 67, 0.3); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 600; cursor: grab; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 2px;" onclick="event.stopPropagation(); openDetailPanel('${al.id}')" title="Cobro pendiente a ${al.nombre} ${al.apellido || ''}">
          💵 ${displayText}
        </div>
      `;
    });

    dueTasks.forEach(t => {
      const student = t.studentId ? alumnos.find(a => a.id === t.studentId) : null;
      const studentName = student ? student.nombre : 'General';
      const dragAttr = t.studentId ? `draggable="true" ondragstart="handleCalendarDragStart(event, 'task', '${t.id}')"` : '';
      const clickAction = t.studentId ? `onclick="event.stopPropagation(); openDetailPanel('${t.studentId}')"` : `onclick="event.stopPropagation()"` ;
      const cursorStyle = t.studentId ? 'cursor: grab;' : 'cursor: default;';
      dayItemsHTML += `
        <div ${dragAttr} ${clickAction} style="background: rgba(139, 92, 246, 0.15); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 600; ${cursorStyle} text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 2px;" title="${escapeHTML(t.title)}">
          📌 ${studentName}: ${escapeHTML(t.title)}
        </div>
      `;
    });

    const isSelected = dateStr === calendarSelectedDateStr;
    let todayStyle = 'border: 1px solid var(--color-border);';
    if (isToday) {
      todayStyle = 'border: 2px solid var(--color-primary); background: rgba(109, 170, 69, 0.05);';
    }
    if (isSelected) {
      todayStyle = 'border: 2px dashed var(--color-primary); background: rgba(79, 152, 163, 0.08);';
    }

    html += `
      <div onclick="selectCalendarDate('${dateStr}')" 
           ondragover="event.preventDefault(); this.classList.add('drag-over');" 
           ondragleave="this.classList.remove('drag-over');" 
           ondrop="this.classList.remove('drag-over'); handleCalendarDrop(event, '${dateStr}');" 
           style="${todayStyle} border-radius: var(--border-radius-sm); padding: 8px; min-height: 80px; text-align: left; display: flex; flex-direction: column; gap: 4px; background: var(--color-surface); cursor: pointer; transition: background-color 0.15s, transform 0.1s; box-shadow: var(--shadow-sm);" 
           onmouseover="this.style.backgroundColor='var(--color-hover)'" 
           onmouseout="this.style.backgroundColor='var(--color-surface)'" 
           class="calendar-day-cell">
        <span style="font-size: 11px; font-weight: 700; color: ${isToday ? 'var(--color-primary)' : 'var(--color-text)'};">${day}</span>
        <div style="flex-grow: 1; overflow-y: auto; max-height: 70px; display: flex; flex-direction: column; gap: 2px;">
          ${dayItemsHTML}
        </div>
      </div>
    `;
  }

  // Next month padding days to fill 42 cells grid
  const totalCells = firstDayIndex + totalDays;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    html += `
      <div style="background: var(--color-bg); opacity: 0.3; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); padding: 8px; min-height: 80px; text-align: left; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 11px; font-weight: 600; color: var(--color-text-muted);">${i}</span>
      </div>
    `;
  }

  grid.innerHTML = html;
}

function renderAjustesSettings() {
  const usernameEl = document.getElementById('ajustes-username');
  if (usernameEl) usernameEl.value = username;

  const tasaEl = document.getElementById('ajustes-tasa-bcv');
  if (tasaEl) tasaEl.value = tasaBCV;

  // Render Academy Profile inputs
  const academyNombre = document.getElementById('ajustes-academy-nombre');
  if (academyNombre) academyNombre.value = academyProfile.nombre || '';
  const academyEslogan = document.getElementById('ajustes-academy-eslogan');
  if (academyEslogan) academyEslogan.value = academyProfile.eslogan || '';
  const academyDireccion = document.getElementById('ajustes-academy-direccion');
  if (academyDireccion) academyDireccion.value = academyProfile.direccion || '';
  const academyTelefono = document.getElementById('ajustes-academy-telefono');
  if (academyTelefono) academyTelefono.value = academyProfile.telefono || '';
  const academyEmail = document.getElementById('ajustes-academy-email');
  if (academyEmail) academyEmail.value = academyProfile.email || '';

  // Hydrate Meta/WhatsApp API settings
  const metaToken = localStorage.getItem("meta_api_token") || '';
  const metaPhoneId = localStorage.getItem("meta_phone_id") || '';
  const metaWabaId = localStorage.getItem("meta_waba_id") || '';

  const metaTokenEl = document.getElementById('meta-api-token');
  if (metaTokenEl) metaTokenEl.value = metaToken;

  const metaPhoneIdEl = document.getElementById('meta-phone-id');
  if (metaPhoneIdEl) metaPhoneIdEl.value = metaPhoneId;

  const metaWabaIdEl = document.getElementById('meta-waba-id');
  if (metaWabaIdEl) metaWabaIdEl.value = metaWabaId;

  // Render checkbox and backup inputs
  const autoBCVCheckbox = document.getElementById('ajustes-bcv-auto');
  if (autoBCVCheckbox) autoBCVCheckbox.checked = fetchBCVOnStartup;

  const backupFreqSelect = document.getElementById('ajustes-backup-freq');
  if (backupFreqSelect) backupFreqSelect.value = backupReminderFrequency;

  const lastBackupEl = document.getElementById('ajustes-backup-last-date');
  if (lastBackupEl) {
    lastBackupEl.innerText = lastBackupDate ? `Último respaldo: ${lastBackupDate}` : 'Último respaldo: Nunca';
  }

  const listEl = document.getElementById('ajustes-templates-list');
  if (listEl) {
    if (whatsappTemplates.length === 0) {
      listEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">Sin plantillas registradas</p>';
    } else {
      listEl.innerHTML = whatsappTemplates.map(tmpl => `
        <div style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 10px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
          <div style="flex-grow: 1;">
            <h5 style="font-size: 13px; font-weight:600; color: var(--color-text);">${escapeHTML(tmpl.nombre)}</h5>
            <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px; white-space: pre-wrap;">${escapeHTML(tmpl.texto)}</p>
          </div>
          <button class="btn btn-ghost btn-icon-sm" onclick="deleteCustomTemplate('${tmpl.id}')" title="Eliminar Plantilla" style="color: var(--color-error)">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `).join('');
    }
  }

  // Render Sales Advisors list
  const asesoresListEl = document.getElementById('ajustes-asesores-list');
  if (asesoresListEl) {
    if (asesores.length === 0) {
      asesoresListEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0;">No hay asesores registrados.</p>';
    } else {
      asesoresListEl.innerHTML = asesores.map(as => `
        <div style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 8px 12px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <h5 style="font-size: 13px; font-weight:600; color: var(--color-text);">${escapeHTML(as.nombre)}</h5>
            <p style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">Usuario: <span style="font-family: monospace; font-weight: bold; color: var(--color-primary);">${escapeHTML(as.username)}</span> | Rol: Asesor de Ventas</p>
          </div>
          <button class="btn btn-ghost btn-icon-sm" onclick="deleteSalesAdvisor('${as.id}')" title="Eliminar Asesor" style="color: var(--color-error)">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `).join('');
    }
  }

  // Hydrate Google Sheets Settings
  if (typeof initGoogleSheetsUI === 'function') {
    initGoogleSheetsUI();
  }

  lucide.createIcons();
}

function renderCohortSidebarStudents() {
  const assignedListEl = document.getElementById('cohort-assigned-students-list');
  const unassignedListEl = document.getElementById('cohort-unassigned-students-list');
  if (!assignedListEl || !unassignedListEl) return;

  const coh = cohortes.find(c => c.id === selectedCohortId);
  if (!coh) return;

  // 1. Assigned Students (academicGroup === cohortId)
  const assigned = alumnos.filter(a => a.academicGroup === coh.id);
  if (assigned.length === 0) {
    assignedListEl.innerHTML = `<p style="font-size:12px; color:var(--color-text-muted); font-style:italic; padding:6px 0; text-align: center;">No hay alumnos asignados.</p>`;
  } else {
    assignedListEl.innerHTML = assigned.map(a => {
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(109, 170, 69, 0.08); padding:8px 12px; border-radius:6px; border:1px solid rgba(109, 170, 69, 0.15); transition: background var(--transition-smooth);">
          <div style="cursor: pointer; flex-grow: 1;" onclick="openDetailPanel('${a.id}')" title="Ver detalles de alumno">
            <p style="font-size:13px; font-weight:600; margin:0; color:var(--color-text); text-decoration: underline; text-underline-offset: 2px;">${escapeHTML(a.nombre)} ${escapeHTML(a.apellido || '')}</p>
            <span style="font-size:11px; color:var(--color-text-muted);">${escapeHTML(a.academicStatus || 'Cursando')}</span>
          </div>
          <button class="btn btn-ghost btn-icon-sm" onclick="unassignStudentFromCohort('${a.id}')" title="Remover del grupo" style="color:var(--color-error); padding:4px; margin-left: 8px;">
            <i data-lucide="minus-circle" style="width:16px; height:16px;"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  // 2. Unassigned Students (of the same course, not in this cohort, stage must be 'Inscrito')
  const unassigned = alumnos.filter(a => a.curso === coh.curso && a.academicGroup !== coh.id && a.etapa === 'Inscrito');
  if (unassigned.length === 0) {
    unassignedListEl.innerHTML = `<p style="font-size:12px; color:var(--color-text-muted); font-style:italic; padding:6px 0; text-align: center;">No hay alumnos de este curso disponibles para agregar.</p>`;
  } else {
    unassignedListEl.innerHTML = unassigned.map(a => {
      // Check if they are assigned to another group
      const otherGroup = cohortes.find(c => c.id === a.academicGroup);
      const groupBadge = otherGroup ? `<span style="font-size:10px; padding:2px 6px; background:rgba(255,255,255,0.08); border-radius:4px; margin-top:2px; display:inline-block;">En: ${escapeHTML(otherGroup.nombre)}</span>` : '';
      
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--color-surface); padding:8px 12px; border-radius:6px; border:1px solid var(--color-border); transition: background var(--transition-smooth);">
          <div style="cursor: pointer; flex-grow: 1;" onclick="openDetailPanel('${a.id}')" title="Ver detalles de alumno">
            <p style="font-size:13px; font-weight:600; margin:0; color:var(--color-text); text-decoration: underline; text-underline-offset: 2px;">${escapeHTML(a.nombre)} ${escapeHTML(a.apellido || '')}</p>
            ${groupBadge}
          </div>
          <button class="btn btn-ghost btn-icon-sm" onclick="assignStudentToCohort('${a.id}', '${coh.id}')" title="Asignar al grupo" style="color:var(--color-primary); padding:4px; margin-left: 8px;">
            <i data-lucide="plus-circle" style="width:16px; height:16px;"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  lucide.createIcons();
}

function renderBulkStudentList() {
  const studentListEl = document.getElementById('bulk-wa-student-list');
  if (!studentListEl) return;

  studentListEl.innerHTML = bulkStudentList.map(student => {
    const isSent = student.bulkSent;
    const btnText = isSent ? 'Re-enviar' : 'Enviar 💬';
    const btnClass = isSent ? 'btn-secondary' : 'btn-success';
    const badgeHtml = isSent ? '<span class="badge" style="background:rgba(109,170,69,0.15); color:#6daa45; font-size:10px; padding:2px 6px; border-radius:4px;">Enviado</span>' : '<span class="badge" style="background:rgba(0,0,0,0.05); color:var(--color-text-muted); font-size:10px; padding:2px 6px; border-radius:4px;">Pendiente</span>';

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; background:rgba(255,255,255,0.01); padding:6px 8px; border-radius:4px; border:1px solid var(--color-border); margin-bottom: 4px;">
        <div style="display:flex; flex-direction:column;">
          <span style="font-weight:600;">${escapeHTML(student.nombre)} ${escapeHTML(student.apellido || '')}</span>
          <span style="font-size:10.5px; color:var(--color-text-muted);">${escapeHTML(student.tel || 'Sin teléfono')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${badgeHtml}
          <button class="btn ${btnClass} btn-sm" onclick="sendBulkWaMessage('${student.id}', this)" style="font-size:11px; padding:4px 8px; height:26px;">
            ${btnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPaymentHistory() {
  if (!selectedStudent) return;
  const listEl = document.getElementById('detail-payment-history-list');
  if (!listEl) return;
  
  const payments = selectedStudent.payments || [];
  
  if (payments.length === 0) {
    listEl.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:12px 0; background:rgba(255,255,255,0.02); border-radius:4px; margin:0;">Sin abonos registrados</p>';
  } else {
    listEl.innerHTML = payments.map(p => {
      const refText = p.ref ? ` <span style="opacity: 0.6; font-size:11px;">(${escapeHTML(p.ref)})</span>` : '';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--color-bg); border:1px solid var(--color-border); padding:6px 10px; border-radius:var(--border-radius-sm); font-size:12px;">
          <div>
            <strong style="color:var(--color-success); font-family:var(--font-display);">$${p.amount} USD</strong>
            <span style="margin-left:6px; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:10px; font-size:11px;">${escapeHTML(p.method)}</span>
            ${refText}
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--color-text-muted); font-size:11px;">${formatDateShort(p.date)}</span>
            <button class="btn btn-ghost btn-icon-sm" onclick="sendPaymentReceiptWhatsApp('${p.id}')" style="color:var(--color-success); padding:2px; height:auto; width:auto;" title="Enviar recibo por WhatsApp">
              <i data-lucide="message-square" style="width:12px; height:12px;"></i>
            </button>
            <button class="btn btn-ghost btn-icon-sm" onclick="generateIndividualPaymentPDF('${p.id}')" style="color:var(--color-primary); padding:2px; height:auto; width:auto;" title="Imprimir Recibo PDF">
              <i data-lucide="printer" style="width:12px; height:12px;"></i>
            </button>
            <button class="btn btn-ghost btn-icon-sm" onclick="deleteStudentPayment('${p.id}')" style="color:var(--color-error); padding:2px; height:auto; width:auto;" title="Eliminar abono">
              <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  }
}

function updatePaymentUI() {
  if (!selectedStudent) return;

  const price = parseFloat(document.getElementById('detail-payment-cost').value) || selectedStudent.academicPrice || 0;
  const paid = selectedStudent.academicPaid || 0;
  const balance = Math.max(0, price - paid);

  document.getElementById('detail-payment-total-paid').innerText = `$${paid} USD (~ ${(paid * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)`;
  document.getElementById('detail-payment-balance').innerText = `$${balance} USD (~ ${(balance * tasaBCV).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES)`;

  // Update badge
  const badge = document.getElementById('detail-payment-status-badge');
  if (badge) {
    if (paid >= price && price > 0) {
      badge.innerText = 'Completado 🟢';
      badge.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
      badge.style.color = 'var(--color-success)';
      badge.style.borderColor = 'rgba(76, 175, 80, 0.3)';
    } else if (paid > 0) {
      badge.innerText = 'Abono Parcial 🟡';
      badge.style.backgroundColor = 'rgba(253, 171, 67, 0.15)';
      badge.style.color = '#fdab43';
      badge.style.borderColor = 'rgba(253, 171, 67, 0.3)';
    } else {
      badge.innerText = 'Pendiente 🔴';
      badge.style.backgroundColor = 'rgba(244, 67, 54, 0.15)';
      badge.style.color = 'var(--color-error)';
      badge.style.borderColor = 'rgba(244, 67, 54, 0.3)';
    }
    badge.style.borderStyle = 'solid';
    badge.style.borderWidth = '1px';
  }

  // Update next contact date field in detail panel
  const nextContactInput = document.getElementById('detail-next-contact');
  if (nextContactInput) {
    nextContactInput.value = selectedStudent.nextContactDate || '';
  }

  renderPaymentHistory();
}

function renderComercialCharts(gridColor, labelColor, chartBorderColor) {
  // 1. LEAD SOURCE CHART
  const sources = ['Instagram', 'WhatsApp', 'Referido', 'Web', 'Presencial', 'Facebook', 'TikTok'];
  const sourceCounts = sources.map(src => alumnos.filter(a => a.origen === src).length);

  const canvas1 = document.getElementById('chart-lead-source');
  if (canvas1) {
    if (window.leadSourceChartInstance) window.leadSourceChartInstance.destroy();
    const ctx1 = canvas1.getContext('2d');
    window.leadSourceChartInstance = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: sources,
        datasets: [{
          label: 'Prospectos',
          data: sourceCounts,
          backgroundColor: 'rgba(247, 172, 5, 0.65)',
          borderColor: '#f7ac05',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: labelColor, stepSize: 1 }
          },
          x: {
            grid: { display: false },
            ticks: { color: labelColor }
          }
        }
      }
    });
  }

  // 2. COURSE REVENUE CHART
  const courseLabels = cursos.map(c => c.nombre);
  const courseRevenues = cursos.map(c => {
    const enrolled = alumnos.filter(a => a.curso === c.id && a.etapa === 'Inscrito').length;
    return enrolled * (c.precio || 0);
  });

  const canvas2 = document.getElementById('chart-course-revenue');
  if (canvas2) {
    if (window.courseRevenueChartInstance) window.courseRevenueChartInstance.destroy();
    const ctx2 = canvas2.getContext('2d');
    window.courseRevenueChartInstance = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: courseLabels,
        datasets: [{
          data: courseRevenues,
          backgroundColor: courseColors.slice(0, cursos.length),
          borderWidth: 1,
          borderColor: chartBorderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              color: labelColor
            }
          }
        }
      }
    });
  }

  // 3. FUNNEL STAGE CHART
  const stageNames = ['Nuevo', 'Contactado', 'Interesado', 'Negociando', 'Inscrito', 'Perdido'];
  const stageCounts = stageNames.map(st => alumnos.filter(a => a.etapa === st).length);
  const stageBarColors = stageNames.map(st => stageColors[st] || '#f7ac05');

  const canvas3 = document.getElementById('chart-funnel-stages');
  if (canvas3) {
    if (window.funnelChartInstance) window.funnelChartInstance.destroy();
    const ctx3 = canvas3.getContext('2d');
    window.funnelChartInstance = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: stageNames,
        datasets: [{
          data: stageCounts,
          backgroundColor: stageBarColors,
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 16
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: labelColor, stepSize: 1 }
          },
          y: {
            grid: { display: false },
            ticks: { color: labelColor }
          }
        }
      }
    });
  }

  // 4. LOST REASONS CHART
  const lostReasons = ['Precio Alto', 'Horario Incompatible', 'Falta de Interés', 'Prefiere la Competencia', 'Ghosting (No responde)', 'Otro'];
  const lostCounts = lostReasons.map(r => alumnos.filter(a => a.etapa === 'Perdido' && (a.lostReason === r || (!a.lostReason && r === 'Otro'))).length);
  
  const defaultReasonsSet = new Set(lostReasons);
  const otherCount = alumnos.filter(a => a.etapa === 'Perdido' && a.lostReason && !defaultReasonsSet.has(a.lostReason)).length;
  lostCounts[5] += otherCount;

  const canvas4 = document.getElementById('chart-lost-reasons');
  if (canvas4) {
    if (window.lostReasonsChartInstance) window.lostReasonsChartInstance.destroy();
    const ctx4 = canvas4.getContext('2d');
    window.lostReasonsChartInstance = new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: lostReasons,
        datasets: [{
          data: lostCounts,
          backgroundColor: ['#d163a7', '#fdab43', '#bb653b', '#8b5cf6', '#5591c7', '#e8af34'],
          borderWidth: 1,
          borderColor: chartBorderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              font: { size: 10 },
              color: labelColor
            }
          }
        }
      }
    });
  }

  // Populate Lost Reasons Table with Potential Lost Revenue (Opción C)
  const tbodyLost = document.getElementById('lost-reasons-metrics-body');
  if (tbodyLost) {
    const lostLeads = alumnos.filter(a => a.etapa === 'Perdido');
    let grandTotalLostRevenue = 0;
    
    const details = lostReasons.map((reason, idx) => {
      let studentsForReason = [];
      if (reason === 'Otro') {
        studentsForReason = lostLeads.filter(a => !a.lostReason || a.lostReason === 'Otro' || !defaultReasonsSet.has(a.lostReason));
      } else {
        studentsForReason = lostLeads.filter(a => a.lostReason === reason);
      }
      
      const count = studentsForReason.length;
      
      let potentialLostRevenue = 0;
      studentsForReason.forEach(a => {
        const cObj = cursos.find(c => c.id === a.curso);
        const defaultPrice = cObj ? cObj.precio : 0;
        const price = a.academicPrice !== undefined ? a.academicPrice : defaultPrice;
        potentialLostRevenue += price;
      });
      
      grandTotalLostRevenue += potentialLostRevenue;
      
      return { reason, count, potentialLostRevenue };
    });
    
    tbodyLost.innerHTML = details.map(d => {
      const pct = grandTotalLostRevenue > 0 ? ((d.potentialLostRevenue / grandTotalLostRevenue) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td><strong>${d.reason}</strong></td>
          <td style="text-align: center;">${d.count}</td>
          <td style="text-align: right; font-weight: 600; color: var(--color-error);">$${d.potentialLostRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          <td style="text-align: right; color: var(--color-text-muted);">${pct}%</td>
        </tr>
      `;
    }).join('');
  }

  // 5. CUMULATIVE REVENUE TREND CHART
  const trendCanvas = document.getElementById('chart-revenue-trend');
  if (trendCanvas) {
    if (window.revenueTrendChartInstance) window.revenueTrendChartInstance.destroy();
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    const cumulativePaid = [];
    let runningSum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let dailySum = 0;
      alumnos.forEach(student => {
        if (student.payments) {
          student.payments.forEach(p => {
            if (p.date === dayStr) {
              dailySum += parseFloat(p.amount) || 0;
            }
          });
        }
      });
      runningSum += dailySum;
      if (d <= now.getDate()) {
        cumulativePaid.push(runningSum);
      } else {
        cumulativePaid.push(null);
      }
    }
    
    const targetLine = daysArray.map(d => Math.round((metaRecaudacion / daysInMonth) * d));
    
    const ctxTrend = trendCanvas.getContext('2d');
    window.revenueTrendChartInstance = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: daysArray.map(d => `${d}`),
        datasets: [
          {
            label: 'Recaudación Acumulada (USD)',
            data: cumulativePaid,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.2,
            spanGaps: true
          },
          {
            label: 'Meta Comercial (Proyección)',
            data: targetLine,
            borderColor: '#fdab43',
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: labelColor }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              callback: function(value) { return '$' + value; }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: labelColor }
          }
        }
      }
    });
  }
  
  // Initialize/update What-If Simulation
  updateWhatIfSimulation();
  
  // Render Coordinator Performance
  renderSalesCoordinatorsPerformance();
}

function renderExpensesTab(totalRevenuePaid) {
  const tbody = document.getElementById('expenses-table-body');
  const emptyState = document.getElementById('expenses-empty-state');
  const countEl = document.getElementById('expenses-count');
  
  if (countEl) countEl.innerText = egresos.length;
  
  if (egresos.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (tbody) {
      const sorted = [...egresos].sort((a, b) => new Date(b.date) - new Date(a.date));
      tbody.innerHTML = sorted.map(e => {
        const sourceLabel = e.source && e.source !== 'General' ? ` <span style="font-size:10px; color:var(--color-text-muted); font-weight:600;">(${e.source})</span>` : '';
        return `
          <tr>
            <td>${formatDateShort(e.date)}</td>
            <td>
              <span class="badge" style="background: rgba(244, 67, 54, 0.1); color: var(--color-error); border: 1px solid rgba(244, 67, 54, 0.2); font-size: 11px; font-weight: 600;">
                ${escapeHTML(e.category)}
              </span>
            </td>
            <td>${escapeHTML(e.desc)}${sourceLabel}</td>
            <td style="text-align: right; font-weight: 600;">$${e.amount.toFixed(2)} USD</td>
            <td style="text-align: right;">
              <button class="btn btn-ghost btn-icon-sm" onclick="deleteExpense('${e.id}')" style="color: var(--color-error); padding: 4px;" title="Eliminar Egreso">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
  
  updateCommissionCalculator(totalRevenuePaid);
  updateMarketingAnalytics();
  updateCollectionTable();
  renderFinancialCharts();
}

function renderFinancialCharts() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const isLight = currentTheme === 'light';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
  const labelColor = isLight ? '#20264a' : 'rgba(255, 255, 255, 0.7)';
  const chartBorderColor = isLight ? '#ffffff' : '#1e1e24';

  // 1. Payment Methods Chart
  const paymentMethods = {};
  alumnos.forEach(a => {
    if (a.payments && Array.isArray(a.payments)) {
      a.payments.forEach(p => {
        const method = p.method || 'Otro';
        paymentMethods[method] = (paymentMethods[method] || 0) + (p.amount || 0);
      });
    }
  });

  const paymentLabels = Object.keys(paymentMethods);
  const paymentData = Object.values(paymentMethods);
  const paymentColors = ['#6daa45', '#5591c7', '#f7ac05', '#fdab43', '#8b5cf6', '#d163a7', '#4f98a3'];

  const canvasPay = document.getElementById('chart-payment-methods');
  if (canvasPay) {
    if (window.paymentMethodsChartInstance) window.paymentMethodsChartInstance.destroy();
    const ctxPay = canvasPay.getContext('2d');
    window.paymentMethodsChartInstance = new Chart(ctxPay, {
      type: 'doughnut',
      data: {
        labels: paymentLabels.length > 0 ? paymentLabels : ['Sin pagos'],
        datasets: [{
          data: paymentData.length > 0 ? paymentData : [0],
          backgroundColor: paymentColors.slice(0, Math.max(paymentLabels.length, 1)),
          borderWidth: 1,
          borderColor: chartBorderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              color: labelColor
            }
          }
        }
      }
    });
  }

  // 2. Monthly Registrations Trend Chart
  const registrationsByMonth = {};
  alumnos.forEach(a => {
    if (a.fecha) {
      const date = new Date(a.fecha);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        registrationsByMonth[key] = (registrationsByMonth[key] || 0) + 1;
      }
    }
  });

  const sortedKeys = Object.keys(registrationsByMonth).sort();
  const labels = sortedKeys.map(key => {
    const [year, month] = key.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
  });
  const dataPoints = sortedKeys.map(key => registrationsByMonth[key]);

  const canvasReg = document.getElementById('chart-monthly-registrations');
  if (canvasReg) {
    if (window.monthlyRegistrationsChartInstance) window.monthlyRegistrationsChartInstance.destroy();
    const ctxReg = canvasReg.getContext('2d');
    window.monthlyRegistrationsChartInstance = new Chart(ctxReg, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Sin registros'],
        datasets: [{
          label: 'Nuevos Prospectos',
          data: dataPoints.length > 0 ? dataPoints : [0],
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#8b5cf6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: labelColor, stepSize: 1 }
          },
          x: {
            grid: { display: false },
            ticks: { color: labelColor }
          }
        }
      }
    });
  }
}

function renderEmbudoTab() {
  const stagesOrder = ['Nuevo', 'Contactado', 'Interesado', 'Negociando', 'Inscrito'];
  const stageColorsList = ['#20264a', '#5591c7', '#f7ac05', '#fdab43', '#6daa45'];
  
  const totalLeads = alumnos.length;
  
  const counts = stagesOrder.map((stage, idx) => {
    if (stage === 'Nuevo') {
      return totalLeads;
    } else if (stage === 'Contactado') {
      return alumnos.filter(a => ['Contactado', 'Interesado', 'Negociando', 'Inscrito'].includes(a.etapa)).length;
    } else if (stage === 'Interesado') {
      return alumnos.filter(a => ['Interesado', 'Negociando', 'Inscrito'].includes(a.etapa)).length;
    } else if (stage === 'Negociando') {
      return alumnos.filter(a => ['Negociando', 'Inscrito'].includes(a.etapa)).length;
    } else if (stage === 'Inscrito') {
      return alumnos.filter(a => a.etapa === 'Inscrito').length;
    }
    return 0;
  });
  
  const funnelVisual = document.getElementById('funnel-conversion-visual');
  if (funnelVisual) {
    if (totalLeads === 0) {
      funnelVisual.innerHTML = '<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding:24px 0;">No hay suficientes datos para graficar el embudo.</p>';
    } else {
      funnelVisual.innerHTML = stagesOrder.map((stage, idx) => {
        const count = counts[idx];
        const pctOfTotal = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : 0;
        const color = stageColorsList[idx];
        
        return `
          <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; padding: 0 4px;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
                ${stage}
              </span>
              <span>${count} prospectos (${pctOfTotal}%)</span>
            </div>
            <div style="height: 28px; width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; position: relative;">
              <div style="height: 100%; background: ${color}; width: ${pctOfTotal}%; opacity: 0.85; transition: width 0.5s ease-out; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; box-sizing: border-box;">
                <span style="font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${pctOfTotal}%</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  
  const tableBody = document.getElementById('funnel-metrics-table-body');
  if (tableBody) {
    let rowsHtml = '';
    
    for (let i = 0; i < stagesOrder.length; i++) {
      const stage = stagesOrder[i];
      const count = counts[i];
      
      let nextStage = '';
      let nextCount = 0;
      let conversionStr = '-';
      let dropoffStr = '-';
      
      if (i < stagesOrder.length - 1) {
        nextStage = stagesOrder[i + 1];
        nextCount = counts[i + 1];
        
        const convRate = count > 0 ? (nextCount / count) * 100 : 0;
        const dropoffRate = 100 - convRate;
        
        conversionStr = `${convRate.toFixed(1)}%`;
        dropoffStr = `${dropoffRate.toFixed(1)}%`;
      }
      
      const stepLabel = nextStage ? `${stage} ➔ ${nextStage}` : 'Inscritos Completados';
      const color = stageColorsList[i];
      
      rowsHtml += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
              <span style="font-weight: 500;">${stepLabel}</span>
            </div>
          </td>
          <td style="text-align: right; font-weight: 600;">${count}</td>
          <td style="text-align: right; color: var(--color-success); font-weight: 600;">${conversionStr}</td>
          <td style="text-align: right; color: ${dropoffStr !== '-' && parseFloat(dropoffStr) > 50 ? 'var(--color-error)' : 'var(--color-text-muted)'}; font-weight: 600;">${dropoffStr}</td>
        </tr>
      `;
    }
    
    tableBody.innerHTML = rowsHtml;
  }
}

function updateCollectionTable() {
  const tbody = document.getElementById('collection-debts-table-body');
  if (!tbody) return;
  
  const debtors = alumnos.filter(a => a.etapa === 'Inscrito').map(student => {
    const courseObj = cursos.find(c => c.id === student.curso);
    const defaultPrice = courseObj ? courseObj.precio : 0;
    const courseName = courseObj ? courseObj.nombre : 'N/A';
    const price = student.academicPrice !== undefined ? student.academicPrice : defaultPrice;
    const paid = student.academicPaid || 0;
    const balance = price - paid;
    return {
      student,
      courseName,
      price,
      paid,
      balance
    };
  }).filter(item => item.balance > 0);
  
  if (debtors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 13px;">No hay alumnos con saldos deudores pendientes 🎉</td></tr>`;
    return;
  }
  
  tbody.innerHTML = debtors.map(item => {
    const s = item.student;
    const balanceVES = item.balance * tasaBCV;
    return `
      <tr>
        <td><span style="font-weight: 700; color: var(--color-text);">${escapeHTML(s.nombre)}</span></td>
        <td>${escapeHTML(item.courseName)}</td>
        <td><span style="font-family: monospace;">${escapeHTML(s.tel || 'No Reg.')}</span></td>
        <td style="text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="text-align: right; color: var(--color-success);">$${item.paid.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; color: var(--color-error);">$${item.balance.toFixed(2)}</td>
        <td style="text-align: right; color: var(--color-text-muted);">${balanceVES.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} VES</td>
        <td style="text-align: center; display: flex; gap: 6px; justify-content: center; align-items: center;">
          <button class="btn btn-secondary" onclick="sendWhatsAppPaymentReminder('${s.id}')" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.2); color: #25d366; cursor: pointer;">
            <i data-lucide="send" style="width: 12px; height: 12px;"></i> WhatsApp
          </button>
          <button class="btn btn-primary" onclick="openQuickPaymentModal('${s.id}')" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.2); color: #2196f3; cursor: pointer; height: auto;">
            <i data-lucide="dollar-sign" style="width: 12px; height: 12px;"></i> Abonar
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderSalesCoordinatorsPerformance() {
  const tbody = document.getElementById('sales-coordinators-performance-body');
  if (!tbody) return;

  const coordinatorsList = ["Admin CTD", ...asesores.map(a => a.nombre)];

  const stats = {};
  coordinatorsList.forEach(name => {
    stats[name] = {
      leads: 0,
      enrolled: 0,
      revenueUSD: 0
    };
  });

  alumnos.forEach(student => {
    if (!student.coordinador || !coordinatorsList.includes(student.coordinador)) {
      student.coordinador = "Admin CTD";
    }

    const coord = student.coordinador;
    stats[coord].leads++;
    if (student.etapa === 'Inscrito') {
      stats[coord].enrolled++;
      stats[coord].revenueUSD += (student.academicPaid || 0);
    }
  });

  const statsArray = Object.keys(stats).map(name => {
    const s = stats[name];
    const conversionRate = s.leads > 0 ? ((s.enrolled / s.leads) * 100).toFixed(1) : '0.0';
    return {
      name,
      leads: s.leads,
      enrolled: s.enrolled,
      revenueUSD: s.revenueUSD,
      revenueVES: s.revenueUSD * tasaBCV,
      conversionRate
    };
  });

  statsArray.sort((a, b) => b.revenueUSD - a.revenueUSD);

  tbody.innerHTML = statsArray.map(stat => {
    return `
      <tr>
        <td><strong>👥 ${escapeHTML(stat.name)}</strong></td>
        <td style="text-align: center; font-weight: 500;">${stat.leads}</td>
        <td style="text-align: center; font-weight: 600; color: var(--color-success);">${stat.enrolled}</td>
        <td style="text-align: right; font-weight: 700; color: var(--color-text);">$${stat.revenueUSD.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
        <td style="text-align: right; color: var(--color-text-muted);">${stat.revenueVES.toLocaleString('es-VE', {minimumFractionDigits: 2})} VES</td>
        <td style="text-align: right; font-weight: 700; color: var(--color-primary);">${stat.conversionRate}%</td>
      </tr>
    `;
  }).join('');
}

function syncHeaderProfile() {
  const userTextEl = document.getElementById('header-username');
  const userAvatarEl = document.getElementById('header-avatar');
  const sidebarUserEl = document.getElementById('sidebar-username');
  const sidebarAvatarEl = document.getElementById('sidebar-avatar');

  const initials = calculateInitials(username, 'AD');

  if (userTextEl) userTextEl.innerText = username;
  if (userAvatarEl) userAvatarEl.innerText = initials;
  if (sidebarUserEl) sidebarUserEl.innerText = username;
  if (sidebarAvatarEl) sidebarAvatarEl.innerText = initials;

  // Sync Academy branding in sidebar and login screen
  const loginTitleEl = document.querySelector('.login-logo-group h2');
  if (loginTitleEl) loginTitleEl.innerText = academyProfile.nombre || 'Academia CTD';

  const sidebarBrandEl = document.querySelector('.brand-name h4');
  if (sidebarBrandEl) sidebarBrandEl.innerText = academyProfile.nombre || 'Academia CTD';
  
  const sidebarSubBrandEl = document.querySelector('.brand-name span');
  if (sidebarSubBrandEl) sidebarSubBrandEl.innerText = academyProfile.eslogan || 'CRM Administrativo';
}

function updateSavedFiltersDropdown() {
  const select = document.getElementById('saved-filters-select');
  if (!select) return;
  
  let optionsHtml = '<option value="">-- Seleccionar vista --</option>';
  optionsHtml += Object.keys(customFilterViews).map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  
  select.innerHTML = optionsHtml;
  document.getElementById('delete-filter-btn-container').style.display = 'none';
}

function populateFilters() {
  const select = document.getElementById('filter-curso');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="">Todos los cursos</option>' + 
      cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
    if (currentVal && cursos.some(c => c.id === currentVal)) {
      select.value = currentVal;
    }
  }

  const cohortSelect = document.getElementById('filter-cohort');
  if (cohortSelect) {
    const currentVal = cohortSelect.value;
    cohortSelect.innerHTML = '<option value="">Todos los grupos</option>' + 
      cohortes.map(coh => `<option value="${coh.id}">${escapeHTML(coh.nombre)}</option>`).join('');
    if (currentVal && cohortes.some(coh => coh.id === currentVal)) {
      cohortSelect.value = currentVal;
    }
  }

  const pipeSelect = document.getElementById('pipeline-filter-curso');
  if (pipeSelect) {
    const pipeVal = pipeSelect.value;
    pipeSelect.innerHTML = '<option value="">Todos los cursos</option>' + 
      cursos.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
    if (pipeVal && cursos.some(c => c.id === pipeVal)) {
      pipeSelect.value = pipeVal;
    }
  }
}

function previewBulkWaMessage() {
  const selectTmpl = document.getElementById('bulk-wa-template-select');
  const previewBox = document.getElementById('bulk-wa-preview-box');
  if (!selectTmpl || !previewBox) return;

  const tmplId = selectTmpl.value;
  const tmpl = whatsappTemplates.find(t => t.id === tmplId);
  
  if (!tmpl) {
    previewBox.innerText = 'Selecciona una plantilla para ver la vista previa.';
    return;
  }

  let sampleName = 'Juan Pérez';
  let sampleCourse = 'Curso Ejemplo';
  let sampleDuration = '8 Semanas';
  let sampleTotal = 350;
  let samplePaid = 0;
  let sampleBalance = 350;

  if (bulkStudentList.length > 0) {
    const s = bulkStudentList[0];
    sampleName = `${s.nombre} ${s.apellido || ''}`.trim();
    const courseObj = cursos.find(c => c.id === s.curso);
    if (courseObj) {
      sampleCourse = courseObj.nombre;
      sampleDuration = courseObj.duracion;
      
      const defaultPrice = courseObj.precio;
      sampleTotal = s.academicPrice !== undefined ? s.academicPrice : defaultPrice;
      samplePaid = s.academicPaid || (s.payments ? s.payments.reduce((acc, p) => acc + p.amount, 0) : 0);
      sampleBalance = Math.max(0, sampleTotal - samplePaid);
    }
  }

  let text = tmpl.texto
    .replace(/{nombre}/g, sampleName)
    .replace(/{curso}/g, sampleCourse)
    .replace(/{precio}/g, sampleBalance)
    .replace(/{saldo}/g, sampleBalance)
    .replace(/{abonado}/g, samplePaid)
    .replace(/{total}/g, sampleTotal)
    .replace(/{duracion}/g, sampleDuration);

  previewBox.innerText = text;
}

function updateNotificationButton() {
  const badge = document.getElementById('bell-badge');
  const list = document.getElementById('notification-list');
  if (!badge || !list) return;

  const alerts = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Check pending/overdue tasks
  tareas.forEach(t => {
    if (!t.completed) {
      const isOverdue = t.dueDate && t.dueDate < todayStr;
      const isDueToday = t.dueDate === todayStr;
      if (isOverdue) {
        const student = t.studentId ? alumnos.find(a => a.id === t.studentId) : null;
        alerts.push({
          type: 'overdue-task',
          icon: 'clock',
          color: 'var(--color-error)',
          text: `Tarea Vencida: "${t.title}"`,
          studentId: t.studentId || null,
          studentName: student ? `${student.nombre} ${student.apellido || ''}` : 'Tarea General'
        });
      } else if (isDueToday) {
        const student = t.studentId ? alumnos.find(a => a.id === t.studentId) : null;
        alerts.push({
          type: 'due-today-task',
          icon: 'calendar',
          color: 'var(--color-warning)',
          text: `Tarea para Hoy: "${t.title}"`,
          studentId: t.studentId || null,
          studentName: student ? `${student.nombre} ${student.apellido || ''}` : 'Tarea General'
        });
      }
    }
  });

  // 2. Check student payment contact alerts (Alumnos en Riesgo de Cobro)
  alumnos.forEach(al => {
    if (al.etapa === 'Inscrito') {
      const courseObj = cursos.find(c => c.id === al.curso);
      const price = al.academicPrice !== undefined ? al.academicPrice : (courseObj ? courseObj.precio : 0);
      const paid = al.academicPaid || 0;
      const balance = price - paid;

      if (balance > 0) {
        const isDatePassed = al.nextContactDate && al.nextContactDate <= todayStr;
        if (isDatePassed) {
          alerts.push({
            type: 'collection-risk',
            icon: 'alert-triangle',
            color: '#fdab43',
            text: `Riesgo de Cobro: $${balance} pendiente (Contacto vencido)`,
            studentId: al.id,
            studentName: `${al.nombre} ${al.apellido || ''}`
          });
        }
      }
    }
  });

  // Render list
  if (alerts.length === 0) {
    list.innerHTML = `<p style="font-size: 12px; color: var(--color-text-muted); text-align: center; padding: 16px 0; margin: 0;">Sin alertas pendientes</p>`;
    badge.style.display = 'none';
    badge.innerText = '0';
  } else {
    badge.innerText = alerts.length;
    badge.style.display = 'flex';
    list.innerHTML = alerts.map(a => {
      const clickAction = a.studentId ? `handleNotificationClick('${a.studentId}')` : `document.getElementById('notification-dropdown').style.display='none'`;
      const cursorStyle = a.studentId ? 'cursor: pointer;' : 'cursor: default;';
      return `
        <div style="display: flex; gap: 10px; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); background: var(--color-surface); align-items: flex-start; ${cursorStyle} transition: background 0.2s;" onmouseover="this.style.background='var(--color-hover)'" onmouseout="this.style.background='var(--color-surface)'" onclick="${clickAction}">
          <div style="color: ${a.color}; margin-top: 2px;">
            <i data-lucide="${a.icon}" style="width: 16px; height: 16px;"></i>
          </div>
          <div style="flex-grow: 1; text-align: left;">
            <div style="font-size: 12px; font-weight: 600; color: var(--color-text); line-height: 1.3;">${escapeHTML(a.studentName)}</div>
            <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px; line-height: 1.3;">${escapeHTML(a.text)}</div>
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();

    // Push local notifications for newly loaded alerts
    if ("Notification" in window && Notification.permission === "granted") {
      alerts.forEach(a => {
        const alertKey = `${a.type}-${a.studentId}-${a.text}`;
        if (!notifiedAlerts.has(alertKey)) {
          notifiedAlerts.add(alertKey);
          if (typeof sendLocalNotification === 'function') {
            sendLocalNotification(
              a.studentName,
              a.text,
              a.studentId
            );
          }
        }
      });
    }
  }
}

function updateBCVHeaderDisplay() {
  const el = document.getElementById('header-bcv-rate-value');
  if (el) {
    el.innerText = tasaBCV.toFixed(2);
  }
  const labelEl = document.querySelector('#header-bcv-badge .bcv-label');
  if (labelEl) {
    const day = new Date().getDay();
    const isWeekend = (day === 0 || day === 6); // 0 = Sunday, 6 = Saturday
    labelEl.innerText = isWeekend ? "BCV (Lunes):" : "BCV:";
    
    // Add title attribute to explain if weekend
    const badge = document.getElementById('header-bcv-badge');
    if (badge) {
      badge.title = isWeekend 
        ? "Fines de semana se utiliza la tasa oficial del lunes siguiente publicada por el BCV." 
        : "Tasa oficial publicada por el Banco Central de Venezuela.";
    }
  }
}

