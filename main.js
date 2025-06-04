// Espera a que todo el contenido del DOM esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", function () {
    // Funciones para manejar cookies
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
    
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    function eraseCookie(name) {   
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    
    // Mostrar el banner de cookies si no se ha aceptado/rechazado
    const cookieBanner = document.getElementById("cookieBanner");
    const acceptCookies = document.getElementById("acceptCookies");
    const rejectCookies = document.getElementById("rejectCookies");
    
    if (!getCookie("cookieConsent")) {
        setTimeout(() => {
            cookieBanner.classList.add("show");
        }, 2000);
    }
    
    // Manejar aceptación de cookies
    acceptCookies.addEventListener("click", function() {
        setCookie("cookieConsent", "accepted", 365);
        cookieBanner.classList.remove("show");
        // Si el usuario ya ha marcado recordar usuario, lo cargamos
        if (getCookie("rememberUser") === "true") {
            const savedUser = getCookie("savedUsername");
            if (savedUser) {
                document.getElementById("usuario").value = savedUser;
                document.getElementById("rememberMe").checked = true;
            }
        }
    });
    
    // Manejar rechazo de cookies
    rejectCookies.addEventListener("click", function() {
        setCookie("cookieConsent", "rejected", 365);
        cookieBanner.classList.remove("show");
    });
    
    // 1. FUNCIONALIDAD DEL BOTÓN TOGGLE (Animación mejorada)
    const container = document.getElementById("container");
    const overlayBtn = document.getElementById("overlayBtn");
    
    if (overlayBtn) {
        overlayBtn.addEventListener("click", () => {
            container.classList.toggle("right-panel-active");
            overlayBtn.classList.add("btnScaled");
            
            setTimeout(() => {
                overlayBtn.classList.remove("btnScaled");
            }, 600);
        });
    }
    
    // 2. VALIDACIÓN DEL FORMULARIO DE LOGIN (Con mejoras visuales y de seguridad)
    const loginForm = document.querySelector("#loginForm");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    const userField = document.getElementById("usuario");
    
    // Cargar usuario guardado si las cookies están aceptadas
    if (getCookie("cookieConsent") === "accepted" && getCookie("rememberUser") === "true") {
        const savedUser = getCookie("savedUsername");
        if (savedUser) {
            userField.value = savedUser;
            rememberMeCheckbox.checked = true;
        }
    }
    
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            
            const usuario = document.getElementById("usuario").value.trim();
            const contrasena = document.getElementById("contrasena").value.trim();
            const mensajeError = document.getElementById("mensajeError");
            
            if (!usuario || !contrasena) {
                if (mensajeError) {
                    mensajeError.textContent = "Por favor complete todos los campos";
                }
                return;
            }
            
            // Guardar usuario si las cookies están aceptadas
            if (getCookie("cookieConsent") === "accepted" && rememberMeCheckbox.checked) {
                setCookie("rememberUser", "true", 30);
                setCookie("savedUsername", usuario, 30);
            } else if (getCookie("cookieConsent") === "accepted") {
                // Si desmarca recordar usuario, borramos la cookie
                eraseCookie("savedUsername");
                setCookie("rememberUser", "false", 30);
            }
            
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
    
    // 3. FUNCIÓN SIMULADA DE AUTENTICACIÓN
    function authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const validCredentials = {
                    Arlec_Mohamed: { password: "Arlec_Mohamed", redirect: "jefe.html" },
                    Larita_Garcia: { password: "Larita_Garcia", redirect: "tecnico.html" },
                };
                
                if (validCredentials[username] && validCredentials[username].password === password) {
                    resolve(validCredentials[username].redirect);
                } else {
                    reject(new Error("Credenciales incorrectas. Inténtalo de nuevo."));
                }
            }, 500);
        });
    }
});