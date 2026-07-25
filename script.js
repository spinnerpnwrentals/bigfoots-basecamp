const ARRIVAL_CHECKLIST_STORAGE_KEY = "bigfoots-basecamp-arrival-checklist";
const CHECKOUT_CHECKLIST_STORAGE_KEY = "bigfoots-basecamp-checkout-checklist";

initInteractiveChecklist({
  checklistSelector: "#arrivalChecklist",
  resetSelector: "#arrivalChecklistReset",
  storageKey: ARRIVAL_CHECKLIST_STORAGE_KEY,
  defaultCheckedSteps: ["arrive"],
  lockedSteps: ["arrive"]
});
initInteractiveChecklist({
  checklistSelector: "#checkoutChecklist",
  resetSelector: "#checkoutChecklistReset",
  storageKey: CHECKOUT_CHECKLIST_STORAGE_KEY
});
initScavengerHunt();

function initInteractiveChecklist({
  checklistSelector,
  resetSelector,
  storageKey,
  defaultCheckedSteps = [],
  lockedSteps = []
}) {
  const checklist = document.querySelector(checklistSelector);
  const resetButton = document.querySelector(resetSelector);
  if (!checklist || !resetButton) return;

  const inputs = Array.from(checklist.querySelectorAll('input[type="checkbox"][data-step]'));
  if (!inputs.length) return;
  const defaultCheckedSet = new Set(defaultCheckedSteps);
  const lockedSet = new Set(lockedSteps);

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function applyState(savedState) {
    inputs.forEach((input) => {
      const checked = lockedSet.has(input.dataset.step)
        ? true
        : savedState[input.dataset.step] === undefined
          ? defaultCheckedSet.has(input.dataset.step)
          : Boolean(savedState[input.dataset.step]);
      input.checked = checked;
      input.closest(".check-item")?.classList.toggle("is-complete", checked);
    });
  }

  function saveState() {
    const nextState = {};
    inputs.forEach((input) => {
      nextState[input.dataset.step] = lockedSet.has(input.dataset.step)
        ? true
        : input.checked;
    });
    localStorage.setItem(storageKey, JSON.stringify(nextState));
  }

  applyState(readState());
  saveState();

  checklist.addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"][data-step]');
    if (!input) return;

    if (lockedSet.has(input.dataset.step)) {
      input.checked = true;
    }

    input.closest(".check-item")?.classList.toggle("is-complete", input.checked);
    saveState();
  });

  resetButton.addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    applyState({});
    saveState();
  });
}

