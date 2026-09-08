(function () {
  "use strict";

  var config = window.PORTAL_AUTH_CONFIG || {};
  var storageKey = config.storageKey || "powerbi-dashboard-portal-auth";
  var loginPage = "login.html";

  function getStorage() {
    return config.storageType === "local" ? window.localStorage : window.sessionStorage;
  }

  function isLoginPage() {
    return /(^|\/)login\.html$/i.test(window.location.pathname);
  }

  function getReturnTo() {
    var path = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1) || "index.html";
    return path + window.location.search + window.location.hash;
  }

  function getStoredSession() {
    try {
      return JSON.parse(getStorage().getItem(storageKey) || "null");
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {}

    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (error) {}
  }

  function isAuthenticated() {
    var session = getStoredSession();
    var now = new Date().getTime();

    if (!session || !session.passwordHash) return false;
    if (session.passwordHash !== config.passwordHash) return false;
    if (session.expiresAt && Number(session.expiresAt) <= now) {
      clearSession();
      return false;
    }

    return true;
  }

  function redirectToLogin() {
    window.location.replace(loginPage + "?returnTo=" + encodeURIComponent(getReturnTo()));
  }

  function toHex(buffer) {
    var bytes = Array.prototype.slice.call(new Uint8Array(buffer));
    return bytes.map(function (value) {
      return ("00" + value.toString(16)).slice(-2);
    }).join("");
  }

  function hashPassword(password) {
    var encoded;

    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.reject(new Error("This browser does not support password hashing."));
    }

    encoded = new TextEncoder().encode(password);
    return window.crypto.subtle.digest("SHA-256", encoded).then(toHex);
  }

  function setSession() {
    var durationDays = Number(config.sessionDurationDays) || 0;
    var expiresAt = durationDays > 0 ? new Date().getTime() + durationDays * 24 * 60 * 60 * 1000 : null;

    getStorage().setItem(storageKey, JSON.stringify({
      passwordHash: config.passwordHash,
      expiresAt: expiresAt
    }));
  }

  function getLoginReturnUrl() {
    var match = window.location.search.match(/[?&]returnTo=([^&]+)/);
    var returnTo = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "index.html";

    if (/^https?:\/\//i.test(returnTo) || returnTo.indexOf("//") === 0) {
      return "index.html";
    }

    return returnTo;
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function initLoginPage() {
    var form = document.getElementById("authForm");
    var password = document.getElementById("authPassword");
    var togglePassword = document.getElementById("togglePassword");

    if (isAuthenticated()) {
      window.location.replace(getLoginReturnUrl());
      return;
    }

    if (!form || !password) return;

    if (togglePassword) {
      togglePassword.onclick = function () {
        var isVisible = password.type === "text";
        password.type = isVisible ? "password" : "text";
        togglePassword.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
        togglePassword.setAttribute("aria-pressed", isVisible ? "false" : "true");
        password.focus();
      };
    }

    form.onsubmit = function (event) {
      event.preventDefault();
      setText("authError", "");

      hashPassword(password.value).then(function (hash) {
        if (hash === config.passwordHash) {
          setSession();
          window.location.replace(getLoginReturnUrl());
          return;
        }

        password.value = "";
        password.focus();
        setText("authError", "Incorrect password.");
      }).catch(function () {
        setText("authError", "This browser cannot verify the password.");
      });
    };
  }

  function initLogoutButtons() {
    var buttons = document.querySelectorAll("[data-auth-logout]");
    var i;

    for (i = 0; i < buttons.length; i += 1) {
      buttons[i].onclick = function () {
        clearSession();
        redirectToLogin();
      };
    }

    document.addEventListener("click", function (event) {
      var target = event.target;

      while (target && target !== document) {
        if (target.getAttribute && target.getAttribute("data-auth-logout") !== null) {
          event.preventDefault();
          clearSession();
          redirectToLogin();
          return;
        }

        target = target.parentNode;
      }
    }, false);
  }

  window.PortalAuth = {
    clearSession: clearSession,
    isAuthenticated: isAuthenticated,
    logout: function () {
      clearSession();
      redirectToLogin();
    }
  };

  if (!isLoginPage() && !isAuthenticated()) {
    redirectToLogin();
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (isLoginPage()) {
      initLoginPage();
    } else {
      initLogoutButtons();
    }
  }, false);
})();
