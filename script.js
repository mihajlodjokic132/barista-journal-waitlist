import { createClient } from "@supabase/supabase-js";

const screensGrid = document.getElementById("screens-grid");
const form = document.getElementById("waitlist-form");
const messageEl = document.getElementById("form-message");

function setupTailoredAtmosphere() {
  const body = document.body;
  const particles = Array.from(document.querySelectorAll(".tailored-particle"));
  const controlsRoot = document.getElementById("tailored-controls");
  const motionControl = document.getElementById("control-motion");
  const lagControl = document.getElementById("control-lag");
  const lightControl = document.getElementById("control-light");
  const wobbleControl = document.getElementById("control-wobble");
  const twinkleControl = document.getElementById("control-twinkle");
  const scrollControl = document.getElementById("control-scroll");
  const breatheDistanceControl = document.getElementById("control-breathe-distance");
  const breatheSpeedControl = document.getElementById("control-breathe-speed");
  const bgDarkenControl = document.getElementById("control-bg-darken");
  const bgColorControl = document.getElementById("control-bg-color");
  const glassControl = document.getElementById("control-glass");
  const frostControl = document.getElementById("control-frost");
  const fontControl = document.getElementById("control-font");
  const resetButton = document.getElementById("control-reset");
  const valueMotion = document.getElementById("value-motion");
  const valueLag = document.getElementById("value-lag");
  const valueLight = document.getElementById("value-light");
  const valueWobble = document.getElementById("value-wobble");
  const valueTwinkle = document.getElementById("value-twinkle");
  const valueScroll = document.getElementById("value-scroll");
  const valueBreatheDistance = document.getElementById("value-breathe-distance");
  const valueBreatheSpeed = document.getElementById("value-breathe-speed");
  const valueBgDarken = document.getElementById("value-bg-darken");
  const valueBgColor = document.getElementById("value-bg-color");
  const valueGlass = document.getElementById("value-glass");
  const valueFrost = document.getElementById("value-frost");
  const valueFont = document.getElementById("value-font");

  const fontStorageKey = "barista-journal-font-preset";
  const allowedFontPresets = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  const fontPresetNames = {
    "1": "Copper Classic",
    "2": "Editorial Night",
    "3": "Luxury Modern",
    "4": "Gallery Serif",
    "5": "Heritage Journal",
    "6": "Boutique Sans",
    "7": "Contrast Studio",
    "8": "Runway Grid",
    "9": "Soft Prestige",
    "10": "Vintage Reserve",
  };
  let fontPreset = "1";

  const storedFont = window.localStorage.getItem(fontStorageKey);
  if (storedFont && allowedFontPresets.has(storedFont)) {
    fontPreset = storedFont;
  } else if (allowedFontPresets.has(body.dataset.fontPreset || "")) {
    fontPreset = String(body.dataset.fontPreset);
  }

  const storageKey = "barista-journal-fx-effects";
  const modeDefaults = {
    creative: {
      motion: true,
      lag: 0.04,
      light: 0.20,
      wobble: 0,
      twinkle: 0.05,
      scroll: 0.90,
      breatheDistance: 2.0,
      breatheSpeed: 10.9,
      bgDarken: 0.31,
      bgColor: "#000000",
      glass: "frosted",
      frost: 1.15,
    },
    tailored: {
      motion: true,
      lag: 0.065,
      light: 1,
      wobble: 1,
      twinkle: 1,
      scroll: 0.35,
      breatheDistance: 3,
      breatheSpeed: 6.8,
      bgDarken: 0.06,
      bgColor: "#000000",
      glass: "frosted",
      frost: 1,
    },
  };

  const defaults = {
    motion: true,
    lag: 0.04,
    light: 0.20,
    wobble: 0,
    twinkle: 0.05,
    scroll: 0.90,
    breatheDistance: 3,
    breatheSpeed: 6.8,
    bgDarken: 0.08,
    bgColor: "#000000",
    glass: "frosted",
    frost: 1,
  };

  let settings = { ...defaults };
  let currentMode = body.dataset.siteStyle === "creative" ? "creative" : "tailored";

  if (controlsRoot) {
    controlsRoot.hidden = true;
  }

  const particleDepths = [0.28, 0.36, 0.31, 0.42, 0.34, 0.48, 0.26, 0.4, 0.52];
  let pointerX = window.innerWidth * 0.52;
  let pointerY = window.innerHeight * 0.24;
  let smoothX = pointerX;
  let smoothY = pointerY;
  let frameId = 0;
  let isRunning = false;

  function persistSettings() {
    let allSettings = {};
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        allSettings = JSON.parse(stored);
      }
    } catch {
      allSettings = {};
    }

    allSettings[currentMode] = settings;
    window.localStorage.setItem(storageKey, JSON.stringify(allSettings));
  }

  function syncControls() {
    if (motionControl) motionControl.checked = Boolean(settings.motion);
    if (lagControl) lagControl.value = String(settings.lag);
    if (lightControl) lightControl.value = String(settings.light);
    if (wobbleControl) wobbleControl.value = String(settings.wobble);
    if (twinkleControl) twinkleControl.value = String(settings.twinkle);
    if (scrollControl) scrollControl.value = String(settings.scroll);
    if (breatheDistanceControl) breatheDistanceControl.value = String(settings.breatheDistance);
    if (breatheSpeedControl) breatheSpeedControl.value = String(settings.breatheSpeed);
    if (bgDarkenControl) bgDarkenControl.value = String(settings.bgDarken ?? 0.08);
    if (bgColorControl) bgColorControl.value = String(settings.bgColor || "#000000");
    if (glassControl) glassControl.value = settings.glass || "frosted";
    if (frostControl) frostControl.value = String(settings.frost ?? 1);
    if (fontControl) fontControl.value = fontPreset;
    updateReadouts();
  }

  function formatNumber(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function getRenderedTitleFont() {
    const sampleHeading = document.querySelector(".feature-card h2") || document.querySelector("h1");
    if (!sampleHeading) return "unknown";
    const family = window.getComputedStyle(sampleHeading).fontFamily || "unknown";
    const firstFamily = family.split(",")[0]?.trim().replace(/^['\"]|['\"]$/g, "") || "unknown";
    return firstFamily;
  }

  function updateReadouts() {
    if (valueMotion) valueMotion.textContent = settings.motion ? "On" : "Off";
    if (valueLag) valueLag.textContent = formatNumber(settings.lag, 3);
    if (valueLight) valueLight.textContent = formatNumber(settings.light, 2);
    if (valueWobble) valueWobble.textContent = formatNumber(settings.wobble, 2);
    if (valueTwinkle) valueTwinkle.textContent = formatNumber(settings.twinkle, 2);
    if (valueScroll) valueScroll.textContent = formatNumber(settings.scroll, 2);
    if (valueBreatheDistance) valueBreatheDistance.textContent = `${formatNumber(settings.breatheDistance, 1)}px`;
    if (valueBreatheSpeed) valueBreatheSpeed.textContent = `${formatNumber(settings.breatheSpeed, 1)}s`;
    if (valueBgDarken) valueBgDarken.textContent = `${Math.round((settings.bgDarken ?? 0) * 100)}%`;
    if (valueBgColor) valueBgColor.textContent = String(settings.bgColor || "#000000").toUpperCase();
    if (valueGlass) valueGlass.textContent = settings.glass === "clear" ? "Clear" : "Frosted";
    if (valueFrost) valueFrost.textContent = formatNumber(settings.frost ?? 1, 2);
    if (valueFont) {
      const rendered = getRenderedTitleFont();
      valueFont.textContent = `${fontPreset} - ${fontPresetNames[fontPreset] || "Custom"} (${rendered})`;
    }
  }

  function applySettingsToCss() {
    body.dataset.fontPreset = fontPreset;
    body.dataset.tailoredMotion = settings.motion ? "on" : "off";
    body.style.setProperty("--tailored-light-strength", settings.light.toFixed(2));
    body.style.setProperty("--tailored-breathe-distance", `${settings.breatheDistance.toFixed(1)}px`);
    body.style.setProperty("--tailored-breathe-speed", `${settings.breatheSpeed.toFixed(2)}s`);
    body.style.setProperty("--tailored-particle-size", `${(7 + settings.wobble * 2).toFixed(2)}px`);
    body.style.setProperty("--bg-darken-opacity", String(Math.max(0, Math.min(0.8, Number(settings.bgDarken ?? 0)))));
    body.style.setProperty("--bg-darken-color", String(settings.bgColor || "#000000"));

    const glassMode = settings.glass === "clear" ? "clear" : "frosted";
    const frost = Math.max(0, Number(settings.frost ?? 1));
    const glassOpacity = glassMode === "clear" ? 0.16 : 0.34 + (frost * 0.12);
    const glassBlur = glassMode === "clear" ? 0 : 8 + (frost * 8);
    const glassSat = glassMode === "clear" ? 100 : 108 + (frost * 12);
    const glassBorder = glassMode === "clear" ? 0.16 : 0.2;

    body.style.setProperty("--glass-bg-opacity", String(glassOpacity));
    body.style.setProperty("--glass-blur", `${glassBlur}px`);
    body.style.setProperty("--glass-sat", `${glassSat}%`);
    body.style.setProperty("--glass-border-alpha", String(glassBorder));
    body.style.setProperty("--glass-frost-level", String(frost));

    if (!settings.motion) {
      particles.forEach((particle) => {
        particle.style.opacity = "0.4";
        particle.style.transform = "translate3d(0, 0, 0)";
      });
    }
  }

  function loadModeSettings(mode) {
    currentMode = mode === "creative" ? "creative" : "tailored";
    settings = { ...(modeDefaults[currentMode] || defaults) };

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        settings = { ...settings, ...(parsed[currentMode] || {}) };
      }
    } catch {
      settings = { ...(modeDefaults[currentMode] || defaults) };
    }

    syncControls();
    applySettingsToCss();
    if (settings.motion) {
      startLoop();
    } else {
      stopLoop();
    }
  }

  function stopLoop() {
    if (!isRunning) return;
    window.cancelAnimationFrame(frameId);
    isRunning = false;
  }

  function startLoop() {
    if (isRunning || !settings.motion) return;
    frameId = window.requestAnimationFrame(render);
    isRunning = true;
  }

  function applyPointer(x, y) {
    const px = (x / Math.max(window.innerWidth, 1)) * 100;
    const py = (y / Math.max(window.innerHeight, 1)) * 100;
    body.style.setProperty("--pointer-x", `${px.toFixed(2)}%`);
    body.style.setProperty("--pointer-y", `${py.toFixed(2)}%`);
  }

  function render(now) {
    if (!settings.motion) {
      stopLoop();
      return;
    }

    smoothX += (pointerX - smoothX) * settings.lag;
    smoothY += (pointerY - smoothY) * settings.lag;
    applyPointer(smoothX, smoothY);

    const scrollY = window.scrollY || 0;

    particles.forEach((particle, index) => {
      const depth = particleDepths[index % particleDepths.length];
      const wobbleX = Math.sin(now * 0.0012 + index * 1.4) * (14 + index * 0.5) * settings.wobble;
      const wobbleY = Math.cos(now * 0.001 + index * 1.1) * (11 + index * 0.35) * settings.wobble;
      const scrollOffset = -scrollY * depth * settings.scroll;
      const twinkle = 0.24 + ((Math.sin(now * 0.0022 + index * 0.8) + 1) * 0.34 * settings.twinkle);

      particle.style.transform = `translate3d(${wobbleX.toFixed(2)}px, ${(wobbleY + scrollOffset).toFixed(2)}px, 0)`;
      particle.style.opacity = Math.min(1, twinkle).toFixed(2);
    });

    frameId = window.requestAnimationFrame(render);
    isRunning = true;
  }

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  });

  window.addEventListener("resize", () => {
    pointerX = Math.min(pointerX, window.innerWidth);
    pointerY = Math.min(pointerY, window.innerHeight);
  });

  applyPointer(pointerX, pointerY);

  function bindControl(control, key, parser = Number) {
    if (!control) return;
    control.addEventListener("input", () => {
      settings[key] = parser(control.value);
      applySettingsToCss();
      persistSettings();
      updateReadouts();

      if (settings.motion) {
        startLoop();
      }
    });
  }

  if (motionControl) {
    motionControl.addEventListener("change", () => {
      settings.motion = motionControl.checked;
      applySettingsToCss();
      persistSettings();
      updateReadouts();

      if (settings.motion) {
        startLoop();
      } else {
        stopLoop();
      }
    });
  }

  bindControl(lagControl, "lag");
  bindControl(lightControl, "light");
  bindControl(wobbleControl, "wobble");
  bindControl(twinkleControl, "twinkle");
  bindControl(scrollControl, "scroll");
  bindControl(breatheDistanceControl, "breatheDistance");
  bindControl(breatheSpeedControl, "breatheSpeed");
  bindControl(bgDarkenControl, "bgDarken");
  bindControl(glassControl, "glass", (value) => (value === "clear" ? "clear" : "frosted"));
  bindControl(frostControl, "frost");

  if (bgColorControl) {
    bgColorControl.addEventListener("input", () => {
      settings.bgColor = String(bgColorControl.value || "#000000");
      applySettingsToCss();
      persistSettings();
      updateReadouts();
    });
  }

  if (fontControl) {
    fontControl.addEventListener("change", () => {
      const next = String(fontControl.value);
      if (!allowedFontPresets.has(next)) return;

      fontPreset = next;
      window.localStorage.setItem(fontStorageKey, fontPreset);
      applySettingsToCss();
      updateReadouts();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      settings = { ...(modeDefaults[currentMode] || defaults) };
      syncControls();
      applySettingsToCss();
      persistSettings();
      window.localStorage.setItem(fontStorageKey, fontPreset);
      updateReadouts();
      startLoop();
    });
  }

  const modeButtons = Array.from(document.querySelectorAll(".style-btn[data-site-style]"));
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.siteStyle;
      if (mode === "creative" || mode === "tailored") {
        loadModeSettings(mode);
      }
    });
  });

  loadModeSettings(currentMode);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
      return;
    }

    startLoop();
  });
}

