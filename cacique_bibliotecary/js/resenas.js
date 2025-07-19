// Sistema de reseñas y calificaciones
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar botones de ver reseñas
    document.querySelectorAll('.ver-resenas').forEach(btn => {
        btn.addEventListener('click', toggleResenas);
    });

    // Inicializar botones de agregar reseña
    document.querySelectorAll('.agregar-resena').forEach(btn => {
        btn.addEventListener('click', mostrarModalResena);
    });

    // Inicializar calificaciones
    inicializarCalificaciones();
});

function toggleResenas(e) {
    const container = e.target.nextElementSibling;
    const estaOculto = container.style.display === 'none';
    
    container.style.display = estaOculto ? 'block' : 'none';
    e.target.textContent = estaOculto ? 'Ocultar reseñas' : 'Ver reseñas';
}

function mostrarModalResena(e) {
    if (!isUserLoggedIn()) {
        mostrarNotificacion('Debes iniciar sesión para escribir una reseña', 'error');
        return;
    }

    const libroCard = e.target.closest('.libro-card');
    const titulo = libroCard.querySelector('h3').textContent;
    
    const modal = crearModalResena(titulo);
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function crearModalResena(titulo) {
    const modal = document.createElement('div');
    modal.className = 'modal-resena';
    modal.innerHTML = `
        <div class="modal-contenido">
            <div class="modal-header">
                <h3>Escribir reseña para "${titulo}"</h3>
                <button class="cerrar-modal">&times;</button>
            </div>
            <div class="estrellas-input">
                <span data-valor="1">★</span>
                <span data-valor="2">★</span>
                <span data-valor="3">★</span>
                <span data-valor="4">★</span>
                <span data-valor="5">★</span>
            </div>
            <textarea class="resena-textarea" placeholder="Escribe tu reseña aquí..."></textarea>
            <button class="enviar-resena">Publicar reseña</button>
        </div>
    `;

    // Eventos del modal
    const cerrarBtn = modal.querySelector('.cerrar-modal');
    cerrarBtn.onclick = () => modal.remove();

    const estrellas = modal.querySelectorAll('.estrellas-input span');
    estrellas.forEach(estrella => {
        estrella.onclick = (e) => seleccionarEstrellas(e.target);
    });

    const enviarBtn = modal.querySelector('.enviar-resena');
    enviarBtn.onclick = () => guardarResena(modal, titulo);

    return modal;
}

function seleccionarEstrellas(estrella) {
    const valor = parseInt(estrella.dataset.valor);
    const estrellas = estrella.parentElement.children;
    
    Array.from(estrellas).forEach((e, i) => {
        e.style.color = i < valor ? '#ffd700' : '#ddd';
    });
}

function guardarResena(modal, titulo) {
    const estrellas = modal.querySelectorAll('.estrellas-input span');
    const calificacion = Array.from(estrellas).filter(e => e.style.color === 'rgb(255, 215, 0)').length;
    const texto = modal.querySelector('.resena-textarea').value;

    if (calificacion === 0) {
        mostrarNotificacion('Por favor, selecciona una calificación', 'error');
        return;
    }

    if (!texto.trim()) {
        mostrarNotificacion('Por favor, escribe una reseña', 'error');
        return;
    }

    // Guardar la reseña
    const resena = {
        titulo,
        calificacion,
        texto,
        usuario: JSON.parse(localStorage.getItem('usuario')).nombre,
        fecha: new Date().toISOString()
    };

    const resenas = JSON.parse(localStorage.getItem('resenas') || '[]');
    resenas.push(resena);
    localStorage.setItem('resenas', JSON.stringify(resenas));

    // Actualizar la visualización
    actualizarResenas(titulo);
    
    modal.remove();
    mostrarNotificacion('¡Reseña publicada con éxito!', 'success');
}

function actualizarResenas(titulo) {
    const resenas = JSON.parse(localStorage.getItem('resenas') || '[]');
    const resenasLibro = resenas.filter(r => r.titulo === titulo);
    
    if (resenasLibro.length === 0) return;

    // Calcular promedio
    const promedio = resenasLibro.reduce((acc, r) => acc + r.calificacion, 0) / resenasLibro.length;
    
    // Actualizar visualización en la tarjeta del libro
    const libroCards = document.querySelectorAll('.libro-card');
    const card = Array.from(libroCards).find(c => c.querySelector('h3').textContent === titulo);
    
    if (card) {
        const ratingStars = card.querySelector('.rating-stars');
        const ratingCount = card.querySelector('.rating-count');
        
        ratingStars.textContent = '★'.repeat(Math.floor(promedio)) + (promedio % 1 >= 0.5 ? '½' : '');
        ratingStars.dataset.rating = promedio.toFixed(1);
        ratingCount.textContent = `(${resenasLibro.length} reseñas)`;
    }
}

function inicializarCalificaciones() {
    const resenas = JSON.parse(localStorage.getItem('resenas') || '[]');
    const libros = {};

    // Agrupar reseñas por libro
    resenas.forEach(resena => {
        if (!libros[resena.titulo]) {
            libros[resena.titulo] = [];
        }
        libros[resena.titulo].push(resena);
    });

    // Actualizar calificaciones para cada libro
    Object.keys(libros).forEach(titulo => {
        actualizarResenas(titulo);
    });
}
