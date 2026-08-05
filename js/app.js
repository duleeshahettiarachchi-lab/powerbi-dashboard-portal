(function () {
  const config = Array.isArray(window.DASHBOARD_CONFIG) ? window.DASHBOARD_CONFIG : [];

  function hasUrl(item) {
    return Boolean(item && typeof item.url === "string" && item.url.trim());
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getPowerBiPageView() {
    const landscape = window.matchMedia("(orientation: landscape)").matches;
    return landscape ? "fitToPage" : "fitToWidth";
  }

  function buildPowerBiUrl(value) {
    const rawUrl = String(value || "").trim();

    try {
      const url = new URL(rawUrl);
      if (url.hostname.includes("powerbi.com")) {
        url.searchParams.set("pageView", getPowerBiPageView());
      }
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  function setViewerSource(iframe, rawUrl) {
    const nextUrl = buildPowerBiUrl(rawUrl);
    if (iframe.dataset.viewerSource !== nextUrl) {
      iframe.dataset.viewerSource = nextUrl;
      iframe.src = nextUrl;
    }
  }

  function renderDashboardCards() {
    const grid = document.getElementById("dashboardGrid");
    if (!grid) return;

    const search = document.getElementById("dashboardSearch");
    const counter = document.getElementById("dashboardCount");
    const emptyState = document.getElementById("emptyState");

    function draw(filterText = "") {
      const term = filterText.trim().toLowerCase();
      const filtered = config.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );

      grid.innerHTML = filtered.map(item => {
        const available = hasUrl(item);
        return `
          <article class="dashboard-card">
            <div class="card-accent"></div>
            <div class="card-body">
              <div class="card-top">
                <div class="dashboard-icon">${escapeHtml(item.icon || "BI")}</div>
                <span class="status-badge ${available ? "available" : "unavailable"}">
                  ${available ? "Available" : "Not available"}
                </span>
              </div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="card-action">
                ${available
  ? `
    <div class="card-action">
      <a
        class="open-dashboard enabled btn"
        href="viewer.html?id=${encodeURIComponent(item.id)}&v=20260805-4"
      >
        Open Dashboard →
      </a>
    </div>
  `
  : ""
}
              </div>
            </div>
          </article>`;
      }).join("");

      if (counter) counter.textContent = `${filtered.length} dashboard${filtered.length === 1 ? "" : "s"}`;
      if (emptyState) emptyState.style.display = filtered.length ? "none" : "block";
    }

    draw();
    if (search) search.addEventListener("input", event => draw(event.target.value));
  }

  function loadViewer() {
    const stage = document.getElementById("viewerStage");
    if (!stage) return;

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    const item = config.find(entry => Number(entry.id) === id);
    const title = document.getElementById("viewerName");

    if (!item || !hasUrl(item)) {
      if (title) title.textContent = item ? item.name : "Dashboard Viewer";
      stage.innerHTML = `
        <div class="viewer-message">
          <div class="viewer-message-card">
            <div class="viewer-message-icon">BI</div>
            <h1>Dashboard Not Available</h1>
            <p>No Power BI URL has been added for this dashboard. Add the URL in <strong>js/dashboard-config.js</strong> and open it again.</p>
            <a class="btn btn-primary" href="dashboards.html">Back to Dashboards</a>
          </div>
        </div>`;
      return;
    }

    if (title) title.textContent = item.name;
    document.title = `${item.name} | Power BI Dashboard Portal`;

    const iframe = document.createElement("iframe");
    iframe.title = item.name;
    iframe.allowFullscreen = true;
    iframe.setAttribute("allow", "fullscreen");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    stage.appendChild(iframe);
    setViewerSource(iframe, item.url);

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        setViewerSource(iframe, item.url);
      }, 300);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderDashboardCards();
    loadViewer();
  });
})();
