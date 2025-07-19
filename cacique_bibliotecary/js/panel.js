'use strict';

class PanelManager {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.checkSession();
  }

  initializeElements() {
    this.elements = {
      userGreeting: document.getElementById('user-greeting'),
      userRole: document.getElementById('user-role'),
      fechaAcceso: document.getElementById('fecha-acceso'),
      tablaContainer: document.getElementById('tabla-prestamos'),
      logoutBtn: document.getElementById('logout-btn'),
      searchInput: document.getElementById('search-prestamos'),
      panels: {
        estudiante: document.getElementById('panel-estudiante'),
        profesor: document.getElementById('panel-profesor'),
        bibliotecario: document.getElementById('panel-bibliotecario')
      }
    };

    this.colors = {
      estudiante: '#228B22',
      profesor: '#0066cc',
      bibliotecario: '#A0522D',
      error: '#B22222',
      success: '#228B22',
      info: '#A0522D',
      warning: '#FFA500'
    };

    this.estados = {
      prestado: { color: '#FFA500', icon: 'book' },
      devuelto: { color: '#228B22', icon: 'check-circle' },
      vencido: { color: '#B22222', icon: 'exclamation-circle' }
    };
  }

  setupEventListeners() {
    if (this.elements.logoutBtn) {
      this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', 
        this.debounce((e) => this.buscarPrestamos(e.target.value), 300)
      );
    }

    document.querySelectorAll('.filtro-estado').forEach(filtro => {
      filtro.addEventListener('change', () => this.filtrarPrestamos());
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'usuarioActivo' && !e.newValue) {
        this.redirigirLogin('La sesión ha sido cerrada en otra pestaña.');
      }
    });
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  checkSession() {
    const session = this.getSessionData();
    if (!session) {
      this.redirigirLogin('⚠️ Debes iniciar sesión para acceder al panel.');
      return;
    }

    if (this.isSessionExpired(session)) {
      this.handleLogout('Tu sesión ha expirado.');
      return;
    }

    this.inicializarPanel(session);
  }

  getSessionData() {
    try {
      return JSON.parse(localStorage.getItem('usuarioActivo'));
    } catch (error) {
      console.error('Error al obtener datos de sesión:', error);
      return null;
    }
  }

  isSessionExpired(session) {
    return session.sessionExpires && new Date().getTime() > session.sessionExpires;
  }

  inicializarPanel(usuario) {
    this.mostrarSaludo(usuario);
    this.mostrarRol(usuario);
    this.mostrarFechaAcceso();
    this.mostrarPanelSegunRol(usuario.role);
    this.cargarHistorialPrestamos(usuario);
  }

  mostrarSaludo(usuario) {
    this.showMessage(`¡Bienvenido/a, ${usuario.nombreCompleto}!`, 'success');
  }

  mostrarRol(usuario) {
    const rolColor = this.colors[usuario.role.toLowerCase()] || this.colors.info;
    this.elements.userRole.innerHTML = `
      <div class="role-badge" style="color:${rolColor}">
        <i class="fas fa-user-tag"></i>
        <span>${usuario.role}</span>
      </div>`;
  }

  mostrarFechaAcceso() {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const fecha = new Date().toLocaleDateString('es-ES', options);
    this.elements.fechaAcceso.innerHTML = `
      <div class="fecha-acceso">
        <i class="fas fa-clock"></i>
        <span>Último acceso: ${fecha}</span>
      </div>`;
  }

  mostrarPanelSegunRol(role) {
    Object.entries(this.elements.panels).forEach(([tipo, panel]) => {
      if (panel) {
        panel.style.display = tipo === role.toLowerCase() ? 'block' : 'none';
      }
    });
  }

  async cargarHistorialPrestamos(usuario) {
    try {
      const prestamos = await this.obtenerHistorialPrestamos(usuario.id);
      this.renderizarTablaPrestamos(prestamos);
    } catch (error) {
      this.showMessage('Error al cargar el historial de préstamos', 'error');
      console.error('Error:', error);
    }
  }

  obtenerHistorialPrestamos(userId) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            titulo: 'Los sueños de Einstein',
            prestamo: '01/07/2025',
            devolucion: '15/07/2025',
            estado: 'Prestado',
            categoria: 'Ciencia'
          },
          {
            id: 2,
            titulo: 'Viaje más allá de las estrellas',
            prestamo: '15/06/2025',
            devolucion: '29/06/2025',
            estado: 'Devuelto',
            categoria: 'Ciencia Ficción'
          },
          {
            id: 3,
            titulo: 'Crónicas medievales',
            prestamo: '20/05/2025',
            devolucion: '03/06/2025',
            estado: 'Devuelto',
            categoria: 'Historia'
          }
        ]);
      }, 500);
    });
  }

  renderizarTablaPrestamos(prestamos) {
    if (!this.elements.tablaContainer) return;

    const stats = this.calcularEstadisticas(prestamos);
    const statsHtml = this.crearEstadisticasHtml(stats);
    
    if (prestamos.length === 0) {
      this.elements.tablaContainer.innerHTML = `
        ${statsHtml}
        <div class="no-prestamos">
          <i class="fas fa-book-open"></i>
          <p>No hay préstamos registrados.</p>
        </div>`;
      return;
    }

    const tabla = this.crearTablaPrestamos(prestamos);
    this.elements.tablaContainer.innerHTML = statsHtml;
    this.elements.tablaContainer.appendChild(tabla);
    this.setupTableListeners(tabla);
  }

  calcularEstadisticas(prestamos) {
    return {
      total: prestamos.length,
      activos: prestamos.filter(p => p.estado === 'Prestado').length,
      devueltos: prestamos.filter(p => p.estado === 'Devuelto').length,
      categorias: prestamos.reduce((acc, p) => {
        acc[p.categoria] = (acc[p.categoria] || 0) + 1;
        return acc;
      }, {})
    };
  }

  crearEstadisticasHtml(stats) {
    return `
      <div class="prestamos-stats">
        <div class="stat-item">
          <i class="fas fa-books"></i>
          <span>Total: ${stats.total}</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-book"></i>
          <span>Activos: ${stats.activos}</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-check-circle"></i>
          <span>Devueltos: ${stats.devueltos}</span>
        </div>
      </div>`;
  }

  crearTablaPrestamos(prestamos) {
    const tabla = document.createElement('table');
    tabla.className = 'history-table';
    tabla.innerHTML = `
      <thead>
        <tr>
          <th><i class="fas fa-book"></i> Título</th>
          <th><i class="fas fa-tag"></i> Categoría</th>
          <th><i class="fas fa-calendar-plus"></i> Préstamo</th>
          <th><i class="fas fa-calendar-check"></i> Devolución</th>
          <th><i class="fas fa-info-circle"></i> Estado</th>
          <th><i class="fas fa-cog"></i> Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${prestamos.map(item => this.crearFilaPrestamo(item)).join('')}
      </tbody>`;
    return tabla;
  }

  crearFilaPrestamo(item) {
    const estado = this.estados[item.estado.toLowerCase()];
    return `
      <tr data-id="${item.id}">
        <td>${item.titulo}</td>
        <td><span class="categoria-badge">${item.categoria}</span></td>
        <td>${item.prestamo}</td>
        <td>${item.devolucion}</td>
        <td>
          <span class="estado-badge ${item.estado.toLowerCase()}">
            <i class="fas fa-${estado.icon}"></i>
            ${item.estado}
          </span>
        </td>
        <td>
          <div class="acciones">
            ${item.estado === 'Prestado' ? `
              <button class="btn-devolver" title="Devolver préstamo">
                <i class="fas fa-undo-alt"></i>
              </button>
            ` : ''}
            <button class="btn-detalles" title="Ver detalles">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }

  setupTableListeners(tabla) {
    tabla.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const row = button.closest('tr');
      const id = row.dataset.id;

      if (button.classList.contains('btn-devolver')) {
        this.handleDevolucion(id);
      } else if (button.classList.contains('btn-detalles')) {
        this.mostrarDetalles(id);
      }
    });
  }

  async handleDevolucion(id) {
    try {
      await this.procesarDevolucion(id);
      this.showMessage('Libro devuelto correctamente', 'success');
      const usuario = this.getSessionData();
      this.cargarHistorialPrestamos(usuario);
    } catch (error) {
      this.showMessage('Error al procesar la devolución', 'error');
    }
  }

  procesarDevolucion(id) {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  mostrarDetalles(id) {
    // TODO: Implementar modal de detalles
    console.log('Mostrando detalles del préstamo:', id);
  }

  buscarPrestamos(texto) {
    // TODO: Implementar búsqueda
    console.log('Buscando:', texto);
  }

  filtrarPrestamos() {
    // TODO: Implementar filtrado
    console.log('Aplicando filtros');
  }

  showMessage(message, type = 'info') {
    if (!this.elements.userGreeting) return;

    const color = this.colors[type];
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };

    this.elements.userGreeting.innerHTML = `
      <div class="message ${type}">
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
      </div>`;
  }

  handleLogout(mensaje = 'Sesión cerrada correctamente. Redirigiendo...') {
    localStorage.removeItem('usuarioActivo');
    this.showMessage(mensaje, 'info');
    setTimeout(() => this.redirigirLogin(), 1200);
  }

  redirigirLogin(mensaje = null) {
    if (mensaje) {
      sessionStorage.setItem('loginMessage', JSON.stringify({
        texto: mensaje,
        tipo: 'warning'
      }));
    }
    window.location.href = 'login.html';
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new PanelManager();
});
