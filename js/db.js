// HYBRID PERSISTENCE ENGINE (INDEXEDDB & LOCALSTORAGE)

function initIndexedDB(callback) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = function(e) {
    const dbInstance = e.target.result;
    if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
      dbInstance.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = function(e) {
    db = e.target.result;
    if (callback) callback();
  };
  request.onerror = function() {
    console.error("IndexedDB blocked or disabled. Falling back strictly to LocalStorage.");
    if (callback) callback();
  };
}

function dbGet(key) {
  return new Promise((resolve) => {
    if (!db) {
      resolve(null);
      return;
    }
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch (err) {
      console.warn("IndexedDB read transaction failed:", err);
      resolve(null);
    }
  });
}

function dbSet(key, value) {
  return new Promise((resolve) => {
    if (!db) {
      resolve();
      return;
    }
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch (err) {
      console.warn("IndexedDB write transaction failed:", err);
      resolve();
    }
  });
}

async function loadState() {
  const sheetsUrl = localStorage.getItem("ctd_google_sheets_url") || "";
  const sheetsEnabled = localStorage.getItem("ctd_google_sheets_sync_enabled") === "true";
  let loadedFromCloud = false;

  if (sheetsEnabled && sheetsUrl) {
    try {
      const response = await fetch(sheetsUrl + "?action=load");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          cursos = (data.cursos && data.cursos.length > 0) ? data.cursos : [...defaultCourses];
          alumnos = data.alumnos || [];
          cohortes = data.cohortes || [];
          tareas = data.tareas || [];
          whatsappTemplates = (data.whatsappTemplates && data.whatsappTemplates.length > 0) ? data.whatsappTemplates : [...defaultTemplates];
          egresos = data.egresos || [];
          asesores = data.asesores || [];
          dias = (data.dias && data.dias.length > 0) ? data.dias : [...defaultDias];
          horarios = (data.horarios && data.horarios.length > 0) ? data.horarios : [...defaultHorarios];
          adminPassword = data.adminPassword || 'admin';
          username = data.username || 'Admin CTD';
          metaRecaudacion = data.metaRecaudacion || 2000;
          metaInscritos = data.metaInscritos || 10;
          if (data.academyProfile) academyProfile = data.academyProfile;
          
          saveStateLocalOnly();
          localStorage.setItem("ctd_last_sync_timestamp", Date.now().toString());
          loadedFromCloud = true;
          console.log("State hydrated from Google Sheets cloud.");
        }
      }
    } catch (e) {
      console.warn("Could not load state from Google Sheets cloud, falling back to local database:", e);
    }
  }

  if (!loadedFromCloud) {
    let storedCursos, storedAlumnos, storedActivities, storedTheme, storedTareas, storedTemplates, storedUsername, storedCohortes, storedEgresos, storedAsesores, storedAdminPassword, storedDias, storedHorarios;

    if (db) {
      storedCursos = await dbGet("ctd_cursos");
      storedAlumnos = await dbGet("ctd_alumnos");
      storedActivities = await dbGet("ctd_activities");
      storedTheme = await dbGet("ctd_theme");
      storedTareas = await dbGet("ctd_tareas");
      storedTemplates = await dbGet("ctd_templates");
      storedUsername = await dbGet("ctd_username");
      storedCohortes = await dbGet("ctd_cohortes");
      storedEgresos = await dbGet("ctd_egresos");
      storedAsesores = await dbGet("ctd_asesores");
      storedAdminPassword = await dbGet("ctd_admin_password");
      storedDias = await dbGet("ctd_dias");
      storedHorarios = await dbGet("ctd_horarios");
    }

    // Fallback to LocalStorage
    if (!storedCursos) storedCursos = localStorage.getItem("ctd_cursos");
    if (!storedAlumnos) storedAlumnos = localStorage.getItem("ctd_alumnos");
    if (!storedActivities) storedActivities = localStorage.getItem("ctd_activities");
    if (!storedTheme) storedTheme = localStorage.getItem("ctd_theme");
    if (!storedTareas) storedTareas = localStorage.getItem("ctd_tareas");
    if (!storedTemplates) storedTemplates = localStorage.getItem("ctd_templates");
    if (!storedUsername) storedUsername = localStorage.getItem("ctd_username");
    if (!storedCohortes) storedCohortes = localStorage.getItem("ctd_cohortes");
    if (!storedEgresos) storedEgresos = localStorage.getItem("ctd_egresos");
    if (!storedAsesores) storedAsesores = localStorage.getItem("ctd_asesores");
    if (!storedAdminPassword) storedAdminPassword = localStorage.getItem("ctd_admin_password");
    if (!storedDias) storedDias = localStorage.getItem("ctd_dias");
    if (!storedHorarios) storedHorarios = localStorage.getItem("ctd_horarios");

    cursos = storedCursos ? (typeof storedCursos === 'string' ? JSON.parse(storedCursos) : storedCursos) : [...defaultCourses];
    
    // Force course upgrades
    const storedCoursesVersion = localStorage.getItem("ctd_courses_ver");
    if (storedCoursesVersion !== "15_courses_v1") {
      cursos = [...defaultCourses];
      localStorage.setItem("ctd_courses_ver", "15_courses_v1");
    }

    alumnos = storedAlumnos ? (typeof storedAlumnos === 'string' ? JSON.parse(storedAlumnos) : storedAlumnos) : [...defaultStudents];
    activities = storedActivities ? (typeof storedActivities === 'string' ? JSON.parse(storedActivities) : storedActivities) : [...defaultActivities];
    cohortes = storedCohortes ? (typeof storedCohortes === 'string' ? JSON.parse(storedCohortes) : storedCohortes) : [];
    tareas = storedTareas ? (typeof storedTareas === 'string' ? JSON.parse(storedTareas) : storedTareas) : [];
    whatsappTemplates = storedTemplates ? (typeof storedTemplates === 'string' ? JSON.parse(storedTemplates) : storedTemplates) : [...defaultTemplates];
    username = storedUsername || 'Admin CTD';
    userRole = localStorage.getItem("ctd_user_role") || 'admin';
    egresos = storedEgresos ? (typeof storedEgresos === 'string' ? JSON.parse(storedEgresos) : storedEgresos) : [];
    asesores = storedAsesores ? (typeof storedAsesores === 'string' ? JSON.parse(storedAsesores) : storedAsesores) : [];
    dias = storedDias ? (typeof storedDias === 'string' ? JSON.parse(storedDias) : storedDias) : [...defaultDias];
    horarios = storedHorarios ? (typeof storedHorarios === 'string' ? JSON.parse(storedHorarios) : storedHorarios) : [...defaultHorarios];
    adminPassword = storedAdminPassword || 'admin';

    // Migration upgrade
    localStorage.setItem("ctd_op_intel_upgrade_v4", "done");

    // One-time database cleanup request to empty all demo records
    if (localStorage.getItem("crm_clean_slate_v1") !== "done") {
      alumnos = [];
      cohortes = [];
      activities = [];
      tareas = [];
      egresos = [];
      localStorage.setItem("crm_clean_slate_v1", "done");
    }
    
    saveStateLocalOnly();
  }

  if (typeof updateBCVHeaderDisplay === 'function') {
    updateBCVHeaderDisplay();
  }

  // SaaS Vertical translation hook
  const activeVertical = localStorage.getItem("saas_selected_vertical") || 'education';
  if (typeof applyVerticalTerminology === 'function') {
    applyVerticalTerminology(activeVertical);
  }

  const activeTheme = 'light';
  document.documentElement.setAttribute('data-theme', activeTheme);
  localStorage.setItem("ctd_theme", "light");
  if (typeof updateThemeIcon === 'function') {
    updateThemeIcon(activeTheme);
  }
}

