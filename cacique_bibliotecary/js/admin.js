'use strict';

class AdminPanel {
  constructor() {
    this.usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
    this.elementos = {
      content: document.getElementById('admin-content'),
      warning: document.getElementById('admin-warning'),
      usuariosLista: document.getElementById('usuarios-lista'),
      mensajesLista: document.getElementById('mensajes-lista'),
      clearBtn: document.getElementById('clear-data-btn')
    };

    this.colors = {
      error: '#B22222',
      success: '#228B22',
      info: '#A0522D',
      usuarios: '#228B22',
      mensajes: '#A0522D'
    };

    this.init();
  }

  showMessage(msg, type = 'info') {
    const color = this.colors[type] || this.colors.info;
    this.elementos.warning.innerHTML = `
      <div style="
        background: #fffbe6;
        border-left: 4px solid ${color};
        padding: 0.7rem 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        color: ${color};
        font-weight: bold;
        text-align: center;
      ">${msg}</div>
    `;

  }

  init() {
    if (!this.validarAcceso()) return;
    
    this.mostrarContenido();
    this.cargarUsuarios();
    this.cargarMensajes();
    this.setupEventListeners();
  }

  validarAcceso() {
    if (!this.usuarioActivo) {
      this.showMessage('⚠️ Debes iniciar sesión para acceder al panel administrativo.', 'error');
      setTimeout(() => { window.location.href = 'login.html'; }, 1800);
      return false;
    }

    if (this.usuarioActivo.role !== 'Bibliotecario') {
      this.showMessage('⚠️ Acceso denegado. Solo bibliotecarios pueden ver esta página.', 'error');
      return false;
    }

    return true;
  }

  mostrarContenido() {
    this.elementos.content.style.display = 'block';
    this.showMessage(
      `Bienvenido, <b>${this.usuarioActivo.nombreCompleto}</b> 
      (<span style='color:#8B4513;'>${this.usuarioActivo.usuario}</span>)`,
      'success'
    );

  }

  cargarUsuarios() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuariosCount = `
      <p style="color:${this.colors.usuarios};font-weight:bold;">
        Total usuarios registrados: ${usuarios.length}
      </p>`;

    if (usuarios.length === 0) {
      this.elementos.usuariosLista.innerHTML = usuariosCount + '<p>No hay usuarios registrados.</p>';
      return;
    }

    const tabla = document.createElement('table');
    tabla.classList.add('usuarios-tabla');
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Nombre Completo</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>`;

    const tbody = document.createElement('tbody');
    usuarios.forEach(usuario => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.usuario}</td>
        <td>${usuario.nombreCompleto}</td>
        <td>${usuario.role}</td>
        <td>
          <button class="edit-btn" data-id="${usuario.usuario}">
            ✏️ Editar
          </button>
          ${usuario.usuario !== this.usuarioActivo.usuario ? 
            `<button class="delete-btn" data-id="${usuario.usuario}">
              🗑️ Eliminar
            </button>` : 
            ''
          }
        </td>`;
      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    this.elementos.usuariosLista.innerHTML = usuariosCount;
    this.elementos.usuariosLista.appendChild(tabla);

  }

  cargarMensajes() {
    const mensajes = JSON.parse(localStorage.getItem('mensajesContacto')) || [];
    const mensajesCount = `
      <p style="color:${this.colors.mensajes};font-weight:bold;">
        Total mensajes almacenados: ${mensajes.length}
      </p>`;

    if (mensajes.length === 0) {
      this.elementos.mensajesLista.innerHTML = mensajesCount + '<p>No hay mensajes almacenados.</p>';
      return;
    }

    const tabla = document.createElement('table');
    tabla.classList.add('mensajes-tabla');
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Asunto</th>
          <th>Mensaje</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>`;

    const tbody = document.createElement('tbody');
    mensajes.forEach(mensaje => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${mensaje.nombre}</td>
        <td>
          <a href="mailto:${mensaje.correo}" title="Enviar correo">
            ${mensaje.correo}
          </a>
        </td>
        <td>${mensaje.asunto}</td>
        <td>${mensaje.mensaje}</td>
        <td>${mensaje.fecha}</td>
        <td>
          <button class="reply-btn" data-email="${mensaje.correo}">
            ↩️ Responder
          </button>
          <button class="delete-msg-btn" data-id="${mensaje.fecha}">
            🗑️ Eliminar
          </button>
        </td>`;
      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    this.elementos.mensajesLista.innerHTML = mensajesCount;
    this.elementos.mensajesLista.appendChild(tabla);

  }

  setupEventListeners() {
    // Botón de limpieza de datos
    this.elementos.clearBtn.addEventListener('click', () => this.limpiarDatos());

    // Eventos para botones de usuarios
    this.elementos.usuariosLista.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('edit-btn')) {
        this.editarUsuario(target.dataset.id);
      } else if (target.classList.contains('delete-btn')) {
        this.eliminarUsuario(target.dataset.id);
      }
    });

    // Eventos para botones de mensajes
    this.elementos.mensajesLista.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('reply-btn')) {
        window.location.href = `mailto:${target.dataset.email}`;
      } else if (target.classList.contains('delete-msg-btn')) {
        this.eliminarMensaje(target.dataset.id);
      }
    });
  }

  editarUsuario(userId) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuarios.find(u => u.usuario === userId);
    if (!usuario) return;

    const nuevoRol = prompt('Nuevo rol (Bibliotecario/Lector):', usuario.role);
    if (!nuevoRol) return;

    if (!['Bibliotecario', 'Lector'].includes(nuevoRol)) {
      this.showMessage('❌ Rol no válido. Use "Bibliotecario" o "Lector".', 'error');
      return;
    }

    usuario.role = nuevoRol;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    this.showMessage('✅ Usuario actualizado correctamente.', 'success');
    setTimeout(() => location.reload(), 1500);
  }

  eliminarUsuario(userId) {
    if (!confirm(`⚠️ ¿Seguro que deseas eliminar al usuario ${userId}?`)) return;

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const nuevosUsuarios = usuarios.filter(u => u.usuario !== userId);
    localStorage.setItem('usuarios', JSON.stringify(nuevosUsuarios));
    this.showMessage('✅ Usuario eliminado correctamente.', 'success');
    setTimeout(() => location.reload(), 1500);
  }

  eliminarMensaje(fecha) {
    if (!confirm('⚠️ ¿Seguro que deseas eliminar este mensaje?')) return;

    const mensajes = JSON.parse(localStorage.getItem('mensajesContacto')) || [];
    const nuevosMensajes = mensajes.filter(m => m.fecha !== fecha);
    localStorage.setItem('mensajesContacto', JSON.stringify(nuevosMensajes));
    this.showMessage('✅ Mensaje eliminado correctamente.', 'success');
    setTimeout(() => location.reload(), 1500);
  }

  limpiarDatos() {
    if (!confirm('⚠️ Esto borrará TODOS los datos de usuarios y mensajes. ¿Continuar?')) return;

    localStorage.removeItem('usuarios');
    localStorage.removeItem('mensajesContacto');
    this.showMessage('✅ Datos limpiados correctamente.', 'success');
    setTimeout(() => location.reload(), 1500);
  }
}

// Inicializar el panel administrativo cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => new AdminPanel());