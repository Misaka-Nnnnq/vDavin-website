import { chart_path, release_api, select_release } from "./release.mjs";

const menu = document.querySelector(".menu-button");
const explorer = document.querySelector("#explorer");
function set_menu(open) {
  menu.setAttribute("aria-expanded", String(open));
  explorer.classList.toggle("is-open", open);
}
menu.addEventListener("click", () =>
  set_menu(menu.getAttribute("aria-expanded") !== "true"),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    set_menu(false);
    menu.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!explorer.contains(event.target) && !menu.contains(event.target))
    set_menu(false);
});
document
  .querySelectorAll(".file-link")
  .forEach((link) => link.addEventListener("click", () => set_menu(false)));

const tabs = [...document.querySelectorAll("[data-preview]")];
function set_preview(name) {
  for (const tab of tabs) {
    const selected = tab.dataset.preview === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden =
      !selected;
  }
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => set_preview(tab.dataset.preview));
  tab.addEventListener("keydown", (event) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    set_preview(tabs[next].dataset.preview);
    tabs[next].focus();
  });
}

const examples = {
  cpu: {
    label: "CPU utilization",
    value: "24.6 %",
    color: "#4ec9b0",
    values: [22, 19, 25, 56, 42, 37, 38, 82, 51, 43, 31, 26, 20, 25, 24.6],
  },
  memory: {
    label: "physical memory utilization",
    value: "40.0 %",
    color: "#dcdcaa",
    values: [31, 31, 33, 33, 36, 37, 37, 39, 40, 40, 40, 41, 40, 40, 40],
  },
  gpu: {
    label: "GPU utilization",
    value: "38.2 %",
    color: "#c586c0",
    values: [4, 5, 8, 32, 27, 64, 53, 45, 76, 69, 30, 40, 31, 42, 38.2],
  },
};
for (const button of document.querySelectorAll("[data-metric]")) {
  button.addEventListener("click", () => {
    const example = examples[button.dataset.metric];
    for (const option of document.querySelectorAll("[data-metric]")) {
      const selected = option === button;
      option.setAttribute("aria-pressed", String(selected));
      option.classList.toggle("selected", selected);
    }
    const path = chart_path(example.values);
    const line = document.querySelector("#chart-line");
    line.setAttribute("d", path);
    line.style.stroke = example.color;
    const area = document.querySelector("#chart-area");
    area.setAttribute("d", `${path}V170H0Z`);
    area.style.fill = `${example.color}13`;
    const value = document.querySelector("#chart-value");
    value.textContent = example.value;
    value.style.color = example.color;
    document
      .querySelector(".history-chart")
      .setAttribute("aria-label", `Illustrative ${example.label} history`);
  });
}

document.querySelector("[data-copy]").addEventListener("click", async () => {
  const status = document.querySelector(".copy-status");
  try {
    await navigator.clipboard.writeText(
      document.querySelector("#checksum-command").textContent,
    );
    status.textContent = "Copied to clipboard.";
  } catch {
    status.textContent = "Select and copy the command above.";
  }
});

async function load_release() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const note = document.querySelector("#release-note");
  try {
    const response = await fetch(release_api, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Release lookup unavailable");
    const release = select_release(await response.json());
    if (!release) {
      note.textContent =
        "No downloadable public build found. Check the releases page for updates.";
      return;
    }
    for (const link of document.querySelectorAll("[data-download]"))
      link.href = release.download;
    for (const label of document.querySelectorAll("[data-download-label]"))
      label.textContent = `Download ${release.version}`;
    for (const version of document.querySelectorAll("[data-release-version]"))
      version.textContent = release.version;
    document.querySelector("[data-checksum]").href = release.checksum;
    document.querySelector("#checksum-command").textContent =
      `Get-FileHash -Algorithm SHA256 -LiteralPath '.\\${release.filename}'`;
    note.textContent = release.prerelease
      ? "Latest public test build · Pre-release"
      : "Latest public build · Read the release notes before running.";
  } catch {
    // Static links remain usable when GitHub is unavailable or rate-limits us.
    note.textContent =
      "Live release details unavailable. Browse downloads on GitHub.";
  } finally {
    clearTimeout(timeout);
  }
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = `#${entry.target.id}`;
        for (const link of document.querySelectorAll(".file-link, .activity")) {
          link.classList.toggle("active", link.getAttribute("href") === target);
        }
      }
    },
    { rootMargin: "-12% 0px -62% 0px" },
  );
  document
    .querySelectorAll("main > section[id]")
    .forEach((section) => observer.observe(section));
}
document.querySelector("#year").textContent = String(new Date().getFullYear());
load_release();
