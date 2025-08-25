// Initializes floating navigation (keeps track of scroll and highlights active section)
function initializeFloatingNav() {
  try {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#floating-nav .nav-link');

    // Add click event listeners to desktop nav links
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
      });
    });

    function updateActive() {
      let current = null;
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom > 200) { // Adjusted to match scroll offset
          current = sec;
        }
      });
      if (!current) return;
      navLinks.forEach(n => n.classList.remove('active'));
      const act = document.querySelector(
        `#floating-nav .nav-link[href="#${current.id}"]`
      );
      if (act) act.classList.add('active');
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    setTimeout(updateActive, 100);
  } catch (e) {
    console.error('Floating nav init error:', e);
  }
}

// Initializes publication filters
function initializeFilters() {
  try {
    const publicationsList = document.getElementById('publicationsList');
    if (!publicationsList) return;

    const allEntries = Array.from(
      publicationsList.querySelectorAll('.publication-entry')
    );

    // Store dropdown elements and the three source‐arrays (years, types, keywords)
    const dropdowns = {};
    let currentFilters = { year: '', type: '', keyword: '' };

    // Build the three arrays once, up front
    const years = [...new Set(allEntries.map(e => e.dataset.year))].sort(
      (a, b) => Number(b) - Number(a)
    );

    let types = [
      ...new Set(allEntries.map(e => e.dataset.type.toLowerCase()))
    ];
    const hasOther = types.includes('other');
    if (hasOther) types = types.filter(t => t !== 'other');
    types.sort();
    if (hasOther) types.push('other');

    const keywords = [
      'Attention',
      'Classification',
      'CNN',
      'Detection',
      'Deep-Learning',
      'Ensemble',
      'Regression',
      'Segmentation',
      'Transfer-Learning',
      'Other'
    ];

    // Helper to rebuild one menu, omitting the currently selected value (if any)
    function rebuildMenu(ft, items) {
      const menu = dropdowns[ft].menu;
      menu.innerHTML = ''; // clear out existing items

      items.forEach(v => {
        // if this value is currently selected, skip it
        if (v === currentFilters[ft]) return;

        const div = document.createElement('div');
        div.className = 'custom-dropdown-item';
        div.dataset.value = v;
        div.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        menu.appendChild(div);
      });
    }

    document.querySelectorAll('.custom-dropdown').forEach(element => {
      const ft = element.dataset.filter;
      const toggle = element.querySelector('.custom-dropdown-toggle');
      const menu = element.querySelector('.custom-dropdown-menu');
      dropdowns[ft] = { toggle, menu };

      // When you click the toggle, rebuild that menu without the currently selected value
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        Object.values(dropdowns).forEach(d => d.menu.classList.remove('show'));

        // Choose the right array based on ft
        if (ft === 'year') {
          rebuildMenu('year', years);
        } else if (ft === 'type') {
          rebuildMenu('type', types);
        } else if (ft === 'keyword') {
          rebuildMenu('keyword', keywords);
        }

        menu.classList.toggle('show');
      });

      menu.addEventListener('click', e => {
        const item = e.target;
        if (!item.classList.contains('custom-dropdown-item')) return;
        if (item.dataset.value === '') return;

        // Set the filter to the clicked value
        currentFilters[ft] = item.dataset.value;

        // Adjust toggle text (with mobile abbreviations if needed)
        const isMobile = window.matchMedia('(max-width: 430px), (max-width: 480px)').matches;
        if (
          ft === 'type' &&
          isMobile &&
          item.dataset.value === 'conference'
        ) {
          toggle.textContent = 'Conferen...';
        } else if (
          ft === 'keyword' &&
          isMobile &&
          (item.dataset.value === 'Deep-Learning' ||
            item.dataset.value === 'Transfer-Learning' ||
            item.dataset.value === 'Classification')
        ) {
          if (item.dataset.value === 'Deep-Learning') {
            toggle.textContent = 'Deep...';
          } else if (item.dataset.value === 'Transfer-Learning') {
            toggle.textContent = 'Transfer...';
          } else {
            toggle.textContent = 'Classific...';
          }
        } else {
          toggle.textContent = item.textContent;
        }

        menu.classList.remove('show');
        applyFilters();
      });
    });

    // Close any open menus when clicking outside
    document.addEventListener('click', () =>
      Object.values(dropdowns).forEach(d => d.menu.classList.remove('show'))
    );

    // Initial population of toggles
    document.querySelector('.custom-dropdown[data-filter="year"] .custom-dropdown-toggle').textContent = 'Year';
    document.querySelector('.custom-dropdown[data-filter="type"] .custom-dropdown-toggle').textContent = 'Type';
    document.querySelector('.custom-dropdown[data-filter="keyword"] .custom-dropdown-toggle').textContent = 'Keyword';

    function applyFilters() {
      let found = 0;
      allEntries.forEach(entry => {
        const y = entry.dataset.year;
        const t = entry.dataset.type.toLowerCase();

        const ks = entry.dataset.keywords
          .split(',')
          .map(k => k.trim().toLowerCase());

        let show = true;
        if (currentFilters.year && y !== currentFilters.year) show = false;
        if (currentFilters.type && t !== currentFilters.type) show = false;

        if (
          currentFilters.keyword &&
          !ks.includes(currentFilters.keyword.toLowerCase())
        ) {
          show = false;
        }

        entry.style.display = show ? 'block' : 'none';
        if (show) found++;
      });

      const msgId = 'noPublicationsMessage';
      let msg = document.getElementById(msgId);
      if (found === 0) {
        if (!msg) {
          msg = document.createElement('p');
          msg.id = msgId;
          msg.textContent =
            'No publications found matching your filters. Please try other filters.';
          msg.className = 'text-center mt-4 text-muted';
          publicationsList.appendChild(msg);
        }
        msg.style.display = 'block';
      } else if (msg) {
        msg.style.display = 'none';
      }
    }

    // “Reset Filters” button must put everything back
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentFilters = { year: '', type: '', keyword: '' };

        // Restore toggle labels
        Object.keys(dropdowns).forEach(ft => {
          const def = ft.charAt(0).toUpperCase() + ft.slice(1);
          dropdowns[ft].toggle.textContent = def;
        });

        applyFilters();
      });
    }

    // Run once to apply “no filters” initially
    applyFilters();
  } catch (e) {
    console.error('Filter init error:', e);
  }
}


