// ======= INICIALIZACIÓN DE VARIABLES GLOBALES =======
// Elementos del DOM
const menuToggle = document.getElementById("menuToggle"); // Botón hamburguesa
const sidebar = document.getElementById("sidebar"); // Menú lateral
const overlay = document.getElementById("overlay"); // Overlay para cerrar menú
const createButton = document.getElementById("createButton"); // Botón CREAR
const statusTabs = document.getElementById("statusTabs"); // Filtros de estado
const mainTitle = document.getElementById("mainTitle"); // Título principal
const conglomeradosContainer = document.getElementById(
  "conglomeradosContainer"
); // Contenedor de listado
const welcomeMessage = document.getElementById("welcomeMessage"); // Mensaje de bienvenida

// Variables para el mapa Leaflet
let map;
let circles = []; // Círculos de subparcelas
let containerCircle = null; // Círculo contenedor

// Configuración de radios para subparcelas
const SUBPARCEL_RADIUS = 40; // Radio de subparcelas individuales
const CONTAINER_RADIUS = 100; // Radio del círculo contenedor

// Cargar datos desde localStorage o inicializar arrays vacíos
let conglomerados = JSON.parse(localStorage.getItem("conglomerados")) || [];
let papelera = JSON.parse(localStorage.getItem("papelera")) || [];
let currentSection = "conglomerados"; // Sección actual activa ('conglomerados' o 'papelera')

// ======= INICIALIZACIÓN DE LA APLICACIÓN =======
function initApp() {
  loadConglomerados(); // Cargar datos iniciales
  setupEventListeners(); // Configurar eventos
  checkCookieConsent(); // Verificar consentimiento de cookies
}

// ======= FUNCIONALIDADES DE COOKIES Y USUARIO =======
// Verificar consentimiento de cookies
// Verificar consentimiento de cookies
function checkCookieConsent() {
  if (!localStorage.getItem("cookieConsent")) {
    showCookieConsent();
  }
}

