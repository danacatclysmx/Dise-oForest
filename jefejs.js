// ======= INICIALIZACIÓN DE VARIABLES GLOBALES =======
// Elementos del DOM
const menuToggle = document.getElementById('menuToggle'); // Botón hamburguesa
const sidebar = document.getElementById('sidebar'); // Menú lateral
const overlay = document.getElementById('overlay'); // Overlay para cerrar menú
const createButton = document.getElementById('createButton'); // Botón CREAR
const statusTabs = document.getElementById('statusTabs'); // Filtros de estado
const mainTitle = document.getElementById('mainTitle'); // Título principal
const conglomeradosContainer = document.getElementById('conglomeradosContainer'); // Contenedor de listado
const welcomeMessage = document.getElementById('welcomeMessage'); // Mensaje de bienvenida

// Variables para el mapa Leaflet
let map;
let circles = []; // Círculos de subparcelas
let containerCircle = null; // Círculo contenedor
let createMap; // Mapa para creación
let createMarker; // Marcador en el mapa de creación
let selectedCoords = null; // Coordenadas seleccionadas
let locationData = {}; // Datos de geolocalización


// Variables para la calculadora de área
let areaDrawingMode = false;
let areaPoints = [];
let areaMarkers = [];
let areaLines = [];
let areaPolygon = null;

// Configuración de radios para subparcelas
const SUBPARCEL_RADIUS = 40; // Radio de subparcelas individuales
const CONTAINER_RADIUS = 100; // Radio del círculo contenedor

// Cargar datos desde localStorage o inicializar arrays vacíos
let conglomerados = JSON.parse(localStorage.getItem('conglomerados')) || [];
let papelera = JSON.parse(localStorage.getItem('papelera')) || [];
let currentSection = 'conglomerados'; // Sección actual activa ('conglomerados' o 'papelera')

