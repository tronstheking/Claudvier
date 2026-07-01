// DICCIONARIOS DE VERTICALES PARA EL SAAS DOCK
const verticalsConfig = {
  education: {
    brandNameDefault: "Academia CTD",
    brandSub: "CRM Educativo",
    clientLabel: "Alumnos",
    clientSingular: "Alumno",
    offeringLabel: "Mis Cursos",
    offeringSingular: "Curso",
    groupLabel: "Cohortes / Grupos",
    groupSingular: "Cohorte",
    newClientBtn: "Nuevo Alumno",
    kpiDebtSub: "Deuda de alumnos",
    kpiTotalRec: "Ingresos Recaudados",
    kpiProjectedSub: "Total esperado"
  },
  medical: {
    brandNameDefault: "MedFlow Clinic",
    brandSub: "CRM de Gestión Médica",
    clientLabel: "Pacientes",
    clientSingular: "Paciente",
    offeringLabel: "Tratamientos",
    offeringSingular: "Tratamiento",
    groupLabel: "Especialistas / Turnos",
    groupSingular: "Especialista",
    newClientBtn: "Nuevo Paciente",
    kpiDebtSub: "Saldos por consultas",
    kpiTotalRec: "Honorarios Recaudados",
    kpiProjectedSub: "Proyección de facturas"
  },
  fitness: {
    brandNameDefault: "GymForce SaaS",
    brandSub: "CRM de Fitness y Box",
    clientLabel: "Miembros",
    clientSingular: "Miembro",
    offeringLabel: "Membresías",
    offeringSingular: "Plan / Membresía",
    groupLabel: "Clases / Entrenadores",
    groupSingular: "Clase",
    newClientBtn: "Nuevo Miembro",
    kpiDebtSub: "Membresías vencidas",
    kpiTotalRec: "Cuotas Recaudadas",
    kpiProjectedSub: "Suscripciones activas"
  },
  real_estate: {
    brandNameDefault: "Apex Inmobiliaria",
    brandSub: "CRM de Gestión Propiedades",
    clientLabel: "Clientes / Leads",
    clientSingular: "Cliente",
    offeringLabel: "Propiedades",
    offeringSingular: "Propiedad",
    groupLabel: "Zonas / Asesores",
    groupSingular: "Asesor",
    newClientBtn: "Nuevo Cliente",
    kpiDebtSub: "Comisiones pendientes",
    kpiTotalRec: "Comisiones Cobradas",
    kpiProjectedSub: "Cierre de ventas"
  }
};

function applyVerticalTerminology(vertical) {
  const activeVertical = vertical || localStorage.getItem("saas_selected_vertical") || "education";
  const config = verticalsConfig[activeVertical] || verticalsConfig.education;
  
  // Custom business name or vertical default
  const customCompanyName = localStorage.getItem("saas_company_name") || config.brandNameDefault;

  console.log(`[SaaS Engine] Applying vertical theme: ${activeVertical} for ${customCompanyName}`);

  // 1. Update brand name & subtitles
  document.querySelectorAll("[data-translate='brandName']").forEach(el => {
    el.textContent = customCompanyName;
  });
  document.querySelectorAll("[data-translate='brandSub']").forEach(el => {
    el.textContent = config.brandSub;
  });

  // 2. Translate other marked elements
  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    if (key !== "brandName" && key !== "brandSub" && config[key]) {
      el.textContent = config[key];
    }
  });

  // 3. Dynamic input updates
  const searchInput = document.getElementById("alumno-search");
  if (searchInput) {
    searchInput.placeholder = `Buscar por nombre, email o ${config.clientSingular.toLowerCase()}...`;
  }
  
  const globalSearchInput = document.getElementById("global-search");
  if (globalSearchInput) {
    globalSearchInput.placeholder = `Buscar ${config.clientSingular.toLowerCase()}, ${config.offeringSingular.toLowerCase()} o notas...`;
  }

  // 4. Update window title
  document.title = `${customCompanyName} - CRM SaaS`;

  // 5. Update avatar initials
  const initials = customCompanyName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const avatarElements = ["sidebar-avatar", "header-avatar"];
  avatarElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });

  // 6. Sidebar profile names
  const profileNameElements = ["sidebar-username", "header-username"];
  profileNameElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = localStorage.getItem("saas_username") || "Administrador";
  });
}
