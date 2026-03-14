const form = document.getElementById("waitlist-form");
const messageEl = document.getElementById("form-message");

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