// Mostrar aviso de cookies como modal
function showCookieConsent() {
  const modal = document.createElement("div");
  modal.className = "cookie-modal";
  modal.innerHTML = `
        <div class="cookie-modal-content">
            <h3>Configuración de Cookies</h3>
            <div class="form-group">
                <label for="cookieUserName">Tu nombre:</label>
                <input type="text" id="cookieUserName" placeholder="Ingresa tu nombre">
            </div>
            <p>Utilizamos cookies para mejorar tu experiencia. ¿Aceptas su uso?</p>
            <div class="cookie-buttons">
                <button class="cookie-button accept">Aceptar</button>
                <button class="cookie-button reject">Rechazar</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Configurar eventos de los botones
  modal.querySelector(".cookie-button.accept").addEventListener("click", () => {
    const userName = document.getElementById("cookieUserName").value.trim();
    if (userName) {
      localStorage.setItem("userName", userName);
      welcomeMessage.textContent = `Bienvenido, ${userName}!`;
      welcomeMessage.style.display = "block";
    }
    localStorage.setItem("cookieConsent", "true");
    modal.remove();
  });

  modal.querySelector(".cookie-button.reject").addEventListener("click", () => {
    localStorage.clear();
    modal.remove();
  });
}

// Cargar nombre de usuario guardado
function loadUserName() {
  const userName = localStorage.getItem("userName");
  if (userName) {
    document.getElementById("userName").value = userName;
    welcomeMessage.textContent = `Bienvenido, ${userName}!`;
    welcomeMessage.style.display = "block";
  }
}

// Guardar nombre de usuario
function saveUserName() {
  const userName = document.getElementById("userName").value.trim();
  if (userName) {
    localStorage.setItem("userName", userName);
    welcomeMessage.textContent = `Bienvenido, ${userName}!`;
    welcomeMessage.style.display = "block";
    alert("Nombre guardado correctamente");
  } else {
    alert("Por favor ingresa un nombre válido");
  }
}

// ======= CALCULADORA DE ÁREAS =======
// Mostrar calculadora de áreas
function showCalculator() {
  document.getElementById("modalCalculadora").classList.add("open");
  document.body.style.overflow = "hidden";
}

// Ocultar calculadora de áreas
function hideCalculator() {
  document.getElementById("modalCalculadora").classList.remove("open");
  document.body.style.overflow = "auto";
}

// Cambiar entre pestañas de la calculadora
function changeCalculatorTab(figure, element) {
  // Actualizar pestañas activas
  document.querySelectorAll(".calculator-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  element.classList.add("active");

  // Mostrar el formulario correspondiente
  document.querySelectorAll(".calculator-form").forEach((form) => {
    form.style.display = "none";
  });
  document.getElementById(
    `form${figure.charAt(0).toUpperCase() + figure.slice(1)}`
  ).style.display = "block";
}

// Calcular área según la figura seleccionada
function calculateArea(figure) {
  let area = 0;
  let resultElement = "";
  let unit = "m²";

  switch (figure) {
    case "circulo":
      const radio = parseFloat(document.getElementById("radio").value);
      if (isNaN(radio)) {
        alert("Por favor ingresa un valor válido para el radio");
        return;
      }
      area = Math.PI * Math.pow(radio, 2);
      resultElement = "resultadoCirculo";
      break;

    case "cuadrado":
      const lado = parseFloat(document.getElementById("lado").value);
      if (isNaN(lado)) {
        alert("Por favor ingresa un valor válido para el lado");
        return;
      }
      area = Math.pow(lado, 2);
      resultElement = "resultadoCuadrado";
      break;

    case "triangulo":
      const base = parseFloat(document.getElementById("base").value);
      const altura = parseFloat(document.getElementById("altura").value);
      if (isNaN(base) || isNaN(altura)) {
        alert("Por favor ingresa valores válidos para base y altura");
        return;
      }
      area = (base * altura) / 2;
      resultElement = "resultadoTriangulo";
      break;
  }

  // Mostrar resultado formateado
  document.getElementById(resultElement).textContent = `${area.toFixed(
    2
  )} ${unit}`;

  // Guardar último cálculo en localStorage
  localStorage.setItem(`lastAreaCalculation_${figure}`, area);
}

// ======= CARGA Y FILTRADO DE DATOS =======
// Cargar conglomerados según la sección actual
function loadConglomerados() {
  conglomeradosContainer.innerHTML = "";

  if (currentSection === "conglomerados") {
    // Mostrar listado normal de conglomerados
    mainTitle.textContent = "CONGLOMERADOS";
    statusTabs.style.display = "flex"; // Mostrar filtros

    // Filtrar conglomerados no eliminados
    const filteredConglomerados = conglomerados.filter(
      (c) => c.estado !== "eliminado"
    );

    if (filteredConglomerados.length === 0) {
      // Mostrar mensaje si no hay datos
      conglomeradosContainer.innerHTML =
        '<p class="no-data">No hay conglomerados registrados</p>';
      document
        .querySelectorAll(".status-tab")
        .forEach((tab) => tab.classList.remove("active"));
      return;
    }

    filteredConglomerados.forEach((conglomerado) => {
      conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
    });

    // Activar el filtro por defecto sin depender del evento
    filterConglomerados("pendientes");
  } else if (currentSection === "papelera") {
    mainTitle.textContent = "PAPELERA";
    statusTabs.style.display = "none";

    if (papelera.length === 0) {
      conglomeradosContainer.innerHTML =
        '<p class="no-data">La papelera está vacía</p>';
      return;
    }

    papelera.forEach((conglomerado) => {
      conglomeradosContainer.appendChild(
        createConglomeradoCard(conglomerado, true)
      );
    });
  } else if (currentSection === "calculadora") {
    mainTitle.textContent = "CALCULADORA DE ÁREAS";
    statusTabs.style.display = "none";
    showCalculator();
  }
}

// ======= CREACIÓN DE TARJETAS =======
// Crear tarjeta visual para cada conglomerado
function createConglomeradoCard(conglomerado, isInTrash = false) {
  const card = document.createElement("div");
  card.className = "conglomerado";
  card.dataset.status = conglomerado.estado;
  card.dataset.id = conglomerado.id;
  card.onclick = () => showDetails(conglomerado.id);

  // Formatear fechas
  const fechaInicio = new Date(conglomerado.fecha_inicio).toLocaleDateString();
  const fechaFin = new Date(
    conglomerado.fecha_finalizacion
  ).toLocaleDateString();

  card.innerHTML = `
        <div class="options-menu">
            <button class="options-button" onclick="event.stopPropagation(); toggleOptionsMenu(this)">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </button>
            <div class="options-dropdown">
                ${
                  !isInTrash
                    ? `
                    <div class="option-item" onclick="event.stopPropagation(); editConglomerado('${conglomerado.id}')">EDITAR</div>
                    <div class="option-item" onclick="event.stopPropagation(); deleteConglomerado('${conglomerado.id}')">ELIMINAR</div>
                `
                    : `
                    <div class="option-item" onclick="event.stopPropagation(); restoreConglomerado('${conglomerado.id}')">RESTAURAR</div>
                    <div class="option-item delete-permanently" onclick="event.stopPropagation(); deletePermanently('${conglomerado.id}')">ELIMINAR PERMANENTEMENTE</div>
                `
                }
                <div class="option-item" onclick="event.stopPropagation(); showDetails('${
                  conglomerado.id
                }')">VER DETALLES</div>
            </div>
        </div>
        
        <div class="conglomerado-id">${conglomerado.id}</div>
        <div class="conglomerado-info">
            <strong>Ubicación:</strong> Departamento: ${
              conglomerado.departamento
            }, Municipio: ${conglomerado.municipio}${
    conglomerado.corregimiento
      ? ", Corregimiento: " + conglomerado.corregimiento
      : ""
  }
        </div>
        <div class="conglomerado-info">
            <strong>Coordenadas Centro:</strong> ${
              conglomerado.coordenadas_centro
            }
        </div>
        <div class="conglomerado-info">
            <strong>Fecha Inicio:</strong> ${fechaInicio} - <strong>Fecha Fin:</strong> ${fechaFin}
        </div>
        <div class="conglomerado-info">
            <strong>Estado:</strong> <span class="estado-badge ${
              conglomerado.estado
            }">${conglomerado.estado.toUpperCase()}</span>
        </div>
    `;

  return card;
}

// ======= CONFIGURACIÓN DE EVENTOS =======
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

  document.addEventListener("click", function (e) {
    if (!sidebar.contains(e.target) && e.target !== menuToggle) {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      menuToggle.classList.remove("open");
    }
  });

  // Navegación del menú
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", function () {
      document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
      this.classList.add("active");

      currentSection = this.dataset.section;
      loadConglomerados();
    });
  });

  // Botón CREAR
  createButton.addEventListener("click", function () {
    document.getElementById("modalCrear").classList.add("open");
    document.body.style.overflow = "hidden";
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    menuToggle.classList.remove("open");
  });

  // Cerrar modal de creación
  document
    .getElementById("closeCrearModal")
    .addEventListener("click", function () {
      document.getElementById("modalCrear").classList.remove("open");
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("cancelarCrear")
    .addEventListener("click", function () {
      document.getElementById("modalCrear").classList.remove("open");
      document.body.style.overflow = "auto";
    });

  // Cerrar modal al hacer clic fuera del contenido
  document.getElementById("modalCrear").addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  });

  // Cerrar modal de calculadora
  document
    .getElementById("closeCalculadoraModal")
    .addEventListener("click", hideCalculator);

  document
    .getElementById("modalCalculadora")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        hideCalculator();
      }
    });

  // Manejar envío del formulario
  document
    .getElementById("formCrearConglomerado")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());

      // Validar coordenadas antes de continuar
      const coordenadas = parseDMS(data.coordenadas);
      if (!coordenadas) {
        alert(
          "Por favor ingrese coordenadas válidas en el formato: 04°32'15.67\"N 74°12'45.89\"W"
        );
        return;
      }

      // Generar un ID único para el nuevo conglomerado
      const nuevoId = "CONG_" + Math.floor(10000 + Math.random() * 90000);

      // Crear el nuevo conglomerado
      const nuevoConglomerado = {
        id: nuevoId,
        coordenadas_centro: data.coordenadas,
        departamento: data.departamento,
        municipio: data.municipio,
        corregimiento: data.corregimiento,
        fecha_inicio: data.fechaInicio,
        fecha_finalizacion: data.fechaFin,
        aprobado_por: "",
        precision: data.precision,
        fecha_aprobacion: "",
        estado: "pendientes",
        punto_referencia: {
          tipo: data.puntoTipo,
          azimut: data.puntoAzimut,
          distancia_horizontal: data.puntoDistancia,
        },
        subparcelas: [
          {
            id: "SPF1",
            radio: "40 m",
            azimut: "0°",
            distancia_centro: "0 m",
            materializado: "Sí",
            color: "Rojo",
            posicion: "Centro",
          },
          {
            id: "SPN",
            radio: "40 m",
            azimut: "0°",
            distancia_centro: "80 m",
            materializado: "Sí",
            color: "Azul",
            posicion: "Norte",
          },
          {
            id: "SPE",
            radio: "40 m",
            azimut: "90°",
            distancia_centro: "80 m",
            materializado: "Sí",
            color: "Verde",
            posicion: "Este",
          },
          {
            id: "SPS",
            radio: "40 m",
            azimut: "180°",
            distancia_centro: "80 m",
            materializado: "Sí",
            color: "Amarillo",
            posicion: "Sur",
          },
          {
            id: "SPO",
            radio: "40 m",
            azimut: "270°",
            distancia_centro: "80 m",
            materializado: "Sí",
            color: "Blanco",
            posicion: "Oeste",
          },
        ],
      };

      conglomerados.push(nuevoConglomerado);
      saveToLocalStorage();

      // Cerrar el modal y limpiar el formulario
      document.getElementById("modalCrear").classList.remove("open");
      document.body.style.overflow = "auto";
      this.reset();

      // Recargar la lista
      if (currentSection === "conglomerados") {
        loadConglomerados();
      }
    });

  // Cerrar modal de detalles
  document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("modalDetalles").style.display = "none";
    document.body.style.overflow = "auto";
  });

  document
    .getElementById("modalDetalles")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("open");
        document.body.style.overflow = "auto";
      }
    });

  // Eventos para la calculadora de áreas
  document.querySelectorAll(".calculator-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      changeCalculatorTab(this.dataset.figure, this);
    });
  });

  document.querySelectorAll(".calculate-button").forEach((button) => {
    button.addEventListener("click", function () {
      calculateArea(this.dataset.figure);
    });
  });

  // Eventos para animaciones hover
  setupHoverEffects();
}

// Configurar efectos hover
function setupHoverEffects() {
  // Efectos para botones
  document.querySelectorAll(".action-button").forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.05)";
      this.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
      this.style.boxShadow = "none";
    });
  });

  // Efectos para tarjetas de conglomerado
  document.addEventListener(
    "mouseover",
    function (e) {
      if (e.target.closest(".conglomerado")) {
        const card = e.target.closest(".conglomerado");
        card.style.transform = "translateY(-5px)";
        card.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.15)";
      }
    },
    true
  );

  document.addEventListener(
    "mouseout",
    function (e) {
      if (e.target.closest(".conglomerado")) {
        const card = e.target.closest(".conglomerado");
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      }
    },
    true
  );
}
// ======= FUNCIONES AUXILIARES =======
// Mostrar/ocultar menú de opciones
function toggleOptionsMenu(button) {
  const dropdown = button.nextElementSibling;
  dropdown.classList.toggle("show");

  document.querySelectorAll(".options-dropdown").forEach((menu) => {
    if (menu !== dropdown) {
      menu.classList.remove("show");
    }
  });
}

// Cerrar todos los menús al hacer clic en cualquier parte del documento
document.addEventListener("click", function () {
  document.querySelectorAll(".options-dropdown").forEach((menu) => {
    menu.classList.remove("show");
  });
});

// Mostrar detalles del conglomerado
function showDetails(conglomeradoId) {
  let data;
  if (currentSection === "conglomerados") {
    data = conglomerados.find((c) => c.id === conglomeradoId);
  } else {
    data = papelera.find((c) => c.id === conglomeradoId);
  }

  if (!data) return;

  // Llenar información general
  document.getElementById("modalConglomeradoId").textContent = data.id;
  document.getElementById("fechaInicioDetalle").textContent = new Date(
    data.fecha_inicio
  ).toLocaleDateString();
  document.getElementById("fechaFinDetalle").textContent = new Date(
    data.fecha_finalizacion
  ).toLocaleDateString();
  document.getElementById("departamentoDetalle").textContent =
    data.departamento;
  document.getElementById("municipioDetalle").textContent = data.municipio;
  document.getElementById("corregimientoDetalle").textContent =
    data.corregimiento || "N/A";
  document.getElementById("coordenadasDetalle").textContent =
    data.coordenadas_centro;
  document.getElementById("aprobadoPorDetalle").textContent =
    data.aprobado_por || "N/A";
  document.getElementById("precisionDetalle").textContent = data.precision;
  document.getElementById("fechaAprobacionDetalle").textContent =
    data.fecha_aprobacion || "N/A";
  document.getElementById("estadoDetalle").textContent =
    data.estado.toUpperCase();

  // Llenar punto de referencia
  document.getElementById("puntoTipoDetalle").textContent =
    data.punto_referencia.tipo || "N/A";
  document.getElementById("puntoAzimutDetalle").textContent =
    data.punto_referencia.azimut || "N/A";
  document.getElementById("puntoDistanciaDetalle").textContent =
    data.punto_referencia.distancia_horizontal || "N/A";

  // Llenar tabla de subparcelas
  const tableBody = document.getElementById("subparcelasTable");
  tableBody.innerHTML = "";

  data.subparcelas.forEach((subparcela) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${subparcela.id}</td>
            <td>${subparcela.radio}</td>
            <td>${subparcela.azimut}</td>
            <td>${subparcela.distancia_centro}</td>
            <td>${subparcela.materializado}</td>
            <td>${subparcela.color}</td>
            <td>${subparcela.posicion}</td>
        `;
    tableBody.appendChild(row);
  });

  // Mostrar el mapa con las subparcelas
  const coordenadas = parseDMS(data.coordenadas_centro);
  if (coordenadas && coordenadas.length === 2) {
    // Inicializar mapa y luego generar subparcelas
    initMapInModal(coordenadas);

    // Pequeño retardo para asegurar que el mapa está listo
    setTimeout(() => {
      generateSubparcelsOnMap(coordenadas, data.subparcelas);
    }, 200);
  } else {
    document.getElementById("map").innerHTML = `
            <div class="map-error">
                <p>No se pudo mostrar el mapa</p>
                <small>Coordenadas inválidas: ${
                  data.coordenadas_centro || "No proporcionadas"
                }</small>
            </div>
        `;
  }

  // Configurar botones de acción según el estado
  const actionButtons = document.getElementById("actionButtons");
  actionButtons.innerHTML = "";

  if (currentSection === "conglomerados") {
    if (data.estado === "pendientes") {
      actionButtons.innerHTML = `
                <button class="action-button reject-button" onclick="changeStatus('${data.id}', 'rechazados')">RECHAZAR</button>
                <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'corregir')">CORREGIR</button>
                <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
            `;
    } else if (data.estado === "rechazados") {
      actionButtons.innerHTML = `
                <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'pendientes')">REVISAR</button>
                <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
            `;
    } else if (data.estado === "aprobados") {
      actionButtons.innerHTML = `
                <button class="action-button reject-button" onclick="changeStatus('${data.id}', 'rechazados')">RECHAZAR</button>
            `;
    }
  } else {
    // En la papelera solo mostramos opciones de restaurar o eliminar permanentemente
    actionButtons.innerHTML = `
            <button class="action-button approve-button" onclick="restoreConglomerado('${data.id}')">RESTAURAR</button>
            <button class="action-button reject-button" onclick="deletePermanently('${data.id}')">ELIMINAR PERMANENTEMENTE</button>
        `;
  }

  // Mostrar modal
  document.getElementById("modalDetalles").classList.add("open");
  document.body.style.overflow = "hidden";
}

