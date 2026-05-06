/* ===== SwiftI2V Project Page JS ===== */

document.addEventListener('DOMContentLoaded', () => {
  // ---- Helper: swap data-src -> src for a single video element ----
  const activateVideo = (v) => {
    if (!v) return;
    const src = v.getAttribute('data-src');
    if (src) {
      v.setAttribute('src', src);
      v.removeAttribute('data-src');
      v.load();
    }
  };

  // ---- Lazy loading for all videos with data-src ----
  const videos = document.querySelectorAll('video[data-src]');
  if ('IntersectionObserver' in window && videos.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateVideo(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '300px 0px' }
    );
    videos.forEach((v) => observer.observe(v));
  } else {
    // Fallback: load all videos immediately (e.g. when opened via file://)
    videos.forEach(activateVideo);
  }

  // Extra safety: also load all videos after 2 s, regardless of viewport
  // (avoids black frames on file:// or when intersection is flaky).
  setTimeout(() => {
    document.querySelectorAll('video[data-src]').forEach(activateVideo);
  }, 2000);

  // ---- Copy BibTeX button ----
  const copyBtn = document.getElementById('copy-bibtex-btn');
  const bibtexPre = document.getElementById('bibtex-code');
  if (copyBtn && bibtexPre) {
    copyBtn.addEventListener('click', async () => {
      const text = bibtexPre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        const original = copyBtn.innerText;
        copyBtn.innerText = '✓ Copied!';
        setTimeout(() => {
          copyBtn.innerText = original;
        }, 1800);
      } catch (err) {
        console.error('Copy failed', err);
      }
    });
  }

  // ---- Teaser Carousel ----
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    if (slides.length === 0) return;

    let current = 0;
    let autoplayTimer = null;
    const AUTOPLAY_MS = 8000; // switch every 8s

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));

    const playSlideVideo = (slide) => {
      const v = slide.querySelector('video');
      if (!v) return;
      activateVideo(v);
      const tryPlay = () => {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      };
      if (v.readyState >= 2) tryPlay();
      else v.addEventListener('canplay', tryPlay, { once: true });
    };

    const pauseSlideVideo = (slide) => {
      const v = slide.querySelector('video');
      if (v && !v.paused) {
        try { v.pause(); } catch (_) {}
      }
    };

    const goTo = (next) => {
      next = (next + slides.length) % slides.length;
      if (next === current) return;
      const prev = current;
      slides[prev].classList.remove('is-active');
      slides[prev].classList.add('is-leaving');
      pauseSlideVideo(slides[prev]);

      slides[next].classList.remove('is-leaving');
      slides[next].classList.add('is-active');
      playSlideVideo(slides[next]);

      dots[prev].classList.remove('is-active');
      dots[next].classList.add('is-active');
      current = next;

      // cleanup
      setTimeout(() => {
        slides[prev].classList.remove('is-leaving');
      }, 600);

      // reset autoplay
      resetAutoplay();
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // Keyboard navigation when the carousel is hovered / focused
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });

    // Autoplay
    const resetAutoplay = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(next, AUTOPLAY_MS);
    };
    carousel.addEventListener('mouseenter', () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
    });
    carousel.addEventListener('mouseleave', resetAutoplay);

    // Kick off: ensure first slide is playing
    playSlideVideo(slides[0]);
    resetAutoplay();
  });
});
