let seed = 731;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
export function paintSky() {
  const canvas = document.querySelector("#sky"),
    ctx = canvas.getContext("2d");
  const w = innerWidth,
    h = innerHeight,
    d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = w * d;
  canvas.height = h * d;
  ctx.scale(d, d);
  seed = 731;
  const paper = document.body.classList.contains("paper");
  ctx.clearRect(0, 0, w, h);
  const page = document.body.dataset.page;
  if (
    [
      "ideas",
      "writing",
      "projects",
      "about",
      "resume",
      "course",
      "lesson",
    ].includes(page)
  )
    return;
  if (page === "home") {
    for (let i = 0; i < 100; i++) {
      const x = random() * w,
        y = random() * h,
        r = random(),
        alpha =
          0.1 + (0.5 + 0.5 * Math.sin(performance.now() / 1800 + i)) * r * 0.55;
      ctx.fillStyle = `rgba(213,199,161,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r > 0.94 ? 1.3 : 0.55, 0, Math.PI * 2);
      ctx.fill();
      if (r > 0.98) {
        ctx.strokeStyle = `rgba(205,190,150,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(x - 7, y);
        ctx.lineTo(x + 7, y);
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x, y + 7);
        ctx.stroke();
      }
    }
    return;
  }
  if (paper) {
    ctx.fillStyle = "#f3efe5";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#8d866917";
    ctx.lineWidth = 0.5;
    for (let r = 200; r < 1800; r += 100) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 28; i++) {
      let a = (i * Math.PI) / 14;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(a) * 1600, h / 2 + Math.sin(a) * 1600);
      ctx.stroke();
    }
    const veil = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w * 0.23, 180),
      w / 2,
      h / 2,
      w * 0.65,
    );
    veil.addColorStop(0, "#f3efe5");
    veil.addColorStop(0.5, "#f3efe5e8");
    veil.addColorStop(1, "#f3efe500");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = "#080b0e";
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(
      w * 0.75,
      h * 0.48,
      0,
      w * 0.75,
      h * 0.48,
      w * 0.6,
    );
    glow.addColorStop(0, "#1c344123");
    glow.addColorStop(0.5, "#10212c13");
    glow.addColorStop(1, "#00000000");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
  const points = [];
  for (let i = 0; i < (paper ? 260 : 470); i++) {
    const x = random() * w,
      y = random() * h,
      r = random(),
      size = r > 0.98 ? 1.8 : r > 0.85 ? 1 : 0.55;
    const edge = paper ? Math.min(1, Math.abs(x - w / 2) / (w * 0.3)) : 1;
    ctx.fillStyle = paper
      ? `rgba(104,102,79,${(0.12 + random() * 0.3) * edge})`
      : `rgba(${random() > 0.5 ? "196,179,140" : "171,195,213"},${0.13 + random() * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    if (r > 0.98) {
      ctx.strokeStyle = paper ? "#8d866931" : "#b5a07944";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    }
    if (i < 55) points.push([x, y]);
  }
  ctx.strokeStyle = paper ? "#77775b1c" : "#a6a8890c";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 260) {
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    }
  }
  if (paper && w > 1000) {
    ctx.fillStyle = "#8d86696a";
    ctx.font = "9px Georgia";
    ctx.fillText("CASSIOPEIA", 35, h * 0.24);
    ctx.fillText("LYRA", w - 85, h * 0.37);
    ctx.fillText("PERSEUS", 55, h * 0.67);
    ctx.fillText("ORION", w - 100, h * 0.83);
  }
}
