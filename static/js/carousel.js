document.addEventListener("DOMContentLoaded", function () {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;

  const carouselInner = carousel.querySelector('.carousel-inner');
  const carouselItems = carousel.querySelectorAll('.carousel-item');
  const indicators = carousel.querySelectorAll('.carousel-indicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let currentIndex = 0;
  const total = carouselItems.length;
  let interval = null;

  function updateCarousel() {
    carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
    indicators.forEach((el, i) => {
      el.classList.toggle('opacity-100', i === currentIndex);
      el.classList.toggle('opacity-50', i !== currentIndex);
    });
  }

  function startAutoSlide() {
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % total;
      updateCarousel();
    }, 3000);
  }

  function stopAutoSlide() {
    clearInterval(interval);
  }

  prevBtn.addEventListener('click', () => {
    stopAutoSlide();
    currentIndex = (currentIndex - 1 + total) % total;
    updateCarousel();
    startAutoSlide();
  });

  nextBtn.addEventListener('click', () => {
    stopAutoSlide();
    currentIndex = (currentIndex + 1) % total;
    updateCarousel();
    startAutoSlide();
  });

  indicators.forEach((indicator, idx) => {
    indicator.addEventListener('click', () => {
      stopAutoSlide();
      currentIndex = idx;
      updateCarousel();
      startAutoSlide();
    });
  });

  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);

  updateCarousel();
  startAutoSlide();
});