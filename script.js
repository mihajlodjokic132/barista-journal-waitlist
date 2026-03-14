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

  screensGrid.innerHTML = "";

  if (screenshots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "screens-empty";
    empty.textContent = "Add screenshots to assets/screenshots and they will appear here automatically.";
    screensGrid.appendChild(empty);
    return;
  }

  let currentIndex = 0;
  let dragStartX = 0;
  let isDragging = false;

  const carousel = document.createElement("div");
  carousel.className = "screens-carousel";

  const stage = document.createElement("div");
  stage.className = "screens-stage";
  stage.tabIndex = 0;

  const previousFigure = document.createElement("figure");
  previousFigure.className = "screen-card screen-side screen-side-left";

  const previousImage = document.createElement("img");
  previousImage.loading = "lazy";
  previousFigure.appendChild(previousImage);

  const figure = document.createElement("figure");
  figure.className = "screen-card screen-current";

  const image = document.createElement("img");
  image.loading = "lazy";
  figure.appendChild(image);

  const nextFigure = document.createElement("figure");
  nextFigure.className = "screen-card screen-side screen-side-right";

  const nextImage = document.createElement("img");
  nextImage.loading = "lazy";
  nextFigure.appendChild(nextImage);

  const hint = document.createElement("p");
  hint.className = "screens-hint";
  hint.textContent = "Drag left or right to browse";

  function wrapIndex(index) {
    const total = screenshots.length;
    return (index + total) % total;
  }

  function updateSlide() {
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

  function goPrevious() {
    currentIndex = wrapIndex(currentIndex - 1);
    updateSlide();
  }

  function goNext() {
    currentIndex = wrapIndex(currentIndex + 1);
    updateSlide();
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

  stage.addEventListener("pointerdown", (event) => {
    dragStartX = event.clientX;
    isDragging = true;
    stage.classList.add("dragging");
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - dragStartX;
    stage.style.setProperty("--drag-offset", `${delta}px`);
  });

  function handleDragEnd(event) {
    if (!isDragging) return;

    const delta = event.clientX - dragStartX;
    const threshold = 55;

    isDragging = false;
    stage.classList.remove("dragging");
    stage.style.setProperty("--drag-offset", "0px");

    if (delta > threshold) {
      goPrevious();
    } else if (delta < -threshold) {
      goNext();
    }
  }

  stage.addEventListener("pointerup", handleDragEnd);
  stage.addEventListener("pointercancel", handleDragEnd);

  stage.appendChild(previousFigure);
  stage.appendChild(figure);
  stage.appendChild(nextFigure);

  carousel.appendChild(stage);
  carousel.appendChild(hint);
  screensGrid.appendChild(carousel);

  updateSlide();
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