// ======= INICIALIZACIÓN DE LA APLICACIÓN =======
function initApp() {
    loadConglomerados(); // Cargar datos iniciales
    setupEventListeners(); // Configurar eventos
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


// ======= CALCULADORA DE ÁREA =======
// Variables adicionales para la calculadora
let coordinateList = []; // Almacenar coordenadas de puntos
let currentHoveredPoint = null; // Punto resaltado actualmente

function toggleAreaCalculator() {
    const areaControls = document.getElementById('area-controls');
    const calculateBtn = document.getElementById('calculateAreaBtn');
    
    if (areaControls.style.display === 'block') {
        areaControls.style.display = 'none';
        calculateBtn.textContent = 'CALCULAR ÁREA';
        calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> CALCULAR ÁREA';
        disableAreaDrawing();
    } else {
        areaControls.style.display = 'block';
        calculateBtn.textContent = 'OCULTAR CALCULADORA';
        calculateBtn.innerHTML = '<i class="fas fa-times"></i> OCULTAR CALCULADORA';
        clearAreaDrawing();
        updateCoordinateList();
    }
}

function enableAreaDrawing() {
    areaDrawingMode = true;
    areaPoints = [];
    coordinateList = [];
    clearAreaDrawing();
    
    map.getContainer().style.cursor = 'crosshair';
    map.on('click', addAreaPoint);
    map.on('mousemove', showMouseCoordinates);
}

function disableAreaDrawing() {
    areaDrawingMode = false;
    map.getContainer().style.cursor = '';
    map.off('click', addAreaPoint);
    map.off('mousemove', showMouseCoordinates);
}

function clearAreaDrawing() {
    areaMarkers.forEach(marker => marker.remove());
    areaLines.forEach(line => line.remove());
    if (areaPolygon) areaPolygon.remove();
    
    areaMarkers = [];
    areaLines = [];
    areaPolygon = null;
    areaPoints = [];
    coordinateList = [];
    
    document.getElementById('area-result').textContent = '';
    const coordsContainer = document.getElementById('mouse-coordinates');
    if (coordsContainer) {
        coordsContainer.textContent = '';
        coordsContainer.style.display = 'none';
    }
    updateCoordinateList();
}

function showMouseCoordinates(e) {
    if (!areaDrawingMode) return;
    
    const coordsContainer = document.getElementById('mouse-coordinates');
    if (coordsContainer) {
        coordsContainer.innerHTML = `
            <strong>Coordenadas actuales:</strong>
            <div class="coordinates-values">
                <span>Lat: ${e.latlng.lat.toFixed(6)}</span>
                <span>Lng: ${e.latlng.lng.toFixed(6)}</span>
            </div>
        `;
    }
}

function addAreaPoint(e) {
    if (!areaDrawingMode) return;
    
    const point = e.latlng;
    areaPoints.push(point);
    
    coordinateList.push({
        id: coordinateList.length + 1,
        lat: point.lat,
        lng: point.lng
    });
    
    updateCoordinateList();
    
    const marker = L.circleMarker(point, {
        radius: 8,
        color: '#ffffff',
        fillColor: '#000000',
        fillOpacity: 1,
        weight: 2
    }).addTo(map);
    
    marker.bindTooltip((coordinateList.length).toString(), {
        permanent: true,
        direction: 'center',    
        className: 'marker-number'
    });
    
    // Eventos hover para el marcador
    marker.on('mouseover', () => highlightPoint(areaMarkers.length - 1));
    marker.on('mouseout', () => unhighlightPoint(areaMarkers.length - 1));
    
    areaMarkers.push(marker);
    
    if (areaPoints.length > 1) {
        const points = [areaPoints[areaPoints.length - 2], areaPoints[areaPoints.length - 1]];
        const line = L.polyline(points, {color: '#ff0000', weight: 2}).addTo(map);
        areaLines.push(line);
    }
    
    if (areaPoints.length >= 3) {
        if (areaPolygon) areaPolygon.remove();
        areaPolygon = L.polygon(areaPoints, {
            color: '#ff5722',
            weight: 2,
            fillColor: '#ff5722',
            fillOpacity: 0.2
        }).addTo(map);
        calculateArea();
    }
}

function updateCoordinateList() {
    const coordsListContainer = document.getElementById('coordinates-list');
    if (!coordsListContainer) return;
    
    if (coordinateList.length === 0) {
        coordsListContainer.innerHTML = '<p class="no-coords">No hay puntos seleccionados</p>';
        return;
    }
    
    let html = '<div class="coordinates-header">';
    html += '<span style="flex:0.5">#</span><span style="flex:1">Latitud</span><span style="flex:1">Longitud</span>';
    html += '</div>';
    
    coordinateList.forEach((coord, index) => {
        html += `
            <div class="coord-item" 
                 data-index="${index}"
                 onmouseenter="highlightPoint(${index})"
                 onmouseleave="unhighlightPoint(${index})">
                <span class="coord-number" style="flex:0.5">${index + 1}</span>
                <span class="coord-lat" style="flex:1">${coord.lat.toFixed(6)}</span>
                <span class="coord-lng" style="flex:1">${coord.lng.toFixed(6)}</span>
            </div>
        `;
    });
    
    coordsListContainer.innerHTML = html;
}

function highlightPoint(index) {
    if (index >= 0 && index < areaMarkers.length) {
        currentHoveredPoint = index;
        areaMarkers[index].setStyle({
            radius: 10,
            fillColor: '#ff0000',
            weight: 3
        });
        
        // Resaltar temporalmente el ítem en la lista
        const coordItems = document.querySelectorAll('.coord-item');
        if (coordItems[index]) {
            coordItems[index].classList.add('hovered');
        }
    }
}

function unhighlightPoint(index) {
    if (index >= 0 && index < areaMarkers.length) {
        areaMarkers[index].setStyle({
            radius: 8,
            fillColor: '#000000',
            weight: 2
        });
        
        // Quitar resaltado del ítem en la lista
        const coordItems = document.querySelectorAll('.coord-item');
        if (coordItems[index]) {
            coordItems[index].classList.remove('hovered');
        }
    }
}

function calculateArea() {
    if (areaPoints.length < 3) return;
    
    // Calcular área usando la fórmula de Gauss
    let area = 0;
    const n = areaPoints.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = areaPoints[i].lng * Math.PI / 180;
        const yi = areaPoints[i].lat * Math.PI / 180;
        const xj = areaPoints[j].lng * Math.PI / 180;
        const yj = areaPoints[j].lat * Math.PI / 180;
        
        area += xi * yj - xj * yi;
    }
    
    area = Math.abs(area) / 2;
    
    // Convertir a metros cuadrados
    const earthRadius = 6378137; // Radio de la Tierra en metros
    const areaM2 = area * earthRadius * earthRadius;
    
    // Mostrar resultado
    let resultText = `Área: ${areaM2.toFixed(2)} m²`;
    
    // Convertir a hectáreas si es grande
    if (areaM2 > 10000) {
        const hectares = areaM2 / 10000;
        resultText += ` (${hectares.toFixed(4)} ha)`;
    }
    
    document.getElementById('area-result').textContent = resultText;
}

