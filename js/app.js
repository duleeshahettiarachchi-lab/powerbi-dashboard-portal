(function () {
  var config = Object.prototype.toString.call(window.DASHBOARD_CONFIG) === "[object Array]"
    ? window.DASHBOARD_CONFIG
    : [];

  function hasUrl(item) {
    return Boolean(item && typeof item.url === "string" && item.url.replace(/^\s+|\s+$/g, ""));
  }

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getQueryParam(name) {
    var query = window.location.search ? window.location.search.substring(1) : "";
    var pairs = query.split("&");

    for (var i = 0; i < pairs.length; i += 1) {
      var parts = pairs[i].split("=");
      if (decodeURIComponent(parts[0] || "") === name) {
        return decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
      }
    }

    return "";
  }

  function appendUrlParam(url, name, value) {
    var hash = "";
    var hashIndex = url.indexOf("#");
    var separator;

    if (hashIndex !== -1) {
      hash = url.substring(hashIndex);
      url = url.substring(0, hashIndex);
    }

    if (url.indexOf(name + "=") !== -1) {
      return url + hash;
    }

    separator = url.indexOf("?") === -1 ? "?" : "&";
    return url + separator + encodeURIComponent(name) + "=" + encodeURIComponent(value) + hash;
  }

  function buildDashboardUrl(value) {
    var rawUrl = trim(value);

    if (rawUrl.indexOf("powerbi.com") !== -1) {
      rawUrl = appendUrlParam(rawUrl, "pageView", "fitToPage");
    }

    return rawUrl;
  }

  function getImageKey(id) {
    return "dashboard-slideshow-image-" + String(id);
  }

  function getPeriodKey(id) {
    return "dashboard-slideshow-period-" + String(id);
  }

  function getStoredImage(id) {
    try {
      return window.localStorage.getItem(getImageKey(id));
    } catch (error) {
      return "";
    }
  }

  function getStoredPeriod(id) {
    try {
      return window.localStorage.getItem(getPeriodKey(id));
    } catch (error) {
      return "";
    }
  }

  function setStoredSlide(id, image, period) {
    try {
      window.localStorage.setItem(getImageKey(id), image);
      window.localStorage.setItem(getPeriodKey(id), period);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getMonthName(monthNumber) {
    var names = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return names[Math.max(0, Math.min(11, Number(monthNumber) - 1))];
  }

  function formatReportPeriod(year, month) {
    year = Number(year);
    month = Number(month);

    if (!year || !month) return "";
    return getMonthName(month) + "-" + String(year);
  }

  function setText(node, value) {
    if (node) {
      node.innerText = value;
      node.textContent = value;
    }
  }

  function renderDashboardCards() {
    var grid = document.getElementById("dashboardGrid");
    var search;
    var counter;
    var emptyState;

    if (!grid) return;

    search = document.getElementById("dashboardSearch");
    counter = document.getElementById("dashboardCount");
    emptyState = document.getElementById("emptyState");

    function draw(filterText) {
      var term = trim(filterText).toLowerCase();
      var html = "";
      var count = 0;
      var i;

      for (i = 0; i < config.length; i += 1) {
        var item = config[i];
        var name = String(item.name || "");
        var description = String(item.description || "");
        var available = hasUrl(item);

        if (
          term &&
          name.toLowerCase().indexOf(term) === -1 &&
          description.toLowerCase().indexOf(term) === -1
        ) {
          continue;
        }

        count += 1;
        html += ''
          + '<article class="dashboard-card">'
          + '  <div class="card-accent"></div>'
          + '  <div class="card-body">'
          + '    <div class="card-top">'
          + '      <div class="dashboard-icon">' + escapeHtml(item.icon || "BI") + '</div>'
          + '      <span class="status-badge ' + (available ? "available" : "unavailable") + '">'
          +          (available ? "Available" : "Not available")
          + '      </span>'
          + '    </div>'
          + '    <h3>' + escapeHtml(name) + '</h3>'
          + '    <p>' + escapeHtml(description) + '</p>'
          + '    <div class="card-action">'
          +        (available
            ? '<a class="open-dashboard enabled btn" href="viewer.html?id=' + encodeURIComponent(item.id) + '&v=20260901-9">Open Dashboard &rarr;</a>'
            : '')
          + '    </div>'
          + '  </div>'
          + '</article>';
      }

      grid.innerHTML = html;
      setText(counter, count + " dashboard" + (count === 1 ? "" : "s"));
      if (emptyState) emptyState.style.display = count ? "none" : "block";
    }

    draw("");
    if (search) {
      search.onkeyup = function () { draw(search.value); };
      search.onsearch = function () { draw(search.value); };
      search.onchange = function () { draw(search.value); };
    }
  }

  function renderViewerTools(stage, item) {
    var id = item && item.id;

    stage.insertAdjacentHTML("beforeend", ''
      + '<div class="viewer-tools">'
      + '  <a class="viewer-tool-btn" href="dashboards.html" title="Back to dashboards">Back</a>'
      + '  <a class="viewer-tool-btn" href="slideshow.html" title="Open slideshow">Slideshow</a>'
      + '</div>');
  }

  function renderEmbeddedViewer(stage, item, dashboardUrl) {
    var name = item && item.name ? item.name : "Dashboard";

    stage.innerHTML = ''
      + '<div class="dashboard-frame-wrap">'
      + '  <iframe class="dashboard-frame" src="' + escapeHtml(dashboardUrl) + '" title="' + escapeHtml(name) + '" allowfullscreen></iframe>'
      + '</div>';

    sizePortraitDashboardFrame();
  }

  function sizePortraitDashboardFrame() {
    var wrap = document.querySelector(".dashboard-frame-wrap");
    var isPortraitPhone = window.matchMedia
      && window.matchMedia("(max-width: 820px) and (orientation: portrait)").matches;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var reportWidth = 1280;
    var reportHeight = 720;
    var scale;

    if (!wrap) return;

    if (!isPortraitPhone) {
      wrap.style.removeProperty("--report-scale");
      return;
    }

    scale = Math.min(viewportWidth / reportWidth, viewportHeight / reportHeight);
    wrap.style.setProperty("--report-scale", String(scale));
  }

  function loadViewer() {
    var stage = document.getElementById("viewerStage");
    var id;
    var item = null;
    var title;
    var i;
    var dashboardUrl;

    if (!stage) return;

    id = Number(getQueryParam("id"));
    title = document.getElementById("viewerName");

    for (i = 0; i < config.length; i += 1) {
      if (Number(config[i].id) === id) {
        item = config[i];
        break;
      }
    }

    if (!item || !hasUrl(item)) {
      if (title) setText(title, item ? item.name : "Dashboard Viewer");
      stage.innerHTML = ''
        + '<div class="viewer-message">'
        + '  <div class="viewer-message-card">'
        + '    <div class="viewer-message-icon">BI</div>'
        + '    <h1>Dashboard Not Available</h1>'
        + '    <p>No dashboard URL has been added for this dashboard. Add the URL in <strong>js/dashboard-config.js</strong> and open it again.</p>'
        + '    <a class="btn btn-primary" href="dashboards.html">Back to Dashboards</a>'
        + '  </div>'
        + '</div>';
      return;
    }

    if (title) setText(title, item.name);
    document.title = item.name + " | Dashboard Portal";

    dashboardUrl = buildDashboardUrl(item.url);
    renderEmbeddedViewer(stage, item, dashboardUrl);
    renderViewerTools(stage, item);
  }

  function getSlideshowSeconds() {
    var value;

    try {
      value = Number(window.localStorage.getItem("dashboard-slideshow-seconds"));
    } catch (error) {
      value = 10;
    }

    if (!value || value < 3) return 10;
    if (value > 300) return 300;
    return value;
  }

  function setSlideshowSeconds(value) {
    try {
      window.localStorage.setItem("dashboard-slideshow-seconds", String(value));
    } catch (error) {
      return;
    }
  }

  function fillSlideshowUploadControls() {
    var select = document.getElementById("slideshowDashboardSelect");
    var year = document.getElementById("slideshowYear");
    var month = document.getElementById("slideshowMonth");
    var input = document.getElementById("slideshowUploadInput");
    var html = "";
    var now = new Date();
    var i;

    if (!select || !year || !month || !input) return;

    for (i = 0; i < config.length; i += 1) {
      html += '<option value="' + escapeHtml(config[i].id) + '">' + escapeHtml(config[i].name || "Dashboard") + '</option>';
    }

    select.innerHTML = html;
    year.value = String(now.getFullYear());
    month.value = String(now.getMonth() + 1);

    input.onchange = function () {
      var file = input.files && input.files[0];
      var id = select.value;
      var period = formatReportPeriod(year.value, month.value);
      var reader;

      if (!file || !id || !period) return;

      reader = new FileReader();
      reader.onload = function () {
        if (setStoredSlide(id, String(reader.result || ""), period)) {
          window.location.reload();
        } else {
          window.alert("This screenshot is too large for browser storage. Please use a smaller PNG/JPG image.");
        }
      };
      reader.readAsDataURL(file);
    };
  }

  function collectSlides() {
    var slides = [];
    var i;

    for (i = 0; i < config.length; i += 1) {
      var item = config[i];
      var image = getStoredImage(item.id);

      if (!image) continue;

      slides.push({
        name: item.name || "Dashboard",
        image: image,
        period: getStoredPeriod(item.id)
      });
    }

    return slides;
  }

  function loadSlideshow() {
    var stage = document.getElementById("slideshowStage");
    var title = document.getElementById("slideshowTitle");
    var date = document.getElementById("slideshowDate");
    var empty = document.getElementById("slideshowEmpty");
    var prev = document.getElementById("prevSlide");
    var next = document.getElementById("nextSlide");
    var playPause = document.getElementById("playPauseSlide");
    var fullscreen = document.getElementById("fullscreenSlide");
    var secondsInput = document.getElementById("slideSeconds");
    var slides;
    var current = 0;
    var timer = null;
    var playing = true;
    var activeNode;
    var pendingNode;
    var animating = false;
    var controlsHideTimer = null;

    if (!stage) return;

    slides = collectSlides();
    if (!slides.length) {
      document.body.className = document.body.className.replace(/\s*no-slideshow-slides/g, "") + " no-slideshow-slides";
      return;
    }

    document.body.className = document.body.className.replace(/\s*no-slideshow-slides/g, "");
    if (empty) empty.style.display = "none";
    activeNode = document.createElement("img");
    pendingNode = document.createElement("img");
    activeNode.className = "slideshow-image active";
    pendingNode.className = "slideshow-image";
    activeNode.alt = "";
    pendingNode.alt = "";
    stage.appendChild(activeNode);
    stage.appendChild(pendingNode);

    function updateMeta() {
      var slide = slides[current];

      setText(title, slide.name);
      setText(date, slide.period ? "Report: " + slide.period : "Report period not set");
    }

    function drawInitial() {
      var slide = slides[current];

      activeNode.src = slide.image;
      activeNode.title = slide.name;
      activeNode.alt = slide.name;
      updateMeta();
    }

    function draw(direction) {
      var slide = slides[current];
      var oldNode;

      if (animating) return;

      pendingNode.src = slide.image;
      pendingNode.title = slide.name;
      pendingNode.alt = slide.name;
      pendingNode.className = direction < 0
        ? "slideshow-image pending-left"
        : "slideshow-image pending-right";
      pendingNode.offsetHeight;

      animating = true;
      activeNode.className = direction < 0
        ? "slideshow-image exit-right"
        : "slideshow-image exit-left";
      pendingNode.className = "slideshow-image active";
      updateMeta();

      window.setTimeout(function () {
        oldNode = activeNode;
        activeNode = pendingNode;
        pendingNode = oldNode;
        pendingNode.className = "slideshow-image";
        animating = false;
      }, 560);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (playing && slides.length > 1) {
        timer = window.setInterval(function () {
          if (animating) return;
          current = (current + 1) % slides.length;
          draw(1);
        }, getSlideshowSeconds() * 1000);
      }
    }

    function move(offset) {
      if (animating) return;
      current = (current + offset + slides.length) % slides.length;
      draw(offset < 0 ? -1 : 1);
      startTimer();
    }

    function revealControls() {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        return;
      }

      document.body.className = document.body.className.replace(/\s*show-slideshow-controls/g, "") + " show-slideshow-controls";
      if (controlsHideTimer) window.clearTimeout(controlsHideTimer);
      controlsHideTimer = window.setTimeout(function () {
        document.body.className = document.body.className.replace(/\s*show-slideshow-controls/g, "");
      }, 3500);
    }

    function updateFullscreenState() {
      var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

      document.body.className = document.body.className.replace(/\s*show-slideshow-controls/g, "");
      document.body.className = document.body.className.replace(/\s*slideshow-fullscreen/g, "");

      if (fullscreenElement) {
        document.body.className += " slideshow-fullscreen";
      }
    }

    if (secondsInput) {
      secondsInput.value = String(getSlideshowSeconds());
      secondsInput.onchange = function () {
        var value = Number(secondsInput.value);

        if (!value || value < 3) value = 3;
        if (value > 300) value = 300;
        secondsInput.value = String(value);
        setSlideshowSeconds(value);
        startTimer();
      };
    }

    if (prev) prev.onclick = function () { move(-1); };
    if (next) next.onclick = function () { move(1); };
    if (playPause) {
      playPause.onclick = function () {
        playing = !playing;
        setText(playPause, playing ? "Pause" : "Play");
        startTimer();
      };
    }
    if (fullscreen) {
      fullscreen.onclick = function () {
        var target = stage;

        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
          return;
        }

        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        }
      };
    }
    document.addEventListener("fullscreenchange", updateFullscreenState, false);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState, false);
    document.addEventListener("MSFullscreenChange", updateFullscreenState, false);
    document.addEventListener("mousemove", revealControls, false);
    document.addEventListener("touchstart", revealControls, false);
    document.addEventListener("keydown", revealControls, false);

    drawInitial();
    startTimer();
  }

  function ready(callback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      window.setTimeout(callback, 1);
    } else if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", callback, false);
    } else {
      window.attachEvent("onload", callback);
    }
  }

  ready(function () {
    renderDashboardCards();
    loadViewer();
    fillSlideshowUploadControls();
    loadSlideshow();
    window.addEventListener("resize", sizePortraitDashboardFrame, false);
    window.addEventListener("orientationchange", sizePortraitDashboardFrame, false);
  });
})();
