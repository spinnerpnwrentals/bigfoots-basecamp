const DEFAULT_PASSWORD = "basecamp";
const STORAGE_KEYS = {
  hunt: "bigfoots-basecamp-hunt-v2",
  found: "bigfoots-basecamp-found-v2",
  completed: "bigfoots-basecamp-completed-v2"
};

const defaultBigfoots = [
  {
    name: "Bigfoot #1",
    clue: "Where snowy boots rest after an adventure.",
    hint: "Look near the entry or mudroom where guests naturally leave footwear."
  },
  {
    name: "Bigfoot #2",
    clue: "I keep watch where coats shake off mountain weather.",
    hint: "Check hooks, coat storage, or gear zones guests can safely reach."
  },
  {
    name: "Bigfoot #3",
    clue: "Warmth is nearby, but I never touch the flames.",
    hint: "Search around the hearth or cozy seating area, not inside anything hot."
  },
  {
    name: "Bigfoot #4",
    clue: "The best trail stories are told from this comfortable lookout.",
    hint: "Look around the main living room seating and nearby decor."
  },
  {
    name: "Bigfoot #5",
    clue: "I guard the snacks without stealing a single bite.",
    hint: "Try the kitchen or dining area, especially guest-facing shelves and counters."
  },
  {
    name: "Bigfoot #6",
    clue: "Steam and tired ski legs pass through my territory.",
    hint: "Check a bathroom, spa towel area, or the route toward post-adventure cleanup."
  },
  {
    name: "Bigfoot #7",
    clue: "Games are serious business when the mountain is dark.",
    hint: "Look near board games, scorekeeping, puzzles, or game room shelves."
  },
  {
    name: "Bigfoot #8",
    clue: "I prefer bedtime stories with a view of the trees.",
    hint: "Search guest-accessible bedroom decor and surfaces."
  },
  {
    name: "Bigfoot #9",
    clue: "When wet gear dries, I stay close and quiet.",
    hint: "Think laundry, hooks, drying areas, or warm gear storage."
  },
  {
    name: "Bigfoot #10",
    clue: "I like fresh mountain air, especially near a favorite soak.",
    hint: "Check the route toward the hot tub or nearby outdoor guest area."
  },
  {
    name: "Bigfoot #11",
    clue: "You may pass me on the way to a great night's sleep.",
    hint: "Search hallways, landings, and bedroom entry areas."
  },
  {
    name: "Bigfoot #12",
    clue: "The final Bigfoot watches over the whole Basecamp.",
    hint: "Look for a broad view of a main gathering space."
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
  clues: document.querySelector("#clues"),
  progressText: document.querySelector("#progressText"),
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
  resetProgress: document.querySelector("#resetProgress"),
  restoreDefaults: document.querySelector("#restoreDefaults"),
  confettiCanvas: document.querySelector("#confettiCanvas")
};

function loadBigfoots() {
  const saved = localStorage.getItem(STORAGE_KEYS.hunt);
  if (!saved) return [...defaultBigfoots];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultBigfoots];
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

  state.found = state.bigfoots.map((_, index) => Boolean(parsed[index]));
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
          <h3>${escapeHtml(bigfoot.name || `Bigfoot #${index + 1}`)}</h3>
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
      <h3>Bigfoot ${index + 1}</h3>
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

function resetProgress() {
  if (!confirm("Reset scavenger hunt progress on this device?")) return;
  state.found = state.bigfoots.map(() => false);
  state.confettiPlayed = false;
  saveFound();
  localStorage.removeItem(STORAGE_KEYS.completed);
  render();
}

function restoreDefaults() {
  if (!confirm("Restore the default 12-Bigfoot hunt on this device?")) return;
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
    name: `Bigfoot #${nextNumber}`,
    clue: "Add a new clue for this hidden Bigfoot.",
    hint: "Add an optional hint guests can reveal."
  });
  state.found.push(false);
  saveBigfoots();
  saveFound();
  render();
});

elements.resetProgress.addEventListener("click", resetProgress);
elements.restoreDefaults.addEventListener("click", restoreDefaults);

loadFound();
render();