function toggleAreaCalculator() {
    const areaControls = document.getElementById('area-controls');
    const calculateBtn = document.getElementById('calculateAreaBtn');
    
    if (areaControls.style.display === 'block') {
        areaControls.style.display = 'none';
        calculateBtn.textContent = 'CALCULAR ÁREA';
        calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> CALCULAR ÁREA';
        disableAreaDrawing();
    } else {
        areaControls.style.display = 'block';
        calculateBtn.textContent = 'OCULTAR CALCULADORA';
        calculateBtn.innerHTML = '<i class="fas fa-times"></i> OCULTAR CALCULADORA';
        clearAreaDrawing();
    }
}

function enableAreaDrawing() {
    areaDrawingMode = true;
    areaPoints = [];
    coordinateList = [];
    clearAreaDrawing();
    
    // Inicializar el contenedor de coordenadas
    const coordsContainer = document.getElementById('mouse-coordinates');
    if (coordsContainer) {
        coordsContainer.innerHTML = '<strong>Coordenadas actuales:</strong><br>Mueva el mouse sobre el mapa';
        coordsContainer.style.display = 'block';
    }
    
    map.getContainer().style.cursor = 'crosshair';
    map.on('click', addAreaPoint);
    map.on('mousemove', showMouseCoordinates);
}

function disableAreaDrawing() {
    areaDrawingMode = false;
    map.getContainer().style.cursor = '';
    if (map) {
        map.off('click', addAreaPoint);
    }
}

// ======= CARGA Y FILTRADO DE DATOS =======
// Cargar conglomerados según la sección actual
function loadConglomerados() {
    conglomeradosContainer.innerHTML = '';
    
    if (currentSection === 'conglomerados') {
        // Mostrar listado normal de conglomerados
        mainTitle.textContent = 'CONGLOMERADOS';
        statusTabs.style.display = 'flex'; // Mostrar filtros
        
        // Filtrar conglomerados no eliminados
        const filteredConglomerados = conglomerados.filter(c => c.estado !== 'eliminado');
        
        if (filteredConglomerados.length === 0) {
            // Mostrar mensaje si no hay datos
            conglomeradosContainer.innerHTML = '<p class="no-data">No hay conglomerados registrados</p>';
            document.querySelectorAll('.status-tab').forEach(tab => tab.classList.remove('active'));
            return;
        }

        filteredConglomerados.forEach(conglomerado => {
            conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
        });
        
        // Activar el filtro por defecto sin depender del evento
        filterConglomerados('pendientes');
    } else if (currentSection === 'papelera') {
        mainTitle.textContent = 'PAPELERA';
        statusTabs.style.display = 'none';
        
        if (papelera.length === 0) {
            conglomeradosContainer.innerHTML = '<p class="no-data">La papelera está vacía</p>';
            return;
        }
        
        papelera.forEach(conglomerado => {
            conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado, true));
        });
    }
}

