export function uploadDemoMarkup() {
  return `<div class="upload-demo"><div class="demo-top"><span>FIELD EXPERIMENT / 001</span><span>8 个分片 · 概念模拟</span></div><div class="chunks" aria-label="分片上传进度">${Array.from({ length: 8 }, (_, index) => `<div class="chunk" data-chunk="${index}">${String(index + 1).padStart(2, "0")}</div>`).join("")}</div><div class="demo-controls"><button data-upload="start">开始上传</button><button data-upload="pause" disabled>模拟断网</button><button data-upload="resume" disabled>恢复上传</button><button data-upload="reset">重置</button></div><p class="demo-status" role="status" aria-live="polite">等待开始。每个方块代表一个分片。</p></div>`;
}
export function mountUploadDemo(root) {
  const demo = root.matches(".upload-demo")
    ? root
    : root.querySelector(".upload-demo");
  if (!demo) return () => {};
  let count = 0,
    state = "idle",
    timer;
  const buttons = Object.fromEntries(
    [...demo.querySelectorAll("[data-upload]")].map((button) => [
      button.dataset.upload,
      button,
    ]),
  );
  function update() {
    demo
      .querySelectorAll(".chunk")
      .forEach((chunk, index) => chunk.classList.toggle("done", index < count));
    buttons.start.disabled = state !== "idle";
    buttons.pause.disabled = state !== "running";
    buttons.resume.disabled = state !== "paused";
    demo.querySelector(".demo-status").textContent =
      state === "done"
        ? "8 / 8 已收到。按顺序合并，校验通过后才标记完成。"
        : state === "paused"
          ? `网络中断。已确认 ${count} / 8 个分片，恢复后只补传剩余部分。`
          : state === "running"
            ? `正在上传… 服务端已确认 ${count} / 8 个分片。`
            : "等待开始。每个方块代表一个分片。";
  }
  function onClick(event) {
    const action = event.target.closest("[data-upload]")?.dataset.upload;
    if (!action) return;
    clearInterval(timer);
    if (action === "start" || action === "resume") {
      state = "running";
      timer = setInterval(() => {
        count++;
        if (count === 8) {
          state = "done";
          clearInterval(timer);
        }
        update();
      }, 650);
    } else if (action === "pause") state = "paused";
    else {
      count = 0;
      state = "idle";
    }
    update();
  }
  demo.addEventListener("click", onClick);
  return () => {
    clearInterval(timer);
    demo.removeEventListener("click", onClick);
  };
}