function initScavengerHunt() {
  const cluesRoot = document.querySelector("#clues");
  const progressText = document.querySelector("#progressText");
  if (!cluesRoot || !progressText) return;

  const DEFAULT_PASSWORD = "basecamp";
  const STORAGE_KEYS = {
    hunt: "bigfoots-basecamp-hunt-v2",
    found: "bigfoots-basecamp-found-v2",
    completed: "bigfoots-basecamp-completed-v2"
  };

  const defaultBigfoots = [
    {
      name: "The Cold-Kitchen Clinger",
      clue: "Something small is clinging to a cold kitchen giant, hiding in plain sight. Slow down—quick trackers can walk right past it.",
      hint: "Search the outside of the refrigerator for something held in place without tape."
    },
    {
      name: "Bigfoot's Ultimate Test",
      clue: "A thousand tiny pieces are waiting for the most dedicated trackers. Head below the main floor toward the place where games get serious and find the challenge that takes patience to assemble.",
      hint: "Look downstairs in the game room for a 1,000-piece puzzle. No need to put it together to mark this clue found."
    },
    {
      name: "Bigfoot's Favorite Cup",
      clue: "Coffee, cocoa, or tea? Bigfoot packed a cup for one enormous sip, then tucked it among the kitchen's other cozy drink companions.",
      hint: "Look where cups and mugs are stored in the kitchen cabinets."
    },
    {
      name: "The Helpful Hot Spot",
      clue: "After helping around the kitchen, I dry hands and hang close to where meals are made—warmer than any other treasure in the hunt.",
      hint: "Look near the oven or stove for a towel hanging from the handle."
    },
    {
      name: "The Mountain Lookout",
      clue: "Climb above the main living area to a perch with mountain views. Something artistic and made of metal is keeping watch from the loft.",
      hint: "Search the upstairs loft, especially the mountain-facing area, for a metal piece of artwork."
    }
  ];

  const secretGuideSections = [
    ["Favorite hikes", "Placeholder: add trail names, drive times, difficulty, pass requirements, and seasonal notes."],
    ["Waterfalls", "Placeholder: add waterfall stops, parking notes, and best months for flow."],
    ["Restaurants", "Placeholder: add casual dinner spots, family favorites, and reservation tips."],
    ["Coffee", "Placeholder: add nearby espresso stops and favorite morning orders."],
    ["Breweries", "Placeholder: add taprooms, food options, and designated-driver notes."],
    ["Ski tips", "Placeholder: add pass guidance, parking timing, rental notes, and beginner-friendly runs."],
    ["Summer activities", "Placeholder: add lake days, biking, scenic drives, and rainy-day options."],
    ["Wildlife", "Placeholder: add common sightings and respectful viewing reminders."],
    ["Sunset locations", "Placeholder: add viewpoints, timing notes, and safe pullouts."]
  ];

  const state = {
    bigfoots: loadBigfoots(),
    found: [],
    admin: false,
    confettiPlayed: localStorage.getItem(STORAGE_KEYS.completed) === "true"
  };

  const elements = {
    clues: cluesRoot,
    progressText,
    progressBar: document.querySelector("#progressBar"),
    progressMeter: document.querySelector(".progress-meter"),
    progressBlocks: document.querySelector("#progressBlocks"),
    complete: document.querySelector("#complete"),
    secretGuide: document.querySelector("#secretGuide"),
    guideGrid: document.querySelector("#guideGrid"),
    adminButton: document.querySelector("#adminButton"),
    adminPanel: document.querySelector("#adminPanel"),
    adminList: document.querySelector("#adminList"),
    exitAdmin: document.querySelector("#exitAdmin"),
    addBigfoot: document.querySelector("#addBigfoot"),
    huntResetButton: document.querySelector("#huntResetButton"),
    resetProgress: document.querySelector("#resetProgress"),
    restoreDefaults: document.querySelector("#restoreDefaults"),
    confettiCanvas: document.querySelector("#confettiCanvas")
  };

  function loadBigfoots() {
    const saved = localStorage.getItem(STORAGE_KEYS.hunt);
    if (!saved) return [...defaultBigfoots];

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length === defaultBigfoots.length
        ? parsed
        : [...defaultBigfoots];
    } catch {
      return [...defaultBigfoots];
    }
  }

  function loadFound() {
    const saved = localStorage.getItem(STORAGE_KEYS.found);
    let parsed = [];

    try {
      parsed = JSON.parse(saved || "[]");
    } catch {
      parsed = [];
    }

    const savedMatchesCurrentHunt = parsed.length === state.bigfoots.length;
    state.found = state.bigfoots.map((_, index) => (
      savedMatchesCurrentHunt ? Boolean(parsed[index]) : false
    ));
    saveFound();
  }

  function saveBigfoots() {
    localStorage.setItem(STORAGE_KEYS.hunt, JSON.stringify(state.bigfoots));
  }

  function saveFound() {
    localStorage.setItem(STORAGE_KEYS.found, JSON.stringify(state.found));
  }

  function getFoundCount() {
    return state.found.filter(Boolean).length;
  }

  function render() {
    renderProgress();
    renderClues();
    renderGuide();
    renderAdmin();
  }

  function renderProgress() {
    const total = state.bigfoots.length;
    const found = getFoundCount();
    const percent = total ? (found / total) * 100 : 0;
    const complete = total > 0 && found === total;

    elements.progressText.textContent = `${found} / ${total} Found`;
    elements.progressBar.style.width = `${percent}%`;
    elements.progressMeter.setAttribute("aria-valuenow", String(found));
    elements.progressMeter.setAttribute("aria-valuemax", String(total));
    elements.progressBlocks.textContent = "█".repeat(found) + "░".repeat(Math.max(total - found, 0));
    elements.complete.classList.toggle("hidden", !complete);
    elements.secretGuide.classList.toggle("hidden", !complete);

    if (complete && !state.confettiPlayed) {
      state.confettiPlayed = true;
      localStorage.setItem(STORAGE_KEYS.completed, "true");
      startConfetti();
      elements.complete.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (!complete) {
      state.confettiPlayed = false;
      localStorage.removeItem(STORAGE_KEYS.completed);
    }
  }

  function renderClues() {
    elements.clues.innerHTML = "";
    state.bigfoots.forEach((bigfoot, index) => {
      const article = document.createElement("article");
      article.className = `hunt-card ${state.found[index] ? "found" : ""}`;
      article.innerHTML = `
        <div class="hunt-card-head">
          <div>
            <p class="eyebrow">Clue ${index + 1}</p>
            <h3>${escapeHtml(bigfoot.name || `Clue ${index + 1}`)}</h3>
            <p class="clue-text">${escapeHtml(bigfoot.clue)}</p>
          </div>
          <span class="status-pill">${state.found[index] ? "✓ Found" : "Searching"}</span>
        </div>
        <div class="card-actions">
          <button class="button secondary hint-toggle" type="button" aria-expanded="false" aria-controls="hint-${index}">Hint</button>
          <button class="button primary found-action" type="button" aria-pressed="${state.found[index]}">${state.found[index] ? "Mark Unfound" : "I Found It"}</button>
        </div>
        <div class="hint-panel" id="hint-${index}">
          <div class="hint-inner">
            <p>${escapeHtml(bigfoot.hint || "No hint has been added yet.")}</p>
          </div>
        </div>
      `;

      const hintButton = article.querySelector(".hint-toggle");
      const hintPanel = article.querySelector(".hint-panel");
      hintButton.addEventListener("click", () => {
        const isOpen = hintPanel.classList.toggle("open");
        hintButton.setAttribute("aria-expanded", String(isOpen));
        hintButton.textContent = isOpen ? "Hide Hint" : "Hint";
      });

      article.querySelector(".found-action").addEventListener("click", () => {
        state.found[index] = !state.found[index];
        saveFound();
        render();
      });

      elements.clues.appendChild(article);
    });
  }

  function renderGuide() {
    elements.guideGrid.innerHTML = secretGuideSections.map(([title, copy]) => `
      <article class="guide-item">
        <h3>${title}</h3>
        <p>${copy}</p>
      </article>
    `).join("");
  }

  function renderAdmin() {
    elements.adminPanel.classList.toggle("hidden", !state.admin);
    if (!state.admin) return;

    elements.adminList.innerHTML = "";
    state.bigfoots.forEach((bigfoot, index) => {
      const item = document.createElement("article");
      item.className = "admin-item";
      item.innerHTML = `
        <h3>Clue ${index + 1}</h3>
        <label>Name <input value="${escapeAttribute(bigfoot.name)}" data-field="name" data-index="${index}" /></label>
        <label>Clue <textarea data-field="clue" data-index="${index}">${escapeHtml(bigfoot.clue)}</textarea></label>
        <label>Hint <textarea data-field="hint" data-index="${index}">${escapeHtml(bigfoot.hint || "")}</textarea></label>
        <button class="button secondary remove-bigfoot" type="button" data-index="${index}">Remove Bigfoot</button>
      `;
      elements.adminList.appendChild(item);
    });
  }

  function updateAdminField(event) {
    const field = event.target.dataset.field;
    const index = Number(event.target.dataset.index);
    if (!field || Number.isNaN(index) || !state.bigfoots[index]) return;

    state.bigfoots[index][field] = event.target.value;
    saveBigfoots();
    renderProgress();
    renderClues();
  }

  function removeBigfoot(index) {
    if (state.bigfoots.length <= 1) {
      alert("The hunt needs at least one Bigfoot.");
      return;
    }

    state.bigfoots.splice(index, 1);
    state.found.splice(index, 1);
    saveBigfoots();
    saveFound();
    render();
  }

  function resetHuntProgress() {
    const total = state.bigfoots.length;
    if (!confirm(`Reset your Bigfoot hunt? This will clear all ${total} discoveries and return the tracker to 0/${total}.`)) return;

    state.found = state.bigfoots.map(() => false);
    state.confettiPlayed = false;
    saveFound();
    localStorage.removeItem(STORAGE_KEYS.completed);
    render();
  }

  function restoreDefaults() {
    if (!confirm("Restore the default five-item hunt on this device?")) return;

    state.bigfoots = [...defaultBigfoots];
    state.found = state.bigfoots.map(() => false);
    state.confettiPlayed = false;
    saveBigfoots();
    saveFound();
    localStorage.removeItem(STORAGE_KEYS.completed);
    render();
  }

  function startConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = elements.confettiCanvas;
    const context = canvas.getContext("2d");
    const colors = ["#25382a", "#667653", "#8b5f39", "#b57a42", "#fbf3df"];
    let particles = [];
    let frame = 0;

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    resize();
    particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.45,
      size: 5 + Math.random() * 7,
      speed: 1.8 + Math.random() * 3.2,
      drift: -1 + Math.random() * 2,
      rotation: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    function draw() {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.y += particle.speed;
        particle.x += particle.drift + Math.sin(frame / 18 + particle.rotation) * 0.55;
        particle.rotation += 0.05;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
        context.restore();
      });
      frame += 1;

      if (frame < 210) {
        requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    window.addEventListener("resize", resize, { once: true });
    draw();
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function escapeAttribute(value = "") {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  elements.adminButton.addEventListener("click", () => {
    const password = prompt("Enter admin password");
    if (password === DEFAULT_PASSWORD) {
      state.admin = true;
      render();
      elements.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (password !== null) {
      alert("Incorrect password.");
    }
  });

  elements.exitAdmin.addEventListener("click", () => {
    state.admin = false;
    render();
  });

  elements.adminList.addEventListener("input", updateAdminField);
  elements.adminList.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-bigfoot");
    if (button) removeBigfoot(Number(button.dataset.index));
  });

  elements.addBigfoot.addEventListener("click", () => {
    const nextNumber = state.bigfoots.length + 1;
    state.bigfoots.push({
      name: `Clue ${nextNumber}`,
      clue: "Add a new riddle for this Basecamp treasure.",
      hint: "Add an optional hint guests can reveal."
    });
    state.found.push(false);
    saveBigfoots();
    saveFound();
    render();
  });

  elements.huntResetButton?.addEventListener("click", resetHuntProgress);
  elements.resetProgress.addEventListener("click", resetHuntProgress);
  elements.restoreDefaults.addEventListener("click", restoreDefaults);

  loadFound();
  render();
}