let cloudSyncTimeout = null;

async function saveState() {
  saveStateLocalOnly();

  if (typeof updateNotificationButton === 'function') {
    updateNotificationButton();
  }

  const sheetsUrl = localStorage.getItem("ctd_google_sheets_url") || "";
  const sheetsEnabled = localStorage.getItem("ctd_google_sheets_sync_enabled") === "true";

  if (sheetsEnabled && sheetsUrl) {
    updateSyncIndicator("pending");

    if (cloudSyncTimeout) {
      clearTimeout(cloudSyncTimeout);
    }

    cloudSyncTimeout = setTimeout(() => {
      updateSyncIndicator("loading");
      fetch(sheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          state: {
            cursos,
            alumnos,
            cohortes,
            activities,
            tareas,
            whatsappTemplates,
            egresos,
            asesores,
            adminPassword,
            username,
            metaRecaudacion,
            metaInscritos,
            academyProfile,
            dias,
            horarios
          }
        })
      })
      .then(() => {
        localStorage.setItem("ctd_last_sync_timestamp", Date.now().toString());
        updateSyncIndicator("sync");
      })
      .catch(err => {
        console.warn("Background cloud sync failed:", err);
        updateSyncIndicator("error");
      });
    }, 4000); // 4 seconds debounce
  }
}

