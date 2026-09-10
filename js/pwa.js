(function () {
  'use strict';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' })
        .catch(function (error) { console.warn('Portal offline support unavailable:', error); });
    });
  }
  var prompt, button;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    prompt = event;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn';
      button.textContent = 'Install app';
      button.addEventListener('click', async function () {
        if (!prompt) return;
        var current = prompt;
        prompt = null;
        button.hidden = true;
        await current.prompt();
      });
      (document.querySelector('.site-nav') || document.querySelector('.auth-card') || document.body).appendChild(button);
    }
    button.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    prompt = null;
    if (button) button.hidden = true;
  });
})();
