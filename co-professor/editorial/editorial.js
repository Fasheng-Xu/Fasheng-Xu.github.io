(function () {
  "use strict";

  if (window.ScrollCraft) window.ScrollCraft.mount(document.querySelector("[data-sc-root]"));

  var composer = document.getElementById("composer");
  var route = document.getElementById("project-route");
  var context = document.getElementById("project-context");
  var target = document.getElementById("project-target");
  var students = document.getElementById("project-students");
  var materials = document.getElementById("project-materials");
  var goal = document.getElementById("project-goal");
  var output = document.getElementById("brief-text");
  var status = document.getElementById("brief-status");
  var states = Object.create(null);
  var activeRoute = route.value;
  var dirtyOutput = false;

  var tasks = {
    analytical: { title: "An analytical paper", kind: "research", context: "Field and research question", materials: "Materials you could bring", prompt: "What are you trying to understand?", target: "Target journal", aim: "Examine assumptions, derivations and results, then prioritize a revision plan." },
    empirical: { title: "An empirical paper", kind: "research", context: "Research question and empirical setting", materials: "Draft, design and evidence available", prompt: "What is the question, and what could the evidence establish?", target: "Target journal", aim: "Examine design, identification, robustness and interpretation, then prioritize revisions." },
    funding: { title: "A funding proposal", kind: "research", context: "Proposed question and significance", materials: "Proposal materials and call requirements", prompt: "What do you want to study, and why does it matter?", target: "Target funder or call", aim: "Clarify the question, significance and work plan against the funder's criteria." },
    materials: { title: "Lectures, slides and assignments", kind: "teaching", context: "Subject and learning goals", materials: "Slides, notes and exercises available", prompt: "What should students understand or be able to do?", aim: "Develop connected lectures, PowerPoint slides, examples, assignments and solution checks." },
    "course-package": { title: "A coherent course or textbook", kind: "teaching", context: "Course subject and learning goals", materials: "Existing course materials", prompt: "What is the through line you want the course to have?", aim: "Organize existing materials into a coherent course or textbook draft with consistent terminology." },
    "ai-course": { title: "A course redesigned for AI", kind: "teaching", context: "Learning goals and the role of AI", materials: "Current activities and assessments", prompt: "What should students practice themselves, and where should AI help?", aim: "Redesign activities and assessments so students practice, explain and defend their reasoning." },
    simulation: { title: "A classroom simulation game", kind: "teaching", context: "Concepts and decisions to experience", materials: "Cases, examples or game ideas available", prompt: "What tradeoff or decision should students experience?", aim: "Develop roles, decision rounds, instructor controls and a debrief tied to the course concepts." }
  };

  function snapshot() {
    states[activeRoute] = { context: context.value, target: target.value, students: students.value, materials: materials.value, goal: goal.value, output: output.value, dirty: dirtyOutput };
  }

  function valueOrPrompt(value, fallback) { return value.trim() || "[" + fallback + "]"; }

  function makeBrief() {
    var task = tasks[route.value];
    var lines = ["CO-PROFESSOR PROJECT BRIEF", "", "Project: " + task.title, "", task.context + ":", valueOrPrompt(context.value, "Add your context"), ""];
    if (task.kind === "research") lines.push(task.target + ":", valueOrPrompt(target.value, "Add a target, if you have one"), "");
    else lines.push("Students and class time:", valueOrPrompt(students.value, "Add student level and available time"), "");
    lines.push(task.materials + ":", valueOrPrompt(materials.value, "Describe the materials you could bring"), "", "A useful outcome:", valueOrPrompt(goal.value, task.aim), "", "Working approach:", "Start with relevant context. Use agents for defined, checkable tasks. I retain the intellectual choices, verify outputs, and decide what to use.", "", "Next step:", "Define the scope, check the available materials, and choose a workflow before starting.");
    return lines.join("\n");
  }

  function regenerate() {
    output.value = makeBrief();
    dirtyOutput = false;
  }

  function changeRoute(nextRoute) {
    if (!tasks[nextRoute]) return;
    snapshot();
    route.value = nextRoute;
    activeRoute = nextRoute;
    var state = states[nextRoute] || { context: "", target: "", students: "", materials: "", goal: "" };
    context.value = state.context;
    target.value = state.target;
    students.value = state.students;
    materials.value = state.materials;
    goal.value = state.goal;
    dirtyOutput = !!state.dirty;
    var task = tasks[nextRoute];
    document.getElementById("context-label").textContent = task.context;
    document.getElementById("materials-label").textContent = task.materials;
    context.placeholder = task.prompt;
    document.getElementById("research-context").hidden = task.kind !== "research";
    document.getElementById("teaching-context").hidden = task.kind !== "teaching";
    document.querySelector('label[for="project-target"]').firstChild.textContent = task.target || "Target journal or funder";
    target.placeholder = nextRoute === "funding" ? "Funder name and call" : "For example, Management Science or MISQ";
    if (state.output) { output.value = state.output; }
    else regenerate();
    status.textContent = "";
    if (window.ScrollCraft && window.ScrollCraft.instances[0]) window.ScrollCraft.instances[0].layout();
  }

  composer.hidden = false;
  changeRoute(activeRoute);
  route.addEventListener("change", function () { changeRoute(route.value); });
  [context, target, students, materials, goal].forEach(function (field) {
    field.addEventListener("input", function () {
      if (!dirtyOutput) regenerate();
      else status.textContent = "Your brief has personal edits. Choose Update your brief to rebuild it from the fields.";
    });
  });
  output.addEventListener("input", function () { dirtyOutput = true; status.textContent = "Your edits are included when you copy or download the brief."; });
  document.getElementById("update-brief").addEventListener("click", function () { regenerate(); status.textContent = "Brief updated from your selected task and context."; });
  document.getElementById("copy-brief").addEventListener("click", async function () {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Brief copied. Nothing was sent.";
    } catch (err) {
      output.focus();
      output.select();
      status.textContent = "Automatic copy is unavailable. The brief is selected so you can copy it yourself.";
    }
  });
  document.getElementById("download-brief").addEventListener("click", function () {
    var url = URL.createObjectURL(new Blob([output.value + "\n"], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "co-professor-" + route.value + "-brief.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = "A text-file download was requested. Nothing was sent.";
  });
  document.querySelectorAll("[data-route]").forEach(function (link) {
    link.addEventListener("click", function () { changeRoute(link.getAttribute("data-route")); });
  });
  if (window.ScrollCraft && window.ScrollCraft.instances[0]) window.ScrollCraft.instances[0].layout();
})();
