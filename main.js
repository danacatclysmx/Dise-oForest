// Espera a que todo el contenido del DOM esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", function () {

  // 1. FUNCIONALIDAD DEL BOTÓN TOGGLE (Animación mejorada)

  // Se obtiene el contenedor principal que manejará las clases para el cambio de paneles
  const container = document.getElementById("container");
  
  // Se obtiene el botón que activará el overlay (cambio de paneles)
  const overlayBtn = document.getElementById("overlayBtn");

  // Si existe el botón overlayBtn (evita errores si no está en el DOM)
  if (overlayBtn) {
    // Se asigna un evento 'click' al botón
    overlayBtn.addEventListener("click", () => {

      // Al hacer click, se alterna la clase CSS 'right-panel-active' en el contenedor
      // Esto cambia la vista del formulario (por ejemplo, de login a registro o viceversa)
      container.classList.toggle("right-panel-active");

      // Agrega temporalmente la clase 'btnScaled' para aplicar una animación de escala al botón
      overlayBtn.classList.add("btnScaled");

      // Después de 600 milisegundos (duración de la animación), se elimina la clase 'btnScaled'
      setTimeout(() => {
        overlayBtn.classList.remove("btnScaled");
      }, 600);
    });
  }

  // 2. VALIDACIÓN DEL FORMULARIO DE LOGIN (Con mejoras visuales y de seguridad)

  // Se obtiene el formulario de login por su ID
  const loginForm = document.querySelector("#loginForm");

  // Solo si existe el formulario (protección extra)
  if (loginForm) {
    // Se agrega un manejador al evento 'submit' (envío de formulario)
    loginForm.addEventListener("submit", function (event) {
      // Previene el envío automático del formulario (evita recargar la página)
      event.preventDefault();

      // Obtiene los valores ingresados por el usuario en los campos de texto, eliminando espacios
      const usuario = document.getElementById("usuario").value.trim();
      const contrasena = document.getElementById("contrasena").value.trim();
      
      // Se obtiene el contenedor del mensaje de error para mostrar avisos
      const mensajeError = document.getElementById("mensajeError");

      // Validación inicial: Verifica si alguno de los campos está vacío
      if (!usuario || !contrasena) {
        if (mensajeError) {
          mensajeError.textContent = "Por favor complete todos los campos";
        }
        // Sale de la función para no continuar con la autenticación
        return;
      }

      // Si los campos están llenos, simula un proceso de autenticación
      authenticateUser(usuario, contrasena)
        .then((redirectPath) => {
          // Si la autenticación fue exitosa, redirecciona al usuario a la página correspondiente
          if (redirectPath) {
            window.location.href = redirectPath;
          }
        })
        .catch((error) => {
          // Si hubo un error en la autenticación (credenciales incorrectas), muestra el mensaje
          if (mensajeError) {
            mensajeError.textContent = error.message;
          }
        });
    });
  }

  // 3. FUNCIÓN SIMULADA DE AUTENTICACIÓN
  // Esta función debería ser reemplazada por una llamada real a un backend en un ambiente de producción

  function authenticateUser(username, password) {
    // Retorna una promesa que se resuelve o se rechaza dependiendo de las credenciales
    return new Promise((resolve, reject) => {

      // Simula un pequeño retraso de red de 500 milisegundos
      setTimeout(() => {

        // Diccionario de credenciales válidas (normalmente esto vendría de una base de datos o servidor)
        const validCredentials = {
          1: { password: "1", redirect: "jefe.html" },     // Usuario 1 se redirige a "jefe.html"
          2: { password: "2", redirect: "tecnico.html" },  // Usuario 2 se redirige a "tecnico.html"
        };

        // Verifica si el usuario existe en el diccionario y si la contraseña coincide
        if (
          validCredentials[username] &&
          validCredentials[username].password === password
        ) {
          // Si las credenciales son correctas, resuelve la promesa con la URL de redirección
          resolve(validCredentials[username].redirect);
        } else {
          // Si no coinciden, rechaza la promesa con un mensaje de error
          reject(new Error("Credenciales incorrectas. Inténtalo de nuevo."));
        }
      }, 500); // Tiempo de espera simulado
    });
  }
});
