
const HF_API_KEY = "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"; 

const state = {
  model: "black-forest-labs/FLUX.1-schnell",
  modelLabel: "FLUX Schnell",
  ratio: { w: 1024, h: 1024 },
  count: 1,
  generating: false,
  history: [],  // { url, prompt, model, ratio }
};

//  Random Prompt Bank 
const PROMPTS = [
  "A vast crystalline cavern filled with glowing blue stalactites, cinematic lighting, ultra-detailed",
  "Futuristic Tokyo street at midnight, neon reflections in rain puddles, cyberpunk aesthetic",
  "A lone lighthouse on a cliff during a violent storm, dramatic waves, oil painting style",
  "Ethereal fox spirit floating through a moonlit bamboo forest, Japanese ukiyo-e inspired",
  "Ancient library hidden inside a giant hollow tree, warm candlelight, book spines glowing",
  "Underwater city ruins overgrown with coral and bioluminescent jellyfish, teal atmosphere",
  "Portrait of a knight made entirely of stained glass, backlit by cathedral sunlight",
  "Miniature planet covered in autumn forests, floating in deep space, golden hour lighting",
  "Art deco ballroom frozen in time, dust motes in shafts of light, abandoned grandeur",
  "A red fox sitting on top of a snow-covered mountain, northern lights above, hyperrealistic",
  "Dreamlike desert landscape with impossible rock formations and twin moons at dusk",
  "Steampunk airship fleet navigating storm clouds above Victorian London, detailed illustration",
  "Cherry blossom petals transforming into origami cranes mid-flight, soft pastel tones",
  "Macro photograph of a dewdrop containing an entire forest landscape inside",
  "Ancient Roman colosseum reimagined as a vertical garden skyscraper, solarpunk future",
];


const $  = id => document.getElementById(id);

const els = {
  themeToggle:       $("themeToggle"),
  modelList:         $("modelList"),
  ratioGrid:         $("ratioGrid"),
  countSelector:     $("countSelector"),
  activeModelLabel:  $("activeModelLabel"),
  statusDot:         $("statusDot"),
  statusText:        $("statusText"),
  canvasEmpty:       $("canvasEmpty"),
  imageGrid:         $("imageGrid"),
  loadingScreen:     $("loadingScreen"),
  loadingLabel:      $("loadingLabel"),
  promptInput:       $("promptInput"),
  randomBtn:         $("randomBtn"),
  clearBtn:          $("clearBtn"),
  generateBtn:       $("generateBtn"),
  charCount:         $("charCount"),
};

// ── Theme ────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("visionary-theme") || "dark";
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("visionary-theme", theme);
  els.themeToggle.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

els.themeToggle.addEventListener("click", e => {
  const btn = e.target.closest(".theme-btn");
  if (btn) applyTheme(btn.dataset.theme);
});

// ── Model Selection ──────────────────────────────────────────
els.modelList.addEventListener("click", e => {
  const item = e.target.closest(".model-item");
  if (!item) return;
  els.modelList.querySelectorAll(".model-item").forEach(m => m.classList.remove("active"));
  item.classList.add("active");
  state.model = item.dataset.model;
  state.modelLabel = item.querySelector(".model-name").textContent;
  els.activeModelLabel.textContent = state.modelLabel;
});

// ── Aspect Ratio ─────────────────────────────────────────────
els.ratioGrid.addEventListener("click", e => {
  const btn = e.target.closest(".ratio-btn");
  if (!btn) return;
  els.ratioGrid.querySelectorAll(".ratio-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.ratio = { w: parseInt(btn.dataset.w), h: parseInt(btn.dataset.h) };
});

// ── Image Count ──────────────────────────────────────────────
els.countSelector.addEventListener("click", e => {
  const btn = e.target.closest(".count-btn");
  if (!btn) return;
  els.countSelector.querySelectorAll(".count-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.count = parseInt(btn.dataset.count);
});

// ── Prompt Textarea ──────────────────────────────────────────
els.promptInput.addEventListener("input", () => {
  const len = els.promptInput.value.length;
  els.charCount.textContent = `${len} / 500`;
  if (len > 500) els.promptInput.value = els.promptInput.value.slice(0, 500);
});

els.clearBtn.addEventListener("click", () => {
  els.promptInput.value = "";
  els.charCount.textContent = "0 / 500";
  els.promptInput.focus();
});

els.randomBtn.addEventListener("click", () => {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  els.promptInput.value = prompt;
  els.charCount.textContent = `${prompt.length} / 500`;
});

// Support Ctrl+Enter / Cmd+Enter to generate
els.promptInput.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
});