function setupShowcaseSwitcher() {
  const switchButtons = Array.from(document.querySelectorAll(".style-btn[data-site-style]"));
  if (switchButtons.length === 0) {
    return;
  }

  const body = document.body;
  const storageKey = "barista-journal-site-style";
  const availableStyles = new Set(["creative", "fashion", "tailored"]);

  function setView(view, persist = true) {
    if (!availableStyles.has(view)) return;

    body.dataset.siteStyle = view;

    switchButtons.forEach((button) => {
      const isActive = button.dataset.siteStyle === view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (persist) {
      window.localStorage.setItem(storageKey, view);
    }
  }

  switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.siteStyle;
      if (!nextView) return;
      setView(nextView);
    });
  });

  const stored = window.localStorage.getItem(storageKey);
  const initialView = stored && availableStyles.has(stored) ? stored : body.dataset.siteStyle || "tailored";
  setView(initialView, false);
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  // Always start from top on refresh/navigation to avoid sticky offset accumulation.
  window.scrollTo(0, 0);
});

function getSortKey(path) {
  const filename = path.split("/").pop() || "";
  const match = filename.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function renderScreenshots() {
  if (!screensGrid) return;

  const screenshotModules = import.meta.glob("./assets/screenshots/*.{png,jpg,jpeg,webp,avif}", {
    eager: true,
    import: "default",
    query: "?url",
  });

  const screenshots = Object.entries(screenshotModules)
    .map(([path, url]) => ({ path, url: String(url) }))
    .sort((a, b) => getSortKey(a.path) - getSortKey(b.path) || a.path.localeCompare(b.path));

  // Preload all screenshot assets to avoid blank/late side previews during transitions.
  screenshots.forEach((item) => {
    const preload = new Image();
    preload.src = item.url;
  });

  screensGrid.innerHTML = "";

  if (screenshots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "screens-empty";
    empty.textContent = "Add screenshots to assets/screenshots and they will appear here automatically.";
    screensGrid.appendChild(empty);
    return;
  }

  let currentIndex = 0;
  let activePointerId = null;
  let dragStartX = 0;
  let dragProgress = 0;
  let isDragging = false;
  let isAnimating = false;
  const snapDurationMs = 260;
  const mobileCommitThreshold = 0.22;

  const carousel = document.createElement("div");
  carousel.className = "screens-carousel";

  const stage = document.createElement("div");
  stage.className = "screens-stage";
  stage.tabIndex = 0;

  const previousFigure = document.createElement("figure");
  previousFigure.className = "screen-card screen-prev";

  const previousImage = document.createElement("img");
  previousImage.loading = "lazy";
  previousImage.draggable = false;
  previousFigure.appendChild(previousImage);

  const figure = document.createElement("figure");
  figure.className = "screen-card screen-current";

  const image = document.createElement("img");
  image.loading = "lazy";
  image.draggable = false;
  figure.appendChild(image);

  const nextFigure = document.createElement("figure");
  nextFigure.className = "screen-card screen-next";

  const nextImage = document.createElement("img");
  nextImage.loading = "lazy";
  nextImage.draggable = false;
  nextFigure.appendChild(nextImage);

  const bufferFigure = document.createElement("figure");
  bufferFigure.className = "screen-card screen-buffer";

  const bufferImage = document.createElement("img");
  bufferImage.loading = "lazy";
  bufferImage.draggable = false;
  bufferFigure.appendChild(bufferImage);

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "screens-arrow screens-arrow-left";
  previousButton.setAttribute("aria-label", "Previous screenshot");
  previousButton.textContent = "<";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "screens-arrow screens-arrow-right";
  nextButton.setAttribute("aria-label", "Next screenshot");
  nextButton.textContent = ">";

  function isMobileLayout() {
    return window.matchMedia("(max-width: 580px)").matches;
  }

  function wrapIndex(index) {
    const total = screenshots.length;
    return (index + total) % total;
  }

  function updateSlideSources() {
    const current = screenshots[currentIndex];
    const previous = screenshots[wrapIndex(currentIndex - 1)];
    const next = screenshots[wrapIndex(currentIndex + 1)];

    image.src = current.url;
    image.alt = `Barista Journal app screenshot ${currentIndex + 1}`;

    previousImage.src = previous.url;
    previousImage.alt = "Previous app screenshot preview";
    nextImage.src = next.url;
    nextImage.alt = "Next app screenshot preview";
  }

  function setCardStyle(card, x, scale, opacity, blur, zIndex) {
    card.style.transform = `translateX(${x}px) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.filter = `blur(${blur}px) saturate(0.9) brightness(0.8)`;
    card.style.zIndex = String(zIndex);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function getVisualState(x, spacing) {
    const distance = clamp(Math.abs(x) / spacing, 0, 1);
    return {
      scale: lerp(1, 0.9, distance),
      opacity: lerp(1, 0.42, distance),
      blur: lerp(0, 3, distance),
    };
  }

  function applyLayout(progress) {
    const stageWidth = stage.clientWidth || 640;
    const spacing = Math.min(stageWidth * 0.34, 220);

    const prevX = -spacing + progress * spacing;
    const currentX = progress * spacing;
    const nextX = spacing + progress * spacing;

    const previousVisual = getVisualState(prevX, spacing);
    const currentVisual = getVisualState(currentX, spacing);
    const nextVisual = getVisualState(nextX, spacing);

    setCardStyle(previousFigure, prevX, previousVisual.scale, previousVisual.opacity, previousVisual.blur, 1);
    setCardStyle(figure, currentX, currentVisual.scale, currentVisual.opacity, currentVisual.blur, 3);
    setCardStyle(nextFigure, nextX, nextVisual.scale, nextVisual.opacity, nextVisual.blur, 1);
  }

  function snapTo(targetProgress, onDone) {
    dragProgress = targetProgress;
    applyLayout(dragProgress);

    window.setTimeout(() => {
      onDone?.();
    }, snapDurationMs);
  }

  function applyArrowLayout(direction) {
    const stageWidth = stage.clientWidth || 640;
    const spacing = Math.min(stageWidth * 0.34, 220);
    const sideVisual = getVisualState(spacing, spacing);
    const centerVisual = getVisualState(0, spacing);

    if (direction < 0) {
      // Next: right preview moves to center, opposite (left) side fades out immediately.
      setCardStyle(previousFigure, -spacing, sideVisual.scale, 0, sideVisual.blur, 1);
      setCardStyle(figure, -spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 2);
      setCardStyle(nextFigure, 0, centerVisual.scale, centerVisual.opacity, centerVisual.blur, 3);
      return;
    }

    // Previous: left preview moves to center, opposite (right) side fades out immediately.
    setCardStyle(previousFigure, 0, centerVisual.scale, centerVisual.opacity, centerVisual.blur, 3);
    setCardStyle(figure, spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 2);
    setCardStyle(nextFigure, spacing, sideVisual.scale, 0, sideVisual.blur, 1);
  }

  function prepareBuffer(direction) {
    const stageWidth = stage.clientWidth || 640;
    const spacing = Math.min(stageWidth * 0.34, 220);
    const sideVisual = getVisualState(spacing, spacing);

    function showBufferAt(x) {
      // Start from hidden state, then immediately transition in without waiting a full frame.
      bufferFigure.style.transition = "none";
      setCardStyle(bufferFigure, x, sideVisual.scale, 0, sideVisual.blur, 1);
      bufferFigure.classList.add("active");

      // Force reflow so the browser applies the hidden state before transitioning.
      void bufferFigure.offsetWidth;

      bufferFigure.style.transition = "";
      setCardStyle(bufferFigure, x, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 1);
    }

    if (direction < 0) {
      const incomingPath = screenshots[wrapIndex(currentIndex + 2)].url;
      bufferImage.src = incomingPath;
      bufferImage.alt = "Incoming app screenshot preview";
      showBufferAt(spacing);
      return;
    }

    const incomingPath = screenshots[wrapIndex(currentIndex - 2)].url;
    bufferImage.src = incomingPath;
    bufferImage.alt = "Incoming app screenshot preview";
    showBufferAt(-spacing);
  }

  function clearBuffer() {
    bufferFigure.classList.remove("active");
    bufferFigure.style.opacity = "0";
    bufferFigure.style.filter = "blur(3px) saturate(0.9) brightness(0.8)";
    bufferFigure.style.zIndex = "0";
  }

  function completeSlide(direction) {
    if (direction < 0) {
      currentIndex = wrapIndex(currentIndex + 1);
    } else {
      currentIndex = wrapIndex(currentIndex - 1);
    }

    // Reset layout without animation to avoid a visible reverse motion.
    stage.classList.add("is-dragging");
    dragProgress = 0;
    updateSlideSources();
    applyLayout(dragProgress);
    clearBuffer();

    // Force style flush so removing the class does not animate the reset.
    void stage.offsetWidth;
    stage.classList.remove("is-dragging");
    isAnimating = false;
  }

  function commit(direction) {
    if (isAnimating || screenshots.length < 2) return;

    if (isMobileLayout()) {
      currentIndex = direction < 0 ? wrapIndex(currentIndex + 1) : wrapIndex(currentIndex - 1);
      updateSlideSources();
      applyLayout(0);
      return;
    }

    isAnimating = true;
    prepareBuffer(direction);
    applyArrowLayout(direction);
    window.setTimeout(() => {
      completeSlide(direction);
    }, snapDurationMs);
  }

  function goPrevious() {
    commit(1);
  }

  function goNext() {
    commit(-1);
  }

  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  });

  previousButton.addEventListener("click", (event) => {
    event.stopPropagation();
    goPrevious();
  });

  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    goNext();
  });
  previousFigure.addEventListener("click", goPrevious);
  nextFigure.addEventListener("click", goNext);

  stage.addEventListener("pointerdown", (event) => {
    if (isAnimating || !isMobileLayout()) return;

    event.preventDefault();
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    isDragging = true;
    stage.classList.add("dragging");
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;

    event.preventDefault();

    const delta = event.clientX - dragStartX;
    // On mobile we only need direction/threshold, not animated dragging.
    dragProgress = delta;
  });

  function handleDragEnd(event) {
    if (!isDragging || event.pointerId !== activePointerId) return;

    isDragging = false;
    activePointerId = null;
    stage.classList.remove("dragging");

    const stageWidth = stage.clientWidth || 640;
    const dragRatio = dragProgress / (stageWidth * 0.45);

    if (dragRatio > mobileCommitThreshold) {
      currentIndex = wrapIndex(currentIndex - 1);
      updateSlideSources();
      applyLayout(0);
    } else if (dragRatio < -mobileCommitThreshold) {
      currentIndex = wrapIndex(currentIndex + 1);
      updateSlideSources();
      applyLayout(0);
    }

    dragProgress = 0;

    if (typeof event.pointerId === "number" && stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  }

  stage.addEventListener("pointerup", handleDragEnd);
  stage.addEventListener("pointercancel", handleDragEnd);
  stage.addEventListener("dragstart", (event) => event.preventDefault());

  window.addEventListener("resize", () => {
    applyLayout(dragProgress);
  });

  stage.appendChild(previousFigure);
  stage.appendChild(figure);
  stage.appendChild(nextFigure);
  stage.appendChild(bufferFigure);
  stage.appendChild(previousButton);
  stage.appendChild(nextButton);

  carousel.appendChild(stage);
  screensGrid.appendChild(carousel);

  updateSlideSources();
  applyLayout(0);
}

renderScreenshots();
setupShowcaseSwitcher();
setupTailoredAtmosphere();

function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`.trim();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabase) {
    setMessage("Waitlist is not configured yet. Add Supabase env vars first.", "error");
    return;
  }

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const skill = String(formData.get("skill") || "").trim();
  const website = String(formData.get("website") || "").trim();

  // Honeypot check: real users should never fill this in.
  if (website) {
    setMessage("You are on the list. We will email you before launch.", "success");
    form.reset();
    return;
  }

  if (!name || !email || !skill) {
    setMessage("Please complete all fields before joining.", "error");
    return;
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailIsValid) {
    setMessage("Please enter a valid email address.", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
    submitButton.textContent = "Joining...";
  }

  const { error } = await supabase.from("waitlist").insert({
    name,
    email,
    skill_level: skill,
    source: "landing-page",
  });

  // Send to Loops via serverless function if Supabase insert succeeded
  let loopsError = null;
  if (!error) {
    try {
      const loopsRes = await fetch("/api/loops-waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          skill,
        }),
      });
      if (!loopsRes.ok) {
        loopsError = true;
      }
    } catch (e) {
      loopsError = true;
    }
  }

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = false;
    submitButton.textContent = "Join the Waitlist";
  }

  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("duplicate") || message.includes("unique")) {
      setMessage("This email is already on the waitlist.", "error");
      return;
    }

    setMessage("Could not save your signup. Please try again.", "error");
    return;
  }

  form.reset();
  if (loopsError) {
    setMessage("You are on the list, but confirmation email could not be sent. Please contact support if you don't receive it.", "warning");
  } else {
    setMessage("You are on the list. We will email you before launch.", "success");
  }
});
