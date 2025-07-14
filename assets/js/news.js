fetch("assets/data/news.json")
  .then(response => response.json())
  .then(newsItems => {
    const newsContainer = document.querySelector(".recent_news_card .row");
    if (!newsContainer) return; // exit if not found

    newsContainer.innerHTML = ""; // clear existing

    const isHomePage =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html";

    const articlesToShow = isHomePage ? newsItems.slice(0, 3) : newsItems;

    articlesToShow.forEach(article => {
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
  })
  .catch(error => console.error("Error loading news:", error));



// ------------------ details page logic ------------------

if (window.location.pathname.includes("news_details.html")) {
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get("id");

  fetch("assets/data/news.json")
    .then(response => response.json())
    .then(newsItems => {
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