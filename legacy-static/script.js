const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  root.dataset.theme = "dark";
}

function syncToggleLabel() {
  const isDark = root.dataset.theme === "dark";
  toggle.setAttribute("aria-label", isDark ? "切换浅色模式" : "切换深色模式");
  toggle.setAttribute("title", isDark ? "切换浅色模式" : "切换深色模式");
}

syncToggleLabel();

toggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
  syncToggleLabel();
});
