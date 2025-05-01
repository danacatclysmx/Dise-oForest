// Variables globales
const muestrasSection = document.getElementById("muestrasSection");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const createButton = document.getElementById("createButton");
const statusTabs = document.getElementById("statusTabs");
const mainTitle = document.getElementById("mainTitle");
const conglomeradosContainer = document.getElementById(
  "conglomeradosContainer"
);
const rutasSection = document.getElementById("rutasSection");
const rutasContainer = document.getElementById("rutasContainer");

// Datos almacenados localmente
let conglomerados = JSON.parse(localStorage.getItem("conglomerados")) || [];
let muestras = JSON.parse(localStorage.getItem("muestras")) || [];
let rutas = JSON.parse(localStorage.getItem("rutas")) || [];
let papelera = JSON.parse(localStorage.getItem("papelera")) || [];
let currentSection = "conglomerados";
// Datos de ejemplo (solo para desarrollo)
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
    {
      id: "ruta2",
      codigo: "MSTR-002",
      conglomerado: "CONG-002",
      fecha: "20/06/2023",
      estado: 3,
      fechaRecoleccion: "15/06/2023",
      fechaEnvio: "16/06/2023",
      fechaEnRuta: "17/06/2023",
    },
  ];
  saveToLocalStorage();
}

// Inicializar la aplicación
function initApp() {
  // Asegurar que las rutas tengan estado
  rutas = rutas.map((r) => ({ ...r, estado: r.estado || 0 }));
  saveToLocalStorage();

  loadData();
  setupEventListeners();
}

