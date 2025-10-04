const navbar = document.querySelector('[data-navbar]');
  if (navbar) {
    const setNavbarHeight = () => {
      const totalHeight = navbar.offsetHeight;
      document.documentElement.style.setProperty(
        '--navbar-total-height',
        `${totalHeight}px`
      );
    };

    setNavbarHeight();

    const resizeObserver = new ResizeObserver(() => setNavbarHeight());
    resizeObserver.observe(navbar);
    window.addEventListener('resize', setNavbarHeight);

    const cleanup = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', setNavbarHeight);
    };

    addEventListener('astro:before-soft-navigate', cleanup, { once: true });
    addEventListener('pagehide', cleanup, { once: true });
  }