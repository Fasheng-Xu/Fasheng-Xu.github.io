/* Co-Professor live page: reveals, the project brief tool and the pilot request form.
   Adapted from the Codex editorial script (site/variants/editorial/editorial.js) without
   the Scroll Craft engine. Nothing runs in a loop: the reveals use an
   IntersectionObserver and stop once shown. The only network request is the form's
   POST to the endpoint named on #pilot-form (data-endpoint), sent when the visitor
   presses Send. The only thing stored is the time of each send attempt, for the rate
   limit, in sessionStorage (this tab, until it closes); the brief stays in this tab. */
(function () {
  "use strict";

  var root = document.documentElement;
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  /* Reveals */

  (function setUpReveals() {
    var targets = all("[data-reveal], [data-draw]");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!targets.length || reduce || !("IntersectionObserver" in window)) return;
    var height = window.innerHeight || root.clientHeight;
    targets.forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < height && box.bottom > 0) el.classList.add("is-shown");
    });
    root.classList.add("reveal-ready");
    // A wiped element is fully clipped until shown, and the observer counts its own clip,
    // so watch its parent instead.
    var shows = new Map();
    function show(entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (shows.get(entry.target) || []).forEach(function (el) { el.classList.add("is-shown"); });
        observer.unobserve(entry.target);
      });
    }
    var reveal = new IntersectionObserver(show, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    var draw = new IntersectionObserver(show, { rootMargin: "0px 0px -25% 0px", threshold: 0 });
    targets.forEach(function (el) {
      if (el.classList.contains("is-shown")) return;
      var watched = el.getAttribute("data-reveal") === "wipe" ? el.parentElement : el;
      shows.set(watched, (shows.get(watched) || []).concat([el]));
      (el.hasAttribute("data-draw") ? draw : reveal).observe(watched);
    });
    window.addEventListener("beforeprint", function () {
      targets.forEach(function (el) { el.classList.add("is-shown"); });
    });
  })();

  // Print the accordions open, then close the ones the reader had closed.
  var openedForPrint = [];
  window.addEventListener("beforeprint", function () {
    openedForPrint = all("details:not([open])");
    openedForPrint.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    openedForPrint.forEach(function (d) { d.open = false; });
    openedForPrint = [];
  });

  /* Pilot form fields the brief tool also uses */

  var form = document.getElementById("pilot-form");
  var projectType = document.getElementById("f-project-type");
  var description = document.getElementById("f-description");
  var includeBrief = document.getElementById("f-include-brief");
  var formBrief = document.getElementById("f-brief");
  var formBriefWrap = document.getElementById("f-brief-wrap");
  var output = document.getElementById("brief-text");

  // The brief goes with the request only while "Include my project brief" is ticked; then
  // the description may stay empty.
  function syncFormBrief() {
    if (!includeBrief || !formBrief) return;
    var on = includeBrief.checked;
    formBrief.value = on && output ? output.value : "";
    formBriefWrap.hidden = !on;
    if (description) description.required = !on;
  }

  /* Field errors: shown under the field they are about and linked to it */

  function errorFor(el) { return el && el.id ? document.getElementById(el.id + "-error") : null; }
  function describedBy(el) { return (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); }
  function clearProblem(el) {
    if (!el || !el.removeAttribute) return;
    el.removeAttribute("aria-invalid");
    var msg = errorFor(el);
    if (!msg) return;
    var ids = describedBy(el).filter(function (id) { return id !== msg.id; });
    if (ids.length) el.setAttribute("aria-describedby", ids.join(" ")); else el.removeAttribute("aria-describedby");
    msg.remove();
  }
  function showProblem(el, text) {
    var msg = errorFor(el);
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "field-error";
      msg.id = el.id + "-error";
      var after = el.type === "checkbox" ? el.closest("label") : el;
      after.parentNode.insertBefore(msg, after.nextSibling);
    }
    msg.textContent = text;
    var ids = describedBy(el);
    if (ids.indexOf(msg.id) < 0) el.setAttribute("aria-describedby", [msg.id].concat(ids).join(" "));
    el.setAttribute("aria-invalid", "true");
    el.focus();
  }

  function routeOption(route) {
    if (!projectType || !/^[a-z-]+$/.test(route || "")) return null;
    return projectType.querySelector('option[data-route="' + route + '"]');
  }
  function preselect(route) {
    var option = routeOption(route);
    if (option) { projectType.value = option.value; clearProblem(projectType); }
  }
  // While the brief goes with the request, the form's project type follows the brief's
  // starting point (a small-group workflow session keeps its own type).
  function followBrief(route) {
    var current = projectType && projectType.options[projectType.selectedIndex];
    if (current && current.getAttribute("data-route") === "workflow-group" && route === "workflow") return;
    preselect(route);
  }
  all("[data-preselect]").forEach(function (link) {
    link.addEventListener("click", function () { preselect(link.getAttribute("data-preselect")); });
  });

  /* Project brief tool */

  var composer = document.getElementById("composer");
  var briefFallback = document.getElementById("brief-fallback");
  var changeRoute = function () {};

  // If the tool fails to start, it stays hidden and its email note stays visible; the
  // request form below still works.
  if (composer && output) {
    try { setUpComposer(); } catch (err) {
      composer.hidden = true;
      if (briefFallback) briefFallback.hidden = false;
    }
  }

  function setUpComposer() {
    var routeSelect = document.getElementById("project-route");
    var fields = {
      context: document.getElementById("project-context"),
      extra: document.getElementById("project-extra"),
      materials: document.getElementById("project-materials"),
      goal: document.getElementById("project-goal")
    };
    var extraField = document.getElementById("extra-field");
    var undoButton = document.getElementById("undo-brief");
    var status = document.getElementById("brief-status");

    var ROUTES = {
      analytical: { title: "An analytical paper (LaTeX)", kind: "research", context: "Field and research question", prompt: "What are you trying to understand?", materials: "Materials you could bring", extra: "Target journal", extraPrompt: "For example, Management Science", aim: "Examine assumptions, derivations and results, then prioritize a revision plan." },
      empirical: { title: "An empirical paper", kind: "research", context: "Research question and empirical setting", prompt: "What is the question, and what could the evidence establish?", materials: "Draft, design and evidence available", extra: "Target journal", extraPrompt: "For example, Management Science", aim: "Examine design, identification, robustness and interpretation, then prioritize revisions." },
      funding: { title: "A funding proposal", kind: "research", context: "Proposed question and significance", prompt: "What do you want to study, and why does it matter?", materials: "Proposal materials and call requirements", extra: "Target funder or call", extraPrompt: "Funder name and call", aim: "Clarify the question, significance and work plan against the funder's criteria and its rules on AI use." },
      "ai-course": { title: "A course redesign for students who use AI", kind: "teaching", context: "Learning goals and how students use AI now", prompt: "What should students practice themselves, and where should AI help?", materials: "Current activities and assessments", aim: "Redesign activities and assessments so students practice, explain and defend their reasoning, with a clear AI policy and rubric changes." },
      materials: { title: "Lectures, slides and assignments", kind: "teaching", context: "Subject and learning goals", prompt: "What should students understand or be able to do?", materials: "Slides, notes and exercises available", aim: "Draft connected lectures, slides, examples, assignments and solution checks with agentic workflows, for you to review before use." },
      "course-package": { title: "A coherent course package", kind: "teaching", context: "Course subject and learning goals", prompt: "What is the through line you want the course to have?", materials: "Existing course materials", aim: "Organize existing materials into a coherent course with a clear sequence, consistent terminology and an instructor guide." },
      simulation: { title: "A classroom simulation", kind: "teaching", context: "Concepts and decisions to experience", prompt: "What tradeoff or decision should students experience?", materials: "Cases, examples or game ideas available", aim: "Develop roles, decision rounds, instructor controls and a debrief tied to the course concepts." },
      workflow: { title: "AI workflow guidance for my own work", kind: "workflow", context: "The research or teaching work you want help with", prompt: "Which parts should AI take on, and which stay with you?", materials: "Tools and access you have now (for example, a campus AI license)", aim: "Set up a directed workflow with defined, checkable tasks, and learn to check what comes back." }
    };
    var TEACHING_EXTRA = { extra: "Student level and class time", extraPrompt: "For example, MBA, 90 minutes" };
    var EMPTY_EXTRA = { research: "Add a target, if you have one", teaching: "Add student level and available time" };
    var MESSAGES = {
      notRebuilt: "Your brief has your own edits, so it was not rebuilt. Choose Rebuild from the fields to start again.",
      edited: "Your edits are kept when you copy, download or add the brief to your request.",
      rebuilt: "Brief rebuilt from your starting point and context.",
      rebuiltOverEdits: "Rebuilt from the fields. Choose Undo to restore your edited version.",
      undone: "Your edited version is back.",
      copied: "Brief copied. Nothing was sent.",
      copyUnavailable: "Automatic copy is unavailable. The brief is selected so you can copy it yourself.",
      downloaded: "A text-file download was requested. Nothing was sent.",
      added: "Your brief will go with your pilot request when you send it. It has not been sent yet."
    };

    var states = Object.create(null);
    var activeRoute = routeSelect.value;
    var edited = false; // the brief holds the visitor's own edits
    var undoText = ""; // the edited brief a rebuild replaced

    function setStatus(text) { if (status.textContent !== text) status.textContent = text; }
    function extraFor(route) { return route.kind === "teaching" ? TEACHING_EXTRA : route; }
    function orPrompt(value, fallback) { return value.trim() || "[" + fallback + "]"; }

    function makeBrief() {
      var route = ROUTES[activeRoute];
      var lines = ["CO-PROFESSOR PROJECT BRIEF", "", "Project: " + route.title, "",
        route.context + ":", orPrompt(fields.context.value, "Add your context"), ""];
      if (route.kind !== "workflow") {
        lines.push(extraFor(route).extra + ":", orPrompt(fields.extra.value, EMPTY_EXTRA[route.kind]), "");
      }
      lines.push(route.materials + ":", orPrompt(fields.materials.value, "Describe the materials you could bring"), "",
        "A useful outcome:", fields.goal.value.trim() || route.aim, "",
        "Working approach:",
        "Start with relevant context. Use AI for defined, checkable tasks. I keep the intellectual choices, verify the outputs and decide what to use.", "",
        "Next step:",
        "Agree on the scope, the materials, who sees them, the timing and the price before any work starts.");
      return lines.join("\n");
    }

    function snapshot() {
      states[activeRoute] = { context: fields.context.value, extra: fields.extra.value, materials: fields.materials.value,
        goal: fields.goal.value, output: output.value, edited: edited, undo: undoText };
    }

    function showLabels(route) {
      document.getElementById("context-label").textContent = route.context;
      document.getElementById("materials-label").textContent = route.materials;
      fields.context.placeholder = route.prompt;
      extraField.hidden = route.kind === "workflow";
      document.getElementById("extra-label").textContent = extraFor(route).extra || "";
      fields.extra.placeholder = extraFor(route).extraPrompt || "";
    }

    changeRoute = function (next) {
      if (!ROUTES[next] || next === activeRoute) return;
      snapshot();
      activeRoute = next;
      routeSelect.value = next;
      var state = states[next] || {};
      Object.keys(fields).forEach(function (key) { fields[key].value = state[key] || ""; });
      edited = !!state.edited;
      undoText = state.undo || "";
      showLabels(ROUTES[next]);
      output.value = edited ? state.output : makeBrief();
      undoButton.hidden = !undoText;
      setStatus("");
      if (includeBrief && includeBrief.checked) followBrief(next);
      syncFormBrief();
    };

    if (!ROUTES[activeRoute]) activeRoute = routeSelect.value = "analytical";
    showLabels(ROUTES[activeRoute]);
    output.value = makeBrief();
    syncFormBrief();
    routeSelect.addEventListener("change", function () { changeRoute(routeSelect.value); });

    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("input", function () {
        if (edited) { setStatus(MESSAGES.notRebuilt); return; }
        output.value = makeBrief();
        syncFormBrief();
      });
    });
    output.addEventListener("input", function () {
      if (!edited) setStatus(MESSAGES.edited);
      edited = true;
      undoText = "";
      undoButton.hidden = true;
      syncFormBrief();
    });

    document.getElementById("rebuild-brief").addEventListener("click", function () {
      if (edited) {
        undoText = output.value;
        undoButton.hidden = false;
        setStatus(MESSAGES.rebuiltOverEdits);
      } else {
        setStatus(MESSAGES.rebuilt);
      }
      edited = false;
      output.value = makeBrief();
      syncFormBrief();
    });
    undoButton.addEventListener("click", function () {
      if (!undoText) return;
      output.value = undoText;
      undoText = "";
      edited = true;
      undoButton.hidden = true;
      output.focus();
      setStatus(MESSAGES.undone);
      syncFormBrief();
    });

    document.getElementById("copy-brief").addEventListener("click", function () {
      function fallback() {
        output.focus();
        output.select();
        setStatus(MESSAGES.copyUnavailable);
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
      navigator.clipboard.writeText(output.value).then(function () { setStatus(MESSAGES.copied); }, fallback);
    });
    document.getElementById("download-brief").addEventListener("click", function () {
      var url = URL.createObjectURL(new Blob([output.value + "\n"], { type: "text/plain;charset=utf-8" }));
      var link = document.createElement("a");
      link.href = url;
      link.download = "co-professor-" + activeRoute + "-brief.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setStatus(MESSAGES.downloaded);
    });
    // Adding the brief takes the visitor back to the request, where it waits to be sent.
    document.getElementById("add-brief").addEventListener("click", function () {
      if (!includeBrief) return;
      includeBrief.checked = true;
      clearProblem(includeBrief);
      followBrief(activeRoute);
      syncFormBrief();
      setStatus(MESSAGES.added);
      includeBrief.focus({ preventScroll: true });
      includeBrief.closest(".field").scrollIntoView({ block: "start" });
    });

    // "Build a project brief first" in the form starts the tool on the chosen project type.
    var toBrief = document.getElementById("to-brief");
    if (toBrief && projectType) toBrief.addEventListener("click", function () {
      var option = projectType.options[projectType.selectedIndex];
      var route = option && option.getAttribute("data-route");
      if (route && ROUTES[route] && route !== activeRoute) changeRoute(route);
    });

    composer.hidden = false;
    if (briefFallback) briefFallback.hidden = true;
  }

  /* Pilot request form */

  if (form) (function setUpForm() {
    var endpoint = (form.getAttribute("data-endpoint") || "").trim();
    if (!/^https:\/\/[^\s"'<>]+$/.test(endpoint)) endpoint = "";

    var status = document.getElementById("f-status");
    var button = form.querySelector("button[type=submit]");
    var trap = document.getElementById("f-leave-blank");
    var field = {
      name: document.getElementById("f-name"),
      email: document.getElementById("f-email"),
      institution: document.getElementById("f-institution"),
      role: document.getElementById("f-role"),
      projectType: projectType,
      target: document.getElementById("f-target"),
      timing: document.getElementById("f-timing"),
      description: description,
      permission: document.getElementById("f-permission"),
      consent: document.getElementById("f-consent"),
      version: form.querySelector('input[name="privacy_note_version"]')
    };
    var count = document.getElementById("f-description-count");

    var MAX_DESCRIPTION = 1500, MAX_BRIEF = 5000;
    var THANKS = "Thank you. Your request was sent. We will reply by email to agree on the scope before any work starts. Please do not send files until then.";
    var EMAIL_US = " If it keeps failing, please come back later.";
    var FAILED = "That did not go through. Please try again in a minute." + EMAIL_US;
    var NO_REPLY = "No reply from the form service. Please try again in a minute." + EMAIL_US;
    var WAIT = "Please wait a moment before trying again.";
    var TOO_MANY = "Too many attempts from this browser tab. Please try again later.";
    var PREVIEW = "Preview only: this copy of the page does not send requests.";
    var PASTED = /\\documentclass|\\begin\{document\}|\\section\{|\\usepackage/;
    // Basic client-side rate limit: one attempt per 30 seconds and at most 5 an hour from this
    // browser tab. The times live in sessionStorage, so they go when the tab closes.
    var COOLDOWN_MS = 30000, MAX_PER_HOUR = 5, HOUR_MS = 3600000;
    // A request that has not answered after 20 seconds counts as failed, so the button comes back.
    var TIMEOUT_MS = 20000;
    var STORE_KEY = "cp-pilot-attempts";
    var attempts = [], sending = false;
    try { localStorage.removeItem(STORE_KEY); } catch (err) {} // left by an earlier version of this page
    try { attempts = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]"); } catch (err) { attempts = []; }
    if (!Array.isArray(attempts)) attempts = [];
    function recent(now) {
      return attempts.filter(function (t) { return typeof t === "number" && now - t >= 0 && now - t < HOUR_MS; });
    }
    function remember(now) {
      attempts = recent(now).concat([now]);
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(attempts)); } catch (err) {}
    }

    function say(text, kind) {
      status.className = "form-status" + (kind ? " " + kind : "");
      status.textContent = text;
    }
    function problem(el, text) {
      showProblem(el, text);
      return false;
    }
    function clearProblems() {
      all("#pilot-form [aria-invalid]").forEach(clearProblem);
    }
    function updateCount() {
      var n = field.description.value.length;
      count.textContent = n.toLocaleString("en-US") + " of 1,500 characters";
      count.classList.toggle("over", n > MAX_DESCRIPTION);
    }
    function briefText() { return formBrief ? formBrief.value.trim() : ""; }

    function valid() {
      var email = field.email.value.trim();
      if (!field.name.value.trim()) return problem(field.name, "Add your name.");
      if (!email) return problem(field.email, "Add your email address, so we can reply.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return problem(field.email, "Check your email address: it needs an @ and a domain.");
      if (!field.projectType.value) return problem(field.projectType, "Choose a project type, or choose Something else.");
      var text = field.description.value.trim();
      var withBrief = !!(includeBrief && includeBrief.checked);
      if (!text && !withBrief) return problem(field.description, "Describe your project in a few lines, or include your project brief.");
      if (field.description.value.length > MAX_DESCRIPTION) {
        return problem(field.description, "Keep the description under 1,500 characters. Describe your materials rather than pasting them.");
      }
      var pasted = "This looks like pasted LaTeX or document text. Please describe your project instead; do not send the manuscript.";
      if (PASTED.test(text)) return problem(field.description, pasted);
      if (withBrief) {
        if (!briefText()) return problem(includeBrief, "Your project brief is empty. Build it below, or untick Include my project brief.");
        if (PASTED.test(briefText())) return problem(includeBrief, pasted);
      }
      if (!field.permission.checked) {
        return problem(field.permission, "Confirm that the project is yours to share and is not a manuscript you received for peer review.");
      }
      if (!field.consent.checked) {
        return problem(field.consent, "Tick the consent box to send your request. The privacy note says what we keep and why.");
      }
      return true;
    }

    function payload() {
      var data = {
        name: field.name.value.trim(),
        email: field.email.value.trim(),
        institution: field.institution.value.trim(),
        role: field.role.value,
        project_type: field.projectType.value,
        target: field.target.value.trim(),
        timing: field.timing.value,
        description: field.description.value.trim(),
        permission: "yes",
        consent: "yes",
        privacy_note_version: field.version ? field.version.value : ""
      };
      if (includeBrief && includeBrief.checked) data.brief = briefText().slice(0, MAX_BRIEF);
      return data;
    }

    function finish() {
      form.reset();
      clearProblems();
      updateCount();
      syncFormBrief();
    }

    if (!endpoint) document.getElementById("f-offline").hidden = false;
    field.description.addEventListener("input", updateCount);
    if (includeBrief) includeBrief.addEventListener("change", function () { syncFormBrief(); });
    form.addEventListener("input", function (ev) { clearProblem(ev.target); });
    form.addEventListener("change", function (ev) { clearProblem(ev.target); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (sending) return;
      say("");
      clearProblems();
      if (trap && trap.value) { // a field people never see: drop the request, send nothing
        say(THANKS, "ok");
        finish();
        return;
      }
      if (!valid()) return;
      if (!endpoint) { say(PREVIEW); return; }
      var now = Date.now();
      var last = recent(now);
      if (last.length && now - last[last.length - 1] < COOLDOWN_MS) { say(WAIT, "err"); return; }
      if (last.length >= MAX_PER_HOUR) { say(TOO_MANY, "err"); return; }
      remember(now);

      // aria-disabled rather than disabled, so keyboard focus stays on the button; the
      // sending flag stops a second send.
      sending = true;
      button.setAttribute("aria-disabled", "true");
      form.setAttribute("aria-busy", "true");
      say("Sending...");
      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timer, timedOut = false;
      var timeout = new Promise(function (resolve, reject) {
        timer = setTimeout(function () {
          timedOut = true;
          if (controller) controller.abort();
          reject(new Error("timeout"));
        }, TIMEOUT_MS);
      });
      var request = fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload()),
        credentials: "omit",
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      Promise.race([request, timeout])
        .then(function (response) {
          if (!response.ok) throw new Error(String(response.status));
          say(THANKS, "ok");
          finish();
        })
        .catch(function () { say(timedOut ? NO_REPLY : FAILED, "err"); })
        .then(function () {
          clearTimeout(timer);
          sending = false;
          button.removeAttribute("aria-disabled");
          form.removeAttribute("aria-busy");
        });
    });

    form.hidden = false;
    var fallback = document.getElementById("f-fallback");
    if (fallback) fallback.hidden = true;
  })();
})();