// Cargar datos según la sección actual
function loadData() {
  // Ocultar todos los contenedores primero
  conglomeradosContainer.style.display = "none";
  rutasSection.style.display = "none";

  // Limpiar contenedores
  conglomeradosContainer.innerHTML = "";
  rutasContainer.innerHTML = "";

  switch (currentSection) {
    case "conglomerados":
      mainTitle.textContent = "CONGLOMERADOS";
      statusTabs.style.display = "flex";
      conglomeradosContainer.style.display = "block";

      const filteredConglomerados = conglomerados.filter(
        (c) => c.estado !== "eliminado"
      );
      if (filteredConglomerados.length === 0) {
        conglomeradosContainer.innerHTML =
          '<p class="no-data">No hay conglomerados registrados</p>';
      } else {
        filteredConglomerados.forEach((conglomerado) => {
          conglomeradosContainer.appendChild(
            createConglomeradoCard(conglomerado)
          );
        });
        filterConglomerados("pendientes");
      }
      break;

    case "muestras":
      mainTitle.textContent = "MUESTRAS";
      statusTabs.style.display = "none";
      conglomeradosContainer.style.display = "none";
      rutasSection.style.display = "none";
      muestrasSection.style.display = "block";

      inicializarFormularioMuestras();
      cargarListadoMuestras();
      break;

    case "rutas":
      mainTitle.textContent = "RUTAS DE MUESTREO";
      statusTabs.style.display = "none";
      conglomeradosContainer.style.display = "none";
      rutasSection.style.display = "block";

      // Limpiar el contenedor
      rutasContainer.innerHTML = "";

      if (rutas.length === 0) {
        rutasContainer.innerHTML =
          '<p class="no-data">No hay rutas registradas</p>';
      } else {
        rutas.forEach((ruta) => {
          rutasContainer.appendChild(createRutaCard(ruta));
        });
      }
      break;

      // Función para crear tarjetas de ruta con el proceso de envío
      function createRutaCard(ruta) {
        const card = document.createElement("div");
        card.classList.add("ruta-card");

        card.innerHTML = `
        <div class="ruta-info">
            <h3>Muestra: <span class="codigo">${
              ruta.codigo || "N/A"
            }</span></h3>
            <p><strong>Conglomerado:</strong> ${
              ruta.conglomerado || "No especificado"
            }</p>
            <p><strong>Fecha estimada:</strong> ${
              ruta.fecha || "No especificada"
            }</p>
        </div>
        
        <div class="proceso-envio">
            <h4>Proceso de Envío:</h4>
            <div class="etapas">
                <div class="etapa ${ruta.estado >= 1 ? "activa" : ""}">
                    <div class="icono"><i class="fas fa-edit"></i></div>
                    <div class="texto">Recolectando</div>
                    <div class="fecha">${ruta.fechaRecoleccion || ""}</div>
                </div>
                
                <div class="etapa ${ruta.estado >= 2 ? "activa" : ""}">
                    <div class="icono"><i class="fas fa-truck-loading"></i></div>
                    <div class="texto">Enviado</div>
                    <div class="fecha">${ruta.fechaEnvio || ""}</div>
                </div>
                
                <div class="etapa ${ruta.estado >= 3 ? "activa" : ""}">
                    <div class="icono"><i class="fas fa-truck-moving"></i></div>
                    <div class="texto">En Ruta</div>
                    <div class="fecha">${ruta.fechaEnRuta || ""}</div>
                </div>
                
                <div class="etapa ${ruta.estado >= 4 ? "activa" : ""}">
                    <div class="icono"><i class="fas fa-home"></i></div>
                    <div class="texto">Entregado</div>
                    <div class="fecha">${ruta.fechaEntrega || ""}</div>
                </div>
            </div>
        </div>
        
        <div class="ruta-acciones">
            <button class="btn-actualizar" onclick="actualizarEstadoRuta('${
              ruta.id
            }')">
                Actualizar Estado
            </button>
        </div>
    `;

        return card;
      }
      window.actualizarEstadoRuta = function (id) {
        const ruta = rutas.find((r) => r.id === id);
        if (!ruta) return;

        if (ruta.estado < 4) {
          ruta.estado += 1;

          // Registrar fecha según el estado
          const hoy = new Date().toLocaleDateString();
          switch (ruta.estado) {
            case 1:
              ruta.fechaRecoleccion = hoy;
              break;
            case 2:
              ruta.fechaEnvio = hoy;
              break;
            case 3:
              ruta.fechaEnRuta = hoy;
              break;
            case 4:
              ruta.fechaEntrega = hoy;
              break;
          }

          saveToLocalStorage();
          loadData();
        }
      };

    case "papelera":
      mainTitle.textContent = "PAPELERA";
      statusTabs.style.display = "none";
      conglomeradosContainer.style.display = "block";

      if (papelera.length === 0) {
        conglomeradosContainer.innerHTML =
          '<p class="no-data">La papelera está vacía</p>';
      } else {
        papelera.forEach((item) => {
          if (item.tipo === "conglomerado") {
            conglomeradosContainer.appendChild(
              createConglomeradoCard(item, true)
            );
          } else if (item.tipo === "muestra") {
            conglomeradosContainer.appendChild(createMuestraCard(item, true));
          } else if (item.tipo === "ruta") {
            conglomeradosContainer.appendChild(createRutaCard(item, true));
          }
        });
      }
      break;
  }
}

// Funciones para crear tarjetas
function createConglomeradoCard(conglomerado, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>${conglomerado.nombre || "Sin nombre"}</h3>
    <p>Departamento: ${conglomerado.departamento || "No especificado"}</p>
    <p>Municipio: ${conglomerado.municipio || "No especificado"}</p>
    <p>Estado: ${conglomerado.estado || "pendiente"}</p>
    ${
      isTrash
        ? `<button onclick="restoreItem('${conglomerado.id}')">Restaurar</button>`
        : `<button onclick="viewDetails('${conglomerado.id}', 'conglomerado')">Ver Detalles</button>`
    }
  `;
  return card;
}

function createMuestraCard(muestra, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>${muestra.codigo || "Sin código"}</h3>
    <p>Conglomerado: ${muestra.conglomerado || "No especificado"}</p>
    <p>Tipo de muestra: ${muestra.tipo || "No especificado"}</p>
    ${
      isTrash
        ? `<button onclick="restoreItem('${muestra.id}')">Restaurar</button>`
        : `<button onclick="viewDetails('${muestra.id}', 'muestra')">Ver Detalles</button>`
    }
  `;
  return card;
}