// Initializes modal images
function initializeGalleryModals() {
  const handler = (sel, id) =>
    document.querySelectorAll(sel).forEach(img => {
      img.setAttribute('data-bs-toggle', 'modal');
      img.setAttribute('data-bs-target', `#${id}`);
      img.addEventListener('click', () => {
        const modalImg = document.getElementById(
          id === 'galleryModal' ? 'modalImage' : 'modalResearchImage'
        );
        if (modalImg) modalImg.src = img.src;
      });
    });
  handler('.gallery-img', 'galleryModal');
  handler('.research-image', 'researchModal');
}

// Initializes gallery filters
function initializeGalleryFilters() {
  const btns = document.querySelectorAll('.gallery-filter-btn');
  const secs = document.querySelectorAll('.filter-section');
  function clr() {
    document.querySelectorAll('.gallery-section-heading').forEach(h => h.remove());
  }
  function add() {
    // Clear existing headings first to prevent duplicates
    clr();
    secs.forEach(s => {
      const c = s.dataset.category;
      const h = document.createElement('h2');
      h.className = 'gallery-section-heading mt-4 mb-3 text-center';
      h.style.position = 'relative';
      h.style.fontWeight = '700';
      h.textContent = c === 'events' ? 'Events Images' : 'Researches Images';
      s.parentNode.insertBefore(h, s);
    });
  }
  function filt(c) {
    secs.forEach(s =>
      (s.style.display = c === 'all' || s.dataset.category === c ? 'flex' : 'none')
    );
    c === 'all' ? add() : clr();
  }
  btns.forEach(b =>
    b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      filt(b.textContent.trim().toLowerCase());
    })
  );
  filt('all');
}

