// news.js - Fetch, render, and control news listing and details

// Utility: Deduplicate and order news
function dedupeAndOrder(newsItems) {
  const unique = [];
  const seen = new Set();
  for (const n of newsItems) {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      unique.push(n);
    }
  }
  const desiredOrderIds = ["news-6", "news-1", "news-2"];
  const ordered = desiredOrderIds.map(id => unique.find(x => x.id === id)).filter(Boolean);
  const remaining = unique.filter(x => !desiredOrderIds.includes(x.id));
  return [...ordered, ...remaining];
}

// Homepage carousel rendering
function renderHomeCarousel(sortedNews) {
  const carouselInner = document.getElementById("newsCarouselInner");
  const carouselIndicators = document.getElementById("newsCarouselIndicators");
  if (!carouselInner || !carouselIndicators) return;

  function getCardsPerSlide() {
    const w = window.innerWidth;
    if (w < 576) return 1;
    if (w < 992) return 2;
    return 3;
  }

  function buildCarousel(cardsPerSlide, activeIndex = 0) {
    carouselInner.innerHTML = "";
    carouselIndicators.innerHTML = "";
    const totalSlides = Math.ceil(sortedNews.length / cardsPerSlide);
    for (let i = 0; i < totalSlides; i++) {
      const start = i * cardsPerSlide;
      const group = sortedNews.slice(start, start + cardsPerSlide);
      let html = `<div class="carousel-item ${i === 0 ? 'active' : ''}">
  <div class="row g-4 justify-content-center">`;
      group.forEach(a => {
        html += `
    <div class="col-md-4">
      <div class="card card-hover h-100">
        <img src="${a.image}" class="card-img-top img-fluid" alt="${a.title}">
        <div class="card-body">
          <p class="recent_news_time">${a.date}</p>
          <h5 class="card-title">${a.title}</h5>
          <p class="card-text">${a.summary}</p>
          <a href="news_details.html?id=${a.id}" class="btn btn-outline-secondary">Read More</a>
        </div>
      </div>
    </div>`;
      });
      html += `
  </div>
</div>`;
      carouselInner.innerHTML += html;
      carouselIndicators.innerHTML += `<button type="button" data-bs-target="#newsCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i + 1}"></button>`;
    }
    try {
      const carouselEl = document.querySelector('#newsCarousel');
      const carouselInstance = bootstrap.Carousel.getOrCreateInstance(carouselEl);
      carouselInstance.to(activeIndex);
    } catch (e) {}
  }

  let cardsPerSlide = getCardsPerSlide();
  buildCarousel(cardsPerSlide);
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    const newCardsPerSlide = getCardsPerSlide();
    if (newCardsPerSlide === cardsPerSlide) return;
    clearTimeout(resizeTimer);
    const activeSlide = document.querySelector('#newsCarousel .carousel-item.active');
    const activeIdx = activeSlide ? Array.from(activeSlide.parentElement.children).indexOf(activeSlide) : 0;
    resizeTimer = setTimeout(() => {
      cardsPerSlide = newCardsPerSlide;
      buildCarousel(cardsPerSlide, activeIdx);
    }, 180);
  });
}

// Render news grid for news page
function renderNewsGrid(sortedNews) {
  const newsContainer = document.querySelector('.recent_news_card .row');
  if (!newsContainer) return;
  newsContainer.innerHTML = '';
  sortedNews.forEach(article => {
    newsContainer.innerHTML += `
<div class="col-md-4">
  <div class="card card-hover h-100">
    <img src="${article.image}" class="card-img-top img-fluid" alt="${article.title}">
    <div class="card-body">
      <p class="recent_news_time">${article.date}</p>
      <h5 class="card-title">${article.title}</h5>
      <p class="card-text">${article.summary}</p>
      <a href="news_details.html?id=${article.id}" class="btn btn-outline-secondary">Read More</a>
    </div>
  </div>
</div>`;
  });
}

// Initialize listing (homepage or news page)
fetch('assets/data/news.json')
  .then(res => res.json())
  .then(items => {
    const sortedNews = dedupeAndOrder(items);
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHome) {
      renderHomeCarousel(sortedNews);
    } else {
      renderNewsGrid(sortedNews);
    }
  })
  .catch(e => console.error('Error initializing news listing:', e));

// News details logic
if (window.location.pathname.includes('news_details.html')) {
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get('id');
  fetch('assets/data/news.json')
    .then(res => res.json())
    .then(items => {
      const sortedNews = dedupeAndOrder(items);
      const idx = sortedNews.findIndex(x => x.id === newsId);
      const item = sortedNews[idx];
      const container = document.getElementById('newsDetailsContainer');
      if (!container) return;
      if (!item) {
        container.innerHTML = "<p class='text-center'>News article not found.</p>";
        return;
      }
      const prev = idx > 0 ? sortedNews[idx - 1] : null;
      const next = idx < sortedNews.length - 1 ? sortedNews[idx + 1] : null;
      const buttons = `
<div class="mt-4 d-flex justify-content-between flex-wrap">
  ${prev ? `<a href="news_details.html?id=${prev.id}" class="btn btn-outline-secondary">&laquo; Previous Article</a>` : '<div></div>'}
  ${next ? `<a href="news_details.html?id=${next.id}" class="btn btn-outline-secondary">Next Article &raquo;</a>` : '<div></div>'}
</div>`;
      container.innerHTML = `
<h2 class="fw-bold mb-3">${item.title}</h2>
<p class="recent_news_time">${item.date}</p>
<img src="${item.image}" class="img-fluid mb-4" alt="${item.title}">
<div class="news_body">${item.content}</div>
${buttons}`;
    })
    .catch(err => {
      console.error('Error loading news details:', err);
      const container = document.getElementById('newsDetailsContainer');
      if (container) container.innerHTML = "<p class='text-center'>Error loading news details.</p>";
    });
}
