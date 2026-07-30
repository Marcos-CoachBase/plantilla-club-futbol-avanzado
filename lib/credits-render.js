(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(credits) {
    var list = document.querySelector("[data-credits]");
    if (!list) return;
    var keys = Object.keys(credits);
    if (!keys.length) { list.innerHTML = "<li>No hay créditos que mostrar.</li>"; return; }
    list.innerHTML = keys.map(function (id) {
      var c = credits[id];
      var creatorLink = c.creator_url
        ? '<a href="' + esc(c.creator_url) + '" target="_blank" rel="noopener">' + esc(c.creator) + "</a>"
        : esc(c.creator);
      return "<li><strong>" + esc(c.title) + "</strong> — " + creatorLink + " (" + esc(c.source) + ") · " +
        '<a href="' + esc(c.license_url) + '" target="_blank" rel="noopener">' + esc(c.license).toUpperCase() + " " + esc(c.license_version || "") + "</a> · " +
        '<a href="' + esc(c.foreign_landing_url) + '" target="_blank" rel="noopener">Ver original ↗</a></li>';
    }).join("");
  }

  function fail() {
    var list = document.querySelector("[data-credits]");
    if (list) {
      list.innerHTML = "<li>Los créditos no se han podido cargar en vista local (file://). Consulta <code>assets/credits.json</code> directamente o abre la web desde un servidor.</li>";
    }
  }

  var started = false;
  function run() {
    if (started) return;
    started = true;

    if (typeof fetch === "undefined") { fail(); return; }

    fetch("assets/credits.json")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(render)
      .catch(fail);
  }

  // Red de seguridad: en algunos entornos el script deferred no arranca
  // exactamente cuando se espera, así que lo intentamos por varias vías.
  run();
  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("load", run);
  setTimeout(run, 1500);
})();
