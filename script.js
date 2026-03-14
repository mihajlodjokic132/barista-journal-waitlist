const screensGrid = document.getElementById("screens-grid");
const form = document.getElementById("waitlist-form");
const messageEl = document.getElementById("form-message");

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
      // Next: right preview moves to center, left preview stays left.
      setCardStyle(previousFigure, -spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 1);
      setCardStyle(figure, -spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 2);
      setCardStyle(nextFigure, 0, centerVisual.scale, centerVisual.opacity, centerVisual.blur, 3);
      return;
    }

    // Previous: left preview moves to center, right preview stays right.
    setCardStyle(previousFigure, 0, centerVisual.scale, centerVisual.opacity, centerVisual.blur, 3);
    setCardStyle(figure, spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 2);
    setCardStyle(nextFigure, spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 1);
  }

  function prepareBuffer(direction) {
    const stageWidth = stage.clientWidth || 640;
    const spacing = Math.min(stageWidth * 0.34, 220);
    const sideVisual = getVisualState(spacing, spacing);

    if (direction < 0) {
      const incomingPath = screenshots[wrapIndex(currentIndex + 2)].url;
      bufferImage.src = incomingPath;
      bufferImage.alt = "Incoming app screenshot preview";
      setCardStyle(bufferFigure, spacing, sideVisual.scale, 0, sideVisual.blur, 1);
      bufferFigure.classList.add("active");

      requestAnimationFrame(() => {
        setCardStyle(bufferFigure, spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 1);
      });
      return;
    }

    const incomingPath = screenshots[wrapIndex(currentIndex - 2)].url;
    bufferImage.src = incomingPath;
    bufferImage.alt = "Incoming app screenshot preview";
    setCardStyle(bufferFigure, -spacing, sideVisual.scale, 0, sideVisual.blur, 1);
    bufferFigure.classList.add("active");

    requestAnimationFrame(() => {
      setCardStyle(bufferFigure, -spacing, sideVisual.scale, sideVisual.opacity, sideVisual.blur, 1);
    });
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
    const isMobileLayout = window.matchMedia("(max-width: 580px)").matches;
    if (isAnimating || !isMobileLayout) return;

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
    const stageWidth = stage.clientWidth || 640;

    dragProgress = Math.max(-1, Math.min(1, delta / (stageWidth * 0.45)));
    applyLayout(dragProgress);
  });

  function handleDragEnd(event) {
    if (!isDragging || event.pointerId !== activePointerId) return;

    isDragging = false;
    activePointerId = null;
    stage.classList.remove("dragging");

    if (dragProgress > mobileCommitThreshold) {
      isAnimating = true;
      snapTo(1, () => completeSlide(1));
    } else if (dragProgress < -mobileCommitThreshold) {
      isAnimating = true;
      snapTo(-1, () => completeSlide(-1));
    } else {
      snapTo(0);
    }

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

function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`.trim();
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const skill = String(formData.get("skill") || "").trim();

  if (!name || !email || !skill) {
    setMessage("Please complete all fields before joining.", "error");
    return;
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailIsValid) {
    setMessage("Please enter a valid email address.", "error");
    return;
  }

  const waitlistEntries = JSON.parse(localStorage.getItem("baristaWaitlist") || "[]");
  waitlistEntries.push({
    name,
    email,
    skill,
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem("baristaWaitlist", JSON.stringify(waitlistEntries));
  form.reset();
  setMessage("You are on the list. We will email you before launch.", "success");
});
