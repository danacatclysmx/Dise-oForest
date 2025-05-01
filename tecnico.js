// Variables globales
const muestrasSection = document.getElementById("muestrasSection");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const createButton = document.getElementById("createButton");
const statusTabs = document.getElementById("statusTabs");
const mainTitle = document.getElementById("mainTitle");
const conglomeradosContainer = document.getElementById("conglomeradosContainer");
const rutasSection = document.getElementById("rutasSection");
const rutasContainer = document.getElementById("rutasContainer");

// Datos almacenados localmente
let conglomerados = JSON.parse(localStorage.getItem("conglomerados")) || [];
let muestras = JSON.parse(localStorage.getItem("muestras")) || [];
let rutas = JSON.parse(localStorage.getItem("rutas")) || [];
let papelera = JSON.parse(localStorage.getItem("papelera")) || [];
let currentSection = "conglomerados";

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

function initApp() {
  rutas = rutas.map((r) => ({ ...r, estado: r.estado || 0 }));
  saveToLocalStorage();
  loadData();
  setupEventListeners();
}

function loadData() {
  conglomeradosContainer.style.display = "none";
  rutasSection.style.display = "none";
  muestrasSection.style.display = "none";

  conglomeradosContainer.innerHTML = "";
  rutasContainer.innerHTML = "";

  switch (currentSection) {
    case "conglomerados":
      mainTitle.textContent = "CONGLOMERADOS";
      statusTabs.style.display = "flex";
      conglomeradosContainer.style.display = "block";

      const activos = conglomerados.filter((c) => c.estado !== "eliminado");
      if (activos.length === 0) {
        conglomeradosContainer.innerHTML = '<p class="no-data">No hay conglomerados registrados</p>';
      } else {
        activos.forEach((c) => {
          conglomeradosContainer.appendChild(createConglomeradoCard(c));
        });
        filterConglomerados("pendientes");
      }
      break;

    case "muestras":
      mainTitle.textContent = "MUESTRAS";
      statusTabs.style.display = "none";
      muestrasSection.style.display = "block";
      inicializarFormularioMuestras();
      cargarListadoMuestras();
      break;

    case "rutas":
      mainTitle.textContent = "RUTAS DE MUESTREO";
      statusTabs.style.display = "none";
      rutasSection.style.display = "block";

      if (rutas.length === 0) {
        rutasContainer.innerHTML = '<p class="no-data">No hay rutas registradas</p>';
      } else {
        rutas.forEach((r) => {
          rutasContainer.appendChild(createRutaCard(r));
        });
      }
      break;

    case "papelera":
      mainTitle.textContent = "PAPELERA";
      statusTabs.style.display = "none";
      conglomeradosContainer.style.display = "block";

      if (papelera.length === 0) {
        conglomeradosContainer.innerHTML = '<p class="no-data">La papelera está vacía</p>';
      } else {
        papelera.forEach((item) => {
          if (item.tipo === "conglomerado") {
            conglomeradosContainer.appendChild(createConglomeradoCard(item, true));
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

function createConglomeradoCard(c, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>${c.nombre || "Sin nombre"}</h3>
    <p>Departamento: ${c.departamento || "No especificado"}</p>
    <p>Municipio: ${c.municipio || "No especificado"}</p>
    <p>Estado: ${c.estado || "pendiente"}</p>
    ${isTrash
      ? `<button onclick="restoreItem('${c.id}')">Restaurar</button>`
      : `<button onclick="viewDetails('${c.id}', 'conglomerado')">Ver Detalles</button>`}
  `;
  return card;
}

function createMuestraCard(m, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>${m.codigo}</h3>
    <p>Conglomerado: ${m.conglomerado}</p>
    <p>Tipo de muestra: ${m.tipo || "No especificado"}</p>
    ${isTrash
      ? `<button onclick="restoreItem('${m.id}')">Restaurar</button>`
      : `<button onclick="viewDetails('${m.id}', 'muestra')">Ver Detalles</button>`}
  `;
  return card;
}

function createRutaCard(r, isTrash = false) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>Muestra: ${r.codigo}</h3>
    <p>Conglomerado: ${r.conglomerado}</p>
    <p>Fecha: ${r.fecha}</p>
    ${isTrash
      ? `<button onclick="restoreItem('${r.id}')">Restaurar</button>`
      : `<button onclick="deleteItem('${r.id}', 'ruta')">Eliminar</button>`}
  `;
  return card;
}

function setupEventListeners() {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
    menuToggle.classList.toggle("open");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      currentSection = item.dataset.section;
      loadData();
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      menuToggle.classList.remove("open");
    });
  });

  createButton.addEventListener("click", () => {
    if (currentSection === "muestras") {
      document.getElementById("formularioRegistroMuestra").scrollIntoView();
    } else {
      alert(`Implementar modal para crear ${currentSection}`);
    }

    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });
}

function saveToLocalStorage() {
  localStorage.setItem("conglomerados", JSON.stringify(conglomerados));
  localStorage.setItem("muestras", JSON.stringify(muestras));
  localStorage.setItem("rutas", JSON.stringify(rutas));
  localStorage.setItem("papelera", JSON.stringify(papelera));
}

function filterConglomerados(status) {
  document.querySelectorAll(".status-tab").forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  const filtrados = conglomerados.filter((c) => c.estado === status);
  conglomeradosContainer.innerHTML = "";

  if (filtrados.length === 0) {
    conglomeradosContainer.innerHTML = '<p class="no-data">No hay conglomerados con este estado</p>';
  } else {
    filtrados.forEach((c) => {
      conglomeradosContainer.appendChild(createConglomeradoCard(c));
    });
  }
}

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

function inicializarFormularioMuestras() {
  const formulario = document.getElementById("formularioRegistroMuestra");
  if (!formulario) return;

  formulario.addEventListener("submit", function (e) {
    e.preventDefault();
    guardarMuestra();
  });

  document.getElementById("codigoMuestra").value =
    "MUES_" + Math.random().toString(36).substr(2, 8).toUpperCase();

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("conglomerado");
  if (id) {
    document.getElementById("subparcela").value = id;
  }
}

function guardarMuestra() {
  const nueva = {
    id: Date.now().toString(),
    codigo: document.getElementById("codigoMuestra").value,
    conglomerado: document.getElementById("subparcela").value,
    fechaRecoleccion: document.getElementById("fechaRecoleccion").value,
    azimut: document.getElementById("azimut").value,
    distancia: document.getElementById("distancia").value,
    profundidad: document.getElementById("profundidad").value,
    colorSuelo: document.getElementById("colorSuelo").value,
    pesoFresco: document.getElementById("pesoFresco").value,
    analisis: Array.from(document.querySelectorAll('input[name="analisis"]:checked')).map((el) => el.value),
    observaciones: document.getElementById("observaciones").value,
    fechaRegistro: new Date().toISOString(),
  };

  muestras.push(nueva);
  saveToLocalStorage();
  alert("Muestra registrada correctamente");
  document.getElementById("formularioRegistroMuestra").reset();
  cargarListadoMuestras();
}

function cargarListadoMuestras() {
  const contenedor = document.getElementById("listadoMuestras");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (muestras.length === 0) {
    contenedor.innerHTML = '<p class="no-data">No hay muestras registradas</p>';
    return;
  }

  muestras.forEach((m) => {
    const card = document.createElement("div");
    card.className = "muestra-card";
    card.innerHTML = `
      <h3>${m.codigo}</h3>
      <p><strong>Conglomerado:</strong> ${m.conglomerado}</p>
      <p><strong>Fecha:</strong> ${new Date(m.fechaRecoleccion).toLocaleDateString()}</p>
      <p><strong>Análisis:</strong> ${m.analisis.join(", ")}</p>
      <button onclick="eliminarMuestra('${m.id}')">Eliminar</button>
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

// Iniciar app
initApp();