function exportBackupJSON() {
  const now = new Date();
  lastBackupDate = now.toLocaleDateString('es-VE') + ' ' + now.toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit'});
  localStorage.setItem('ctd_last_backup_timestamp', Date.now().toString());

  const data = {
    alumnos: alumnos,
    cursos: cursos,
    cohortes: cohortes,
    tareas: tareas,
    whatsappTemplates: whatsappTemplates,
    activities: activities,
    asesores: asesores,
    adminPassword: adminPassword,
    username: username,
    metaRecaudacion: metaRecaudacion,
    metaInscritos: metaInscritos,
    academyProfile: academyProfile,
    fetchBCVOnStartup: fetchBCVOnStartup,
    backupReminderFrequency: backupReminderFrequency,
    lastBackupDate: lastBackupDate,
    version: "ctd-crm-v4-backup"
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `ctd_crm_backup_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  saveState();
  if (typeof renderAjustesSettings === 'function') {
    renderAjustesSettings();
  }
  showToast('Copia de seguridad exportada con éxito.', 'success');
  logActivity('configuracion', 'Se exportó un respaldo completo de la base de datos.');
}

function importBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.alumnos || !data.cursos || !data.cohortes) {
        showToast('El archivo de respaldo no es válido o está incompleto.', 'error');
        return;
      }

      if (!confirm('⚠️ ¿Estás seguro de que deseas restaurar este respaldo? Se sobrescribirán todos tus datos actuales.')) {
        event.target.value = '';
        return;
      }

      alumnos = data.alumnos;
      cursos = data.cursos;
      cohortes = data.cohortes;
      tareas = data.tareas || [];
      whatsappTemplates = data.whatsappTemplates || [];
      activities = data.activities || [];
      asesores = data.asesores || [];
      adminPassword = data.adminPassword || 'admin';
      username = data.username || 'Admin CTD';
      metaRecaudacion = data.metaRecaudacion || 2000;
      metaInscritos = data.metaInscritos || 10;
      if (data.academyProfile) academyProfile = data.academyProfile;
      if (data.fetchBCVOnStartup !== undefined) fetchBCVOnStartup = data.fetchBCVOnStartup;
      if (data.backupReminderFrequency) backupReminderFrequency = data.backupReminderFrequency;
      if (data.lastBackupDate) lastBackupDate = data.lastBackupDate;

      saveState();
      event.target.value = '';
      if (typeof syncHeaderProfile === 'function') syncHeaderProfile();
      if (typeof renderAjustesSettings === 'function') renderAjustesSettings();
      showToast('Copia de seguridad restaurada con éxito.', 'success');
      logActivity('configuracion', 'Se restauró un respaldo completo de la base de datos.');

      if (typeof setView === 'function') {
        setView(activeView);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al procesar el archivo de respaldo.', 'error');
    }
  };
  reader.readAsText(file);
}

function dbClearAll() {
  return new Promise((resolve) => {
    if (!db) {
      resolve();
      return;
    }
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch (err) {
      console.warn("IndexedDB clear failed:", err);
      resolve();
    }
  });
}

// Google Sheets Synchronization Integration

let googleSheetsUrl = localStorage.getItem("ctd_google_sheets_url") || "";
let googleSheetsSyncEnabled = localStorage.getItem("ctd_google_sheets_sync_enabled") === "true";

function initGoogleSheetsUI() {
  const urlInput = document.getElementById("ajustes-sheets-url");
  const enabledCheckbox = document.getElementById("ajustes-sheets-enabled");
  const actionsDiv = document.getElementById("sheets-sync-actions");

  if (urlInput) urlInput.value = googleSheetsUrl;
  if (enabledCheckbox) enabledCheckbox.checked = googleSheetsSyncEnabled;
  if (actionsDiv) {
    actionsDiv.style.display = googleSheetsSyncEnabled ? "flex" : "none";
  }

  updateSyncIndicator();
}

function updateSyncIndicator(status = null) {
  const badge = document.getElementById("sheets-sync-status");
  if (!badge) return;

  if (!googleSheetsSyncEnabled || !googleSheetsUrl) {
    badge.innerText = "Desconectado";
    badge.style.background = "rgba(0,0,0,0.05)";
    badge.style.color = "var(--color-text-muted)";
    badge.style.borderColor = "var(--color-border)";
    return;
  }

  if (status === "sync") {
    badge.innerText = "Sincronizado";
    badge.style.background = "rgba(76, 175, 80, 0.15)";
    badge.style.color = "var(--color-success)";
    badge.style.borderColor = "rgba(76, 175, 80, 0.3)";
  } else if (status === "loading") {
    badge.innerText = "Sincronizando...";
    badge.style.background = "rgba(33, 150, 243, 0.15)";
    badge.style.color = "var(--color-primary)";
    badge.style.borderColor = "rgba(33, 150, 243, 0.3)";
  } else if (status === "pending") {
    badge.innerText = "Pendiente de guardar...";
    badge.style.background = "rgba(255, 152, 0, 0.15)";
    badge.style.color = "#ff9800";
    badge.style.borderColor = "rgba(255, 152, 0, 0.3)";
  } else if (status === "error") {
    badge.innerText = "Error de Conexión";
    badge.style.background = "rgba(244, 67, 54, 0.15)";
    badge.style.color = "var(--color-error)";
    badge.style.borderColor = "rgba(244, 67, 54, 0.3)";
  } else {
    const lastSync = localStorage.getItem("ctd_last_sync_timestamp");
    if (lastSync) {
      const date = new Date(parseInt(lastSync));
      badge.innerText = `Último sync: ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      badge.style.background = "rgba(33, 150, 243, 0.15)";
      badge.style.color = "var(--color-primary)";
      badge.style.borderColor = "rgba(33, 150, 243, 0.3)";
    } else {
      badge.innerText = "Pendiente";
      badge.style.background = "rgba(255, 152, 0, 0.15)";
      badge.style.color = "#ff9800";
      badge.style.borderColor = "rgba(255, 152, 0, 0.3)";
    }
  }
}