// ── Status Indicator ─────────────────────────────────────────
function setStatus(state_) {
  const dot = els.statusDot;
  dot.className = "status-dot";
  if (state_ === "ready")   { dot.classList.add("ready");   els.statusText.textContent = "Ready"; }
  if (state_ === "loading") { dot.classList.add("loading"); els.statusText.textContent = "Generating…"; }
  if (state_ === "error")   { dot.classList.add("error");   els.statusText.textContent = "Error"; }
}

// ── Generate ─────────────────────────────────────────────────
els.generateBtn.addEventListener("click", generate);

async function generate() {
  const prompt = els.promptInput.value.trim();
  if (!prompt) {
    shakePrompt();
    return;
  }
  if (state.generating) return;

  state.generating = true;
  els.generateBtn.disabled = true;
  setStatus("loading");

  // Show loading overlay
  els.loadingScreen.classList.add("active");
  els.canvasEmpty.classList.add("hidden");

  const { w, h } = state.ratio;
  const count = state.count;

  els.loadingLabel.textContent =
    count === 1 ? "Generating image" : `Generating ${count} images`;

  // Build concurrent fetch promises
  const tasks = Array.from({ length: count }, () =>
    fetchImage(prompt, w, h)
  );

  try {
    const results = await Promise.allSettled(tasks);

    // Clear previous grid
    els.imageGrid.innerHTML = "";
    els.imageGrid.className = `image-grid count-${count}`;

    let anySuccess = false;

    results.forEach((res, i) => {
      if (res.status === "fulfilled" && res.value) {
        anySuccess = true;
        const entry = { url: res.value, prompt, model: state.modelLabel, ratio: `${w}×${h}` };
        state.history.unshift(entry);
        renderCard(entry, i);
      } else {
        renderErrorCard(i);
        console.error(`Image ${i + 1} failed:`, res.reason);
      }
    });

    setStatus(anySuccess ? "ready" : "error");

  } catch (err) {
    console.error("Generation error:", err);
    setStatus("error");
  } finally {
    state.generating = false;
    els.generateBtn.disabled = false;
    els.loadingScreen.classList.remove("active");
    if (els.imageGrid.children.length === 0) {
      els.canvasEmpty.classList.remove("hidden");
    }
  }
}

// ── API Call ─────────────────────────────────────────────────
async function fetchImage(prompt, width, height) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${state.model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: width,
          height: height,
          num_inference_steps: 25, // Note: some models ignore this param via free tier API
          guidance_scale: 7.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API error ${response.status}: ${errText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// ── Render Card ───────────────────────────────────────────────
function renderCard(entry, index) {
  const card = document.createElement("div");
  card.className = "img-card";
  card.style.animationDelay = `${index * 0.08}s`;

  const img = document.createElement("img");
  img.src = entry.url;
  img.alt = entry.prompt;
  img.loading = "lazy";

  const overlay = document.createElement("div");
  overlay.className = "img-card-overlay";

  const dlBtn = document.createElement("button");
  dlBtn.className = "overlay-btn";
  dlBtn.textContent = "Download";
  dlBtn.addEventListener("click", () => downloadImage(entry.url, entry.prompt));

  const cpBtn = document.createElement("button");
  cpBtn.className = "overlay-btn";
  cpBtn.textContent = "Copy Prompt";
  cpBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(entry.prompt).then(() => {
      cpBtn.textContent = "Copied!";
      setTimeout(() => (cpBtn.textContent = "Copy Prompt"), 1500);
    });
  });

  overlay.appendChild(dlBtn);
  overlay.appendChild(cpBtn);
  card.appendChild(img);
  card.appendChild(overlay);
  els.imageGrid.appendChild(card);
}

function renderErrorCard(index) {
  const card = document.createElement("div");
  card.className = "img-card";
  card.style.animationDelay = `${index * 0.08}s`;
  card.style.cssText += `
    display:flex; align-items:center; justify-content:center;
    min-height:250px; background:var(--surface2); color:var(--danger); font-size:11px;
    letter-spacing:0.1em; text-transform:uppercase; border: 1px dashed var(--danger);
  `;
  card.textContent = "Generation failed";
  els.imageGrid.appendChild(card);
}

// ── Download ─────────────────────────────────────────────────
function downloadImage(url, prompt) {
  const a = document.createElement("a");
  const slug = prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `visionary-${slug}-${Date.now()}.png`;
  a.click();
}

// ── Prompt Shake Animation ───────────────────────────────────
function shakePrompt() {
  const ta = els.promptInput;
  ta.style.borderColor = "var(--danger)";
  ta.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 320, easing: "ease-in-out" }
  );
  ta.focus();
  setTimeout(() => (ta.style.borderColor = ""), 600);
}

// ── Init ─────────────────────────────────────────────────────
initTheme();
setStatus("ready");
