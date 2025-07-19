document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carrusel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carrusel-btn.next');
    const prevButton = document.querySelector('.carrusel-btn.prev');
    
    let currentIndex = 0;
    const slideWidth = slides[0].getBoundingClientRect().width;
    
    // Configurar posición inicial de los slides
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });
    
    // Función para mover el carrusel
    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    };
    
    // Click en botón siguiente
    nextButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let nextSlide = currentSlide.nextElementSibling;
        
        if (!nextSlide) {
            nextSlide = slides[0];
            track.style.transition = 'none';
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
            }, 0);
        }
        
        moveToSlide(track, currentSlide, nextSlide);
    });
    
    // Click en botón anterior
    prevButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let prevSlide = currentSlide.previousElementSibling;
        
        if (!prevSlide) {
            prevSlide = slides[slides.length - 1];
            track.style.transition = 'none';
            setTimeout(() => {
                track.style.transition = 'transform 0.5s ease';
            }, 0);
        }
        
        moveToSlide(track, currentSlide, prevSlide);
    });
    
    // Auto-play del carrusel
    let autoPlayInterval;
    
    const startAutoPlay = () => {
        autoPlayInterval = setInterval(() => {
            nextButton.click();
        }, 5000); // Cambiar slide cada 5 segundos
    };
    
    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };
    
    // Iniciar auto-play
    startAutoPlay();
    
    // Detener auto-play al hover
    const carruselContainer = document.querySelector('.carrusel-container');
    carruselContainer.addEventListener('mouseenter', stopAutoPlay);
    carruselContainer.addEventListener('mouseleave', startAutoPlay);
    
    // Touch events para dispositivos móviles
    let touchstartX = 0;
    let touchendX = 0;
    
    track.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    });
    
    track.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    const handleSwipe = () => {
        if (touchendX < touchstartX) nextButton.click();
        if (touchendX > touchstartX) prevButton.click();
    };
});
