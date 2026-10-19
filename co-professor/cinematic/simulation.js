(() => {
  "use strict";

  const controls = document.getElementById("demo-controls");
  const fallback = document.getElementById("demo-static");
  const orderSelect = document.getElementById("order-quantity");
  const revealButton = document.getElementById("reveal-demand");
  const resetButton = document.getElementById("reset-demo");
  const roundLabel = document.getElementById("round-label");
  const results = document.getElementById("round-results");
  const summary = document.getElementById("decision-summary");
  const totalOutput = document.getElementById("total-cost");
  const caseSelect = document.getElementById("case-select");
  const downloadButton = document.getElementById("download-case");

  // Preserve the worked example if the interactive markup is incomplete.
  if (![controls, fallback, orderSelect, revealButton, resetButton, roundLabel,
    results, summary, totalOutput, caseSelect, downloadButton].every(Boolean)) {
    return;
  }

  const demandSequence = [30, 70, 50];
  const orderOptions = [20, 40, 60, 80];
  const rounds = [];
  let hasTeachingIntent = false;
  const inquiryContext = document.getElementById("inquiry-context");
  const initialButtonLabel = revealButton.textContent.trim() || "Reveal demand";
  const dollars = (value) => "$" + value.toLocaleString("en-US");
  const totalCost = () => rounds.reduce((total, round) => total + round.cost, 0);
  const selectedOrder = () => {
    const value = Number(orderSelect.value);
    return orderOptions.includes(value) ? value : 40;
  };
  const selectedCase = () => {
    const option = caseSelect.options[caseSelect.selectedIndex];
    return option ? option.textContent.trim() : "MBA operations";
  };

  function buildTeachingSummary() {
    const body = [
      "Co-Professor teaching example",
      "Teaching context: " + selectedCase(),
      "",
      "Local illustrative inventory demo:",
      "This fixed, three-round teaching example runs locally in the browser. " +
        "These are illustrative decisions and outcomes, not a live business forecast.",
      "Cost rule: $2 per unit ordered plus $5 per unit of unfilled demand.",
      "Unsold units have no recovery value. Every round starts fresh.",
      "Fixed demand sequence: 30, 70, 50 units.",
      "",
    ];
    if (rounds.length === 0) {
      body.push("No rounds completed yet.");
    } else {
      rounds.forEach((round, index) => {
        body.push(
          "Round " + (index + 1) + ": ordered " + round.order +
          ", demand " + round.demand + ", left over " + round.leftover +
          ", unfilled " + round.unfilled + ", cost " + dollars(round.cost) + "."
        );
      });
    }
    body.push("Total cost so far: " + dollars(totalCost()) + ".");
    if (rounds.length < demandSequence.length) {
      body.push("Selected order for round " + (rounds.length + 1) + ": " + selectedOrder() + ".");
    }
    body.push("", "Teaching goal:", "", "Debrief: What trade-off explains your decisions?", "");
    return body.join("\n");
  }

  function updateTeachingContext() {
    if (inquiryContext) {
      inquiryContext.textContent = hasTeachingIntent
        ? "Teaching example selected: " + selectedCase() + ". " + rounds.length +
          " classroom round" + (rounds.length === 1 ? "" : "s") + " completed."
        : "Research, teaching or a funding proposal.";
    }
  }

  function downloadTeachingExample() {
    const blob = new Blob([buildTeachingSummary()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "co-professor-teaching-example.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addResult(round) {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = String(rounds.length);
    row.appendChild(heading);

    [round.order, round.demand, round.leftover, round.unfilled, dollars(round.cost)]
      .forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.appendChild(cell);
      });
    results.appendChild(row);
  }

  function revealDemand() {
    if (rounds.length >= demandSequence.length) return;

    hasTeachingIntent = true;
    const order = selectedOrder();
    const demand = demandSequence[rounds.length];
    const leftover = Math.max(order - demand, 0);
    const unfilled = Math.max(demand - order, 0);
    const round = { order, demand, leftover, unfilled, cost: 2 * order + 5 * unfilled };
    rounds.push(round);
    addResult(round);
    totalOutput.textContent = dollars(totalCost());

    const outcome = "Round " + rounds.length + ": ordered " + order +
      ", demand " + demand + ", " + leftover + " left over, " + unfilled +
      " unfilled. Round cost " + dollars(round.cost) +
      "; total cost " + dollars(totalCost()) + ". ";

    if (rounds.length === demandSequence.length) {
      roundLabel.textContent = "All 3 rounds completed";
      revealButton.disabled = true;
      revealButton.textContent = "Completed";
      orderSelect.disabled = true;
      summary.textContent = outcome +
        "What trade-off between ordering cost and unfilled demand explains your choices? " +
        "Reset to compare another approach using the same demands.";
    } else {
      roundLabel.textContent = "Round " + (rounds.length + 1) + " of 3";
      summary.textContent = outcome +
        "What would justify your next order given the cost of leftover units and unfilled demand?";
    }
    updateTeachingContext();
  }

  function resetDemo() {
    rounds.length = 0;
    results.replaceChildren();
    orderSelect.value = "40";
    orderSelect.disabled = false;
    revealButton.disabled = false;
    revealButton.textContent = initialButtonLabel;
    roundLabel.textContent = "Round 1 of 3";
    totalOutput.textContent = "$0";
    summary.textContent = "Choose an order quantity, then reveal demand. " +
      "Each reset repeats the same three demands. What trade-off informs your first choice?";
    updateTeachingContext();
  }

  function selectTeachingContext() {
    hasTeachingIntent = true;
    updateTeachingContext();
  }

  orderSelect.addEventListener("change", selectTeachingContext);
  caseSelect.addEventListener("change", selectTeachingContext);
  revealButton.addEventListener("click", revealDemand);
  resetButton.addEventListener("click", resetDemo);

  downloadButton.addEventListener("click", downloadTeachingExample);
  resetDemo();
  downloadButton.hidden = false;
  fallback.hidden = true;
  controls.hidden = false;
})();