function createRutaCard(ruta, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <div class="info">
      <h2>Muestra <span class="order-code">${
        ruta.codigo || "XXX000"
      }</span></h2>
      <p>Tiempo estimado: ${ruta.tiempoEstimado || "No especificado"}</p>
      <p>Del conglomerado: ${ruta.conglomerado || "No especificado"}</p>
    </div>

    <div class="progress-container">
      <div class="progress">
        <div class="step ${
          ruta.estado >= 1 ? "active" : ""
        }"><i class="fas fa-edit"></i></div>
        <div class="step ${
          ruta.estado >= 2 ? "active" : ""
        }"><i class="fas fa-truck-loading"></i></div>
        <div class="step ${
          ruta.estado >= 3 ? "active" : ""
        }"><i class="fas fa-truck-moving"></i></div>
        <div class="step ${
          ruta.estado >= 4 ? "active" : ""
        }"><i class="fas fa-home"></i></div>
      </div>

      <div class="labels">
        <p>Recolectando</p>
        <p>Enviado</p>
        <p>En Ruta</p>
        <p>Entregado</p>
      </div>
    </div>

    <div class="buttons">
      <button class="prev-btn">◀ Anterior</button>
      <button class="next-btn">Siguiente ▶</button>
    </div>
    ${
      isTrash
        ? `<button onclick="restoreItem('${ruta.id}')">Restaurar</button>`
        : `<button onclick="deleteItem('${ruta.id}', 'ruta')">Eliminar</button>`
    }
  `;

  // Configurar eventos para los botones de esta tarjeta específica
  const currentEstado = ruta.estado || 0;
  const steps = card.querySelectorAll(".step");
  const prevBtn = card.querySelector(".prev-btn");
  const nextBtn = card.querySelector(".next-btn");

  function updateSteps() {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index <= currentEstado);
    });
    if (prevBtn) prevBtn.disabled = currentEstado === 0;
    if (nextBtn) nextBtn.disabled = currentEstado === steps.length - 1;
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentEstado > 0) {
        ruta.estado = currentEstado - 1;
        saveToLocalStorage();
        updateSteps();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentEstado < steps.length - 1) {
        ruta.estado = currentEstado + 1;
        saveToLocalStorage();
        updateSteps();
      }
    });
  }

  updateSteps();
  return card;
}

// Configurar event listeners
function setupEventListeners() {
  // Menú lateral
  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
    menuToggle.classList.toggle("open");
  });

  overlay.addEventListener("click", function () {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });

  // Navegación del menú
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", function () {
      document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
      currentSection = this.dataset.section;
      loadData();

      // Cerrar el menú después de seleccionar
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      menuToggle.classList.remove("open");
    });
  });

  // Botón CREAR
  createButton.addEventListener("click", function () {
    alert(`Implementar modal para crear ${currentSection}`);
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });
  // Botón CREAR - Modificar para manejar muestras
  createButton.addEventListener("click", function () {
    if (currentSection === "muestras") {
      // Desplazarse al formulario
      document.getElementById("formularioRegistroMuestra").scrollIntoView();
    } else {
      alert(`Implementar modal para crear ${currentSection}`);
    }

    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });
}

// Funciones de utilidad
function saveToLocalStorage() {
  localStorage.setItem("conglomerados", JSON.stringify(conglomerados));
  localStorage.setItem("muestras", JSON.stringify(muestras));
  localStorage.setItem("rutas", JSON.stringify(rutas));
  localStorage.setItem("papelera", JSON.stringify(papelera));
}

function filterConglomerados(status) {
  document
    .querySelectorAll(".status-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  const filtered = conglomerados.filter((c) => c.estado === status);
  conglomeradosContainer.innerHTML = "";

  if (filtered.length === 0) {
    conglomeradosContainer.innerHTML =
      '<p class="no-data">No hay conglomerados con este estado</p>';
  } else {
    filtered.forEach((conglomerado) => {
      conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
    });
  }
}

// Funciones globales
window.restoreItem = function (id) {
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
  loadData();
};

window.deleteItem = function (id, type) {
  if (!confirm(`¿Estás seguro de eliminar este ${type}?`)) return;

  let item;
  if (type === "conglomerado") {
    item = conglomerados.find((c) => c.id === id);
    conglomerados = conglomerados.filter((c) => c.id !== id);
  } else if (type === "muestra") {
    item = muestras.find((m) => m.id === id);
    muestras = muestras.filter((m) => m.id !== id);
  } else if (type === "ruta") {
    item = rutas.find((r) => r.id === id);
    rutas = rutas.filter((r) => r.id !== id);
  }

  if (item) {
    item.tipo = type;
    papelera.push(item);
    saveToLocalStorage();
    loadData();
  }
};

window.viewDetails = function (id, type) {
  alert(`Mostrar detalles del ${type} con ID: ${id}`);
};
// Función para inicializar el formulario de muestras
function inicializarFormularioMuestras() {
  const formulario = document.getElementById("formularioRegistroMuestra");

  if (formulario) {
    formulario.addEventListener("submit", function (e) {
      e.preventDefault();
      guardarMuestra();
    });

    // Generar código automático para la muestra
    document.getElementById("codigoMuestra").value =
      "MUES_" + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Si viene de un conglomerado específico
    const urlParams = new URLSearchParams(window.location.search);
    const conglomeradoId = urlParams.get("conglomerado");
    if (conglomeradoId) {
      document.getElementById("subparcela").value = conglomeradoId;
    }
  }
}

function guardarMuestra() {
  const nuevaMuestra = {
    id: Date.now().toString(),
    codigo: document.getElementById("codigoMuestra").value,
    conglomerado: document.getElementById("subparcela").value,
    fechaRecoleccion: document.getElementById("fechaRecoleccion").value,
    azimut: document.getElementById("azimut").value,
    distancia: document.getElementById("distancia").value,
    profundidad: document.getElementById("profundidad").value,
    colorSuelo: document.getElementById("colorSuelo").value,
    pesoFresco: document.getElementById("pesoFresco").value,
    analisis: Array.from(
      document.querySelectorAll('input[name="analisis"]:checked')
    ).map((el) => el.value),
    observaciones: document.getElementById("observaciones").value,
    fechaRegistro: new Date().toISOString(),
  };

  muestras.push(nuevaMuestra);
  saveToLocalStorage();

  // Limpiar formulario y mostrar mensaje
  alert("Muestra registrada correctamente");
  document.getElementById("formularioRegistroMuestra").reset();
  cargarListadoMuestras();
}

function cargarListadoMuestras() {
  const contenedor = document.getElementById("listadoMuestras");
  contenedor.innerHTML = "";

  if (muestras.length === 0) {
    contenedor.innerHTML = '<p class="no-data">No hay muestras registradas</p>';
    return;
  }

  muestras.forEach((muestra) => {
    const card = document.createElement("div");
    card.className = "muestra-card";
    card.innerHTML = `
        <h3>${muestra.codigo}</h3>
        <p><strong>Conglomerado:</strong> ${muestra.conglomerado}</p>
        <p><strong>Fecha:</strong> ${new Date(
          muestra.fechaRecoleccion
        ).toLocaleDateString()}</p>
        <p><strong>Análisis:</strong> ${muestra.analisis.join(", ")}</p>
        <button onclick="eliminarMuestra('${muestra.id}')">Eliminar</button>
      `;
    contenedor.appendChild(card);
  });
}

window.eliminarMuestra = function (id) {
  if (confirm("¿Estás seguro de eliminar esta muestra?")) {
    muestras = muestras.filter((m) => m.id !== id);
    saveToLocalStorage();
    cargarListadoMuestras();
  }
};

// Inicializar la aplicación
initApp();
