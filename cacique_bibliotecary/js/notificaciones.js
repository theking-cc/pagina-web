// Sistema de Notificaciones
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        // Inicializar elementos del DOM
        this.notificationButton = document.getElementById('notification-button');
        this.notificationCenter = document.getElementById('notification-center');
        this.notificationList = document.querySelector('.notification-list');
        this.notificationBadge = document.querySelector('.notification-badge');
        this.closeButton = document.getElementById('close-notifications');

        // Event listeners
        this.notificationButton.addEventListener('click', () => this.toggleNotificationCenter());
        this.closeButton.addEventListener('click', () => this.closeNotificationCenter());

        // Comprobar notificaciones al inicio
        this.checkNotifications();
        
        // Comprobar periódicamente nuevas notificaciones
        setInterval(() => this.checkNotifications(), 60000); // Cada minuto
    }

    toggleNotificationCenter() {
        this.notificationCenter.classList.toggle('active');
        if (this.notificationCenter.classList.contains('active')) {
            this.markAllAsRead();
        }
    }

    closeNotificationCenter() {
        this.notificationCenter.classList.remove('active');
    }

    async checkNotifications() {
        // Comprobar préstamos próximos a vencer
        this.checkPrestamosVencimiento();
        
        // Comprobar libros disponibles de la lista de espera
        this.checkLibrosDisponibles();
        
        // Comprobar nuevas reseñas en libros favoritos
        this.checkNuevasResenas();
    }

    checkPrestamosVencimiento() {
        const prestamos = JSON.parse(localStorage.getItem('prestamos') || '[]');
        const hoy = new Date();

        prestamos.forEach(prestamo => {
            const fechaVencimiento = new Date(prestamo.fechaVencimiento);
            const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

            if (diasRestantes <= 3 && !prestamo.notificado) {
                this.addNotification({
                    title: '¡Préstamo próximo a vencer!',
                    message: `El libro "${prestamo.titulo}" debe ser devuelto en ${diasRestantes} días.`,
                    type: 'warning',
                    actions: [
                        {
                            text: 'Renovar préstamo',
                            action: () => this.renovarPrestamo(prestamo.id)
                        },
                        {
                            text: 'Ver detalles',
                            action: () => this.verDetallesPrestamo(prestamo.id)
                        }
                    ]
                });

                prestamo.notificado = true;
                this.updatePrestamos(prestamos);
            }
        });
    }

    checkLibrosDisponibles() {
        const listaEspera = JSON.parse(localStorage.getItem('listaEspera') || '[]');
        const librosDisponibles = document.querySelectorAll('.libro-card');

        listaEspera.forEach(espera => {
            const libroCard = Array.from(librosDisponibles)
                .find(card => card.querySelector('h3').textContent === espera.titulo);

            if (libroCard && libroCard.querySelector('.estado').textContent === 'Disponible') {
                this.addNotification({
                    title: '¡Libro disponible!',
                    message: `El libro "${espera.titulo}" que estabas esperando ya está disponible.`,
                    type: 'success',
                    actions: [
                        {
                            text: 'Reservar ahora',
                            action: () => this.reservarLibro(espera.titulo)
                        }
                    ]
                });

                this.removeFromListaEspera(espera.titulo);
            }
        });
    }

    checkNuevasResenas() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const resenas = JSON.parse(localStorage.getItem('resenas') || '[]');
        const ultimaRevision = localStorage.getItem('ultimaRevisionResenas') || new Date(0);

        resenas.forEach(resena => {
            if (favoritos.includes(resena.titulo) && new Date(resena.fecha) > new Date(ultimaRevision)) {
                this.addNotification({
                    title: 'Nueva reseña en libro favorito',
                    message: `Hay una nueva reseña para "${resena.titulo}".`,
                    type: 'info',
                    actions: [
                        {
                            text: 'Ver reseña',
                            action: () => this.verResena(resena.id)
                        }
                    ]
                });
            }
        });

        localStorage.setItem('ultimaRevisionResenas', new Date().toISOString());
    }

    addNotification(notification) {
        // Añadir notificación a la lista
        this.notifications.unshift({
            id: Date.now(),
            ...notification,
            time: new Date(),
            read: false
        });

        // Actualizar contador
        this.unreadCount++;
        this.updateBadge();

        // Actualizar vista
        this.renderNotifications();

        // Mostrar popup
        this.showPopup(notification);
    }

    showPopup(notification) {
        const popup = document.createElement('div');
        popup.className = 'notification-popup';
        popup.innerHTML = `
            <div class="notification-title">
                ${notification.title}
                <button class="close-popup">×</button>
            </div>
            <div class="notification-content">
                ${notification.message}
            </div>
        `;

        document.body.appendChild(popup);

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            popup.remove();
        }, 5000);

        // Cerrar al hacer click
        popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
    }

    renderNotifications() {
        this.notificationList.innerHTML = this.notifications
            .map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'} ${notification.type}">
                    <div class="notification-title">
                        ${notification.title}
                        <span class="notification-time">${this.formatTime(notification.time)}</span>
                    </div>
                    <div class="notification-content">
                        ${notification.message}
                    </div>
                    ${notification.actions ? `
                        <div class="notification-actions">
                            ${notification.actions.map((action, index) => `
                                <button 
                                    class="${index === 0 ? 'action-primary' : 'action-secondary'}"
                                    data-action-id="${notification.id}-${index}"
                                >
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');

        // Añadir event listeners para las acciones
        this.notifications.forEach(notification => {
            if (notification.actions) {
                notification.actions.forEach((action, index) => {
                    const button = document.querySelector(`[data-action-id="${notification.id}-${index}"]`);
                    if (button) {
                        button.addEventListener('click', action.action);
                    }
                });
            }
        });
    }

    markAllAsRead() {
        this.notifications.forEach(notification => notification.read = true);
        this.unreadCount = 0;
        this.updateBadge();
        this.renderNotifications();
    }

    updateBadge() {
        this.notificationBadge.textContent = this.unreadCount;
        this.notificationBadge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `Hace ${minutes} minutos`;
        if (hours < 24) return `Hace ${hours} horas`;
        return `Hace ${days} días`;
    }

    // Métodos auxiliares para acciones específicas
    renovarPrestamo(id) {
        // Implementar lógica de renovación
        console.log('Renovando préstamo:', id);
    }

    verDetallesPrestamo(id) {
        // Implementar navegación a detalles del préstamo
        window.location.href = `panel.html#prestamo-${id}`;
    }

    reservarLibro(titulo) {
        // Implementar lógica de reserva
        console.log('Reservando libro:', titulo);
    }

    verResena(id) {
        // Implementar navegación a la reseña
        console.log('Viendo reseña:', id);
    }

    removeFromListaEspera(titulo) {
        const listaEspera = JSON.parse(localStorage.getItem('listaEspera') || '[]');
        const nuevaLista = listaEspera.filter(item => item.titulo !== titulo);
        localStorage.setItem('listaEspera', JSON.stringify(nuevaLista));
    }

    updatePrestamos(prestamos) {
        localStorage.setItem('prestamos', JSON.stringify(prestamos));
    }
}

// Inicializar el sistema de notificaciones
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});
