// Variables globales
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const createButton = document.getElementById('createButton');
const statusTabs = document.getElementById('statusTabs');
const mainTitle = document.getElementById('mainTitle');
const conglomeradosContainer = document.getElementById('conglomeradosContainer');

// Datos almacenados localmente
let conglomerados = JSON.parse(localStorage.getItem('conglomerados')) || [];
let muestras = JSON.parse(localStorage.getItem('muestras')) || [];
let rutas = JSON.parse(localStorage.getItem('rutas')) || [];
let papelera = JSON.parse(localStorage.getItem('papelera')) || [];
let currentSection = 'conglomerados'; // 'conglomerados', 'muestras', 'rutas' o 'papelera'

// Inicializar la aplicación
function initApp() {
    loadData();
    setupEventListeners();
}

// Cargar datos según la sección actual
function loadData() {
    conglomeradosContainer.innerHTML = '';
    switch (currentSection) {
        case 'conglomerados':
            mainTitle.textContent = 'CONGLOMERADOS';
            statusTabs.style.display = 'flex';
            const filteredConglomerados = conglomerados.filter(c => c.estado !== 'eliminado');
            if (filteredConglomerados.length === 0) {
                conglomeradosContainer.innerHTML = '<p class="no-data">No hay conglomerados registrados</p>';
                return;
            }
            filteredConglomerados.forEach(conglomerado => {
                conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
            });
            filterConglomerados('pendientes');
            break;
        case 'muestras':
            mainTitle.textContent = 'MUESTRAS';
            statusTabs.style.display = 'none';
            if (muestras.length === 0) {
                conglomeradosContainer.innerHTML = '<p class="no-data">No hay muestras registradas</p>';
                return;
            }
            muestras.forEach(muestra => {
                conglomeradosContainer.appendChild(createMuestraCard(muestra));
            });
            break;
        case 'rutas':
            mainTitle.textContent = 'RUTAS DE MUESTREO';
            statusTabs.style.display = 'none';
            if (rutas.length === 0) {
                conglomeradosContainer.innerHTML = '<p class="no-data">No hay rutas registradas</p>';
                return;
            }
            rutas.forEach(ruta => {
                conglomeradosContainer.appendChild(createRutaCard(ruta));
            });
            break;
        case 'papelera':
            mainTitle.textContent = 'PAPELERA';
            statusTabs.style.display = 'none';
            if (papelera.length === 0) {
                conglomeradosContainer.innerHTML = '<p class="no-data">La papelera está vacía</p>';
                return;
            }
            papelera.forEach(item => {
                if (item.tipo === 'conglomerado') {
                    conglomeradosContainer.appendChild(createConglomeradoCard(item, true));
                } else if (item.tipo === 'muestra') {
                    conglomeradosContainer.appendChild(createMuestraCard(item, true));
                } else if (item.tipo === 'ruta') {
                    conglomeradosContainer.appendChild(createRutaCard(item, true));
                }
            });
            break;
    }
}

// Funciones para crear tarjetas
function createConglomeradoCard(conglomerado, isInTrash = false) {
    const card = document.createElement('div');
    card.className = 'conglomerado';
    card.dataset.status = conglomerado.estado;
    card.dataset.id = conglomerado.id;
    card.onclick = () => showConglomeradoDetails(conglomerado.id);

    const fechaInicio = new Date(conglomerado.fecha_inicio).toLocaleDateString();
    const fechaFin = new Date(conglomerado.fecha_finalizacion).toLocaleDateString();
    const muestrasAsociadas = muestras.filter(m => m.id_conglomerado === conglomerado.id).length;

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
                    <div class="option-item" onclick="event.stopPropagation(); deleteItem('${conglomerado.id}', 'conglomerado')">ELIMINAR</div>
                ` : `
                    <div class="option-item" onclick="event.stopPropagation(); restoreItem('${conglomerado.id}', 'conglomerado')">RESTAURAR</div>
                    <div class="option-item delete-permanently" onclick="event.stopPropagation(); deletePermanently('${conglomerado.id}', 'conglomerado')">ELIMINAR PERMANENTEMENTE</div>
                `}
                <div class="option-item" onclick="event.stopPropagation(); showConglomeradoDetails('${conglomerado.id}')">VER DETALLES</div>
            </div>
        </div>
        <div class="conglomerado-id">${conglomerado.id}</div>
        <div class="conglomerado-info">
            <strong>Ubicación:</strong> ${conglomerado.departamento}, ${conglomerado.municipio}${conglomerado.corregimiento ? ', ' + conglomerado.corregimiento : ''}
        </div>
        <div class="conglomerado-info">
            <strong>Coordenadas:</strong> ${conglomerado.coordenadas_centro}
        </div>
        <div class="conglomerado-info">
            <strong>Fechas:</strong> ${fechaInicio} - ${fechaFin}
        </div>
        <div class="conglomerado-info">
            <strong>Muestras:</strong> ${muestrasAsociadas} registradas
        </div>
        <div class="conglomerado-info">
            <strong>Estado:</strong> <span class="estado-badge ${conglomerado.estado}">${conglomerado.estado.toUpperCase()}</span>
        </div>
    `;
    return card;
}

