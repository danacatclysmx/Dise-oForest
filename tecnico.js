// Variables globales
let currentSection = "conglomerados";
let conglomerados = [];
let muestras = [];
let rutas = [];
let papelera = [];

// Referencias DOM
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section");

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  setupEventListeners();
  generateSampleCode();
  lucide.createIcons();
});

// Configurar event listeners
function setupEventListeners() {
  // Toggle sidebar
  menuToggle.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", closeSidebar);

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      switchSection(section);
    });
  });

  // Botón de logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Formulario de muestras
  const formulario = document.getElementById("formulario-muestra");
  if (formulario) {
    formulario.addEventListener("submit", handleSubmitMuestra);
  }

  // Botón nueva ruta
  const btnNuevaRuta = document.getElementById("btn-nueva-ruta");
  if (btnNuevaRuta) {
    btnNuevaRuta.addEventListener("click", abrirModalNuevaRuta);
  }

  // Modales
  setupModalEventListeners();

  // Cerrar sidebar al hacer clic en enlaces
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      closeSidebar();
    }
  });
}

// Event listeners para modales
function setupModalEventListeners() {
  // Modal nueva ruta
  const modalNuevaRuta = document.getElementById("modal-nueva-ruta");
  const closeModalRuta = document.getElementById("close-modal-ruta");
  const cancelRuta = document.getElementById("cancel-ruta");
  const formNuevaRuta = document.getElementById("form-nueva-ruta");

  if (closeModalRuta)
    closeModalRuta.addEventListener("click", () =>
      cerrarModal("modal-nueva-ruta")
    );
  if (cancelRuta)
    cancelRuta.addEventListener("click", () => cerrarModal("modal-nueva-ruta"));
  if (formNuevaRuta)
    formNuevaRuta.addEventListener("submit", handleSubmitNuevaRuta);

  // Modal actualizar estado
  const closeModalEstado = document.getElementById("close-modal-estado");
  const cancelEstado = document.getElementById("cancel-estado");
  const formActualizarEstado = document.getElementById(
    "form-actualizar-estado"
  );

  if (closeModalEstado)
    closeModalEstado.addEventListener("click", () =>
      cerrarModal("modal-actualizar-estado")
    );
  if (cancelEstado)
    cancelEstado.addEventListener("click", () =>
      cerrarModal("modal-actualizar-estado")
    );
  if (formActualizarEstado)
    formActualizarEstado.addEventListener(
      "submit",
      handleSubmitActualizarEstado
    );
}

// Funciones del sidebar
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");
  menuToggle.classList.toggle("open");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
  menuToggle.classList.remove("open");
}

// Cambiar sección
function switchSection(sectionName) {
  // Actualizar navegación
  navItems.forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.section === sectionName) {
      item.classList.add("active");
    }
  });

  // Actualizar secciones
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  currentSection = sectionName;
  loadSectionData(sectionName);
  closeSidebar();
}

// Cargar datos de localStorage
function loadData() {
  const savedConglomerados = localStorage.getItem("conglomerados");
  const savedMuestras = localStorage.getItem("muestras");
  const savedRutas = localStorage.getItem("rutas");
  const savedPapelera = localStorage.getItem("papelera");

  if (savedConglomerados) conglomerados = JSON.parse(savedConglomerados);
  if (savedMuestras) muestras = JSON.parse(savedMuestras);
  if (savedRutas) rutas = JSON.parse(savedRutas);
  if (savedPapelera) papelera = JSON.parse(savedPapelera);

  // Datos de ejemplo para conglomerados si no existen
  if (conglomerados.length === 0) {
    conglomerados = [
      {
        id: "cong1",
        nombre: "Conglomerado Amazonas Norte",
        departamento: "Amazonas",
        municipio: "Leticia",
        estado: "aprobado",
      },
      {
        id: "cong2",
        nombre: "Conglomerado Chocó Sur",
        departamento: "Chocó",
        municipio: "Quibdó",
        estado: "aprobado",
      },
    ];
    saveToLocalStorage();
  }

  // Datos de ejemplo para rutas si no existen
  if (rutas.length === 0) {
    rutas = [
      {
        id: "ruta1",
        codigo: "MSTR-001",
        conglomerado: "CONG-001",
        fecha: "15/06/2023",
        estado: 1,
        fechaRecoleccion: "10/06/2023",
      },
    ];
    saveToLocalStorage();
  }

  loadSectionData(currentSection);
}