function saveGoogleSheetsSettings() {
  const urlVal = document.getElementById("ajustes-sheets-url").value.trim();
  if (urlVal && !urlVal.startsWith("https://script.google.com/")) {
    showToast("URL inválida. Debe ser una URL de Google Apps Script Web App.", "error");
    return;
  }

  googleSheetsUrl = urlVal;
  localStorage.setItem("ctd_google_sheets_url", googleSheetsUrl);
  showToast("URL de Google Sheets guardada con éxito.", "success");
  
  if (googleSheetsUrl && googleSheetsSyncEnabled) {
    syncCloudNow("pull");
  } else {
    updateSyncIndicator();
  }
}

function toggleGoogleSheetsSync() {
  const enabled = document.getElementById("ajustes-sheets-enabled").checked;
  
  if (enabled && !googleSheetsUrl) {
    showToast("Por favor, ingresa primero una URL de Google Apps Script.", "error");
    document.getElementById("ajustes-sheets-enabled").checked = false;
    return;
  }

  googleSheetsSyncEnabled = enabled;
  localStorage.setItem("ctd_google_sheets_sync_enabled", enabled ? "true" : "false");
  
  const actionsDiv = document.getElementById("sheets-sync-actions");
  if (actionsDiv) {
    actionsDiv.style.display = enabled ? "flex" : "none";
  }

  updateSyncIndicator();
  if (enabled) {
    syncCloudNow("pull");
  }
}