function createMuestraCard(muestra, isInTrash = false) {
    const card = document.createElement('div');
    card.className = 'muestra';
    card.dataset.id = muestra.id;
    card.onclick = () => showMuestraDetails(muestra.id);

    const fechaRecoleccion = new Date(muestra.fecha_recoleccion).toLocaleDateString();
    const conglomerado = conglomerados.find(c => c.id === muestra.id_conglomerado) || {};

    card.innerHTML = `
        <div class="options-menu">
            <button class="options-button" onclick="event.stopPropagation(); toggleOptionsMenu(this)">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </button>
            <div class="options-dropdown">
                ${!isInTrash ? `
                    <div class="option-item" onclick="event.stopPropagation(); editMuestra('${muestra.id}')">EDITAR</div>
                    <div class="option-item" onclick="event.stopPropagation(); deleteItem('${muestra.id}', 'muestra')">ELIMINAR</div>
                ` : `
                    <div class="option-item" onclick="event.stopPropagation(); restoreItem('${muestra.id}', 'muestra')">RESTAURAR</div>
                    <div class="option-item delete-permanently" onclick="event.stopPropagation(); deletePermanently('${muestra.id}', 'muestra')">ELIMINAR PERMANENTEMENTE</div>
                `}
                <div class="option-item" onclick="event.stopPropagation(); showMuestraDetails('${muestra.id}')">VER DETALLES</div>
            </div>
        </div>
        <div class="muestra-id">${muestra.id}</div>
        <div class="muestra-info">
            <strong>Conglomerado:</strong> ${conglomerado.id || 'N/A'} (${conglomerado.departamento || ''}, ${conglomerado.municipio || ''})
        </div>
        <div class="muestra-info">
            <strong>Subparcela:</strong> ${muestra.id_subparcela}
        </div>
        <div class="muestra-info">
            <strong>Fecha Recolección:</strong> ${fechaRecoleccion}
        </div>
        <div class="muestra-info">
            <strong>Estado:</strong> <span class="estado-badge ${muestra.estado || 'pendiente'}">${(muestra.estado || 'pendiente').toUpperCase()}</span>
        </div>
    `;
    return card;
}

