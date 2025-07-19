'use strict';

class CatalogoManager {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupCardButtons();
    this.loadFavoritos();
    this.initializeAnimations();
  }

  initializeElements() {
    this.elements = {
      cards: document.querySelectorAll('.libro-card'),
      searchInput: document.getElementById('search-libros'),
      filtroCategoria: document.getElementById('filtro-categoria'),
      filtroEstado: document.getElementById('filtro-estado'),
      ordenarPor: document.getElementById('ordenar-por'),
      toggleView: document.getElementById('toggle-view')
    };

    this.colors = {
      disponible: '#228B22',
      reservado: '#B22222',
      prestado: '#A0522D',
      favorito: '#FFA500'
    };

    this.animations = {
      entrada: {
        duration: 700,
        delay: 120,
        initialDelay: 150
      }
    };

    this.favoritos = [];
  }

  initializeAnimations() {
    this.elements.cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.7s, transform 0.7s';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, this.animations.entrada.initialDelay + i * this.animations.entrada.delay);
    });
  }

  setupCardButtons() {
    this.elements.cards.forEach(card => {
      const estado = card.querySelector('.estado');
      const reservarBtn = card.querySelector('.reservar-btn');
      const devolverBtn = card.querySelector('.devolver-btn');
      const favoritoBtn = card.querySelector('.favorito-btn');
      const titulo = card.querySelector('.titulo').textContent;

      if (reservarBtn) {
        reservarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.reservarLibro(card);
        });
      }

      if (devolverBtn) {
        devolverBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.devolverLibro(card);
        });
      }

      if (favoritoBtn) {
        favoritoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorito(card);
        });
      }

      // Animación hover
      card.addEventListener('mouseenter', () => this.animateCardHover(card, true));
      card.addEventListener('mouseleave', () => this.animateCardHover(card, false));
    });
  }

  setupEventListeners() {
    // Búsqueda y filtrado
    this.elements.searchInput?.addEventListener('input', () => this.filtrarLibros());
    this.elements.filtroCategoria?.addEventListener('change', () => this.filtrarLibros());
    this.elements.filtroEstado?.addEventListener('change', () => this.filtrarLibros());
    this.elements.ordenarPor?.addEventListener('change', () => this.ordenarLibros());
    
    // Cambio de vista
    this.elements.toggleView?.addEventListener('click', () => this.toggleViewMode());

    // Eventos de tarjetas
    this.elements.cards.forEach(card => {
      card.addEventListener('click', (e) => this.handleCardClick(e, card));
      card.addEventListener('mouseenter', () => this.animateCardHover(card, true));
      card.addEventListener('mouseleave', () => this.animateCardHover(card, false));
    });
  }



  handleCardClick(event, card) {
    const target = event.target;
    
    if (target.classList.contains('favorito-btn')) {
      this.toggleFavorito(card);
    } else if (target.classList.contains('reservar-btn')) {
      this.reservarLibro(card);
    }
  }

  animateCardHover(card, isEntering) {
    const scale = isEntering ? 'scale(1.02)' : 'scale(1)';
    const shadow = isEntering ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)';
    
    card.style.transform = scale;
    card.style.boxShadow = shadow;
  }

  toggleFavorito(card) {
    const id = card.dataset.id;
    const favBtn = card.querySelector('.favorito-btn');
    
    if (this.favoritos.includes(id)) {
      this.favoritos = this.favoritos.filter(favId => favId !== id);
      favBtn.style.color = '#666';
    } else {
      this.favoritos.push(id);
      favBtn.style.color = this.colors.favorito;
    }
    
    localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
  }

  loadFavoritos() {
    const stored = localStorage.getItem('favoritos');
    this.favoritos = stored ? JSON.parse(stored) : [];
    
    this.elements.cards.forEach(card => {
      const favBtn = card.querySelector('.favorito-btn');
      if (this.favoritos.includes(card.dataset.id)) {
        favBtn.style.color = this.colors.favorito;
      }
    });
  }

  filtrarLibros() {
    const searchTerm = this.elements.searchInput?.value.toLowerCase() || '';
    const categoria = this.elements.filtroCategoria?.value || 'todos';
    const estado = this.elements.filtroEstado?.value || 'todos';
    
    this.elements.cards.forEach(card => {
      const titulo = card.querySelector('.titulo').textContent.toLowerCase();
      const cardCategoria = card.dataset.categoria;
      const cardEstado = card.dataset.estado;
      
      const matchSearch = titulo.includes(searchTerm);
      const matchCategoria = categoria === 'todos' || cardCategoria === categoria;
      const matchEstado = estado === 'todos' || cardEstado === estado;
      
      card.style.display = matchSearch && matchCategoria && matchEstado ? 'flex' : 'none';
    });
  }

  ordenarLibros() {
    const ordenarPor = this.elements.ordenarPor?.value || 'titulo';
    const container = this.elements.cards[0].parentNode;
    const cardsArray = Array.from(this.elements.cards);
    
    cardsArray.sort((a, b) => {
      const valueA = a.dataset[ordenarPor].toLowerCase();
      const valueB = b.dataset[ordenarPor].toLowerCase();
      return valueA.localeCompare(valueB);
    });
    
    cardsArray.forEach(card => container.appendChild(card));
  }

  toggleViewMode() {
    const container = this.elements.cards[0].parentNode;
    container.classList.toggle('grid-view');
    container.classList.toggle('list-view');
    
    this.elements.cards.forEach(card => {
      card.classList.toggle('grid-card');
      card.classList.toggle('list-card');
    });
  }

  reservarLibro(card) {
    const estado = card.dataset.estado;
    if (estado === 'disponible') {
      card.dataset.estado = 'reservado';
      card.querySelector('.estado').style.color = this.colors.reservado;
      // Aquí se podría agregar la lógica para enviar la reserva al servidor
    }
  }

  devolverLibro(card) {
    const estado = card.dataset.estado;
    if (estado === 'reservado' || estado === 'prestado') {
      card.dataset.estado = 'disponible';
      const estadoElement = card.querySelector('.estado');
      estadoElement.textContent = 'Disponible';
      estadoElement.style.color = this.colors.disponible;
      card.style.boxShadow = '0 4px 16px rgba(34,139,34,0.12)';
    }
  }
}

// Inicializar el gestor del catálogo cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  const catalogo = new CatalogoManager();
});