// Close navbar when clicking anywhere except on the hamburger itself
function initializeNavbarOutsideClick() {
  document.addEventListener('click', function (event) {
    const navbar = document.getElementById('navbarResponsive');
    const customHamburger = document.getElementById('customHamburger');
    const menuOverlay = document.getElementById('menuOverlay');

    // If the nav is open and the click is not on the hamburger, close it.
    if (navbar.classList.contains('show') && !customHamburger.contains(event.target)) {
      navbar.classList.remove('show');
      customHamburger.classList.remove('active');
      if (menuOverlay) {
        menuOverlay.classList.remove('active');
      }
      document.body.style.overflow = 'auto';
    }
  });
}

// Toggle “Read More” / “Show Less” on mobile
function initializeReadMoreToggle() {
  document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const container = btn.closest('.research-content');
      if (!container) return;
      const desc = container.querySelector('.research-description');
      if (!desc) return;

      if (desc.classList.contains('expanded')) {
        desc.classList.remove('expanded');
        btn.textContent = 'Read More';
      } else {
        desc.classList.add('expanded');
        btn.textContent = 'Show Less';
      }
    });
  });
}

// Highlight active nav link based on current page
function initializeActiveNavLink() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const currentPage = window.location.pathname.split('/').pop();
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// Hide bibbase element on mobile
function initializeBibbaseHide() {
  if (window.innerWidth <= 430) {
    const result = document.evaluate(
      "//*[@id='bibbase']/div[1]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const el = result.singleNodeValue;
    if (el) el.style.display = 'none';
  }
}

// Mobile filter functionality for faculty/alumni/graduate/collaborators/interns/undergraduate sections
function initializeMobileSectionFilters() {
  const filterBtns = document.querySelectorAll('.mobile-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filterValue = this.getAttribute('data-filter');
      scrollToSection(filterValue);
    });
  });
}

// Helper to scroll to the selected section smoothly
function scrollToSection(category) {
  const targetSection = document.getElementById(category);
  if (targetSection) {
    const headerOffset = 200; // Increased offset for better clearance
    const elementPosition = targetSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

// Initialize custom hamburger behavior for mobile nav
function initializeCustomHamburger() {
  const customHamburger = document.getElementById('customHamburger');
  const navbarCollapse = document.getElementById('navbarResponsive');
  const menuOverlay = document.getElementById('menuOverlay');
  const navLinks = document.querySelectorAll('.nav-link');

  navbarCollapse.classList.remove('show');
  menuOverlay.classList.remove('active');
  customHamburger.classList.remove('active');

  customHamburger.addEventListener('click', function () {
    customHamburger.classList.toggle('active');
    navbarCollapse.classList.toggle('show');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = navbarCollapse.classList.contains('show') ? 'hidden' : 'auto';
  });

  menuOverlay.addEventListener('click', function () {
    customHamburger.classList.remove('active');
    navbarCollapse.classList.remove('show');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 430) {
        customHamburger.classList.remove('active');
        setTimeout(() => {
          navbarCollapse.classList.remove('show');
          menuOverlay.classList.remove('active');
          document.body.style.overflow = 'auto';
        }, 300);
      }
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 430) {
      customHamburger.classList.remove('active');
      navbarCollapse.classList.remove('show');
      menuOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
}


// Force page reload when loaded from bfcache
function initializePageShowReload() {
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      // Page was loaded from cache, force reload
      window.location.reload();
    }
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeFloatingNav();
  initializeFilters();
  initializeGalleryModals();
  initializeGalleryFilters();
  initializeNavbarOutsideClick();
  initializeReadMoreToggle();
  initializeActiveNavLink();
  initializeBibbaseHide();
  initializeMobileSectionFilters();
  initializeCustomHamburger();
  initializePageShowReload();
});


window.addEventListener('load', function () {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  // Option A) Instant hide:
  // loader.style.display = 'none';

  // Option B) Fade out smoothly over 300ms:
  loader.style.transition = 'opacity 0.3s ease';
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 300);
});