// Cargar datos de sección específica
function loadSectionData(sectionName) {
  switch (sectionName) {
    case "conglomerados":
      renderConglomerados();
      break;
    case "muestras":
      renderMuestras();
      cargarConglomeradosEnSelect();
      break;
    case "rutas":
      renderRutas();
      break;
    case "papelera":
      renderPapelera();
      break;
  }
}
// muestre los conglomerados correctamente
function cargarConglomeradosEnSelect() {
  const select = document.getElementById("conglomeradoAsociado");
  if (select) {
    // Limpiar opciones existentes
    select.innerHTML = '<option value="">Seleccionar Conglomerado</option>';

    // Verificar si hay conglomerados
    if (conglomerados.length === 0) {
      console.log("No hay conglomerados disponibles");

      // Intentar cargar conglomerados desde localStorage global (compartido con jefe)
      const jefeConglomerados = localStorage.getItem("jefeConglomerados");
      if (jefeConglomerados) {
        try {
          const conglomeradosJefe = JSON.parse(jefeConglomerados);
          // Filtrar solo los aprobados
          const aprobados = conglomeradosJefe.filter(
            (c) => c.estado === "APROBADOS" || c.estado === "aprobados"
          );

          if (aprobados.length > 0) {
            // Actualizar nuestros conglomerados con los del jefe
            conglomerados = aprobados.map((c) => ({
              id: c.id || c.codigo,
              nombre: c.nombre || c.codigo || "Conglomerado " + c.id,
              departamento: c.departamento,
              municipio: c.municipio,
              estado: "aprobado",
              ubicacion: c.coordenadas || c.ubicacion,
            }));
            saveToLocalStorage();
            console.log("Conglomerados cargados desde jefe:", conglomerados);
          }
        } catch (e) {
          console.error("Error al cargar conglomerados del jefe:", e);
        }
      }

      // Si aún no hay conglomerados, agregar el de ejemplo
      if (conglomerados.length === 0) {
        // Agregar el conglomerado que vemos en la imagen
        conglomerados.push({
          id: "CONG_32361",
          nombre: "CONG_32361",
          departamento: "Meta",
          municipio: "Cubarral",
          estado: "aprobado",
          ubicacion: "3.909747, -74.128876",
        });
        saveToLocalStorage();
      }
    }

    // Ahora agregar las opciones al select
    conglomerados.forEach((conglomerado) => {
      const option = document.createElement("option");
      option.value = conglomerado.id;
      // Usar el nombre o el ID si no hay nombre
      option.textContent =
        conglomerado.nombre || conglomerado.id || "Sin nombre";
      select.appendChild(option);
    });

    console.log(
      "Opciones de conglomerado cargadas:",
      select.options.length - 1
    );
  } else {
    console.error("No se encontró el elemento select de conglomerados");
  }
}

