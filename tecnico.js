// Referencias a elementos del DOM utilizados en varias partes del código

// Sección donde se mostrarán las muestras
const muestrasSection = document.getElementById("muestrasSection");

// Botón para alternar el menú lateral
const menuToggle = document.getElementById("menuToggle");

// Menú lateral (sidebar)
const sidebar = document.getElementById("sidebar");

// Capa oscura que cubre la pantalla cuando el menú está abierto
const overlay = document.getElementById("overlay");

// Botón para crear nuevos registros
const createButton = document.getElementById("createButton");

// Contenedor de pestañas de estado (por ejemplo: 'activos', 'inactivos')
const statusTabs = document.getElementById("statusTabs");

// Título principal de la aplicación
const mainTitle = document.getElementById("mainTitle");

// Contenedor donde se mostrarán los conglomerados
const conglomeradosContainer = document.getElementById("conglomeradosContainer");

// Sección completa de rutas
const rutasSection = document.getElementById("rutasSection");

// Contenedor dentro de la sección de rutas donde se mostrarán las rutas dinámicamente
const rutasContainer = document.getElementById("rutasContainer");

// Carga datos almacenados localmente o inicializa arreglos vacíos si no existen

// Lista de conglomerados
let conglomerados = JSON.parse(localStorage.getItem("conglomerados")) || [];

// Lista de muestras
let muestras = JSON.parse(localStorage.getItem("muestras")) || [];

// Lista de rutas
let rutas = JSON.parse(localStorage.getItem("rutas")) || [];

// Papelera para elementos eliminados
let papelera = JSON.parse(localStorage.getItem("papelera")) || [];

// Variable para saber qué sección está activa actualmente
let currentSection = "conglomerados";

// Asegurarse que al iniciar solo se muestra la sección correcta
// Asegura que solo se muestre la sección correcta al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Muestra la sección de conglomerados
  conglomeradosContainer.style.display = "block";

  // Oculta la sección de rutas
  rutasSection.style.display = "none";

  // Oculta la sección de muestras
  muestrasSection.style.display = "none";
});

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
//verifica si el arreglo rutas está vacío
function loadData() {
  // Primero ocultamos todas las secciones posibles
  conglomeradosContainer.style.display = "none";
  rutasSection.style.display = "none";
  muestrasSection.style.display = "none";
  
  // Limpiamos los contenedores
  conglomeradosContainer.innerHTML = "";
  rutasContainer.innerHTML = "";
//controla la representación dinámica de contenido en pantalla , según la sección actual
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

/**
 * Crea un elemento HTML (div) que representa una tarjeta de conglomerado.
 *
 * Objeto que contiene los datos del conglomerado.
 * Indica si el conglomerado está en la papelera.
 * Tarjeta del conglomerado lista para insertar en el DOM.
 */
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
/**
 * Crea un elemento HTML (div) que representa una tarjeta de muestra.
 *
 * - Objeto que contiene los datos de la muestra.
 * - Indica si la muestra está en la papelera.
 *  Tarjeta de la muestra lista para insertar en el DOM.
 */
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
/**
 * Crea un elemento HTML (div) que representa una tarjeta de ruta.
 *- Objeto que contiene los datos de la ruta.
 * - Indica si la ruta está en la papelera.
 *  Tarjeta de la ruta lista para insertar en el DOM.
 */
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

/**
 * Configura todos los eventos necesarios para la interacción del usuario.
 * - Menú lateral (toggle y overlay)
 * - Selección de secciones desde el menú
 * - Acción del botón "Crear"
 */
function setupEventListeners() {
  // Alternar menú lateral al hacer clic en el botón hamburguesa
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que el evento afecte a otros elementos
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
    menuToggle.classList.toggle("open");
  });

  // Cerrar el menú al hacer clic en el overlay (fondo oscuro)
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });

  // Manejar selección de secciones desde el menú lateral
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      // Remover clase 'active' de todos los ítems
      document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"));
      
      // Agregar clase 'active' al ítem seleccionado
      item.classList.add("active");

      // Actualizar la sección actual
      currentSection = item.dataset.section;

      // Volver a cargar contenido según la nueva sección
      loadData();

      // Cerrar el menú después de seleccionar una opción
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      menuToggle.classList.remove("open");
    });
  });

  // Acción del botón "Crear" dependiendo de la sección activa
  createButton.addEventListener("click", () => {
    if (currentSection === "muestras") {
      // Si está en muestras, desplazar hacia el formulario
      document.getElementById("formularioRegistroMuestra").scrollIntoView({ behavior: "smooth" });
    } else {
      // Para otras secciones, mostrar un mensaje temporal
      alert(`Implementar modal para crear ${currentSection}`);
    }

    // Cerrar el menú lateral si estaba abierto
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });
}