// ======= FUNCIÓN PARA EDITAR CONGLOMERADO =======
// ======= FUNCIÓN PARA EDITAR CONGLOMERADO =======
function editConglomerado(id) {
    const conglomerado = conglomerados.find(c => c.id === id);
    if (!conglomerado) return;

    // Función para formatear fecha a YYYY-MM-DD
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return dateString; // Si no es una fecha válida, devolver original
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Llenar el modal de edición
    document.getElementById('editConglomeradoId').textContent = conglomerado.id;
    document.getElementById('editConglomeradoOriginalId').value = conglomerado.id;
    document.getElementById('editCoordenadas').value = conglomerado.coordenadas_centro;
    document.getElementById('editDepartamento').value = conglomerado.departamento;
    document.getElementById('editMunicipio').value = conglomerado.municipio;
    document.getElementById('editCorregimiento').value = conglomerado.corregimiento || '';
    document.getElementById('editFechaInicio').value = formatDateForInput(conglomerado.fecha_inicio);
    document.getElementById('editFechaFin').value = formatDateForInput(conglomerado.fecha_finalizacion);
    document.getElementById('editPrecision').value = conglomerado.precision;
    document.getElementById('editPuntoTipo').value = conglomerado.punto_referencia.tipo || '';
    document.getElementById('editPuntoAzimut').value = conglomerado.punto_referencia.azimut || '';
    document.getElementById('editPuntoDistancia').value = conglomerado.punto_referencia.distancia_horizontal || '';

    // Abrir modal
    document.getElementById('modalEditar').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ======= CREACIÓN DE TARJETAS =======
// Crear tarjeta visual para cada conglomerado
function createConglomeradoCard(conglomerado, isInTrash = false) {
    const card = document.createElement('div');
    card.className = 'conglomerado';
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
                ${!isInTrash ? `
                    <div class="option-item" onclick="event.stopPropagation(); editConglomerado('${conglomerado.id}')">EDITAR</div>
                    <div class="option-item" onclick="event.stopPropagation(); deleteConglomerado('${conglomerado.id}')">ELIMINAR</div>
                ` : `
                    <div class="option-item" onclick="event.stopPropagation(); restoreConglomerado('${conglomerado.id}')">RESTAURAR</div>
                    <div class="option-item delete-permanently" onclick="event.stopPropagation(); deletePermanently('${conglomerado.id}')">ELIMINAR PERMANENTEMENTE</div>
                `}
                <div class="option-item" onclick="event.stopPropagation(); showDetails('${conglomerado.id}')">VER DETALLES</div>
            </div>
        </div>
        
        <div class="conglomerado-id">${conglomerado.id}</div>
        <div class="conglomerado-info">
            <strong>Ubicación:</strong> Departamento: ${conglomerado.departamento}, Municipio: ${conglomerado.municipio}${conglomerado.corregimiento ? ', Corregimiento: ' + conglomerado.corregimiento : ''}
        </div>
        <div class="conglomerado-info">
            <strong>Coordenadas Centro:</strong> ${conglomerado.coordenadas_centro}
        </div>
        <div class="conglomerado-info">
            <strong>Fecha Inicio:</strong> ${fechaInicio} - <strong>Fecha Fin:</strong> ${fechaFin}
        </div>
        <div class="conglomerado-info">
            <strong>Estado:</strong> <span class="estado-badge ${conglomerado.estado}">${conglomerado.estado.toUpperCase()}</span>
        </div>
    `;
    
    return card;
}

// ======= CONFIGURACIÓN DE EVENTOS =======
// Configurar event listeners
function setupEventListeners() {

    // Cerrar modal edición
    document.getElementById('closeEditarModal').addEventListener('click', function() {
        document.getElementById('modalEditar').classList.remove('open');
        document.body.style.overflow = 'auto';
    });

    document.getElementById('cancelarEditar').addEventListener('click', function() {
        document.getElementById('modalEditar').classList.remove('open');
        document.body.style.overflow = 'auto';
    });

    // Manejar envío del formulario de edición
    document.getElementById('formEditarConglomerado').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const originalId = document.getElementById('editConglomeradoOriginalId').value;
        const index = conglomerados.findIndex(c => c.id === originalId);
        
        if (index === -1) {
            alert('Conglomerado no encontrado');
            return;
        }
        
        // Recoger datos del formulario
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Actualizar solo campos editables
        conglomerados[index].fecha_inicio = data.fechaInicio;
        conglomerados[index].fecha_finalizacion = data.fechaFin;
        conglomerados[index].precision = data.precision;
        conglomerados[index].punto_referencia.tipo = data.puntoTipo;
        conglomerados[index].punto_referencia.azimut = data.puntoAzimut;
        conglomerados[index].punto_referencia.distancia_horizontal = data.puntoDistancia;
        
        saveToLocalStorage();
        loadConglomerados();
        
        // Cerrar modal
        document.getElementById('modalEditar').classList.remove('open');
        document.body.style.overflow = 'auto';
        
        alert('Cambios guardados exitosamente!');
    });

    // Evento para cerrar sesión
    document.getElementById('logoutButton').addEventListener('click', function() {
        // Cerrar menú si está abierto
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    
        // Redirigir a la página de login
        window.location.href = 'Login.html';
    });

    // Menú lateral
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        menuToggle.classList.toggle('open');
    });
    
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    });
    
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            menuToggle.classList.remove('open');
        }
    });
    
    // Navegación del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            currentSection = this.dataset.section;
            loadConglomerados();
        });
    });
    
    // Botón CREAR
    createButton.addEventListener('click', function() {
        document.getElementById('modalCrear').classList.add('open');
        document.body.style.overflow = 'hidden';
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
        
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

    
    document.getElementById('closeCrearModal').addEventListener('click', function() {
        document.getElementById('modalCrear').classList.remove('open');
        document.body.style.overflow = 'auto';
        if (createMap) createMap.remove();
    });

    document.getElementById('cancelarCrear').addEventListener('click', function() {
        document.getElementById('modalCrear').classList.remove('open');
        document.body.style.overflow = 'auto';
        if (createMap) createMap.remove();
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    document.getElementById('modalCrear').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Manejar envío del formulario
    document.getElementById('formCrearConglomerado').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!selectedCoords) {
            alert('Por favor seleccione una ubicación en el mapa');
            return;
        }

        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        // Validar fechas
        if (!data.fechaInicio || !data.fechaFin) {
            alert('Por favor ingrese ambas fechas');
            return;
        }
        
        // Generar un ID único para el nuevo conglomerado
        const nuevoId = 'CONG_' + Math.floor(10000 + Math.random() * 90000);
        
        // Crear el nuevo conglomerado
        const nuevoConglomerado = {
            id: nuevoId,
            coordenadas_centro: `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`,
            departamento: locationData.departamento || 'No identificado',
            municipio: locationData.municipio || 'No identificado',
            corregimiento: locationData.corregimiento || '',
            fecha_inicio: data.fechaInicio,
            fecha_finalizacion: data.fechaFin,
            aprobado_por: "",
            precision: data.precision,
            fecha_aprobacion: "",
            estado: "pendientes",
            punto_referencia: {
                tipo: data.puntoTipo,
                azimut: data.puntoAzimut,
                distancia_horizontal: data.puntoDistancia
            },
            subparcelas: [
                {
                    id: "SPF1",
                    radio: "40 m",
                    azimut: "0°",
                    distancia_centro: "0 m",
                    materializado: "Sí",
                    color: "Rojo",
                    posicion: "Centro"
                },
                {
                    id: "SPN",
                    radio: "40 m",
                    azimut: "0°",
                    distancia_centro: "80 m",
                    materializado: "Sí",
                    color: "Azul",
                    posicion: "Norte"
                },
                {
                    id: "SPE",
                    radio: "40 m",
                    azimut: "90°",
                    distancia_centro: "80 m",
                    materializado: "Sí",
                    color: "Verde",
                    posicion: "Este"
                },
                {
                    id: "SPS",
                    radio: "40 m",
                    azimut: "180°",
                    distancia_centro: "80 m",
                    materializado: "Sí",
                    color: "Amarillo",
                    posicion: "Sur"
                },
                {
                    id: "SPO",
                    radio: "40 m",
                    azimut: "270°",
                    distancia_centro: "80 m",
                    materializado: "Sí",
                    color: "Blanco",
                    posicion: "Oeste"
                }
            ]
        };
        
        conglomerados.push(nuevoConglomerado);
        saveToLocalStorage();
        
        // Cerrar el modal y limpiar el formulario
        document.getElementById('modalCrear').classList.remove('open');
        document.body.style.overflow = 'auto';
        this.reset();
        if (createMap) createMap.remove();
        
        // Recargar la lista
        if (currentSection === 'conglomerados') {
            loadConglomerados();
        }
        
        alert('Conglomerado creado exitosamente!');
    });
    
    // Cerrar modal de detalles
    document.getElementById('closeModal').addEventListener('click', closeDetailsModal);
    document.getElementById('modalDetalles').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDetailsModal();
        }
    });
        // Eventos para animaciones hover
        setupHoverEffects();
        
    }

// Cerrar modal de detalles y limpiar mapa
function closeDetailsModal() {
    const modal = document.getElementById('modalDetalles');
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
    
    // Destruir el mapa si existe
    if (map) {
        try {
            map.remove();
        } catch (e) {
            console.warn("Error al remover el mapa:", e);
        }
        map = null;
        circles = [];
        containerCircle = null;
    }

    // Desactivar la calculadora al cerrar el modal
    const areaControls = document.getElementById('area-controls');
    if (areaControls) {
        areaControls.style.display = 'none';
    }
    
    const calculateBtn = document.getElementById('calculateAreaBtn');
    if (calculateBtn) {
        calculateBtn.textContent = 'CALCULAR ÁREA';
        calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> CALCULAR ÁREA';
    }
    
    // Limpiar contenedor del mapa completamente
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';
}


// Configurar efectos hover
function setupHoverEffects() {
    // Efectos para botones
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Efectos para tarjetas de conglomerado
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.conglomerado')) {
            const card = e.target.closest('.conglomerado');
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
        }
    }, true);
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.conglomerado')) {
            const card = e.target.closest('.conglomerado');
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        }
    }, true);
}
// ======= FUNCIONES AUXILIARES =======
// Mostrar/ocultar menú de opciones
function toggleOptionsMenu(button) {
    const dropdown = button.nextElementSibling;
    dropdown.classList.toggle('show');
    
    document.querySelectorAll('.options-dropdown').forEach(menu => {
        if (menu !== dropdown) {
            menu.classList.remove('show');
        }
    });
}

// Cerrar todos los menús al hacer clic en cualquier parte del documento
document.addEventListener('click', function() {
    document.querySelectorAll('.options-dropdown').forEach(menu => {
        menu.classList.remove('show');
    });
});

// Mostrar detalles del conglomerado
function showDetails(conglomeradoId) {
    let data;
    if (currentSection === 'conglomerados') {
        data = conglomerados.find(c => c.id === conglomeradoId);
    } else {
        data = papelera.find(c => c.id === conglomeradoId);
    }
    
    if (!data) return;
    
    // Llenar información general
    document.getElementById('modalConglomeradoId').textContent = data.id;
    document.getElementById('fechaInicioDetalle').textContent = new Date(data.fecha_inicio).toLocaleDateString();
    document.getElementById('fechaFinDetalle').textContent = new Date(data.fecha_finalizacion).toLocaleDateString();
    document.getElementById('departamentoDetalle').textContent = data.departamento;
    document.getElementById('municipioDetalle').textContent = data.municipio;
    document.getElementById('corregimientoDetalle').textContent = data.corregimiento || 'N/A';
    document.getElementById('coordenadasDetalle').textContent = data.coordenadas_centro;
    document.getElementById('aprobadoPorDetalle').textContent = data.aprobado_por || 'N/A';
    document.getElementById('precisionDetalle').textContent = data.precision;
    document.getElementById('fechaAprobacionDetalle').textContent = data.fecha_aprobacion || 'N/A';
    document.getElementById('estadoDetalle').textContent = data.estado.toUpperCase();
    
    // Llenar punto de referencia
    document.getElementById('puntoTipoDetalle').textContent = data.punto_referencia.tipo || 'N/A';
    document.getElementById('puntoAzimutDetalle').textContent = data.punto_referencia.azimut || 'N/A';
    document.getElementById('puntoDistanciaDetalle').textContent = data.punto_referencia.distancia_horizontal || 'N/A';
    
    // Llenar tabla de subparcelas
    const tableBody = document.getElementById('subparcelasTable');
    tableBody.innerHTML = '';
    
    data.subparcelas.forEach(subparcela => {
        const row = document.createElement('tr');
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
        document.getElementById('map').innerHTML = `
            <div class="map-error">
                <p>No se pudo mostrar el mapa</p>
                <small>Coordenadas inválidas: ${data.coordenadas_centro || 'No proporcionadas'}</small>
            </div>
        `;
    }
    
    // Configurar botones de acción según el estado
    const actionButtons = document.getElementById('actionButtons');
    actionButtons.innerHTML = '';
    
    if (currentSection === 'conglomerados') {
        if (data.estado === 'pendientes') {
            actionButtons.innerHTML = `
                <button class="action-button reject-button" onclick="changeStatus('${data.id}', 'rechazados')">RECHAZAR</button>
                <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'corregir')">CORREGIR</button>
                <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
            `;
        } else if (data.estado === 'rechazados') {
            actionButtons.innerHTML = `
                <button class="action-button correct-button" onclick="changeStatus('${data.id}', 'pendientes')">REVISAR</button>
                <button class="action-button approve-button" onclick="changeStatus('${data.id}', 'aprobados')">APROBAR</button>
            `;
        } else if (data.estado === 'aprobados') {
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
    
    setTimeout(() => {
        document.getElementById('calculateAreaBtn')?.addEventListener('click', toggleAreaCalculator);
        document.getElementById('startDrawingBtn')?.addEventListener('click', enableAreaDrawing);
        document.getElementById('clearDrawingBtn')?.addEventListener('click', clearAreaDrawing);
    }, 300);

    // Mostrar modal
    document.getElementById('modalDetalles').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Cambiar estado de un conglomerado
function changeStatus(id, newStatus) {
    const index = conglomerados.findIndex(c => c.id === id);
    
    if (index !== -1) {
        if (newStatus === 'corregir') {
            alert(`El conglomerado ${id} ha sido marcado para corrección`);
            return;
        }
        
        conglomerados[index].estado = newStatus;
        
        if (newStatus === 'aprobados') {
            conglomerados[index].aprobado_por = "Usuario Actual";
            conglomerados[index].fecha_aprobacion = new Date().toLocaleDateString();
        }
        
        saveToLocalStorage();
        loadConglomerados();
        closeDetailsModal(); // Usar la nueva función de cierre
    }
}

// Eliminar conglomerado (mover a papelera)
function deleteConglomerado(id) {
    if (confirm(`¿Estás seguro de que deseas mover el conglomerado ${id} a la papelera?`)) {
        const index = conglomerados.findIndex(c => c.id === id);
        
        if (index !== -1) {
            papelera.push(conglomerados[index]);
            conglomerados.splice(index, 1);
            
            saveToLocalStorage();
            loadConglomerados();
            closeDetailsModal(); // Usar la nueva función de cierre
        }
    }
}

// Restaurar conglomerado desde la papelera
function restoreConglomerado(id) {
    const index = papelera.findIndex(c => c.id === id);
    
    if (index !== -1) {
        conglomerados.push(papelera[index]);
        papelera.splice(index, 1);
        
        saveToLocalStorage();
        loadConglomerados();
        closeDetailsModal(); // Usar la nueva función de cierre
    }
}

// Eliminar permanentemente de la papelera
function deletePermanently(id) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el conglomerado ${id}? Esta acción no se puede deshacer.`)) {
        const index = papelera.findIndex(c => c.id === id);
        
        if (index !== -1) {
            papelera.splice(index, 1);
            saveToLocalStorage();
            loadConglomerados();
            closeDetailsModal(); // Usar la nueva función de cierre
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
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar la pestaña clickeada si hay evento
    if (event) {
        event.target.classList.add('active');
    } else {
        // Activar la pestaña correspondiente al status si no hay evento
        document.querySelector(`.status-tab[data-status="${status}"]`).classList.add('active');
    }
    
    // Filtrar conglomerados
    const cards = document.querySelectorAll('.conglomerado');
    cards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Guardar datos en localStorage
function saveToLocalStorage() {
    localStorage.setItem('conglomerados', JSON.stringify(conglomerados));
    localStorage.setItem('papelera', JSON.stringify(papelera));
}

// Función para convertir coordenadas DMS a decimales
function parseDMS(coordenadas) {
    if (!coordenadas) return null;
    
    // Limpiar la cadena de coordenadas
    coordenadas = coordenadas.toString()
        .trim()
        .replace(/\s+/g, ' ')  // Reemplazar múltiples espacios por uno solo
        .replace(/’’/g, '"')   // Reemplazar comillas dobles especiales por comillas normales
        .replace(/’/g, "'")     // Reemplazar comillas simples especiales por comillas normales
        .replace(/""/g, '"');   // Reemplazar comillas dobles duplicadas
    
    // Mostrar en consola para depuración
    console.log('Coordenadas a parsear:', coordenadas);
    
    // Patrones para diferentes formatos
    const patterns = [
        // Formato 1: 04°32'15.67"N 74°12'45.89"W (con segundos decimales)
        /^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/i,
        // Formato 2: 6°15'00"N 75°34'00"W (segundos enteros)
        /^(\d+)°(\d+)'(\d+)"([NS])\s+(\d+)°(\d+)'(\d+)"([EW])$/i,
        // Formato 3: 6.25N 75.5666W (decimal)
        /^([\d.]+)([NS])\s+([\d.]+)([EW])$/i,
        // Formato 4: -6.25, -75.5666 (decimal con coma)
        /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
    ];
    
    let matches;
    for (const pattern of patterns) {
        matches = coordenadas.match(pattern);
        if (matches) break;
    }
    
    if (!matches) {
        console.error('No se encontró patrón para:', coordenadas);
        return null;
    }
    
    let lat, lng;
    
    // Procesar según el patrón que coincidió
    if (matches.length === 9) {
        // Formatos DMS (con o sin decimales en segundos)
        lat = parseFloat(matches[1]) + (parseFloat(matches[2]) / 60) + (parseFloat(matches[3]) / 3600);
        if (matches[4].toUpperCase() === 'S') lat = -lat;
        
        lng = parseFloat(matches[5]) + (parseFloat(matches[6]) / 60) + (parseFloat(matches[7]) / 3600);
        if (matches[8].toUpperCase() === 'W') lng = -lng;
    } else if (matches.length === 5) {
        // Formato decimal con N/S E/W
        lat = parseFloat(matches[1]);
        if (matches[2].toUpperCase() === 'S') lat = -lat;
        
        lng = parseFloat(matches[3]);
        if (matches[4].toUpperCase() === 'W') lng = -lng;
    } else if (matches.length === 3) {
        // Formato decimal simple
        lat = parseFloat(matches[1]);
        lng = parseFloat(matches[2]);
    }
    
    // Validar que las coordenadas están dentro de rangos válidos
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        console.error('Coordenadas fuera de rango o inválidas:', lat, lng);
        return null;
    }
    
    console.log('Coordenadas parseadas:', lat, lng);
    return [lat, lng];
}

// ======= FUNCIONES DEL MAPA =======
// Inicializar el mapa en el modal  
function initMapInModal(center) {
    // Limpiar completamente el contenedor
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '<div id="map-content" style="height:100%; width:100%"></div>';


    // Limpiar mapa existente
    if (map) {
        map.remove();
        circles = [];
        containerCircle = null;
    }

    // Crear nuevo mapa con renderizador Canvas
    map = L.map('map-content', {
        preferCanvas: true,
        center: center,
        zoom: 15,
        renderer: L.canvas()
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        updateWhenIdle: true,
        maxZoom: 19
    }).addTo(map);

    // Forzar actualización de tamaño después de un breve retardo
    setTimeout(() => {
        if (map) {
            map.invalidateSize(true);
        }
    }, 100);
    
    return map;
}

// Función para generar las subparcelas en el mapa
function generateSubparcelsOnMap(center, subparcelas) {
    // Limpiar elementos anteriores
    clearMap();
    
    // 1. Crear círculo del conglomerado (fondo grande)
    containerCircle = L.circle(center, {
        color: '#FFD700',  // Amarillo oro
        fillColor: '#FFD700',
        fillOpacity: 0.2,  // Muy transparente
        radius: 120,       // 100 metros de radio
        weight: 2         // Grosor del borde
    }).addTo(map).bindTooltip("Área del Conglomerado", {permanent: false});

    // 2. Crear las 5 subparcelas en la disposición específica
    const subparcelPositions = [
        { id: "SPF1", position: "Centro", color: "#FF0000", distance: 0, azimuth: 0 },
        { id: "SPN", position: "Norte", color: "#0000FF", distance: 80, azimuth: 0 },
        { id: "SPE", position: "Este", color: "#00FF00", distance: 80, azimuth: 90 },
        { id: "SPS", position: "Sur", color: "#FFFF00", distance: 80, azimuth: 180 },
        { id: "SPO", position: "Oeste", color: "#FFFFFF", distance: 80, azimuth: 270 }
    ];

    subparcelPositions.forEach(sp => {
        const position = sp.distance > 0 ? 
            calculateOffset(center, sp.distance, sp.azimuth) : 
            center;
            
        L.circle(position, {
            color: sp.color,
            fillColor: sp.color,
            fillOpacity: 0.6,
            radius: 40,  // 40 metros de radio
            weight: 1
        }).addTo(map)
        .bindTooltip(`${sp.id} (${sp.position})`, {permanent: false});
    });

    // 3. Ajustar la vista para mostrar todo correctamente
    const allCircles = L.featureGroup([containerCircle, ...circles]);
    map.fitBounds(allCircles.getBounds(), {
        padding: [30, 30],
        maxZoom: 17
    });

    // Forzar redibujado para evitar artefactos
    setTimeout(() => map.invalidateSize(true), 100);
}

// Función auxiliar para obtener color según posición
function getColorForSubparcela(posicion) {
    const COLOR_MAP = {
        'Centro': '#FF0000',  // Rojo
        'Norte': '#1E90FF',   // Azul brillante
        'Este': '#32CD32',    // Verde lima
        'Sur': '#FFD700',     // Amarillo oro
        'Oeste': '#FFFFFF'    // Blanco
    };
    return COLOR_MAP[posicion] || '#AAAAAA';
}

// Función para crear un círculo en el mapa
function createCircle(center, color, tooltip, style = {}) {
    const defaultStyle = {
        color: color,
        fillColor: color,
        fillOpacity: 0.5,
        radius: SUBPARCEL_RADIUS,
        weight: 1
    };
    
    const finalStyle = {...defaultStyle, ...style};
    
    const circle = L.circle(center, finalStyle)
        .addTo(map)
        .bindTooltip(tooltip, {
            permanent: false,
            direction: 'top'
        });
    
    circles.push(circle);
    return circle;
}

// Función para calcular offset desde el centro
function calculateOffset(center, distance, bearing) {
    const earthRadius = 6378137; // Radio terrestre en metros
    const latRad = center[0] * Math.PI / 180;
    const angularDist = distance / earthRadius;
    const bearingRad = bearing * Math.PI / 180;
    
    const newLat = Math.asin(
        Math.sin(latRad) * Math.cos(angularDist) + 
        Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearingRad)
    );
    
    const newLng = center[1] * Math.PI / 180 + Math.atan2(
        Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(latRad),
        Math.cos(angularDist) - Math.sin(latRad) * Math.sin(newLat)
    );
    
    return [
        newLat * 180 / Math.PI,
        ((newLng * 180 / Math.PI) + 540) % 360 - 180 // Normalizar longitud
    ];
}

// Función para limpiar el mapa
function clearMap() {
    circles.forEach(circle => map && map.removeLayer(circle));
    circles = [];
    
    if (containerCircle && map) {
        map.removeLayer(containerCircle);
        containerCircle = null;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);