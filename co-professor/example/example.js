/* Co-Professor example report: small conveniences on a page that is complete without them.
   Every finding and plan step is in the HTML, inside native <details>, and in-page links
   work without this script. It opens a closed step or finding that a link or the address
   points to, reveals the two "Open all" buttons, shows what a bar of the plan strip stands
   for, starts two sections closed on narrow screens (the card about this example on phones,
   the order of work below 1100 px) so the verdict and the first steps come sooner, and
   prints every section open. It makes no network request, stores nothing, writes no HTML
   and runs no timers. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function byHash(hash) {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (err) { return null; }
  }

  // Open el and every <details> around it.
  function openTo(el) {
    for (var node = el; node; node = node.parentElement) {
      if (node.tagName === "DETAILS") node.open = true;
    }
  }

  function revealHash(behavior) {
    var target = byHash(location.hash);
    if (!target) return;
    openTo(target);
    target.scrollIntoView({ block: "start", behavior: behavior });
  }

  // A link opens its target before the browser scrolls to it, so the target is visible
  // even when the address already names it.
  document.addEventListener("click", function (ev) {
    var link = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var target = byHash(link.getAttribute("href"));
    if (target) openTo(target);
  });
  window.addEventListener("hashchange", function () { revealHash(reduceMotion ? "auto" : "smooth"); });

  // Narrow screens: close the card's details (phones) and the order of work (below 1100 px).
  // The card's toggle shows only on phones, so it opens again whenever the screen widens.
  if (window.matchMedia) {
    var about = document.getElementById("about-example");
    var phone = window.matchMedia("(max-width: 760px)");
    var order = document.getElementById("order-of-work");
    if (about && phone.matches) about.open = false;
    if (order && window.matchMedia("(max-width: 1100px)").matches) order.open = false;
    var widen = function () { if (about && !phone.matches) about.open = true; };
    if (phone.addEventListener) phone.addEventListener("change", widen);
    else if (phone.addListener) phone.addListener(widen);
  }
  if (location.hash) revealHash("auto");

  // "Open all steps" and "Open all findings": open everything unless all are open already.
  all("button[data-toggle]").forEach(function (button) {
    var kind = button.getAttribute("data-toggle");
    var items = all(kind === "steps" ? "details.ex-step" : "details.ex-finding");
    if (!items.length) return;
    function allOpen() { return items.every(function (d) { return d.open; }); }
    function label() {
      button.textContent = button.getAttribute(allOpen() ? "data-close-label" : "data-open-label");
    }
    button.addEventListener("click", function () {
      var open = !allOpen();
      items.forEach(function (d) { d.open = open; });
      label();
    });
    // "toggle" does not bubble, so listen in the capture phase.
    document.addEventListener("toggle", function (ev) { if (items.indexOf(ev.target) >= 0) label(); }, true);
    label();
    button.hidden = false;
  });

  // The plan strip: the bar under the pointer or the keyboard is named above the strip.
  var readout = document.querySelector(".ex-readout");
  if (readout) all(".ex-bar").forEach(function (bar) {
    function show() { readout.textContent = bar.getAttribute("data-tip") || ""; }
    function clear() { readout.textContent = ""; }
    bar.addEventListener("pointerenter", show);
    bar.addEventListener("focus", show);
    bar.addEventListener("pointerleave", clear);
    bar.addEventListener("blur", clear);
  });

  // Print every step, finding and section open, then close the ones the reader had closed.
  var openedForPrint = [];
  window.addEventListener("beforeprint", function () {
    openedForPrint = all("details:not([open])");
    openedForPrint.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    openedForPrint.forEach(function (d) { d.open = false; });
    openedForPrint = [];
  });
})();
