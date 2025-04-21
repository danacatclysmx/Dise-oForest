// Control del menú lateral
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const createButton = document.getElementById('createButton');

// Alternar menú lateral
menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    menuToggle.classList.toggle('open');
});

// Cerrar menú al hacer clic en el overlay
overlay.addEventListener('click', function() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    menuToggle.classList.remove('open');
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && e.target !== menuToggle) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.classList.remove('open');
    }
});

// Funcionalidad para el menú lateral
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// Botón CREAR
createButton.addEventListener('click', function() {
    alert('Creando nuevo elemento');
});

// Datos de ejemplo para los conglomerados
const conglomeradosData = {
    "CONG_004523": {
        "coordenadas_centro": "6°15'00\"N 75°34'00\"W",
        "departamento": "Antioquia",
        "municipio": "Medellín",
        "corregimiento": "Santa Elena",
        "fecha_inicio": "15/05/2024",
        "fecha_finalizacion": "17/05/2024",
        "aprobado_por": "Juan Pérez",
        "precision": "±0.35 m",
        "fecha_aprobacion": "20/05/2024",
        "punto_referencia": {
            "tipo": "Árbol destacado",
            "azimut": "45°",
            "distancia_horizontal": "15 m"
        },
        "subparcelas": [
            {
                "id": "SPF1",
                "radio": "40 m",
                "azimut": "0°",
                "distancia_centro": "0 m",
                "materializado": "Sí",
                "color": "Rojo",
                "posicion": "Centro"
            },
            {
                "id": "SPN",
                "radio": "40 m",
                "azimut": "0°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Azul",
                "posicion": "Norte"
            },
            {
                "id": "SPE",
                "radio": "40 m",
                "azimut": "90°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Verde",
                "posicion": "Este"
            },
            {
                "id": "SPS",
                "radio": "40 m",
                "azimut": "180°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Amarillo",
                "posicion": "Sur"
            },
            {
                "id": "SPO",
                "radio": "40 m",
                "azimut": "270°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Blanco",
                "posicion": "Oeste"
            }
        ]
    },
    "CONG_004524": {
        "coordenadas_centro": "4°38'00\"N 74°05'00\"W",
        "departamento": "Cundinamarca",
        "municipio": "Bogotá",
        "corregimiento": "Usaquén",
        "fecha_inicio": "18/05/2024",
        "fecha_finalizacion": "20/05/2024",
        "aprobado_por": "María Gómez",
        "precision": "±0.25 m",
        "fecha_aprobacion": "22/05/2024",
        "punto_referencia": {
            "tipo": "Roca grande",
            "azimut": "120°",
            "distancia_horizontal": "20 m"
        },
        "subparcelas": [
            {
                "id": "SPF1",
                "radio": "40 m",
                "azimut": "0°",
                "distancia_centro": "0 m",
                "materializado": "Sí",
                "color": "Rojo",
                "posicion": "Centro"
            },
            {
                "id": "SPN",
                "radio": "40 m",
                "azimut": "0°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Azul",
                "posicion": "Norte"
            },
            {
                "id": "SPE",
                "radio": "40 m",
                "azimut": "90°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Verde",
                "posicion": "Este"
            },
            {
                "id": "SPS",
                "radio": "40 m",
                "azimut": "180°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Amarillo",
                "posicion": "Sur"
            },
            {
                "id": "SPO",
                "radio": "40 m",
                "azimut": "270°",
                "distancia_centro": "80 m",
                "materializado": "Sí",
                "color": "Blanco",
                "posicion": "Oeste"
            }
        ]
    }
};

// Función para mostrar/ocultar el menú de opciones
function toggleOptionsMenu(button) {
    const dropdown = button.nextElementSibling;
    dropdown.classList.toggle('show');
    
    // Cerrar otros menús abiertos
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
    const data = conglomeradosData[conglomeradoId];
    
    if (!data) return;
    
    // Llenar información general
    document.getElementById('modalConglomeradoId').textContent = conglomeradoId;
    document.getElementById('fechaInicio').textContent = data.fecha_inicio;
    document.getElementById('fechaFin').textContent = data.fecha_finalizacion;
    document.getElementById('departamento').textContent = data.departamento;
    document.getElementById('municipio').textContent = data.municipio;
    document.getElementById('corregimiento').textContent = data.corregimiento;
    document.getElementById('coordenadas').textContent = data.coordenadas_centro;
    document.getElementById('aprobadoPor').textContent = data.aprobado_por;
    document.getElementById('precision').textContent = data.precision;
    document.getElementById('fechaAprobacion').textContent = data.fecha_aprobacion;
    
    // Llenar punto de referencia
    document.getElementById('puntoTipo').textContent = data.punto_referencia.tipo;
    document.getElementById('puntoAzimut').textContent = data.punto_referencia.azimut;
    document.getElementById('puntoDistancia').textContent = data.punto_referencia.distancia_horizontal;
    
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
    
    // Mostrar modal
    document.getElementById('modalDetalles').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Funciones para las opciones del menú
function editConglomerado(id) {
    alert(`Editando conglomerado ${id}`);
}

function deleteConglomerado(id) {
    if (confirm(`¿Estás seguro de que deseas eliminar el conglomerado ${id}?`)) {
        alert(`Conglomerado ${id} eliminado`);
    }
}

// Cerrar modal al hacer clic en la X
document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('modalDetalles').style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Cerrar modal al hacer clic fuera del contenido
document.getElementById('modalDetalles').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Botones de acción (ejemplo)
document.querySelectorAll('.action-button').forEach(button => {
    button.addEventListener('click', function() {
        const action = this.textContent;
        const id = document.getElementById('modalConglomeradoId').textContent;
        alert(`Acción "${action}" seleccionada para el conglomerado ${id}`);
        document.getElementById('modalDetalles').style.display = 'none';
        document.body.style.overflow = 'auto';
    });
});

// Filtrar conglomerados por estado
function filterConglomerados(status) {
    // Actualizar pestañas activas
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar conglomerados
    const conglomerados = document.querySelectorAll('.conglomerado');
    conglomerados.forEach(cong => {
        if (cong.dataset.status === status || status === 'todos') {
            cong.style.display = 'block';
        } else {
            cong.style.display = 'none';
        }
    });
}