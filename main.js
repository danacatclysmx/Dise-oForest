document.addEventListener("DOMContentLoaded", function () {
  // 1. Funcionalidad del botón de toggle (mejorada)
  const container = document.getElementById("container");
  const overlayBtn = document.getElementById("overlayBtn");

  if (overlayBtn) {
    overlayBtn.addEventListener("click", () => {
      container.classList.toggle("right-panel-active");

      // Animación mejorada
      overlayBtn.classList.add("btnScaled");
      setTimeout(() => {
        overlayBtn.classList.remove("btnScaled");
      }, 600);
    });
  }

  // 2. Validación del formulario de login (mejorada)
  const loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const usuario = document.getElementById("usuario").value.trim();
      const contrasena = document.getElementById("contrasena").value.trim();
      const mensajeError = document.getElementById("mensajeError");

      // Validación básica de campos vacíos
      if (!usuario || !contrasena) {
        if (mensajeError) {
          mensajeError.textContent = "Por favor complete todos los campos";
        }
        return;
      }

      // Simulación de autenticación (en producción usaría una API)
      authenticateUser(usuario, contrasena)
        .then((redirectPath) => {
          if (redirectPath) {
            window.location.href = redirectPath;
          }
        })
        .catch((error) => {
          if (mensajeError) {
            mensajeError.textContent = error.message;
          }
        });
    });
  }

  // Función simulada de autenticación (reemplazar con llamada real a API)
  function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      // Simulamos un retraso de red
      setTimeout(() => {
        // EN PRODUCCIÓN: Esto debería ser reemplazado por una llamada a tu backend
        const validCredentials = {
          1: { password: "1", redirect: "jefe.html" },
          2: { password: "2", redirect: "tecnico.html" },
        };

        if (
          validCredentials[username] &&
          validCredentials[username].password === password
        ) {
          resolve(validCredentials[username].redirect);
        } else {
          reject(new Error("Credenciales incorrectas. Inténtalo de nuevo."));
        }
      }, 500); // Simula tiempo de respuesta
    });
  }
});