// Cambiar estado de un conglomerado
function changeStatus(id, newStatus) {
  const index = conglomerados.findIndex((c) => c.id === id);

  if (index !== -1) {
    if (newStatus === "corregir") {
      // Implementar lógica para corregir
      alert(`El conglomerado ${id} ha sido marcado para corrección`);
      return;
    }

    conglomerados[index].estado = newStatus;

    if (newStatus === "aprobados") {
      conglomerados[index].aprobado_por = "Usuario Actual";
      conglomerados[index].fecha_aprobacion = new Date().toLocaleDateString();
    }

    saveToLocalStorage();
    loadConglomerados();
    document.getElementById("modalDetalles").classList.remove("open");
    document.body.style.overflow = "auto";
  }
}

// Editar conglomerado
function editConglomerado(id) {
  alert(`Editando conglomerado ${id} - Implementar lógica de edición`);
}

// Eliminar conglomerado (mover a papelera)
function deleteConglomerado(id) {
  if (
    confirm(
      `¿Estás seguro de que deseas mover el conglomerado ${id} a la papelera?`
    )
  ) {
    const index = conglomerados.findIndex((c) => c.id === id);

    if (index !== -1) {
      // Mover a la papelera
      papelera.push(conglomerados[index]);
      // Eliminar de la lista principal
      conglomerados.splice(index, 1);

      saveToLocalStorage();
      loadConglomerados();
    }
  }
}

