'use strict';

// Constantes y configuración
const CONFIG = {
  messageTimeout: 3500,
  minPasswordLength: 6,
  maxLoginAttempts: 3,
  sessionDuration: 24 * 60 * 60 * 1000,
  colors: {
    error: '#dc3545',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107'
  },
  defaultAvatar: 'https://via.placeholder.com/150',
  roles: {
    ADMIN: 'admin',
    USER: 'user',
    LIBRARIAN: 'librarian'
  }
};

// Utilidades
const Utils = {
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasMinLength = password.length >= CONFIG.minPasswordLength;
    
    return {
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasMinLength,
      errors: {
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        minLength: !hasMinLength
      }
    };
  },

  formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  showNotification(message, type = 'info', duration = CONFIG.messageTimeout) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    notification.innerHTML = `
      <i class="fas fa-${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

class StorageManager {
  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error al obtener ${key}:`, error);
      return defaultValue;
    }
  }

  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
      return false;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error al eliminar ${key}:`, error);
      return false;
    }
  }
}

class UIManager {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.contactForm = document.querySelector('.contact-form');
    this.loginForm = document.querySelector('.login-form');
    this.registroForm = document.querySelector('.registro-form');
    this.mensajeExito = document.getElementById('mensaje-exito');
    this.loginMsg = document.getElementById('login-msg');
    this.registroMsg = document.getElementById('registro-msg');
    this.mensajesContainer = document.getElementById('mensajes-lista');
  }

  setupEventListeners() {
    if (this.contactForm) {
      this.contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
    }
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
    if (this.registroForm) {
      this.registroForm.addEventListener('submit', this.handleRegistro.bind(this));
    }

    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
      input.addEventListener('input', Utils.debounce((e) => {
        this.handleSearch(e.target.value, e.target.dataset.searchType);
      }, 300));
    });

    this.initializeMensajesList();
    this.checkAuthentication();
  }

  showMessage(message, type = 'info', target) {
    const color = CONFIG.colors[type];
    
    if (target) {
      target.style.display = 'block';
      target.textContent = message;
      target.style.cssText = `
        display: block;
        background: #fff;
        color: ${color};
        border-left: 4px solid ${color};
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
      `;
      
      setTimeout(() => {
        target.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => target.style.display = 'none', 300);
      }, CONFIG.messageTimeout);
    } else {
      Utils.showNotification(message, type);
    }
  }

  async handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.contactForm);
    const contactData = {
      nombre: formData.get('nombre')?.trim(),
      correo: formData.get('correo')?.trim(),
      asunto: formData.get('asunto')?.trim(),
      mensaje: formData.get('mensaje')?.trim()
    };

    if (!Object.values(contactData).every(Boolean)) {
      this.showMessage('Por favor complete todos los campos.', 'error', this.mensajeExito);
      return;
    }

    if (!Utils.validateEmail(contactData.correo)) {
      this.showMessage('Por favor ingrese un correo electrónico válido.', 'error', this.mensajeExito);
      return;
    }

    const nuevoMensaje = {
      ...contactData,
      id: Utils.generateId(),
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    };

    const mensajes = StorageManager.getItem('mensajesContacto', []);
    mensajes.unshift(nuevoMensaje);
    
    if (StorageManager.setItem('mensajesContacto', mensajes)) {
      this.showMessage('¡Mensaje enviado con éxito!', 'success', this.mensajeExito);
      this.contactForm.reset();
      document.dispatchEvent(new CustomEvent('mensajeEnviado', { detail: nuevoMensaje }));
    } else {
      this.showMessage('Error al enviar el mensaje. Intente nuevamente.', 'error', this.mensajeExito);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(this.loginForm);
    const usuario = formData.get('login-user')?.trim();
    const password = formData.get('login-pass')?.trim();

    if (!usuario || !password) {
      this.showMessage('Por favor ingrese usuario y contraseña.', 'error', this.loginMsg);
      return;
    }

    const loginAttempts = StorageManager.getItem(`loginAttempts_${usuario}`, 0);
    if (loginAttempts >= CONFIG.maxLoginAttempts) {
      const lastAttempt = new Date(StorageManager.getItem(`lastLoginAttempt_${usuario}`));
      const timeDiff = new Date() - lastAttempt;
      
      if (timeDiff < 15 * 60 * 1000) {
        this.showMessage('Cuenta bloqueada temporalmente. Intente más tarde.', 'error', this.loginMsg);
        return;
      }
      
      StorageManager.removeItem(`loginAttempts_${usuario}`);
      StorageManager.removeItem(`lastLoginAttempt_${usuario}`);
    }

    const usuarios = StorageManager.getItem('usuarios', []);
    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (encontrado) {
      StorageManager.removeItem(`loginAttempts_${usuario}`);
      StorageManager.removeItem(`lastLoginAttempt_${usuario}`);

      const sessionData = {
        ...encontrado,
        fechaAcceso: new Date().toISOString(),
        sessionExpires: new Date().getTime() + CONFIG.sessionDuration
      };

      if (StorageManager.setItem('usuarioActivo', sessionData)) {
        this.showMessage(`¡Bienvenido, ${encontrado.nombreCompleto}!`, 'success', this.loginMsg);
        document.dispatchEvent(new CustomEvent('loginSuccess', { detail: encontrado }));
        
        setTimeout(() => {
          window.location.href = encontrado.role === CONFIG.roles.ADMIN ? 'admin.html' : 'panel.html';
        }, 1200);
      } else {
        this.showMessage('Error al iniciar sesión. Intente nuevamente.', 'error', this.loginMsg);
      }
    } else {
      const newAttempts = loginAttempts + 1;
      StorageManager.setItem(`loginAttempts_${usuario}`, newAttempts);
      StorageManager.setItem(`lastLoginAttempt_${usuario}`, new Date().toISOString());

      const remainingAttempts = CONFIG.maxLoginAttempts - newAttempts;
      this.showMessage(
        `Credenciales incorrectas. ${remainingAttempts} intentos restantes.`,
        'error',
        this.loginMsg
      );
    }
  }

  async handleRegistro(e) {
    e.preventDefault();
    const formData = new FormData(this.registroForm);
    const userData = {
      usuario: formData.get('register-user')?.trim(),
      nombreCompleto: formData.get('register-full')?.trim(),
      password: formData.get('register-pass')?.trim(),
      role: formData.get('register-role')?.trim()
    };

    if (!Object.values(userData).every(Boolean)) {
      this.showMessage('Por favor complete todos los campos.', 'error', this.registroMsg);
      return;
    }

    const passwordValidation = Utils.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      const errors = [];
      if (passwordValidation.errors.minLength) errors.push(`mínimo ${CONFIG.minPasswordLength} caracteres`);
      if (passwordValidation.errors.upperCase) errors.push('una mayúscula');
      if (passwordValidation.errors.lowerCase) errors.push('una minúscula');
      if (passwordValidation.errors.numbers) errors.push('un número');
      
      this.showMessage(
        `La contraseña debe contener: ${errors.join(', ')}.`,
        'error',
        this.registroMsg
      );
      return;
    }

    const usuarios = StorageManager.getItem('usuarios', []);
    if (usuarios.some(u => u.usuario === userData.usuario)) {
      this.showMessage('El usuario ya existe.', 'error', this.registroMsg);
      return;
    }

    const nuevoUsuario = {
      ...userData,
      id: Utils.generateId(),
      fechaRegistro: new Date().toISOString(),
      historialPrestamos: []
    };

    usuarios.push(nuevoUsuario);
    if (StorageManager.setItem('usuarios', usuarios)) {
      this.showMessage('¡Registro exitoso! Ya puedes iniciar sesión.', 'success', this.registroMsg);
      this.registroForm.reset();
      document.dispatchEvent(new CustomEvent('registroExitoso', { detail: nuevoUsuario }));
    } else {
      this.showMessage('Error al registrar usuario. Intente nuevamente.', 'error', this.registroMsg);
    }
  }

  checkAuthentication() {
    const session = StorageManager.getItem('usuarioActivo');
    if (session && new Date().getTime() > session.sessionExpires) {
      StorageManager.removeItem('usuarioActivo');
      this.showMessage('Tu sesión ha expirado. Inicia sesión nuevamente.', 'warning');
      window.location.href = 'login.html';
    }
  }

  initializeMensajesList() {
    if (!this.mensajesContainer) return;

    const mensajes = StorageManager.getItem('mensajesContacto', []);
    if (mensajes.length === 0) {
      this.mensajesContainer.innerHTML = '<p class="no-mensajes">No hay mensajes guardados.</p>';
      return;
    }

    const tabla = document.createElement('table');
    tabla.className = 'mensajes-tabla';
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Asunto</th>
          <th>Mensaje</th>
          <th>Fecha</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = tabla.querySelector('tbody');
    mensajes.forEach(msg => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${msg.nombre}</td>
        <td>${msg.correo}</td>
        <td>${msg.asunto}</td>
        <td>${msg.mensaje}</td>
        <td>${Utils.formatDate(msg.fecha)}</td>
        <td><span class="estado ${msg.estado || 'pendiente'}">${msg.estado || 'pendiente'}</span></td>
      `;
      tbody.appendChild(fila);
    });

    this.mensajesContainer.innerHTML = '';
    this.mensajesContainer.appendChild(tabla);
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new UIManager();
});
