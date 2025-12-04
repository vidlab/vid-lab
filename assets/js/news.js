fetch("assets/data/news.json")
  .then(response => response.json())
  .then(newsItems => {
    const isHomePage =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html";

    // Remove duplicate entries by id (if any remain in JSON)
    const uniqueItems = [];
    const seen = new Set();
    for (const n of newsItems) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        uniqueItems.push(n);
      }
    }

    // Desired ordering: luncheon first (news-6), then the two most recent acceptances (news-1, news-2), then the rest
    const desiredOrderIds = ["news-6", "news-1", "news-2"];
    const ordered = desiredOrderIds.map(id => uniqueItems.find(x => x.id === id)).filter(Boolean);
    const remaining = uniqueItems.filter(x => !desiredOrderIds.includes(x.id));
    const sortedNews = [...ordered, ...remaining];

    if (isHomePage) {
      // --- Homepage: Carousel slider showing 3 cards per slide ---
      const carouselInner = document.getElementById("newsCarouselInner");
      const carouselIndicators = document.getElementById("newsCarouselIndicators");
      if (!carouselInner || !carouselIndicators) return;

      carouselInner.innerHTML = "";
      carouselIndicators.innerHTML = "";

      const cardsPerSlide = 3;
      const totalSlides = Math.ceil(sortedNews.length / cardsPerSlide);

      for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
        const startIdx = slideIndex * cardsPerSlide;
        const slideNews = sortedNews.slice(startIdx, startIdx + cardsPerSlide);

        let slideHTML = `
          <div class="carousel-item ${slideIndex === 0 ? 'active' : ''}">
            <div class="row g-4 justify-content-center">
        `;

        slideNews.forEach(article => {
          slideHTML += `
            <div class="col-md-4">
              <div class="card card-hover h-100">
                <img src="${article.image}" class="card-img-top img-fluid" alt="${article.title}">
                <div class="card-body">
                  <p class="recent_news_time">${article.date}</p>
                  <h5 class="card-title">${article.title}</h5>
                  <p class="card-text">${article.summary}</p>
                  <a href="news_details.html?id=${article.id}" class="btn btn-outline-secondary">
                    Read More
                  </a>
                </div>
              </div>
            </div>
          `;
        });

        slideHTML += `
            </div>
          </div>
        `;
        carouselInner.innerHTML += slideHTML;

        // Add indicator for this slide
        carouselIndicators.innerHTML += `
          <button type="button" data-bs-target="#newsCarousel" data-bs-slide-to="${slideIndex}" 
            ${slideIndex === 0 ? 'class="active" aria-current="true"' : ''} 
            aria-label="Slide ${slideIndex + 1}"></button>
        `;
      }
    } else {
      // --- News page: Regular card grid ---
      const newsContainer = document.querySelector(".recent_news_card .row");
      if (!newsContainer) return;

      newsContainer.innerHTML = "";

      sortedNews.forEach(article => {
        newsContainer.innerHTML += `
          <div class="col-md-4">
            <div class="card card-hover h-100">
              <img src="${article.image}" class="card-img-top img-fluid" alt="${article.title}">
              <div class="card-body">
                <p class="recent_news_time">${article.date}</p>
                <h5 class="card-title">${article.title}</h5>
                <p class="card-text">${article.summary}</p>
                <a href="news_details.html?id=${article.id}" class="btn btn-outline-secondary">
                  Read More
                </a>
              </div>
            </div>
          </div>
        `;
      });
    }
  })
  .catch(error => console.error("Error loading news:", error));



// ------------------ details page logic ------------------

if (window.location.pathname.includes("news_details.html")) {
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get("id");

  fetch("assets/data/news.json")
    .then(response => response.json())
    .then(newsItems => {
      // sanitize and reorder same as listing
      const uniqueItemsDetail = [];
      const seenDetail = new Set();
      for (const n of newsItems) {
        if (!seenDetail.has(n.id)) {
          seenDetail.add(n.id);
          uniqueItemsDetail.push(n);
        }
      }
      const desiredOrderIdsDetail = ["news-6", "news-1", "news-2"];
      const orderedDetail = desiredOrderIdsDetail.map(id => uniqueItemsDetail.find(x => x.id === id)).filter(Boolean);
      const remainingDetail = uniqueItemsDetail.filter(x => !desiredOrderIdsDetail.includes(x.id));
      newsItems = [...orderedDetail, ...remainingDetail];
      const currentIndex = newsItems.findIndex(x => x.id === newsId);
      const newsItem = newsItems[currentIndex];
      const container = document.getElementById("newsDetailsContainer");

      if (!container) return;

      if (!newsItem) {
        container.innerHTML = "<p class='text-center'>News article not found.</p>";
        return;
      }

      // determine prev/next IDs
      const prevItem = currentIndex > 0 ? newsItems[currentIndex - 1] : null;
      const nextItem = currentIndex < newsItems.length - 1 ? newsItems[currentIndex + 1] : null;

      // generate button group
      let buttons = `
  <div class="mt-4 d-flex justify-content-between flex-wrap">
    ${prevItem
          ? `<a href="news_details.html?id=${prevItem.id}" class="btn btn-outline-secondary">&laquo; Previous Article</a>`
          : `<div></div>`}
    ${nextItem
          ? `<a href="news_details.html?id=${nextItem.id}" class="btn btn-outline-secondary">Next Article &raquo;</a>`
          : `<div></div>`}
  </div>
`;

      container.innerHTML = `
        <h2 class="fw-bold mb-3">${newsItem.title}</h2>
        <p class="recent_news_time">${newsItem.date}</p>
        <img src="${newsItem.image}" class="img-fluid mb-4" alt="${newsItem.title}">
        <div class="news_body">${newsItem.content}</div>
        ${buttons}
      `;
    })
    .catch(err => {
      console.error("Error loading news details:", err);
      const container = document.getElementById("newsDetailsContainer");
      if (container) {
        container.innerHTML =
          "<p class='text-center'>Error loading news details.</p>";
      }
    });
}