// Restaurar conglomerado desde la papelera
function restoreConglomerado(id) {
  const index = papelera.findIndex((c) => c.id === id);

  if (index !== -1) {
    // Mover de vuelta a la lista principal
    conglomerados.push(papelera[index]);
    // Eliminar de la papelera
    papelera.splice(index, 1);

    saveToLocalStorage();
    loadConglomerados();
    document.getElementById("modalDetalles").style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Eliminar permanentemente de la papelera
function deletePermanently(id) {
  if (
    confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el conglomerado ${id}? Esta acción no se puede deshacer.`
    )
  ) {
    const index = papelera.findIndex((c) => c.id === id);

    if (index !== -1) {
      papelera.splice(index, 1);
      saveToLocalStorage();
      loadConglomerados();
      document.getElementById("modalDetalles").style.display = "none";
      document.body.style.overflow = "auto";
    }
  }
}

// Filtrar conglomerados por estado
function filterConglomerados(status, event = null) {
  // Prevenir comportamiento por defecto si hay evento
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Actualizar pestañas activas
  document.querySelectorAll(".status-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Activar la pestaña clickeada si hay evento
  if (event) {
    event.target.classList.add("active");
  } else {
    // Activar la pestaña correspondiente al status si no hay evento
    document
      .querySelector(`.status-tab[data-status="${status}"]`)
      .classList.add("active");
  }

  // Filtrar conglomerados
  const cards = document.querySelectorAll(".conglomerado");
  cards.forEach((card) => {
    if (status === "all" || card.dataset.status === status) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Guardar datos en localStorage
function saveToLocalStorage() {
  localStorage.setItem("conglomerados", JSON.stringify(conglomerados));
  localStorage.setItem("papelera", JSON.stringify(papelera));
}

// Función para convertir coordenadas DMS a decimales
function parseDMS(coordenadas) {
  if (!coordenadas) return null;

  // Limpiar la cadena de coordenadas
  coordenadas = coordenadas
    .toString()
    .trim()
    .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
    .replace(/’’/g, '"') // Reemplazar comillas dobles especiales por comillas normales
    .replace(/’/g, "'") // Reemplazar comillas simples especiales por comillas normales
    .replace(/""/g, '"'); // Reemplazar comillas dobles duplicadas

  // Mostrar en consola para depuración
  console.log("Coordenadas a parsear:", coordenadas);

  // Patrones para diferentes formatos
  const patterns = [
    // Formato 1: 04°32'15.67"N 74°12'45.89"W (con segundos decimales)
    /^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/i,
    // Formato 2: 6°15'00"N 75°34'00"W (segundos enteros)
    /^(\d+)°(\d+)'(\d+)"([NS])\s+(\d+)°(\d+)'(\d+)"([EW])$/i,
    // Formato 3: 6.25N 75.5666W (decimal)
    /^([\d.]+)([NS])\s+([\d.]+)([EW])$/i,
    // Formato 4: -6.25, -75.5666 (decimal con coma)
    /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/,
  ];

  let matches;
  for (const pattern of patterns) {
    matches = coordenadas.match(pattern);
    if (matches) break;
  }

  if (!matches) {
    console.error("No se encontró patrón para:", coordenadas);
    return null;
  }

  let lat, lng;

  // Procesar según el patrón que coincidió
  if (matches.length === 9) {
    // Formatos DMS (con o sin decimales en segundos)
    lat =
      parseFloat(matches[1]) +
      parseFloat(matches[2]) / 60 +
      parseFloat(matches[3]) / 3600;
    if (matches[4].toUpperCase() === "S") lat = -lat;

    lng =
      parseFloat(matches[5]) +
      parseFloat(matches[6]) / 60 +
      parseFloat(matches[7]) / 3600;
    if (matches[8].toUpperCase() === "W") lng = -lng;
  } else if (matches.length === 5) {
    // Formato decimal con N/S E/W
    lat = parseFloat(matches[1]);
    if (matches[2].toUpperCase() === "S") lat = -lat;

    lng = parseFloat(matches[3]);
    if (matches[4].toUpperCase() === "W") lng = -lng;
  } else if (matches.length === 3) {
    // Formato decimal simple
    lat = parseFloat(matches[1]);
    lng = parseFloat(matches[2]);
  }

  // Validar que las coordenadas están dentro de rangos válidos
  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    console.error("Coordenadas fuera de rango o inválidas:", lat, lng);
    return null;
  }

  console.log("Coordenadas parseadas:", lat, lng);
  return [lat, lng];
}

// ======= FUNCIONES DEL MAPA =======
// Inicializar el mapa en el modal
function initMapInModal(center) {
  // Limpiar mapa existente
  if (map) {
    map.remove();
    circles = [];
    containerCircle = null;
  }

  // Crear nuevo mapa con renderizador Canvas
  map = L.map("map", {
    preferCanvas: true,
    center: center,
    zoom: 15,
    zoomControl: true,
    renderer: L.canvas(),
  });

  // Capa base con mejor rendimiento
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    updateWhenIdle: true,
    maxZoom: 19,
  }).addTo(map);

  // Forzar actualización de tamaño
  setTimeout(() => map.invalidateSize(true), 100);

  return map;
}

// Función para generar las subparcelas en el mapa
function generateSubparcelsOnMap(center, subparcelas) {
  // Limpiar elementos anteriores
  clearMap();

  // 1. Crear círculo del conglomerado (fondo grande)
  containerCircle = L.circle(center, {
    color: "#FFD700", // Amarillo oro
    fillColor: "#FFD700",
    fillOpacity: 0.2, // Muy transparente
    radius: 120, // 100 metros de radio
    weight: 2, // Grosor del borde
  })
    .addTo(map)
    .bindTooltip("Área del Conglomerado", { permanent: false });

  // 2. Crear las 5 subparcelas en la disposición específica
  const subparcelPositions = [
    {
      id: "SPF1",
      position: "Centro",
      color: "#FF0000",
      distance: 0,
      azimuth: 0,
    },
    {
      id: "SPN",
      position: "Norte",
      color: "#0000FF",
      distance: 80,
      azimuth: 0,
    },
    {
      id: "SPE",
      position: "Este",
      color: "#00FF00",
      distance: 80,
      azimuth: 90,
    },
    {
      id: "SPS",
      position: "Sur",
      color: "#FFFF00",
      distance: 80,
      azimuth: 180,
    },
    {
      id: "SPO",
      position: "Oeste",
      color: "#FFFFFF",
      distance: 80,
      azimuth: 270,
    },
  ];

  subparcelPositions.forEach((sp) => {
    const position =
      sp.distance > 0
        ? calculateOffset(center, sp.distance, sp.azimuth)
        : center;

    L.circle(position, {
      color: sp.color,
      fillColor: sp.color,
      fillOpacity: 0.6,
      radius: 40, // 40 metros de radio
      weight: 1,
    })
      .addTo(map)
      .bindTooltip(`${sp.id} (${sp.position})`, { permanent: false });
  });

  // 3. Ajustar la vista para mostrar todo correctamente
  const allCircles = L.featureGroup([containerCircle, ...circles]);
  map.fitBounds(allCircles.getBounds(), {
    padding: [30, 30],
    maxZoom: 17,
  });

  // Forzar redibujado para evitar artefactos
  setTimeout(() => map.invalidateSize(true), 100);
}

// Función auxiliar para obtener color según posición
function getColorForSubparcela(posicion) {
  const COLOR_MAP = {
    Centro: "#FF0000", // Rojo
    Norte: "#1E90FF", // Azul brillante
    Este: "#32CD32", // Verde lima
    Sur: "#FFD700", // Amarillo oro
    Oeste: "#FFFFFF", // Blanco
  };
  return COLOR_MAP[posicion] || "#AAAAAA";
}

// Función para crear un círculo en el mapa
function createCircle(center, color, tooltip, style = {}) {
  const defaultStyle = {
    color: color,
    fillColor: color,
    fillOpacity: 0.5,
    radius: SUBPARCEL_RADIUS,
    weight: 1,
  };

  const finalStyle = { ...defaultStyle, ...style };

  const circle = L.circle(center, finalStyle).addTo(map).bindTooltip(tooltip, {
    permanent: false,
    direction: "top",
  });

  circles.push(circle);
  return circle;
}

// Función para calcular offset desde el centro
function calculateOffset(center, distance, bearing) {
  const earthRadius = 6378137; // Radio terrestre en metros
  const latRad = (center[0] * Math.PI) / 180;
  const angularDist = distance / earthRadius;
  const bearingRad = (bearing * Math.PI) / 180;

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDist) +
      Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearingRad)
  );

  const newLng =
    (center[1] * Math.PI) / 180 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(newLat)
    );

  return [
    (newLat * 180) / Math.PI,
    (((newLng * 180) / Math.PI + 540) % 360) - 180, // Normalizar longitud
  ];
}

// Función para limpiar el mapa
function clearMap() {
  circles.forEach((circle) => map && map.removeLayer(circle));
  circles = [];

  if (containerCircle && map) {
    map.removeLayer(containerCircle);
    containerCircle = null;
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initApp);