/**
 * Guarda los datos actuales en localStorage para persistencia entre sesiones.
 * Se guardan las listas de:
 * - Conglomerados
 * - Muestras
 * - Rutas
 * - Papelera
 */
function saveToLocalStorage() {
  localStorage.setItem("conglomerados", JSON.stringify(conglomerados));
  localStorage.setItem("muestras", JSON.stringify(muestras));
  localStorage.setItem("rutas", JSON.stringify(rutas));
  localStorage.setItem("papelera", JSON.stringify(papelera));
}

/**
 * Restaura un elemento desde la papelera a su lista original (conglomerados, muestras o rutas).
 *
 * - ID del elemento que se va a restaurar.
 * - Se expone en el objeto `window` para ser usada desde HTML (ej: onclick).
 */
window.restoreItem = function (id) {
  // Busca el elemento en la papelera por su ID
  const item = papelera.find((i) => i.id === id);
  if (!item) return; // Si no existe, salir

  // Lo agrega a la lista correspondiente según su tipo
  if (item.tipo === "conglomerado") {
    conglomerados.push(item);
  } else if (item.tipo === "muestra") {
    muestras.push(item);
  } else if (item.tipo === "ruta") {
    rutas.push(item);
  }

  // Elimina el elemento de la papelera
  papelera = papelera.filter((i) => i.id !== id);

  // Guarda los cambios en localStorage y actualiza la interfaz
  saveToLocalStorage();
  loadData();
};
/**
 * Mueve un elemento a la papelera después de confirmar con el usuario.
 *
 * - ID del elemento que se desea eliminar/mover a papelera.
 * - Tipo de elemento: 'conglomerado', 'muestra' o 'ruta'.
 * - Se expone en el objeto `window` para ser usada desde HTML.
 */
window.deleteItem = function (id, type) {
  // Confirmar acción con el usuario
  if (!confirm(`¿Estás seguro de eliminar este ${type}?`)) return;

  let item;
  // Busca el elemento y lo elimina de su lista original
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

  // Si se encontró el elemento, lo agrega a la papelera con su tipo asociado
  if (item) {
    item.tipo = type;
    papelera.push(item);
    saveToLocalStorage(); // Guarda cambios
    loadData(); // Actualiza interfaz
  }
};

/**
 * Muestra los detalles de un elemento seleccionado (simulado con alert).
 *
 *  - ID del elemento del cual se quiere ver detalle.
 * - Tipo de elemento: 'conglomerado', 'muestra' o 'ruta'.
 *  - Se expone en el objeto `window` para ser usada desde HTML.
 */
window.viewDetails = function (id, type) {
  alert(`Mostrar detalles del ${type} con ID: ${id}`);
};

/**
 * Inicializa el formulario de registro de muestras.
 * - Asigna un código único a la muestra.
 * - Configura el evento submit del formulario.
 * - Rellena automáticamente campos si vienen parámetros por URL.
 */
function inicializarFormularioMuestras() {
  // Obtener referencia al formulario
  const formulario = document.getElementById("formularioRegistroMuestra");
  if (!formulario) return; // Si no existe, salir

  // Manejar el envío del formulario sin recargar la página
  formulario.addEventListener("submit", function (e) {
    e.preventDefault(); // Evita que el formulario recargue la página
    guardarMuestra();   // Llama a la función que guarda los datos
  });

  // Generar un código único aleatorio para la muestra
  document.getElementById("codigoMuestra").value =
    "MUES_" + Math.random().toString(36).substr(2, 8).toUpperCase();

  // Verificar si hay un ID de conglomerado en la URL para rellenar campo
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("conglomerado");
  if (id) {
    document.getElementById("subparcela").value = id;
  }
}
/**
 * Guarda una nueva muestra recolectada desde el formulario.
 * Recoge todos los valores del formulario y los almacena en el arreglo global `muestras`.
 */
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
/**
 * Elimina una muestra del listado y actualiza la interfaz.
 *
 *  ID de la muestra a eliminar.
 *  Se expone en el objeto `window` para ser usada desde HTML.
 */
window.eliminarMuestra = function (id) {
  if (confirm("¿Estás seguro de eliminar esta muestra?")) {
    muestras = muestras.filter((m) => m.id !== id);
    // Guardar cambios en localStorage
    saveToLocalStorage();
    // Volver a cargar el listado actualizado
    cargarListadoMuestras();
  }
};

// Iniciar app
initApp();
