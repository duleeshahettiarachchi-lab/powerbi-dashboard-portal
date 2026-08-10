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

  function appendPowerBiParam(url, name, value) {
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

  function buildPowerBiUrl(value) {
    var rawUrl = trim(value);

    if (rawUrl.indexOf("powerbi.com") !== -1) {
      rawUrl = appendPowerBiParam(rawUrl, "pageView", "fitToWidth");
    }

    return rawUrl;
  }

  function getImageKey(id) {
    return "dashboard-live-image-" + String(id);
  }

  function getStoredImage(id) {
    try {
      return window.localStorage.getItem(getImageKey(id));
    } catch (error) {
      return "";
    }
  }

  function getDashboardImage(item) {
    return getStoredImage(item.id) || trim(item.image || item.imageUrl);
  }

  function setStoredImage(id, value) {
    try {
      window.localStorage.setItem(getImageKey(id), value);
      return true;
    } catch (error) {
      return false;
    }
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
            ? '<a class="open-dashboard enabled btn" href="viewer.html?id=' + encodeURIComponent(item.id) + '&v=20260810-2">Open Dashboard &rarr;</a>'
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

  function bindImageUploads(root) {
    var inputs = root.getElementsByTagName("input");
    var i;

    for (i = 0; i < inputs.length; i += 1) {
      if (inputs[i].className.indexOf("dashboard-image-input") === -1) continue;

      inputs[i].onchange = function () {
        var input = this;
        var id = input.getAttribute("data-dashboard-id");
        var file = input.files && input.files[0];
        var reader;

        if (!file) return;

        reader = new FileReader();
        reader.onload = function () {
          if (setStoredImage(id, String(reader.result || ""))) {
            window.location.href = "viewer.html?id=" + encodeURIComponent(id) + "&mode=image&v=20260810-2";
          } else {
            window.alert("This image is too large for the browser storage. Please use a smaller PNG image.");
          }
        };
        reader.readAsDataURL(file);
      };
    }
  }

  function renderViewerTools(stage, item) {
    var id = item && item.id;

    stage.insertAdjacentHTML("beforeend", ''
      + '<div class="viewer-tools">'
      + '  <a class="viewer-tool-btn" href="dashboards.html" title="Back to dashboards">Back</a>'
      + '  <a class="viewer-tool-btn" href="viewer.html?id=' + encodeURIComponent(id) + '&mode=image&v=20260810-2" title="Open live image">Live Image</a>'
      + '  <label class="viewer-tool-btn" title="Create or replace live image">Create Image'
      + '    <input class="dashboard-image-input" type="file" accept="image/png,image/jpeg,image/webp" data-dashboard-id="' + escapeHtml(id) + '">'
      + '  </label>'
      + '</div>');
    bindImageUploads(stage);
  }

  function renderImageViewer(stage, item, imageData) {
    var id = item && item.id;
    var name = item && item.name ? item.name : "Dashboard";

    if (!imageData) {
      stage.innerHTML = ''
        + '<div class="viewer-message">'
        + '  <div class="viewer-message-card">'
        + '    <div class="viewer-message-icon">IMG</div>'
        + '    <h1>No Live Image</h1>'
        + '    <p>No PNG image has been created for ' + escapeHtml(name) + ' yet. Open the dashboard and use Create Image.</p>'
        + '    <a class="btn btn-primary" href="dashboards.html">Back to Dashboards</a>'
        + '  </div>'
        + '</div>';
      return;
    }

    stage.innerHTML = ''
      + '<img class="live-dashboard-image" src="' + escapeHtml(imageData) + '" alt="' + escapeHtml(name) + '">'
      + '<div class="viewer-tools">'
      + '  <a class="viewer-tool-btn" href="dashboards.html" title="Back to dashboards">Back</a>'
      + '  <label class="viewer-tool-btn" title="Replace live image">Replace'
      + '    <input class="dashboard-image-input" type="file" accept="image/png,image/jpeg,image/webp" data-dashboard-id="' + escapeHtml(id) + '">'
      + '  </label>'
      + '</div>';
    bindImageUploads(stage);
  }

  function showViewerMessage(stage, item, dashboardUrl) {
    var name = item && item.name ? item.name : "Dashboard";
    var linkHtml = dashboardUrl
      ? '<a class="btn btn-primary" href="' + escapeHtml(dashboardUrl) + '" target="_self">Open Directly</a>'
      : '<a class="btn btn-primary" href="dashboards.html">Back to Dashboards</a>';

    stage.innerHTML = ''
      + '<div class="viewer-message">'
      + '  <div class="viewer-message-card">'
      + '    <div class="viewer-message-icon">BI</div>'
      + '    <h1>' + escapeHtml(name) + '</h1>'
      + '    <p>If the dashboard stays blank on this TV, the TV browser may not support Power BI iframe viewing. Use the button below to open the Power BI page directly.</p>'
      +      linkHtml
      + '  </div>'
      + '</div>';
  }

  function loadViewer() {
    var stage = document.getElementById("viewerStage");
    var id;
    var item = null;
    var title;
    var i;
    var iframe;
    var dashboardUrl;
    var fallbackTimer;
    var mode;
    var imageData;

    if (!stage) return;

    id = Number(getQueryParam("id"));
    title = document.getElementById("viewerName");

    for (i = 0; i < config.length; i += 1) {
      if (Number(config[i].id) === id) {
        item = config[i];
        break;
      }
    }

    mode = trim(getQueryParam("mode")).toLowerCase();
    imageData = item ? getDashboardImage(item) : "";

    if (item && mode === "image") {
      if (title) setText(title, item.name);
      document.title = item.name + " Live Image | Power BI Dashboard Portal";
      renderImageViewer(stage, item, imageData);
      return;
    }

    if (!item || !hasUrl(item)) {
      if (title) setText(title, item ? item.name : "Dashboard Viewer");
      stage.innerHTML = ''
        + '<div class="viewer-message">'
        + '  <div class="viewer-message-card">'
        + '    <div class="viewer-message-icon">BI</div>'
        + '    <h1>Dashboard Not Available</h1>'
        + '    <p>No Power BI URL has been added for this dashboard. Add the URL in <strong>js/dashboard-config.js</strong> and open it again.</p>'
        + '    <a class="btn btn-primary" href="dashboards.html">Back to Dashboards</a>'
        + '  </div>'
        + '</div>';
      return;
    }

    if (title) setText(title, item.name);
    document.title = item.name + " | Power BI Dashboard Portal";

    dashboardUrl = buildPowerBiUrl(item.url);
    stage.innerHTML = "";

    iframe = document.createElement("iframe");
    iframe.title = item.name;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("allow", "fullscreen");

    iframe.onload = function () {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };

    stage.appendChild(iframe);
    renderViewerTools(stage, item);
    iframe.src = dashboardUrl;

    fallbackTimer = window.setTimeout(function () {
      if (imageData) {
        renderImageViewer(stage, item, imageData);
      } else {
        showViewerMessage(stage, item, dashboardUrl);
      }
    }, 18000);
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
  });
})();
