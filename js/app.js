(function () {
  var config = Object.prototype.toString.call(window.DASHBOARD_CONFIG) === "[object Array]"
    ? window.DASHBOARD_CONFIG
    : [];
  var snapshotMetadata = null;
  var snapshotSettings = null;

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

  function getSelectedSlideIds() {
    var raw;
    var parsed;
    var ids = {};
    var i;

    try {
      raw = window.localStorage.getItem("dashboard-slideshow-selected");
    } catch (error) {
      raw = "";
    }

    if (!raw) return null;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return null;
    }

    if (Object.prototype.toString.call(parsed) !== "[object Array]") return null;

    for (i = 0; i < parsed.length; i += 1) {
      ids[String(parsed[i])] = true;
    }

    return ids;
  }

  function setSelectedSlideIds(ids) {
    var values = [];
    var key;

    for (key in ids) {
      if (Object.prototype.hasOwnProperty.call(ids, key) && ids[key]) {
        values.push(Number(key));
      }
    }

    values.sort(function (a, b) { return a - b; });

    try {
      window.localStorage.setItem("dashboard-slideshow-selected", JSON.stringify(values));
    } catch (error) {
      return;
    }
  }

  function setText(node, value) {
    if (node) {
      node.innerText = value;
      node.textContent = value;
    }
  }

  function loadJson(url, callback) {
    var request;

    if (!window.XMLHttpRequest) {
      callback(null);
      return;
    }

    request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return;

      if ((request.status >= 200 && request.status < 300) || (request.status === 0 && request.responseText)) {
        try {
          callback(JSON.parse(request.responseText));
        } catch (error) {
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    request.send(null);
  }

  function loadSnapshotMetadata(callback) {
    if (snapshotMetadata) {
      callback(snapshotMetadata);
      return;
    }

    loadJson("snapshots/metadata.json?v=" + encodeURIComponent(String(new Date().getTime())), function (data) {
      snapshotMetadata = data && Object.prototype.toString.call(data.dashboards) === "[object Array]"
        ? data
        : { dashboards: [] };
      callback(snapshotMetadata);
    });
  }

  function loadSnapshotSettings(callback) {
    if (snapshotSettings) {
      callback(snapshotSettings);
      return;
    }

    loadJson("snapshot-config.json?v=" + encodeURIComponent(String(new Date().getTime())), function (data) {
      snapshotSettings = data || {};
      callback(snapshotSettings);
    });
  }

  function findDashboardById(id) {
    var i;

    for (i = 0; i < config.length; i += 1) {
      if (String(config[i].id) === String(id)) {
        return config[i];
      }
    }

    return null;
  }

  function findSnapshotById(id, metadata) {
    var list = metadata && Object.prototype.toString.call(metadata.dashboards) === "[object Array]"
      ? metadata.dashboards
      : [];
    var i;

    for (i = 0; i < list.length; i += 1) {
      if (String(list[i].id) === String(id)) {
        return list[i];
      }
    }

    return null;
  }

  function formatDateTime(value) {
    var date;

    if (!value) return "";

    date = new Date(value);
    if (isNaN(date.getTime())) return "";

    try {
      return date.toLocaleString();
    } catch (error) {
      return value;
    }
  }

  function buildSnapshotUrl(snapshot) {
    var path = snapshot && snapshot.snapshotPath ? String(snapshot.snapshotPath) : "";

    if (!path || snapshot.status !== "ok") return "";

    return path + (path.indexOf("?") === -1 ? "?" : "&") + "t=" + encodeURIComponent(snapshot.capturedAt || new Date().getTime());
  }

  function requestFullscreen(target) {
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
  }

  function getSnapshotStatusHtml(item, metadata) {
    var snapshot = findSnapshotById(item.id, metadata);
    var updated = snapshot && snapshot.status === "ok" ? formatDateTime(snapshot.capturedAt) : "";

    if (updated) {
      return '<div class="snapshot-card-meta">Last updated: ' + escapeHtml(updated) + '</div>';
    }

    if (snapshot && snapshot.status === "failed") {
      return '<div class="snapshot-card-meta unavailable">Snapshot capture failed</div>';
    }

    return '<div class="snapshot-card-meta unavailable">Snapshot not available yet</div>';
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
          + '      <a class="snapshot-dashboard btn" href="snapshot.html?id=' + encodeURIComponent(item.id) + '">TV Preview</a>'
          +        getSnapshotStatusHtml(item, snapshotMetadata)
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

    loadSnapshotMetadata(function () {
      draw(search ? search.value : "");
    });
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

  function loadSnapshotViewer() {
    var stage = document.getElementById("snapshotStage");
    var message = document.getElementById("snapshotMessage");
    var title = document.getElementById("snapshotTitle");
    var updated = document.getElementById("snapshotUpdated");
    var liveLink = document.getElementById("snapshotLiveLink");
    var fullscreen = document.getElementById("snapshotFullscreen");
    var id;
    var item;

    if (!stage) return;

    id = Number(getQueryParam("id"));
    item = findDashboardById(id);

    if (item) {
      document.title = item.name + " Snapshot | Dashboard Portal";
      setText(title, item.name);
      if (liveLink) liveLink.href = "viewer.html?id=" + encodeURIComponent(item.id);
    }

    loadSnapshotSettings(function (settings) {
      loadSnapshotMetadata(function (metadata) {
        var snapshot = findSnapshotById(id, metadata);
        var imageUrl = buildSnapshotUrl(snapshot);
        var refreshInterval = settings
          && settings.snapshot
          && Number(settings.snapshot.refreshIntervalMs)
          ? Number(settings.snapshot.refreshIntervalMs)
          : 3600000;

        if (!item) {
          setText(title, "Snapshot View");
          setText(updated, "Dashboard not found");
          setText(message, "Dashboard not found");
          return;
        }

        if (!imageUrl) {
          setText(updated, "Last updated: not available");
          setText(message, "Snapshot not available yet");
          return;
        }

        stage.innerHTML = '<img class="snapshot-image" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(item.name || "Dashboard snapshot") + '">';
        setText(updated, "Last updated: " + (formatDateTime(snapshot.capturedAt) || "unknown"));

        if (refreshInterval >= 60000) {
          window.setTimeout(function () {
            window.location.reload();
          }, refreshInterval);
        }
      });
    });

    if (fullscreen) {
      fullscreen.onclick = function () {
        requestFullscreen(stage);
      };
    }
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

  function fillSlideshowSelectionControls(onSelectionChange) {
    var panel = document.getElementById("slideshowSelectorPanel");
    var menuButton = document.getElementById("slideshowMenuButton");
    var closeButton = document.getElementById("closeSlideshowPanel");
    var holder = document.getElementById("slideshowDashboardButtons");
    var selectAll = document.getElementById("selectAllSlides");
    var clearAll = document.getElementById("clearAllSlides");
    var count = document.getElementById("slideshowSelectionCount");
    var selected = getSelectedSlideIds();
    var html = "";
    var i;

    if (!panel || !menuButton || !holder) return;

    if (!selected) {
      selected = {};
      for (i = 0; i < config.length; i += 1) {
        selected[String(config[i].id)] = true;
      }
      setSelectedSlideIds(selected);
    }

    function getSelectedCount() {
      var total = 0;
      var key;

      for (key in selected) {
        if (Object.prototype.hasOwnProperty.call(selected, key) && selected[key]) {
          total += 1;
        }
      }

      return total;
    }

    function updateSelectionCount() {
      var total = getSelectedCount();

      setText(count, total + " selected");
    }

    function saveAndRefresh() {
      setSelectedSlideIds(selected);
      updateSelectionCount();
      if (typeof onSelectionChange === "function") {
        onSelectionChange();
      }
    }

    for (i = 0; i < config.length; i += 1) {
      html += '<button class="slideshow-dashboard-choice" type="button" data-dashboard-id="' + escapeHtml(config[i].id) + '">'
        + '<span>' + escapeHtml(String(config[i].id)) + '</span>'
        + escapeHtml(config[i].name || "Dashboard")
        + '</button>';
    }

    holder.innerHTML = html;

    function syncButtons() {
      var buttons = holder.querySelectorAll("[data-dashboard-id]");
      var j;

      for (j = 0; j < buttons.length; j += 1) {
        var id = buttons[j].getAttribute("data-dashboard-id");
        if (selected[id]) {
          buttons[j].className = "slideshow-dashboard-choice selected";
          buttons[j].setAttribute("aria-pressed", "true");
        } else {
          buttons[j].className = "slideshow-dashboard-choice";
          buttons[j].setAttribute("aria-pressed", "false");
        }
      }
    }

    holder.onclick = function (event) {
      var target = event.target;

      while (target && target !== holder && !target.getAttribute("data-dashboard-id")) {
        target = target.parentNode;
      }

      if (!target || target === holder) return;

      selected[target.getAttribute("data-dashboard-id")] = !selected[target.getAttribute("data-dashboard-id")];
      syncButtons();
      saveAndRefresh();
    };

    menuButton.onclick = function () {
      var isOpen = panel.className.indexOf(" open") !== -1;
      panel.className = isOpen
        ? panel.className.replace(/\s*open/g, "")
        : panel.className.replace(/\s*open/g, "") + " open";
      menuButton.setAttribute("aria-expanded", isOpen ? "false" : "true");
    };

    if (closeButton) {
      closeButton.onclick = function () {
        panel.className = panel.className.replace(/\s*open/g, "");
        menuButton.setAttribute("aria-expanded", "false");
      };
    }

    if (selectAll) {
      selectAll.onclick = function () {
        var j;
        for (j = 0; j < config.length; j += 1) {
          selected[String(config[j].id)] = true;
        }
        syncButtons();
        saveAndRefresh();
      };
    }

    if (clearAll) {
      clearAll.onclick = function () {
        var j;
        for (j = 0; j < config.length; j += 1) {
          selected[String(config[j].id)] = false;
        }
        syncButtons();
        saveAndRefresh();
      };
    }

    syncButtons();
    updateSelectionCount();
  }

  function collectSlides(metadata) {
    var slides = [];
    var selected = getSelectedSlideIds();
    var i;

    for (i = 0; i < config.length; i += 1) {
      var item = config[i];
      var snapshot = findSnapshotById(item.id, metadata);
      var image = buildSnapshotUrl(snapshot);
      var period = snapshot && snapshot.status === "ok"
        ? "Last updated: " + (formatDateTime(snapshot.capturedAt) || "unknown")
        : "";

      if (!image) {
        image = getStoredImage(item.id);
        period = getStoredPeriod(item.id);
      }

      if (!image) continue;
      if (selected && !selected[String(item.id)]) continue;

      slides.push({
        id: item.id,
        name: item.name || "Dashboard",
        image: image,
        period: period
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
    var initialized = false;

    if (!stage) return;

    function updateMeta() {
      var slide = slides[current];

      if (!slide) {
        setText(title, "Slideshow");
        setText(date, "No selected dashboard screenshot");
        return;
      }

      setText(title, slide.name);
      setText(date, slide.period || "Snapshot time not set");
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
      if (animating || !slides.length) return;
      current = (current + offset + slides.length) % slides.length;
      draw(offset < 0 ? -1 : 1);
      startTimer();
    }

    function updateFullscreenState() {
      var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

      document.body.className = document.body.className.replace(/\s*slideshow-fullscreen/g, "");

      if (fullscreenElement) {
        document.body.className += " slideshow-fullscreen";
      }
    }

    function ensureSlideNodes() {
      if (initialized) return;

      activeNode = document.createElement("img");
      pendingNode = document.createElement("img");
      activeNode.className = "slideshow-image active";
      pendingNode.className = "slideshow-image";
      activeNode.alt = "";
      pendingNode.alt = "";
      stage.appendChild(activeNode);
      stage.appendChild(pendingNode);
      initialized = true;
    }

    function refreshSlides() {
      var oldSlide = slides && slides[current];
      var i;

      stopTimer();
      slides = collectSlides(snapshotMetadata);

      if (!slides.length) {
        document.body.className = document.body.className.replace(/\s*no-slideshow-slides/g, "") + " no-slideshow-slides";
        if (empty) empty.style.display = "grid";
        if (activeNode) activeNode.removeAttribute("src");
        if (pendingNode) pendingNode.removeAttribute("src");
        updateMeta();
        return;
      }

      document.body.className = document.body.className.replace(/\s*no-slideshow-slides/g, "");
      if (empty) empty.style.display = "none";
      ensureSlideNodes();

      current = 0;
      if (oldSlide) {
        for (i = 0; i < slides.length; i += 1) {
          if (String(slides[i].id) === String(oldSlide.id)) {
            current = i;
            break;
          }
        }
      }

      drawInitial();
      startTimer();
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
        requestFullscreen(stage);
      };
    }
    document.addEventListener("fullscreenchange", updateFullscreenState, false);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState, false);
    document.addEventListener("MSFullscreenChange", updateFullscreenState, false);

    fillSlideshowSelectionControls(refreshSlides);
    loadSnapshotMetadata(refreshSlides);
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
    loadSnapshotViewer();
    loadSlideshow();
    window.addEventListener("resize", sizePortraitDashboardFrame, false);
    window.addEventListener("orientationchange", sizePortraitDashboardFrame, false);
  });
})();
