import { paintSky } from "./sky.js";
const base = "assets/reference/";
let animation = 0,
  observer = null;
export function stopVisuals() {
  cancelAnimationFrame(animation);
  observer?.disconnect();
}
export function startVisuals() {
  stopVisuals();
  if (document.querySelector(".ideas-thread")) {
    drawThread();
    observer = new ResizeObserver(drawThread);
    document
      .querySelectorAll(".idea-entry")
      .forEach((n) => observer.observe(n));
  }
  const spheres = [...document.querySelectorAll("[data-sphere]")];
  if (!spheres.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  Promise.all(spheres.map(loadSphere)).then((renderers) => {
    if (!spheres[0].isConnected) return;
    let last = 0;
    const start = performance.now();
    const loop = (now) => {
      if (!spheres[0].isConnected) return;
      if (!document.hidden && now - last > 65) {
        paintSky();
        renderers.forEach((r) => r?.(reduced ? 0 : (now - start) / 1000));
        last = now;
      }
      if (!reduced) animation = requestAnimationFrame(loop);
    };
    loop(start);
  });
  const text = document.querySelector("[data-typewriter]");
  if (text && !reduced) {
    const value = text.textContent;
    text.textContent = "";
    let i = 0;
    const tick = () => {
      if (!text.isConnected) return;
      text.textContent = value.slice(0, ++i);
      if (i < value.length) setTimeout(tick, 115);
    };
    tick();
  }
}
async function loadSphere(canvas) {
  const earth = canvas.dataset.sphere === "earth",
    image = new Image();
  image.src =
    base +
    (earth
      ? "home-orrery-projects-earth-surface-v9-1024.webp"
      : "home-orrery-writing-moon-surface-v7-1024.webp");
  try {
    await image.decode();
  } catch {
    return null;
  }
  const texture = document.createElement("canvas");
  texture.width = image.width;
  texture.height = image.height;
  const tc = texture.getContext("2d", { willReadFrequently: true });
  tc.drawImage(image, 0, 0);
  const source = tc.getImageData(0, 0, image.width, image.height).data;
  const n = earth ? 256 : 160;
  canvas.width = canvas.height = n;
  const c = canvas.getContext("2d"),
    frame = c.createImageData(n, n),
    pixels = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const nx = (x + 0.5 - n / 2) / (n * 0.495),
        ny = (y + 0.5 - n / 2) / (n * 0.495),
        rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const z = Math.sqrt(1 - rr),
        light = Math.max(0.17, -nx * 0.42 - ny * 0.3 + z * 0.79);
      pixels.push({
        offset: (y * n + x) * 4,
        u: Math.atan2(nx, z) / (2 * Math.PI) + 0.5,
        v: Math.asin(ny) / Math.PI + 0.5,
        light,
        alpha: Math.min(255, (1 - rr) * 10000),
      });
    }
  return (time) => {
    const shift = time / (earth ? 140 : 230);
    for (const p of pixels) {
      const tx = Math.floor(((p.u + shift) % 1) * image.width),
        ty = Math.min(image.height - 1, Math.floor(p.v * image.height)),
        idx = (ty * image.width + tx) * 4;
      for (let k = 0; k < 3; k++)
        frame.data[p.offset + k] = source[idx + k] * p.light;
      frame.data[p.offset + 3] = p.alpha;
    }
    c.putImageData(frame, 0, 0);
    canvas.classList.add("sphere-ready");
  };
}
export function drawThread() {
  const host = document.querySelector(".ideas-thread"),
    svg = host?.querySelector("svg");
  if (!svg) return;
  const box = host.getBoundingClientRect(),
    mobile = box.width < 600,
    rows = [...host.querySelectorAll(".idea-entry")];
  if (!rows.length) {
    svg.innerHTML = "";
    return;
  }
  const points = rows.map((r, i) => ({
    x: (mobile ? 17 : 145) + Math.sin(i * 1.5) * (mobile ? 4 : 14),
    y: r.getBoundingClientRect().top - box.top + 34,
  }));
  let path = points.length ? `M ${points[0].x - 10} 0` : "";
  points.forEach((p, i) => {
    const previous = points[i - 1] || { x: p.x - 10, y: 0 },
      middle = (previous.y + p.y) / 2;
    path += ` C ${previous.x} ${middle}, ${p.x} ${middle}, ${p.x} ${p.y}`;
  });
  if (points.length) {
    const p = points.at(-1);
    path += ` C ${p.x} ${p.y + 35}, ${p.x - 12} ${p.y + 50}, ${p.x - 12} ${box.height}`;
  }
  svg.setAttribute("viewBox", `0 0 ${box.width} ${Math.max(box.height, 1)}`);
  svg.innerHTML = `<path class="thread-base" d="${path}"/><path class="thread-progress" pathLength="1" stroke-dasharray="1" d="${path}"/><path class="thread-flow" d="${path}"/>${points.map((p, i) => `<circle class="thread-node" cx="${p.x}" cy="${p.y}" r="${i === 0 ? 4.5 : 3.6}"/>`).join("")}<path class="thread-cursor" d="M -3 -7 L 8 -2 L -3 3 Z"/>`;
  updateThreadProgress();
}

export function updateThreadProgress() {
  const host = document.querySelector(".ideas-thread"),
    line = host?.querySelector(".thread-progress"),
    cursor = host?.querySelector(".thread-cursor");
  if (!line || !cursor || !line.getAttribute("d")) return;
  const box = host.getBoundingClientRect(),
    fraction = Math.max(
      0.055,
      Math.min(0.985, (160 - box.top) / Math.max(box.height, 1)),
    );
  line.setAttribute("stroke-dashoffset", String(1 - fraction));
  const p = line.getPointAtLength(line.getTotalLength() * fraction);
  cursor.setAttribute("transform", `translate(${p.x} ${p.y})`);
}
window.addEventListener("scroll", updateThreadProgress, { passive: true });

document.addEventListener("pointermove", (event) => {
  if (
    !matchMedia("(pointer: fine)").matches ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const stage = document.querySelector(".cosmic-stage");
  if (stage) {
    stage.style.setProperty(
      "--parallax-x",
      `${(event.clientX / innerWidth - 0.5) * 7}px`,
    );
    stage.style.setProperty(
      "--parallax-y",
      `${(event.clientY / innerHeight - 0.5) * 5}px`,
    );
  }
});