function createRutaCard(ruta, isInTrash = false) {
    const card = document.createElement('div');
    card.className = 'ruta';
    card.dataset.id = ruta.id;
    card.onclick = () => showRutaDetails(ruta.id);

    const conglomerado = conglomerados.find(c => c.id === ruta.id_conglomerado) || {};

    card.innerHTML = `
        <div class="options-menu">
            <button class="options-button" onclick="event.stopPropagation(); toggleOptionsMenu(this)">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </button>
            <div class="options-dropdown">
                ${!isInTrash ? `
                    <div class="option-item" onclick="event.stopPropagation(); editRuta('${ruta.id}')">EDITAR</div>
                    <div class="option-item" onclick="event.stopPropagation(); deleteItem('${ruta.id}', 'ruta')">ELIMINAR</div>
                ` : `
                    <div class="option-item" onclick="event.stopPropagation(); restoreItem('${ruta.id}', 'ruta')">RESTAURAR</div>
                    <div class="option-item delete-permanently" onclick="event.stopPropagation(); deletePermanently('${ruta.id}', 'ruta')">ELIMINAR PERMANENTEMENTE</div>
                `}
                <div class="option-item" onclick="event.stopPropagation(); showRutaDetails('${ruta.id}')">VER DETALLES</div>
            </div>
        </div>
        <div class="ruta-id">${ruta.id}</div>
        <div class="ruta-info">
            <strong>Conglomerado:</strong> ${conglomerado.id || 'N/A'} (${conglomerado.departamento || ''}, ${conglomerado.municipio || ''})
        </div>
        <div class="ruta-info">
            <strong>Subparcela:</strong> ${ruta.id_subparcela}
        </div>
        <div class="ruta-info">
            <strong>Puntos:</strong> ${ruta.punto_inicial} → ${ruta.punto_final}
        </div>
        <div class="ruta-info">
            <strong>Color:</strong> <span class="color-badge" style="background-color: ${ruta.color}"></span> ${ruta.color}
        </div>
    `;
    return card;
}

