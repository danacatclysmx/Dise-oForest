document.addEventListener("DOMContentLoaded", function () {
  // Función mejorada para cargar secciones
  function loadSection(sectionId, event = null) {
    console.log(`Intentando cargar sección: ${sectionId}`);

    // Ocultar todas las secciones primero
    const sections = document.querySelectorAll(".content-section");
    sections.forEach((section) => {
      section.classList.remove("active");
    });

    // Mostrar la sección solicitada
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
    } else {
      console.error(`No se encontró la sección con ID: ${sectionId}-section`);
    }

    // Actualizar menú activo
    const menuItems = document.querySelectorAll(".sidebar-menu .menu-item");
    menuItems.forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("onclick")?.includes(`'${sectionId}'`)) {
        item.classList.add("active");
      }
    });
  }

  // Función para filtrar por color
  function filterByColor(color, event) {
    const conglomerados = document.querySelectorAll(".conglomerado-view");
    const filterOptions = document.querySelectorAll(".filter-option");

    // Actualizar opciones de filtro
    filterOptions.forEach((option) => {
      option.classList.remove("active");
    });
    event.currentTarget.classList.add("active");

    // Aplicar filtro
    conglomerados.forEach((conglomerado) => {
      conglomerado.style.display =
        color === "all" || conglomerado.dataset.color === color
          ? "block"
          : "none";
    });
  }

  // Función para mostrar detalles (simplificada)
  function showDetails(conglomeradoId) {
    try {
      const modal = document.getElementById("modalDetalles");
      if (modal) {
        modal.style.display = "flex";
        document.getElementById("modalConglomeradoId").textContent =
          conglomeradoId;
      }
    } catch (error) {
      console.error("Error en showDetails:", error);
    }
  }

  // Cerrar modal
  document.getElementById("closeModal")?.addEventListener("click", function () {
    document.getElementById("modalDetalles").style.display = "none";
  });

  // Menú hamburguesa
  document.getElementById("menuToggle")?.addEventListener("click", function () {
    document.getElementById("sidebar")?.classList.toggle("active");
    document.getElementById("overlay")?.classList.toggle("active");
  });

  // Overlay para cerrar menú
  document.getElementById("overlay")?.addEventListener("click", function () {
    document.getElementById("sidebar")?.classList.remove("active");
    document.getElementById("overlay")?.classList.remove("active");
  });

  // Inicialización
  loadSection("visualizar"); // Cargar sección por defecto
});
