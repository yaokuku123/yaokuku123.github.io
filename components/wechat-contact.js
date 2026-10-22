import { escapeHtml as e } from "../lib/html.js";

export function mountWechatContact(profile) {
  const dialog = document.createElement("dialog");
  dialog.className = "wechat-dialog";
  dialog.setAttribute("aria-labelledby", "wechat-title");
  dialog.innerHTML = `<button type="button" class="wechat-close" aria-label="关闭微信二维码">×</button><span class="eyebrow">LET’S KEEP IN TOUCH</span><h2 id="wechat-title">微信联系</h2><p>微信名 · ${e(profile.wechat.name)}</p><img src="${e(profile.wechat.image)}" alt="${e(profile.wechat.name)} 的微信加好友二维码"><p>用微信扫一扫，或保存图片后识别二维码。</p><a class="text-link" href="${e(profile.wechat.image)}" download="yorick-wechat.jpg">保存二维码 ↓</a>`;
  document.body.append(dialog);
  let opener;
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-wechat]");
    if (trigger) {
      opener = trigger;
      dialog.showModal();
    }
  });
  dialog
    .querySelector(".wechat-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => opener?.isConnected && opener.focus());
  window.addEventListener("hashchange", () => dialog.open && dialog.close());
}
