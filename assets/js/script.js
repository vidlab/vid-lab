/**
 * Initializes the floating navigation sidebar
 * - Handles smooth scrolling when clicking navigation links
 * - Automatically highlights the active section based on scroll position
 * - Syncs navigation state with the visible content
 * - Responsive: adjusts scroll offset based on screen size
 */
function initializeFloatingNav() {
  try {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#floating-nav .nav-link');
    
    /**
     * Get responsive scroll offset based on screen width
     * Minimal values - just navbar clearance without extra spacing
     * @returns {number} The scroll offset in pixels
     */
    function getScrollOffset() {
      if (window.innerWidth <= 768) {
        return 130; // Mobile: navbar + mobile filter bar
      } else if (window.innerWidth <= 992) {
        return 80; // Tablet: optimized clearance
      }
      return 80; // Desktop: optimized clearance (navbar ~56px + buffer)
    }

    // Add click event listeners to desktop floating nav links
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
      });
    });

    /**
     * Updates the active nav link based on which section is currently visible
     * Checks if a section's top is within the viewport threshold
     * Uses responsive offset that adapts to screen size
     */
    function updateActive() {
      const SCROLL_OFFSET = getScrollOffset();
      let current = null;
      
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        
        // Get section-specific offset
        let sectionOffset = SCROLL_OFFSET;
        if (sec.id === 'graduate' || sec.id === 'collaborators' || sec.id === 'interns' || sec.id === 'undergraduate') {
          // These sections have 10px less offset
          sectionOffset = SCROLL_OFFSET - 10;
        }
        
        // Check if section is visible within the responsive offset threshold
        if (rect.top <= sectionOffset && rect.bottom > sectionOffset) {
          current = sec;
        }
      });
      
      // Update active state for the current visible section
      if (!current) return;
      navLinks.forEach(n => n.classList.remove('active'));
      const activeLink = document.querySelector(
        `#floating-nav .nav-link[href="#${current.id}"]`
      );
      if (activeLink) activeLink.classList.add('active');
    }

    // Listen for scroll and resize events to update active section
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive); // Re-calculate on screen resize
    setTimeout(updateActive, 100); // Initial check after page load
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
  // Initialize research modal (keep existing functionality)
  const researchHandler = (sel, id) =>
    document.querySelectorAll(sel).forEach(img => {
      img.setAttribute('data-bs-toggle', 'modal');
      img.setAttribute('data-bs-target', `#${id}`);
      img.addEventListener('click', () => {
        const modalImg = document.getElementById('modalResearchImage');
        if (modalImg) modalImg.src = img.src;
      });
    });
  researchHandler('.research-image', 'researchModal');
  
  // Initialize gallery image viewer with navigation
  initializeImageViewer();
}

// Image Viewer with Navigation Controls
function initializeImageViewer() {
  const modal = document.getElementById('imageViewerModal');
  const viewerImg = document.getElementById('viewerImage');
  const closeBtn = document.querySelector('.viewer-close');
  const prevBtn = document.querySelector('.viewer-prev');
  const nextBtn = document.querySelector('.viewer-next');
  
  if (!modal || !viewerImg) return;
  
  let currentIndex = 0;
  let galleryImages = [];
  
  // Collect all visible gallery images
  function updateGalleryImages() {
    galleryImages = Array.from(document.querySelectorAll('.gallery-img'))
      .filter(img => {
        const section = img.closest('.filter-section');
        return section && section.style.display !== 'none';
      });
  }
  
  // Open viewer
  document.querySelectorAll('.gallery-img').forEach((img) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() {
      updateGalleryImages();
      currentIndex = galleryImages.indexOf(this);
      showImage();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  
  // Show current image
  function showImage() {
    if (galleryImages.length > 0 && currentIndex >= 0 && currentIndex < galleryImages.length) {
      const currentImg = galleryImages[currentIndex];
      viewerImg.src = currentImg.src;
      
      // Update button visibility
      if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
      if (nextBtn) nextBtn.style.display = currentIndex === galleryImages.length - 1 ? 'none' : 'block';
    }
  }
  
  // Close viewer
  function closeViewer() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeViewer);
  }
  
  // Close on background click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeViewer();
    }
  });
  
  // Navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentIndex > 0) {
        currentIndex--;
        showImage();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentIndex < galleryImages.length - 1) {
        currentIndex++;
        showImage();
      }
    });
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeViewer();
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      currentIndex--;
      showImage();
    } else if (e.key === 'ArrowRight' && currentIndex < galleryImages.length - 1) {
      currentIndex++;
      showImage();
    }
  });
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
      h.textContent = c === 'events' ? 'Events Images' : 'Research Posters';
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

