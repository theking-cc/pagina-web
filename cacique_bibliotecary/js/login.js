// Funcionalidad del sistema de autenticación
document.addEventListener('DOMContentLoaded', () => {
    // Cargar header y footer
    fetch('header.html')
        .then(response => response.text())
        .then(data => document.getElementById('header-placeholder').innerHTML = data);

    // Configuración de las pestañas
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = {
        login: document.getElementById('login-form'),
        registro: document.getElementById('registro-form')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const formType = tab.dataset.tab;
            
            // Actualizar pestañas activas
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Mostrar formulario correspondiente
            Object.keys(forms).forEach(key => {
                forms[key].style.display = key === formType ? 'block' : 'none';
            });
        });
    });

    // Validación del formulario de login
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-pass');
        const button = loginForm.querySelector('.auth-button');
        
        // Resetear errores
        resetFormErrors(loginForm);

        // Validar campos
        let isValid = true;
        if (!validateEmail(email.value)) {
            showError(email, 'Ingresa un correo válido');
            isValid = false;
        }
        if (password.value.length < 6) {
            showError(password, 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        if (isValid) {
            // Simular login
            button.classList.add('loading');
            try {
                await simulateLogin();
                // Guardar datos del usuario
                const userData = {
                    email: email.value,
                    name: 'Usuario Demo',
                    role: 'Estudiante',
                    lastLogin: new Date().toISOString()
                };
                localStorage.setItem('usuarioActivo', JSON.stringify(userData));
                
                // Redirigir al panel
                window.location.href = 'panel.html';
            } catch (error) {
                showError(email, 'Credenciales incorrectas');
            } finally {
                button.classList.remove('loading');
            }
        }
    });

    // Validación del formulario de registro
    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('register-full');
        const email = document.getElementById('register-email');
        const password = document.getElementById('register-pass');
        const confirmPassword = document.getElementById('register-pass-confirm');
        const role = document.getElementById('register-role');
        const terms = document.getElementById('terms');
        const button = registerForm.querySelector('.auth-button');

        // Resetear errores
        resetFormErrors(registerForm);

        // Validar campos
        let isValid = true;
        if (fullName.value.length < 3) {
            showError(fullName, 'El nombre debe tener al menos 3 caracteres');
            isValid = false;
        }
        if (!validateEmail(email.value)) {
            showError(email, 'Ingresa un correo válido');
            isValid = false;
        }
        if (password.value.length < 8) {
            showError(password, 'La contraseña debe tener al menos 8 caracteres');
            isValid = false;
        }
        if (password.value !== confirmPassword.value) {
            showError(confirmPassword, 'Las contraseñas no coinciden');
            isValid = false;
        }
        if (!role.value) {
            showError(role, 'Selecciona un rol');
            isValid = false;
        }
        if (!terms.checked) {
            showError(terms, 'Debes aceptar los términos y condiciones');
            isValid = false;
        }

        if (isValid) {
            // Simular registro
            button.classList.add('loading');
            try {
                await simulateRegister();
                // Mostrar mensaje de éxito y redirigir
                alert('Registro exitoso. Por favor, inicia sesión.');
                location.reload();
            } catch (error) {
                showError(email, 'Error al crear la cuenta. Intenta nuevamente.');
            } finally {
                button.classList.remove('loading');
            }
        }
    });

    // Recuperación de contraseña
    const forgotPassword = document.getElementById('forgot-password');
    forgotPassword?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('Ingresa tu correo electrónico para recuperar tu contraseña:');
        if (email && validateEmail(email)) {
            alert('Se ha enviado un correo con las instrucciones para recuperar tu contraseña.');
        } else if (email) {
            alert('Por favor, ingresa un correo válido.');
        }
    });
});

// Funciones auxiliares
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(element, message) {
    const formGroup = element.closest('.form-group');
    formGroup.classList.add('error');
    const errorDiv = formGroup.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
    }
}

function resetFormErrors(form) {
    form.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
}

// Simulaciones de API
function simulateLogin() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });
}

function simulateRegister() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1500);
    });
}
