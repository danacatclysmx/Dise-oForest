// Control del menú lateral
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const createButton = document.getElementById('createButton');
const statusTabs = document.getElementById('statusTabs');
const mainTitle = document.getElementById('mainTitle');
const conglomeradosContainer = document.getElementById('conglomeradosContainer');

// Datos almacenados localmente
let conglomerados = JSON.parse(localStorage.getItem('conglomerados')) || [];
let papelera = JSON.parse(localStorage.getItem('papelera')) || [];
let currentSection = 'conglomerados'; // 'conglomerados' o 'papelera'

// Inicializar la aplicación
function initApp() {
    loadConglomerados();
    setupEventListeners();
}

// Cargar conglomerados según la sección actual
function loadConglomerados() {
    conglomeradosContainer.innerHTML = '';
    
    if (currentSection === 'conglomerados') {
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
        
        // Activar el primer filtro por defecto
        filterConglomerados('pendientes');
    } else {
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

// Crear tarjeta de conglomerado
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

// Configurar event listeners
function setupEventListeners() {
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
        document.getElementById('modalCrear').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    });
    
    // Cerrar modal de creación
    document.getElementById('closeCrearModal').addEventListener('click', function() {
        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    document.getElementById('cancelarCrear').addEventListener('click', function() {
        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
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
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Generar un ID único para el nuevo conglomerado
        const nuevoId = 'CONG_' + Math.floor(10000 + Math.random() * 90000);
        
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
        document.getElementById('modalCrear').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.reset();
        
        // Recargar la lista
        if (currentSection === 'conglomerados') {
            loadConglomerados();
        }
    });
    
    // Cerrar modal de detalles
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('modalDetalles').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    document.getElementById('modalDetalles').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

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
    
    // Mostrar modal
    document.getElementById('modalDetalles').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cambiar estado de un conglomerado
function changeStatus(id, newStatus) {
    const index = conglomerados.findIndex(c => c.id === id);
    
    if (index !== -1) {
        if (newStatus === 'corregir') {
            // Implementar lógica para corregir
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
        document.getElementById('modalDetalles').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Editar conglomerado
function editConglomerado(id) {
    alert(`Editando conglomerado ${id} - Implementar lógica de edición`);
}

// Eliminar conglomerado (mover a papelera)
function deleteConglomerado(id) {
    if (confirm(`¿Estás seguro de que deseas mover el conglomerado ${id} a la papelera?`)) {
        const index = conglomerados.findIndex(c => c.id === id);
        
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
    const index = papelera.findIndex(c => c.id === id);
    
    if (index !== -1) {
        // Mover de vuelta a la lista principal
        conglomerados.push(papelera[index]);
        // Eliminar de la papelera
        papelera.splice(index, 1);
        
        saveToLocalStorage();
        loadConglomerados();
        document.getElementById('modalDetalles').style.display = 'none';
        document.body.style.overflow = 'auto';
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
            document.getElementById('modalDetalles').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Filtrar conglomerados por estado
function filterConglomerados(status) {
    // Actualizar pestañas activas
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar conglomerados
    const cards = document.querySelectorAll('.conglomerado');
    cards.forEach(card => {
        if (card.dataset.status === status) {
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

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);