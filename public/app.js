"use strict";
const PL = ["Instagram", "Facebook", "Twitter"];
const TY = ["video", "image", "carousel", "poll", "text"];
const lab = { Twitter: "Twitter / X", video: "Video", image: "Image", carousel: "Carousel", poll: "Poll", text: "Text" };
const st = { p: "Instagram", t: "video" };
const $ = (id) => document.getElementById(id);
const W = (k, c) => c[M.features.indexOf(k)];
const fmt = (n) => n.toLocaleString("en-US");

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function chips(box, list, key) {
  box.replaceChildren();
  list.forEach((v) => {
    const b = el("button", "", lab[v] || v);
    b.type = "button";
    b.setAttribute("aria-pressed", String(st[key] === v));
    b.onclick = () => { st[key] = v; draw(); };
    box.append(b);
  });
}

function draw() {
  chips($("cp"), PL, "p");
  chips($("ct"), TY, "t");
  const kp = "platform_" + st.p, kt = "format_" + st.t;
  const z = M.clf_intercept + W(kp, M.clf_coef) + W(kt, M.clf_coef);
  const p = 1 / (1 + Math.exp(-z));
  const m = M.reg_intercept + W(kp, M.reg_coef) + W(kt, M.reg_coef);
  const round = (x) => Math.round(Math.expm1(x) / 10) * 10;

  $("pc").textContent = Math.round(p * 100) + "%";
  $("arc").style.strokeDashoffset = String(440 * (1 - p));
  $("vd").textContent = p >= 0.5 ? "Good odds to go viral" : p >= 0.33 ? "Around average: could go either way" : "Below average odds";
  $("rg").replaceChildren(
    "Expect about ", el("b", "", fmt(round(m))), " interactions (likes, comments, shares).", el("br"),
    "Likely range: " + fmt(round(m + M.q10)) + " to " + fmt(round(m + M.q90))
  );

  const dr = $("dr");
  dr.replaceChildren();
  [[lab[st.p] || st.p, W(kp, M.clf_coef)], [lab[st.t], W(kt, M.clf_coef)]].forEach(([name, c]) => {
    const w = Math.min(Math.abs(c) / 1.2, 1) * 50;
    const sign = c >= 0 ? "up" : "dn";
    const bar = el("div", "bar"), fill = el("i", sign);
    fill.style.left = (c >= 0 ? 50 : 50 - w) + "%";
    fill.style.width = w + "%";
    bar.append(fill);
    const row = el("div", "row");
    row.append(el("span", "", name), bar, el("span", "val " + sign, (c >= 0 ? "+" : "") + c.toFixed(2)));
    dr.append(row);
  });
}

$("tr").textContent =
  "“Viral” here means the top third of posts. The model learns from " + M.metrics.n + " posts with real engagement numbers, plus " + M.metrics.n_extra +
  " tweets at a low weight. " + fmt(M.metrics.n_rejected) + " more posts were tested and left out: their labels behave like random noise and made predictions worse. " +
  "On posts the model never saw, it scores an AUC of " + M.metrics.auc + " (0.5 is a coin flip). Accuracy is " + Math.round(M.metrics.accuracy * 100) +
  "%, against " + Math.round(M.metrics.baseline_accuracy * 100) + "% for always answering “not viral”. Use it to compare ideas, not as a verdict.";

function tab(video) {
  $("tl").setAttribute("aria-pressed", String(!video));
  $("tv").setAttribute("aria-pressed", String(video));
  $("pl").hidden = video;
  $("pv").hidden = !video;
}
$("tl").onclick = () => tab(false);
$("tv").onclick = () => tab(true);

// Links are only parsed as text. They are never opened or sent anywhere.
const HINT = "The link is read for the platform and format only. Nothing is downloaded.";
$("lm").textContent = HINT;
$("link").oninput = (e) => {
  const v = e.target.value.trim().slice(0, 500), h = $("lm");
  if (!v) { h.textContent = HINT; return; }
  let u;
  try { u = new URL(/^https?:/i.test(v) ? v : "https://" + v); } catch (_) { h.textContent = "This doesn’t look like a link yet."; return; }
  const d = u.hostname.replace(/^www\.|^m\./, ""), a = u.pathname;
  let pl = null, ty = null;
  if (/(^|\.)instagram\.com$/.test(d)) { pl = "Instagram"; ty = /\/reels?\//.test(a) ? "video" : /\/p\//.test(a) ? "image" : null; }
  else if (/(^|\.)facebook\.com$|^fb\.watch$|^fb\.com$/.test(d)) { pl = "Facebook"; ty = /reel|watch|videos/.test(d + a) ? "video" : null; }
  else if (/(^|\.)twitter\.com$|^x\.com$/.test(d)) { pl = "Twitter"; }
  else if (/tiktok\.com$|youtube\.com$|youtu\.be$/.test(d)) { h.textContent = "This platform isn’t in the training data. Pick the closest one below, and treat the result with extra care."; return; }
  else { h.textContent = "Unknown site. Choose the platform and format yourself below."; return; }
  st.p = pl;
  if (ty) st.t = ty;
  draw();
  h.textContent = "Detected: " + (lab[pl] || pl) + (ty ? ", " + lab[ty].toLowerCase() + "." : ". Pick the format below.");
};

// Videos are read locally through a temporary blob URL. Nothing is uploaded.
let url = null;
$("file").onchange = (e) => {
  const f = e.target.files[0], msg = $("fm");
  msg.textContent = "";
  if (!f) return;
  if (!f.type.startsWith("video/")) { msg.textContent = "This isn’t a video file. Choose an MP4 or MOV."; return; }
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(f);
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url;
  v.onloadedmetadata = () => { v.currentTime = Math.min(1, v.duration / 2); };
  v.onerror = () => { $("vc").hidden = true; msg.textContent = "This video format can’t be read in the browser. Try an MP4."; };
  v.onseeked = () => {
    const c = $("cv"), x = c.getContext("2d");
    c.width = 360; c.height = Math.round(360 / (v.videoWidth / v.videoHeight));
    x.drawImage(v, 0, 0, c.width, c.height);
    const s = Math.round(v.duration), w = v.videoWidth, h = v.videoHeight;
    const rows = [
      ["Duration", Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")],
      ["Resolution", w + " × " + h],
      ["Orientation", h > w ? "Vertical (9:16 style)" : h < w ? "Horizontal" : "Square"],
      ["Size", (f.size / 1048576).toFixed(1) + " MB"],
      ["File type", f.type],
    ];
    $("dl").replaceChildren(...rows.flatMap(([a, b]) => [el("dt", "", a), el("dd", "", b)]));
    $("vc").hidden = false;
    st.t = "video";
    draw();
    URL.revokeObjectURL(url); url = null;
  };
};

draw();