async function syncCloudNow(direction) {
  if (!googleSheetsUrl) {
    showToast("Conexión no configurada.", "error");
    return;
  }

  updateSyncIndicator();
  showToast(direction === "pull" ? "Descargando datos desde la nube..." : "Subiendo datos a la nube...", "info");

  try {
    if (direction === "pull") {
      const response = await fetch(googleSheetsUrl + "?action=load");
      if (!response.ok) throw new Error("HTTP error " + response.status);
      const data = await response.json();

      if (data) {
        // Safe check: if cloud has no courses, but local CRM has courses, auto-push to initialize cloud instead of wiping out!
        const isCloudEmpty = (!data.cursos || data.cursos.length === 0);
        if (isCloudEmpty && (cursos.length > 0 || alumnos.length > 0)) {
          console.log("Detectado Google Sheets vacío. Inicializando con base de datos local...");
          showToast("Inicializando Google Sheets con datos locales...", "info");
          await syncCloudNow("push");
          return;
        }

        if (data.cursos) cursos = data.cursos;
        if (data.alumnos) alumnos = data.alumnos;
        if (data.cohortes) cohortes = data.cohortes;
        if (data.tareas) tareas = data.tareas;
        if (data.whatsappTemplates) whatsappTemplates = data.whatsappTemplates;
        if (data.egresos) egresos = data.egresos;
        if (data.asesores) asesores = data.asesores;
        if (data.dias) dias = data.dias;
        if (data.horarios) horarios = data.horarios;
        if (data.adminPassword) adminPassword = data.adminPassword;
        if (data.username) username = data.username;
        if (data.metaRecaudacion) metaRecaudacion = data.metaRecaudacion;
        if (data.metaInscritos) metaInscritos = data.metaInscritos;
        if (data.academyProfile) academyProfile = data.academyProfile;
        
        saveStateLocalOnly(); // avoid loops
        
        localStorage.setItem("ctd_last_sync_timestamp", Date.now().toString());
        updateSyncIndicator("sync");
        showToast("Datos sincronizados desde la nube.", "success");
        
        if (typeof setView === "function") setView(activeView);
      }
    } else {
      // push
      const stateObj = {
        cursos,
        alumnos,
        cohortes,
        activities,
        tareas,
        whatsappTemplates,
        egresos,
        asesores,
        adminPassword,
        username,
        metaRecaudacion,
        metaInscritos,
        academyProfile,
        dias,
        horarios
      };

      const response = await fetch(googleSheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", state: stateObj })
      });

      localStorage.setItem("ctd_last_sync_timestamp", Date.now().toString());
      updateSyncIndicator("sync");
      showToast("Datos guardados en la nube.", "success");
    }
  } catch (err) {
    console.error("Cloud sync failed:", err);
    updateSyncIndicator("error");
    showToast("Error de comunicación con Google Sheets. Usando almacenamiento local.", "error");
  }
}

// Separate local-only saving to prevent infinite loop on cloud sync pull
function saveStateLocalOnly() {
  try {
    localStorage.setItem("ctd_theme", "light");
    localStorage.setItem("ctd_username", username);
    localStorage.setItem("ctd_alumnos", JSON.stringify(alumnos));
    localStorage.setItem("ctd_cursos", JSON.stringify(cursos));
    localStorage.setItem("ctd_cohortes", JSON.stringify(cohortes));
    localStorage.setItem("ctd_activities", JSON.stringify(activities));
    localStorage.setItem("ctd_tareas", JSON.stringify(tareas));
    localStorage.setItem("ctd_templates", JSON.stringify(whatsappTemplates));
    localStorage.setItem("ctd_egresos", JSON.stringify(egresos));
    localStorage.setItem("ctd_asesores", JSON.stringify(asesores));
    localStorage.setItem("ctd_dias", JSON.stringify(dias));
    localStorage.setItem("ctd_horarios", JSON.stringify(horarios));
    localStorage.setItem("ctd_admin_password", adminPassword);
    localStorage.setItem("ctd_academy_profile", JSON.stringify(academyProfile));
    localStorage.setItem("ctd_fetch_bcv_startup", fetchBCVOnStartup);
    localStorage.setItem("ctd_backup_freq", backupReminderFrequency);
    localStorage.setItem("ctd_last_backup_date", lastBackupDate);
  } catch (e) {
    console.warn("LocalStorage quota exceeded. CRM will continue using IndexedDB storage natively.", e);
  }

  if (db) {
    dbSet("ctd_cursos", cursos);
    dbSet("ctd_alumnos", alumnos);
    dbSet("ctd_cohortes", cohortes);
    dbSet("ctd_activities", activities);
    dbSet("ctd_theme", "light");
    dbSet("ctd_tareas", tareas);
    dbSet("ctd_templates", whatsappTemplates);
    dbSet("ctd_username", username);
    dbSet("ctd_egresos", egresos);
    dbSet("ctd_asesores", asesores);
    dbSet("ctd_dias", dias);
    dbSet("ctd_horarios", horarios);
    dbSet("ctd_admin_password", adminPassword);
  }
}
