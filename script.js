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

  const carousel = document.createElement("div");
  carousel.className = "screens-carousel";

  const figure = document.createElement("figure");
  figure.className = "screen-card";

  const image = document.createElement("img");
  image.loading = "lazy";
  figure.appendChild(image);

  const controls = document.createElement("div");
  controls.className = "screens-controls";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "screens-nav";
  prevButton.textContent = "<";
  prevButton.setAttribute("aria-label", "Previous screenshot");

  const counter = document.createElement("p");
  counter.className = "screens-counter";
  counter.setAttribute("aria-live", "polite");

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "screens-nav";
  nextButton.textContent = ">";
  nextButton.setAttribute("aria-label", "Next screenshot");

  function updateSlide() {
    const current = screenshots[currentIndex];
    image.src = current.url;
    image.alt = `Barista Journal app screenshot ${currentIndex + 1}`;
    counter.textContent = `${currentIndex + 1} / ${screenshots.length}`;
  }

  function goPrevious() {
    currentIndex = (currentIndex - 1 + screenshots.length) % screenshots.length;
    updateSlide();
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % screenshots.length;
    updateSlide();
  }

  prevButton.addEventListener("click", goPrevious);
  nextButton.addEventListener("click", goNext);

  carousel.tabIndex = 0;
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  });

  controls.appendChild(prevButton);
  controls.appendChild(counter);
  controls.appendChild(nextButton);

  carousel.appendChild(figure);
  carousel.appendChild(controls);
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