/**
 * Initializes mobile filter buttons for section navigation
 * On mobile devices, shows a horizontal scrollable button bar
 * Each button scrolls to its corresponding section when clicked
 * Updates active state to highlight the currently selected section
 * Also syncs with scroll position
 */
function initializeMobileSectionFilters() {
  const filterBtns = document.querySelectorAll('.mobile-filter-btn');
  const sections = document.querySelectorAll('section[id]');
  let isScrollingProgrammatically = false; // Flag to prevent conflicts
  
  // Handle button clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      // Set flag to prevent scroll listener from interfering
      isScrollingProgrammatically = true;
      
      // Remove active state from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      
      // Set active state on clicked button
      this.classList.add('active');
      
      // Get the section ID and scroll to it
      const filterValue = this.getAttribute('data-filter');
      scrollToSection(filterValue);
      
      // Re-enable scroll listener after scrolling completes
      setTimeout(() => {
        isScrollingProgrammatically = false;
      }, 1000); // Wait for smooth scroll animation to complete
    });
  });
  
  /**
   * Update active mobile button based on scroll position
   * Syncs button highlight with visible section
   */
  function updateMobileActiveButton() {
    if (window.innerWidth >= 768) return; // Only on mobile
    if (isScrollingProgrammatically) return; // Don't update during programmatic scroll
    
    const scrollOffset = 130; // Mobile offset: navbar + mobile filter bar
    let current = null;
    
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      
      // Get section-specific offset for mobile
      let sectionOffset = scrollOffset;
      if (sec.id === 'graduate' || sec.id === 'collaborators' || sec.id === 'interns' || sec.id === 'undergraduate') {
        // These sections have 10px less offset (120px instead of 130px)
        sectionOffset = scrollOffset - 10;
      }
      
      if (rect.top <= sectionOffset && rect.bottom > sectionOffset) {
        current = sec;
      }
    });
    
    if (!current) return;
    
    // Remove active from all buttons
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    // Set active on corresponding button
    const activeBtn = document.querySelector(
      `.mobile-filter-btn[data-filter="${current.id}"]`
    );
    if (activeBtn) activeBtn.classList.add('active');
  }
  
  // Update on scroll (only on mobile)
  if (window.innerWidth < 768) {
    window.addEventListener('scroll', updateMobileActiveButton, { passive: true });
    setTimeout(updateMobileActiveButton, 100); // Initial check
  }
}


/**
 * Smoothly scrolls to a specific section on the page
 * @param {string} category - The ID of the section to scroll to
 * 
 * Calculates the proper scroll position by:
 * 1. Getting the section's position relative to the viewport
 * 2. Subtracting the header offset (responsive based on screen size)
 * 3. Smoothly animating to the calculated position
 * 
 * Uses minimal offset - just enough to clear the navbar
 * This maximizes visible content while keeping navigation accessible
 */
function scrollToSection(category) {
  const targetSection = document.getElementById(category);
  if (targetSection) {
    // Minimal offset - just navbar clearance
    let headerOffset = 80; // Default: navbar (~56px) + optimized buffer
    
    if (window.innerWidth <= 768) {
      headerOffset = 130; // Mobile: navbar + mobile filter bar
    } else if (window.innerWidth <= 992) {
      headerOffset = 80; // Tablet: optimized clearance
    }
    
    // Adjust offset for specific sections
    if (category === 'graduate' || category === 'collaborators' || category === 'interns' || category === 'undergraduate') {
      headerOffset -= 10; // These sections have 10px less offset
    }
    
    const elementPosition = targetSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    // Smooth scroll to the calculated position
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