// Renderizar conglomerados
function renderConglomerados() {
  const emptyState = document.getElementById("conglomerados-empty");
  const grid = document.getElementById("conglomerados-grid");

  if (conglomerados.length === 0) {
    emptyState.style.display = "block";
    grid.style.display = "none";
  } else {
    emptyState.style.display = "none";
    grid.style.display = "grid";

    grid.innerHTML = conglomerados
      .map(
        (conglomerado) => `
            <div class="card">
                <div class="card-header">
                    <h3>${
                      conglomerado.nombre || conglomerado.id || "Sin nombre"
                    }</h3>
                </div>
                <div class="card-content">
                    <p><strong>Departamento:</strong> ${
                      conglomerado.departamento || "No especificado"
                    }</p>
                    <p><strong>Municipio:</strong> ${
                      conglomerado.municipio || "No especificado"
                    }</p>
                    <p><strong>ID:</strong> ${
                      conglomerado.id || "No especificado"
                    }</p>
                    <div class="badge">${
                      conglomerado.estado || "pendiente"
                    }</div>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-secondary btn-sm" onclick="verDetalles('${
                          conglomerado.id
                        }', 'conglomerado')">
                            <i data-lucide="eye"></i>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    lucide.createIcons();
  }
}
// Renderizar muestras
function renderMuestras() {
  const listContainer = document.getElementById("muestras-list");

  if (muestras.length === 0) {
    listContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="test-tube" class="empty-icon"></i>
                <p>No hay muestras registradas</p>
            </div>
        `;
  } else {
    listContainer.innerHTML = muestras
      .map((muestra) => {
        const conglomerado = conglomerados.find(
          (c) => c.id === muestra.conglomerado
        );
        return `
                <div class="muestra-item">
                    <div class="muestra-header">
                        <div class="muestra-info">
                            <h4>${muestra.codigo}</h4>
                            <p><strong>Conglomerado:</strong> ${
                              conglomerado
                                ? conglomerado.nombre
                                : muestra.conglomerado
                            }</p>
                            <p><strong>Fecha:</strong> ${new Date(
                              muestra.fechaRecoleccion
                            ).toLocaleDateString()}</p>
                            <div class="muestra-badges">
                                ${muestra.analisis
                                  .map(
                                    (analisis) =>
                                      `<span class="badge">${analisis}</span>`
                                  )
                                  .join("")}
                            </div>
                        </div>
                        <button class="btn btn-destructive btn-sm" onclick="eliminarMuestra('${
                          muestra.id
                        }')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  lucide.createIcons();
}

// Renderizar rutas
function renderRutas() {
  const emptyState = document.getElementById("rutas-empty");
  const grid = document.getElementById("rutas-grid");

  if (rutas.length === 0) {
    emptyState.style.display = "block";
    grid.style.display = "none";
  } else {
    emptyState.style.display = "none";
    grid.style.display = "grid";

    grid.innerHTML = rutas
      .map((ruta) => {
        const estadoInfo = getEstadoRuta(ruta.estado);
        return `
                <div class="ruta-card">
                    <div class="ruta-header">
                        <div class="ruta-info">
                            <h3>Muestra: ${ruta.codigo}</h3>
                            <p><strong>Conglomerado:</strong> ${
                              ruta.conglomerado
                            }</p>
                            <p><strong>Fecha:</strong> ${ruta.fecha}</p>
                        </div>
                        <div class="ruta-status ${estadoInfo.class}">${
          estadoInfo.label
        }</div>
                    </div>
                    
                    <div class="proceso-envio">
                        <h4>Proceso de Envío</h4>
                        <div class="etapas-container">
                            <div class="etapas-line"></div>
                            ${[
                              "Recolectada",
                              "Empacada",
                              "En Ruta",
                              "Entregada",
                            ]
                              .map(
                                (etapa, index) => `
                                <div class="etapa">
                                    <div class="etapa-circulo ${
                                      index <= ruta.estado
                                        ? "activa"
                                        : "inactiva"
                                    }">
                                        ${index + 1}
                                    </div>
                                    <div class="etapa-texto">${etapa}</div>
                                    ${getFechaEtapa(ruta, index)}
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                    
                    <div class="ruta-actions">
                        <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="abrirModalActualizarEstado('${
                          ruta.id
                        }')">
                            Actualizar Estado
                        </button>
                        <button class="btn btn-destructive btn-sm" onclick="eliminarItem('${
                          ruta.id
                        }', 'ruta')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    lucide.createIcons();
  }
}

// Renderizar papelera
function renderPapelera() {
  const emptyState = document.getElementById("papelera-empty");
  const grid = document.getElementById("papelera-grid");

  if (papelera.length === 0) {
    emptyState.style.display = "block";
    grid.style.display = "none";
  } else {
    emptyState.style.display = "none";
    grid.style.display = "grid";

    grid.innerHTML = papelera
      .map(
        (item) => `
            <div class="card" style="border: 1px solid #fecaca; background-color: #fef2f2;">
                <div class="card-header">
                    <h3>
                        <i data-lucide="trash-2" style="color: #dc2626;"></i>
                        ${getTitleFromItem(item)}
                    </h3>
                </div>
                <div class="card-content">
                    <div class="badge badge-destructive">${item.tipo}</div>
                    ${getItemDetails(item)}
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-secondary btn-sm" onclick="restaurarItem('${
                          item.id
                        }')" style="width: 100%;">
                            <i data-lucide="rotate-ccw"></i>
                            Restaurar
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    lucide.createIcons();
  }
}

// Funciones de modales
function abrirModalNuevaRuta() {
  const modal = document.getElementById("modal-nueva-ruta");
  const select = document.getElementById("muestra-select");

  // Cargar muestras disponibles (que no tengan ruta ya)
  const muestrasDisponibles = muestras.filter(
    (muestra) => !rutas.some((ruta) => ruta.muestraId === muestra.id)
  );

  select.innerHTML = '<option value="">Seleccionar muestra para envío</option>';
  muestrasDisponibles.forEach((muestra) => {
    const conglomerado = conglomerados.find(
      (c) => c.id === muestra.conglomerado
    );
    const option = document.createElement("option");
    option.value = muestra.id;
    option.textContent = `${muestra.codigo} - ${
      conglomerado ? conglomerado.nombre : "Sin conglomerado"
    }`;
    select.appendChild(option);
  });

  // Establecer fecha actual
  document.getElementById("fecha-envio").value = new Date()
    .toISOString()
    .split("T")[0];

  modal.style.display = "flex";
}

function abrirModalActualizarEstado(rutaId) {
  const modal = document.getElementById("modal-actualizar-estado");
  const ruta = rutas.find((r) => r.id === rutaId);

  if (ruta) {
    document.getElementById("ruta-id-estado").value = rutaId;
    document.getElementById("nuevo-estado").value = ruta.estado;
    document.getElementById("fecha-actualizacion").value = new Date()
      .toISOString()
      .split("T")[0];

    modal.style.display = "flex";
  }
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "none";
}

// Manejar envío de nueva ruta
function handleSubmitNuevaRuta(e) {
  e.preventDefault();

  const muestraId = document.getElementById("muestra-select").value;
  const fechaEnvio = document.getElementById("fecha-envio").value;

  const muestra = muestras.find((m) => m.id === muestraId);
  const conglomerado = conglomerados.find((c) => c.id === muestra.conglomerado);

  const nuevaRuta = {
    id: Date.now().toString(),
    codigo: muestra.codigo,
    muestraId: muestraId,
    conglomerado: conglomerado ? conglomerado.nombre : "Sin conglomerado",
    fecha: fechaEnvio,
    estado: 0,
    fechaRecoleccion: muestra.fechaRecoleccion,
  };

  rutas.push(nuevaRuta);
  saveToLocalStorage();
  renderRutas();
  cerrarModal("modal-nueva-ruta");

  alert("Ruta creada correctamente");
}

// Manejar actualización de estado
function handleSubmitActualizarEstado(e) {
  e.preventDefault();

  const rutaId = document.getElementById("ruta-id-estado").value;
  const nuevoEstado = parseInt(document.getElementById("nuevo-estado").value);
  const fechaActualizacion = document.getElementById(
    "fecha-actualizacion"
  ).value;

  const ruta = rutas.find((r) => r.id === rutaId);
  if (ruta) {
    ruta.estado = nuevoEstado;

    // Actualizar fechas según el estado
    switch (nuevoEstado) {
      case 1:
        ruta.fechaEnvio = fechaActualizacion;
        break;
      case 2:
        ruta.fechaEnRuta = fechaActualizacion;
        break;
      case 3:
        ruta.fechaEntrega = fechaActualizacion;
        break;
    }

    saveToLocalStorage();
    renderRutas();
    cerrarModal("modal-actualizar-estado");

    alert("Estado actualizado correctamente");
  }
}

// Funciones auxiliares
function getEstadoRuta(estado) {
  const estados = [
    { label: "Recolectada", class: "status-recolectada" },
    { label: "Empacada", class: "status-empacada" },
    { label: "En Ruta", class: "status-en-ruta" },
    { label: "Entregada", class: "status-entregada" },
  ];
  return estados[estado] || estados[0];
}

function getFechaEtapa(ruta, index) {
  const fechas = [
    ruta.fechaRecoleccion,
    ruta.fechaEnvio,
    ruta.fechaEnRuta,
    ruta.fechaEntrega,
  ];

  return fechas[index] ? `<div class="etapa-fecha">${fechas[index]}</div>` : "";
}

function getTitleFromItem(item) {
  if (item.tipo === "conglomerado") {
    return item.nombre || "Sin nombre";
  } else if (item.tipo === "muestra") {
    return item.codigo;
  } else if (item.tipo === "ruta") {
    return `Muestra: ${item.codigo}`;
  }
  return "Item";
}

function getItemDetails(item) {
  if (item.tipo === "conglomerado") {
    return `
            <p><strong>Departamento:</strong> ${
              item.departamento || "No especificado"
            }</p>
            <p><strong>Municipio:</strong> ${
              item.municipio || "No especificado"
            }</p>
        `;
  } else if (item.tipo === "muestra") {
    const conglomerado = conglomerados.find((c) => c.id === item.conglomerado);
    return `<p><strong>Conglomerado:</strong> ${
      conglomerado ? conglomerado.nombre : "Sin conglomerado"
    }</p>`;
  } else if (item.tipo === "ruta") {
    return `
            <p><strong>Conglomerado:</strong> ${item.conglomerado}</p>
            <p><strong>Fecha:</strong> ${item.fecha}</p>
        `;
  }
  return "";
}

// Generar código de muestra
function generateSampleCode() {
  const codigoInput = document.getElementById("codigoMuestra");
  if (codigoInput) {
    codigoInput.value =
      "MUES_" + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

// Manejar envío del formulario de muestras
function handleSubmitMuestra(e) {
  e.preventDefault();

  const analisisCheckboxes = document.querySelectorAll(
    'input[name="analisis"]:checked'
  );
  const analisis = Array.from(analisisCheckboxes).map((cb) => cb.value);

  const nuevaMuestra = {
    id: Date.now().toString(),
    codigo: document.getElementById("codigoMuestra").value,
    conglomerado: document.getElementById("conglomeradoAsociado").value,
    subparcela: document.getElementById("subparcela").value,
    fechaRecoleccion: document.getElementById("fechaRecoleccion").value,
    azimut: Number(document.getElementById("azimut").value),
    distancia: Number(document.getElementById("distancia").value),
    profundidad: Number(document.getElementById("profundidad").value),
    colorSuelo: document.getElementById("colorSuelo").value,
    pesoFresco: Number(document.getElementById("pesoFresco").value),
    analisis: analisis,
    observaciones: document.getElementById("observaciones").value,
    fechaRegistro: new Date().toISOString(),
  };

  muestras.push(nuevaMuestra);
  saveToLocalStorage();

  // Resetear formulario
  e.target.reset();
  generateSampleCode();

  // Actualizar vista
  renderMuestras();

  alert("Muestra registrada correctamente");
}

// Función para manejar el logout
function handleLogout() {
  if (confirm("¿Estás seguro que deseas cerrar sesión?")) {
    window.location.href = "login.html";
  }
}

// Funciones de acciones
function verDetalles(id, tipo) {
  alert(`Ver detalles del ${tipo} con ID: ${id}`);
}

function eliminarMuestra(id) {
  if (confirm("¿Estás seguro de eliminar esta muestra?")) {
    const muestra = muestras.find((m) => m.id === id);
    if (muestra) {
      muestra.tipo = "muestra";
      papelera.push(muestra);
      muestras = muestras.filter((m) => m.id !== id);
      saveToLocalStorage();
      renderMuestras();
    }
  }
}

function eliminarItem(id, tipo) {
  if (!confirm(`¿Estás seguro de eliminar este ${tipo}?`)) return;

  let item;
  if (tipo === "conglomerado") {
    item = conglomerados.find((c) => c.id === id);
    conglomerados = conglomerados.filter((c) => c.id !== id);
  } else if (tipo === "muestra") {
    item = muestras.find((m) => m.id === id);
    muestras = muestras.filter((m) => m.id !== id);
  } else if (tipo === "ruta") {
    item = rutas.find((r) => r.id === id);
    rutas = rutas.filter((r) => r.id !== id);
  }

  if (item) {
    item.tipo = tipo;
    papelera.push(item);
    saveToLocalStorage();
    loadSectionData(currentSection);
  }
}

function restaurarItem(id) {
  const item = papelera.find((i) => i.id === id);
  if (!item) return;

  if (item.tipo === "conglomerado") {
    conglomerados.push(item);
  } else if (item.tipo === "muestra") {
    muestras.push(item);
  } else if (item.tipo === "ruta") {
    rutas.push(item);
  }

  papelera = papelera.filter((i) => i.id !== id);
  saveToLocalStorage();
  renderPapelera();
}

// Guardar en localStorage
function saveToLocalStorage() {
  localStorage.setItem("conglomerados", JSON.stringify(conglomerados));
  localStorage.setItem("muestras", JSON.stringify(muestras));
  localStorage.setItem("rutas", JSON.stringify(rutas));
  localStorage.setItem("papelera", JSON.stringify(papelera));
}