// Configurar event listeners
function setupEventListeners() {
    // Menú lateral
    menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        menuToggle.classList.toggle('open');
    });

    overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    });

    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            menuToggle.classList.remove('open');
        }
    });

    // Navegación del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentSection = this.dataset.section;
            loadData();
        });
    });

    // Botón CREAR
    createButton.addEventListener('click', function () {
        if (currentSection === 'conglomerados') {
            document.getElementById('modalCrear').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else if (currentSection === 'muestras') {
            const selectConglomerado = document.getElementById('muestraConglomerado');
            selectConglomerado.innerHTML = '';
            conglomerados.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `${c.id} - ${c.departamento}, ${c.municipio}`;
                selectConglomerado.appendChild(option);
            });
            document.getElementById('modalCrearMuestra').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else if (currentSection === 'rutas') {
            alert('Implementar modal para crear ruta');
        }
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    });

    // Cerrar modales
    document.getElementById('closeCrearModal').addEventListener('click', function () {
        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('cancelarCrear').addEventListener('click', function () {
        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('closeCrearMuestraModal').addEventListener('click', function () {
        document.getElementById('modalCrearMuestra').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('cancelarCrearMuestra').addEventListener('click', function () {
        document.getElementById('modalCrearMuestra').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('closeModal').addEventListener('click', function () {
        document.getElementById('modalDetalles').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('closeMuestraModal').addEventListener('click', function () {
        document.getElementById('modalDetallesMuestra').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Cerrar modales al hacer clic fuera del contenido
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Manejar envío del formulario de conglomerado
    document.getElementById('formCrearConglomerado').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        const nuevoId = 'CONG_' + Math.floor(10000 + Math.random() * 90000);
        const subparcelas = [];
        const subparcelaInputs = document.querySelectorAll('.subparcela-input');
        subparcelaInputs.forEach(input => {
            subparcelas.push({
                id: input.querySelector('.subparcela-id').value,
                radio: input.querySelector('.subparcela-radio').value,
                azimut: input.querySelector('.subparcela-azimut').value,
                distancia_centro: input.querySelector('.subparcela-distancia').value,
                materializado: input.querySelector('.subparcela-materializado').value,
                color: input.querySelector('.subparcela-color').value,
                posicion: input.querySelector('.subparcela-posicion').value
            });
        });

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
            subparcelas: subparcelas
        };

        conglomerados.push(nuevoConglomerado);
        saveToLocalStorage();

        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.reset();
        document.getElementById('subparcelasContainer').innerHTML = '';

        if (currentSection === 'conglomerados') {
            loadData();
        }
    });

    // Manejar envío del formulario de muestra
    document.getElementById('formCrearMuestra').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        const nuevoId = 'MUESTRA_' + Math.floor(10000 + Math.random() * 90000);
        const nuevaMuestra = {
            id: nuevoId,
            id_conglomerado: data.muestraConglomerado,
            id_subparcela: data.muestraSubparcela,
            fecha_recoleccion: data.fechaRecoleccion,
            azimut: data.azimutMuestra,
            distancia_horizontal: data.distanciaHorizontal,
            profundidad: data.profundidad,
            color_suelo: data.colorSuelo,
            peso_fresco: data.pesoFresco,
            estado: "pendiente",
            carbono: "",
            densidad: "",
            fertilidad: "",
            observaciones: data.observaciones
        };

        muestras.push(nuevaMuestra);
        saveToLocalStorage();

        document.getElementById('modalCrearMuestra').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.reset();

        if (currentSection === 'muestras') {
            loadData();
        }
    });

    // Actualizar subparcelas cuando se selecciona un conglomerado
    document.getElementById('muestraConglomerado').addEventListener('change', function () {
        const selectSubparcela = document.getElementById('muestraSubparcela');
        selectSubparcela.innerHTML = '';
        const conglomeradoId = this.value;
        const conglomerado = conglomerados.find(c => c.id === conglomeradoId);
        if (conglomerado) {
            conglomerado.subparcelas.forEach(subparcela => {
                const option = document.createElement('option');
                option.value = subparcela.id;
                option.textContent = `Subparcela ${subparcela.id}`;
                selectSubparcela.appendChild(option);
            });
        }
    });
}

// Guardar datos en localStorage
function saveToLocalStorage() {
    localStorage.setItem('conglomerados', JSON.stringify(conglomerados));
    localStorage.setItem('muestras', JSON.stringify(muestras));
    localStorage.setItem('rutas', JSON.stringify(rutas));
    localStorage.setItem('papelera', JSON.stringify(papelera));
}

// Filtrar conglomerados por estado
function filterConglomerados(status) {
    document.querySelectorAll('.status-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`.status-tab[onclick*="${status}"]`);
    if (activeTab) activeTab.classList.add('active');

    const filteredConglomerados = conglomerados.filter(c => c.estado === status);
    conglomeradosContainer.innerHTML = '';
    if (filteredConglomerados.length === 0) {
        conglomeradosContainer.innerHTML = `<p class="no-data">No hay conglomerados ${status}</p>`;
        return;
    }
    filteredConglomerados.forEach(conglomerado => {
        conglomeradosContainer.appendChild(createConglomeradoCard(conglomerado));
    });
}

// Mostrar detalles de un conglomerado
function showConglomeradoDetails(id) {
    const conglomerado = conglomerados.find(c => c.id === id);
    if (!conglomerado) return;

    document.getElementById('modalConglomeradoId').textContent = `DETALLES DEL CONGLOMERADO ${id}`;
    document.getElementById('fechaInicioDetalle').textContent = new Date(conglomerado.fecha_inicio).toLocaleDateString();
    document.getElementById('fechaFinDetalle').textContent = new Date(conglomerado.fecha_finalizacion).toLocaleDateString();
    document.getElementById('departamentoDetalle').textContent = conglomerado.departamento;
    document.getElementById('municipioDetalle').textContent = conglomerado.municipio;
    document.getElementById('corregimientoDetalle').textContent = conglomerado.corregimiento || 'N/A';
    document.getElementById('coordenadasDetalle').textContent = conglomerado.coordenadas_centro;
    document.getElementById('aprobadoPorDetalle').textContent = conglomerado.aprobado_por || 'N/A';
    document.getElementById('precisionDetalle').textContent = conglomerado.precision;
    document.getElementById('fechaAprobacionDetalle').textContent = conglomerado.fecha_aprobacion || 'N/A';
    document.getElementById('estadoDetalle').textContent = conglomerado.estado.toUpperCase();

    const subparcelasTable = document.getElementById('subparcelasTable');
    subparcelasTable.innerHTML = '';
    conglomerado.subparcelas.forEach(subparcela => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subparcela.id}</td>
            <td>${subparcela.radio}</td>
            <td>${subparcela.azimut}</td>
            <td>${subparcela.distancia_centro}</td>
            <td>${subparcela.materializado}</td>
            <td><span class="color-badge" style="background-color: ${subparcela.color}"></span> ${subparcela.color}</td>
            <td>${subparcela.posicion}</td>
        `;
        subparcelasTable.appendChild(row);
    });

    const muestrasTable = document.getElementById('muestrasTable');
    muestrasTable.innerHTML = '';
    const muestrasAsociadas = muestras.filter(m => m.id_conglomerado === id);
    muestrasAsociadas.forEach(muestra => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${muestra.id}</td>
            <td>${new Date(muestra.fecha_recoleccion).toLocaleDateString()}</td>
            <td>${muestra.azimut}</td>
            <td>${muestra.distancia_horizontal}</td>
            <td>${muestra.profundidad}</td>
            <td>${muestra.color_suelo}</td>
            <td>${muestra.peso_fresco}</td>
        `;
        muestrasTable.appendChild(row);
    });

    document.getElementById('modalDetalles').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Mostrar detalles de una muestra
function showMuestraDetails(id) {
    const muestra = muestras.find(m => m.id === id);
    if (!muestra) return;

    const conglomerado = conglomerados.find(c => c.id === muestra.id_conglomerado) || {};
    document.getElementById('modalMuestraId').textContent = `DETALLES DE LA MUESTRA ${id}`;
    document.getElementById('conglomeradoMuestraDetalle').textContent = `${conglomerado.id || 'N/A'} (${conglomerado.departamento || ''}, ${conglomerado.municipio || ''})`;
    document.getElementById('subparcelaMuestraDetalle').textContent = muestra.id_subparcela;
    document.getElementById('fechaRecoleccionDetalle').textContent = new Date(muestra.fecha_recoleccion).toLocaleDateString();
    document.getElementById('azimutMuestraDetalle').textContent = muestra.azimut;
    document.getElementById('distanciaHorizontalDetalle').textContent = muestra.distancia_horizontal;
    document.getElementById('profundidadDetalle').textContent = muestra.profundidad;
    document.getElementById('colorSueloDetalle').textContent = muestra.color_suelo;
    document.getElementById('pesoFrescoDetalle').textContent = muestra.peso_fresco;
    document.getElementById('estadoMuestraDetalle').textContent = (muestra.estado || 'pendiente').toUpperCase();
    document.getElementById('carbonoDetalle').textContent = muestra.carbono || 'N/A';
    document.getElementById('densidadDetalle').textContent = muestra.densidad || 'N/A';
    document.getElementById('fertilidadDetalle').textContent = muestra.fertilidad || 'N/A';
    document.getElementById('observacionesDetalle').textContent = muestra.observaciones || 'N/A';

    document.getElementById('modalDetallesMuestra').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Añadir subparcela dinámicamente
function addSubparcela() {
    const subparcelasContainer = document.getElementById('subparcelasContainer');
    const subparcelaCount = subparcelasContainer.children.length + 1;

    const subparcelaInput = document.createElement('div');
    subparcelaInput.className = 'subparcela-input';
    subparcelaInput.innerHTML = `
        <h4>Subparcela ${subparcelaCount}</h4>
        <div class="form-group">
            <label>ID Subparcela:</label>
            <input type="text" class="subparcela-id" required>
        </div>
        <div class="form-group">
            <label>Radio (m):</label>
            <input type="number" class="subparcela-radio" required>
        </div>
        <div class="form-group">
            <label>Azimut:</label>
            <input type="text" class="subparcela-azimut" placeholder="Ej: 45°" required>
        </div>
        <div class="form-group">
            <label>Distancia al Centro (m):</label>
            <input type="number" class="subparcela-distancia" required>
        </div>
        <div class="form-group">
            <label>Materializado:</label>
            <input type="text" class="subparcela-materializado" required>
        </div>
        <div class="form-group">
            <label>Color:</label>
            <input type="color" class="subparcela-color" required>
        </div>
        <div class="form-group">
            <label>Posición:</label>
            <input type="text" class="subparcela-posicion" required>
        </div>
    `;
    subparcelasContainer.appendChild(subparcelaInput);
}

// Eliminar un elemento
function deleteItem(id, tipo) {
    let array;
    if (tipo === 'conglomerado') array = conglomerados;
    else if (tipo === 'muestra') array = muestras;
    else if (tipo === 'ruta') array = rutas;

    const index = array.findIndex(item => item.id === id);
    if (index !== -1) {
        const item = array.splice(index, 1)[0];
        item.estado = 'eliminado';
        papelera.push({ ...item, tipo });
        saveToLocalStorage();
        loadData();
    }
}

// Restaurar un elemento
function restoreItem(id, tipo) {
    const index = papelera.findIndex(item => item.id === id && item.tipo === tipo);
    if (index !== -1) {
        const item = papelera.splice(index, 1)[0];
        item.estado = 'pendientes';
        if (tipo === 'conglomerado') conglomerados.push(item);
        else if (tipo === 'muestra') muestras.push(item);
        else if (tipo === 'ruta') rutas.push(item);
        saveToLocalStorage();
        loadData();
    }
}

// Eliminar permanentemente un elemento
function deletePermanently(id, tipo) {
    const index = papelera.findIndex(item => item.id === id && item.tipo === tipo);
    if (index !== -1) {
        papelera.splice(index, 1);
        saveToLocalStorage();
        loadData();
    }
}
// Inicializar el mapa
let map;
let userLocationMarker; // Marcador para la ubicación del usuario
let routePolyline; // Polilínea para la ruta

function initializeMap() {
    // Inicializar el mapa
    map = L.map('map').setView([6.25, -75.56], 12); // Coordenadas iniciales

    // Agregar capa base del mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Datos de prueba para los conglomerados
    const conglomerados = [
        {
            id: "CONG001",
            nombre: "Conglomerado 1",
            coordenadas: [6.25, -75.56],
        },
        {
            id: "CONG002",
            nombre: "Conglomerado 2",
            coordenadas: [6.20, -75.60],
        }
    ];

    // Función para obtener la ubicación del usuario
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const userLocation = [position.coords.latitude, position.coords.longitude];
                    console.log("Ubicación del usuario:", userLocation);

                    // Agregar marcador de la ubicación del usuario
                    if (userLocationMarker) {
                        map.removeLayer(userLocationMarker);
                    }
                    userLocationMarker = L.marker(userLocation).addTo(map);
                    userLocationMarker.bindPopup("Tu ubicación actual");

                    // Centrar el mapa en la ubicación del usuario
                    map.setView(userLocation, 14);

                    // Dibujar rutas hacia los conglomerados
                    drawRoutes(userLocation);
                },
                error => {
                    console.error("Error al obtener la ubicación del usuario:", error);
                }
            );
        } else {
            console.error("Geolocalización no soportada en este navegador.");
        }
    }

    // Función para dibujar rutas hacia los conglomerados
    function drawRoutes(userLocation) {
        if (routePolyline) {
            map.removeLayer(routePolyline);
        }

        // Dibujar rutas hacia cada conglomerado
        routePolyline = L.polyline([], { color: 'blue', weight: 3 }).addTo(map);
        conglomerados.forEach(conglomerado => {
            const route = [userLocation, conglomerado.coordenadas];
            routePolyline.addLatLngs(route);
        });
    }

    // Obtener la ubicación del usuario al cargar el mapa
    getUserLocation();
}

// Llamar a initializeMap cuando se seleccione la sección de rutas
function changeSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';

        // Inicializar el mapa si es la sección de rutas
        if (sectionId === 'rutasSection') {
            initializeMap();
        }
    }

    // Actualizar el título principal
    const mainTitle = document.getElementById('mainTitle');
    switch (sectionId) {
        case 'conglomeradosSection':
            mainTitle.textContent = 'CONGLOMERADOS';
            break;
        case 'muestrasSection':
            mainTitle.textContent = 'MUESTRAS';
            break;
        case 'rutasSection':
            mainTitle.textContent = 'RUTAS DE MUESTREO';
            break;
        case 'papeleraSection':
            mainTitle.textContent = 'PAPELERA';
            break;
    }
}
// Editar un conglomerado
function editConglomerado(id) {
    alert(`Editar conglomerado ${id}`);
}

// Editar una muestra
function editMuestra(id) {
    alert(`Editar muestra ${id}`);
}

// Editar una ruta
function editRuta(id) {
    alert(`Editar ruta ${id}`);
}

// Inicializar la aplicación
initApp();