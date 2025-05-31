// ======= INICIALIZACIÓN DE VARIABLES GLOBALES =======
const API_BASE_URL = "http://localhost:8080/ms_Conglomerado"; // Ajustar según tu entorno
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
let createMap; // Mapa para creación
let createMarker; // Marcador en el mapa de creación
let selectedCoords = null; // Coordenadas seleccionadas
let locationData = {}; // Datos de geolocalización

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
}


// ======= FUNCIONES DE COMUNICACIÓN CON EL API =======
async function fetchConglomerados() {
    try {
        const response = await fetch(`${API_BASE_URL}/getAll`);
        const data = await response.json();
        return data.objetoRta || [];
    } catch (error) {
        console.error("Error cargando conglomerados:", error);
        return [];
    }
}

async function createConglomeradoAPI(conglomeradoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(conglomeradoData)
        });
        
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error creando conglomerado:", error);
        throw error;
    }
}

async function deleteConglomeradoAPI(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
            method: "DELETE"
        });
        return response.ok;
    } catch (error) {
        console.error("Error eliminando conglomerado:", error);
        return false;
    }
}

// ======= FUNCIONES DE MAPA PARA CREACIÓN =======
function initCreateMap() {
    // Eliminar mapa existente si hay uno
    if (createMap) {
        createMap.remove();
    }
    
    // Crear nuevo mapa
    createMap = L.map('map-container-crear', {
        preferCanvas: true,
        zoomControl: true,
        renderer: L.canvas()
    }).setView([4.570868, -74.297333], 7); // Centro en Colombia

    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(createMap);

    // Evento de clic en el mapa
    createMap.on('click', function(e) {
        // Eliminar marcador anterior si existe
        if (createMarker) {
            createMap.removeLayer(createMarker);
        }
        
        // Crear nuevo marcador
        createMarker = L.marker(e.latlng).addTo(createMap);
        selectedCoords = e.latlng;
        
        // Mostrar coordenadas seleccionadas
        document.getElementById('selected-coordinates').innerHTML = 
            `<strong>Coordenadas seleccionadas:</strong> ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        
        // Obtener datos de geolocalización
        reverseGeocode(e.latlng);
    });
    
    // Forzar actualización de tamaño
    setTimeout(() => createMap.invalidateSize(true), 100);
}

// Función para obtener datos de ubicación usando geocodificación inversa
function reverseGeocode(latlng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.address) {
                locationData = {
                    departamento: data.address.state || '',
                    municipio: data.address.city || data.address.town || data.address.village || '',
                    corregimiento: data.address.suburb || data.address.county || ''
                };
                
                // Actualizar UI con datos obtenidos
                document.getElementById('auto-departamento').textContent = locationData.departamento;
                document.getElementById('auto-municipio').textContent = locationData.municipio;
                document.getElementById('auto-corregimiento').textContent = locationData.corregimiento;
            }
        })
        .catch(error => {
            console.error('Error en geocodificación inversa:', error);
            document.getElementById('selected-coordinates').innerHTML += 
                '<br><span style="color:red">Error obteniendo datos de ubicación</span>';
        });
}


// ======= CARGA Y FILTRADO DE DATOS =======
// Cargar conglomerados según la sección actual
async function loadConglomerados() {
    conglomeradosContainer.innerHTML = '<p class="no-data">Cargando conglomerados...</p>';
    
    try {
        const data = await fetchConglomerados();
        
        if (data.length === 0) {
            conglomeradosContainer.innerHTML = '<p class="no-data">No hay conglomerados registrados</p>';
            return;
        }

        conglomeradosContainer.innerHTML = "";
        data.forEach(conglomerado => {
            conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
        });
    } catch (error) {
        conglomeradosContainer.innerHTML = `<p class="no-data">Error al cargar: ${error.message}</p>`;
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
  const fechaFin = new Date(conglomerado.fecha_finalizacion).toLocaleDateString();

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
        
        <div class="conglomerado-id">${conglomerado.idConglomerado}</div>
        <div class="conglomerado-info">
            <strong>Ubicación:</strong> ${conglomerado.departamento}, ${conglomerado.municipio}
        </div>
        <div class="conglomerado-info">
            <strong>Coordenadas:</strong> ${conglomerado.coordenadas_centro}
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
  createButton.addEventListener('click', function() {
      document.getElementById("modalCrear").classList.add("open");
      document.body.style.overflow = "hidden";
      
      // Inicializar mapa de creación
      setTimeout(() => {
          initCreateMap();
          // Resetear datos de ubicación
          locationData = {};
          selectedCoords = null;
          document.getElementById('selected-coordinates').textContent = '';
          document.getElementById('auto-departamento').textContent = '-';
          document.getElementById('auto-municipio').textContent = '-';
          document.getElementById('auto-corregimiento').textContent = '-';
      }, 300);
  });


  // Cerrar modal de creación
  document.getElementById("closeCrearModal").addEventListener("click", function() {
      document.getElementById("modalCrear").classList.remove("open");
      document.body.style.overflow = "auto";
      if (createMap) createMap.remove();
  });

  document.getElementById("cancelarCrear").addEventListener("click", function() {
      document.getElementById("modalCrear").classList.remove("open");
      document.body.style.overflow = "auto";
      if (createMap) createMap.remove();
  });

  // Cerrar modal al hacer clic fuera del contenido
  document.getElementById("modalCrear").addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  });
  // Manejar envío del formulario
  document.getElementById("formCrearConglomerado").addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!selectedCoords) {
        alert("Por favor seleccione una ubicación en el mapa");
        return;
    }

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    // Construir objeto para el API
    const conglomeradoData = {
        coordenadas_centro: `${selectedCoords.lat},${selectedCoords.lng}`,
        departamento: locationData.departamento || 'No identificado',
        municipio: locationData.municipio || 'No identificado',
        corregimiento: locationData.corregimiento || '',
        
        // Conversión de fechas a formato ISO
        fecha_inicio: new Date(data.fechaInicio).toISOString(),
        fecha_finalizacion: new Date(data.fechaFin).toISOString(),
        
        precision: parseFloat(data.precision),
        aprobadoPor: null,
        fecha_aprobacion: null
    };

    try {
        await createConglomeradoAPI(conglomeradoData);
        
        // Cerrar modal y recargar
        document.getElementById("modalCrear").classList.remove("open");
        document.body.style.overflow = "auto";
        if (createMap) createMap.remove();
        
        loadConglomerados();
        alert("Conglomerado creado exitosamente!");
    } catch (error) {
        alert(`Error al crear conglomerado: ${error.message}`);
    }
});

  // Cerrar modal de detalles
  document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("modalDetalles").classList.remove("open");
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
async function showDetails(conglomeradoId) {
  try {
    // Llamar a la API para obtener el conglomerado por ID
    const response = await fetch(`${API_BASE_URL}/conglomerados/${conglomeradoId}`);
    
    if (!response.ok) {
      throw new Error("No se pudo cargar el conglomerado");
    }

    const data = await response.json();

    // Llenar información general
    document.getElementById("modalConglomeradoId").textContent = data.id || "N/A";
    document.getElementById("fechaInicioDetalle").textContent = new Date(conglomerado.fecha_inicio).toLocaleDateString();
        document.getElementById("fechaFinDetalle").textContent = new Date(conglomerado.fecha_finalizacion).toLocaleDateString();
    document.getElementById("departamentoDetalle").textContent =
      data.departamento || "N/A";
    document.getElementById("municipioDetalle").textContent =
      data.municipio || "N/A";
    document.getElementById("corregimientoDetalle").textContent =
      data.corregimiento || "N/A";
    document.getElementById("coordenadasDetalle").textContent =
      data.coordenadas_centro || "N/A";
    document.getElementById("aprobadoPorDetalle").textContent =
      data.aprobado_por || "N/A";
    document.getElementById("precisionDetalle").textContent =
      data.precision || "N/A";
    document.getElementById("fechaAprobacionDetalle").textContent =
      data.fecha_aprobacion
        ? new Date(data.fecha_aprobacion).toLocaleDateString()
        : "N/A";
    document.getElementById("estadoDetalle").textContent =
      (data.estado || "desconocido").toUpperCase();

    // Llenar punto de referencia
    document.getElementById("puntoTipoDetalle").textContent =
      data.punto_referencia?.tipo || "N/A";
    document.getElementById("puntoAzimutDetalle").textContent =
      data.punto_referencia?.azimut || "N/A";
    document.getElementById("puntoDistanciaDetalle").textContent =
      data.punto_referencia?.distancia_horizontal || "N/A";

    // Llenar tabla de subparcelas
    const tableBody = document.getElementById("subparcelasTable");
    tableBody.innerHTML = "";

    if (Array.isArray(data.subparcelas) && data.subparcelas.length > 0) {
      data.subparcelas.forEach((subparcela) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${subparcela.id || "N/A"}</td>
          <td>${subparcela.radio || "N/A"}</td>
          <td>${subparcela.azimut || "N/A"}</td>
          <td>${subparcela.distancia_centro || "N/A"}</td>
          <td>${subparcela.materializado || "N/A"}</td>
          <td>${subparcela.color || "N/A"}</td>
          <td>${subparcela.posicion || "N/A"}</td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="7">No hay subparcelas registradas</td>`;
      tableBody.appendChild(row);
    }

    // Mostrar el mapa con las subparcelas
    const coordenadas = parseDMS(data.coordenadas_centro);
    if (coordenadas && coordenadas.length === 2) {
      initMapInModal(coordenadas);
      setTimeout(() => generateSubparcelsOnMap(coordenadas, data.subparcelas), 200);
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
      switch (data.estado) {
        case "pendientes":
          actionButtons.innerHTML = `
            <button class="action-button reject-button" onclick="changeStatus('${data.id}', 'rechazados')">RECHAZAR</button>
            <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'corregir')">CORREGIR</button>
            <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
          `;
          break;
        case "rechazados":
          actionButtons.innerHTML = `
            <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'pendientes')">REVISAR</button>
            <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
          `;
          break;
        case "aprobados":
          actionButtons.innerHTML = `
            <button class="action-button reject-button" onclick="changeStatus('${data.id}', 'rechazados')">RECHAZAR</button>
          `;
          break;
        default:
          actionButtons.innerHTML = "";
          break;
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
  } catch (error) {
    console.error("Error cargando detalles:", error);
    alert("No se pudieron cargar los detalles del conglomerado.");
  }
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
async function deleteConglomerado(id) {
    if (confirm(`¿Estás seguro de eliminar el conglomerado ${id}?`)) {
        const success = await deleteConglomeradoAPI(id);
        
        if (success) {
            loadConglomerados();
            alert("Conglomerado eliminado exitosamente!");
        } else {
            alert("Error al eliminar el conglomerado");
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
