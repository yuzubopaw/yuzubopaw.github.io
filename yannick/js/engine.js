/* Shared engine: language, save data, speech, quiz shell, stars. */
(function (w) {
  const KEY = "yannick-skill-games-v1";

  const defaultState = () => ({
    lang: "en",
    sound: true,
    name: "Yannick",
    stars: {},
    plays: {},
    sessionCount: 0,
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }

  const Store = load();
  function save() {
    localStorage.setItem(KEY, JSON.stringify(Store));
  }

  function L(en, zh) {
    return Store.lang === "zh" ? zh : en;
  }

  function asset(p) {
    return (w.ASSET && w.ASSET[p]) || p;
  }

  function utter(text, onend) {
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = Store.lang === "zh" ? "zh-HK" : "en-GB";
    u.rate = 0.9;
    if (onend) u.onend = onend;
    w.speechSynthesis.speak(u);
    return u;
  }

  function speak(text) {
    if (!Store.sound || !text || !w.speechSynthesis) return;
    w.speechSynthesis.cancel();
    utter(text);
  }

  function speakQueue(texts) {
    if (!Store.sound || !w.speechSynthesis) return;
    const list = (texts || []).filter(Boolean);
    if (!list.length) return;
    w.speechSynthesis.cancel();
    let n = 0;
    function next() {
      if (n >= list.length) return;
      utter(list[n++], next);
    }
    next();
  }

  function headBar(total, index, replayText) {
    return `<div class="game-head">
      <button class="speak-btn" type="button" id="replay" aria-label="listen">🔊</button>
      ${pips(total, index, index)}
    </div>
    <p class="sr" id="prompt-sr">${replayText || ""}</p>`;
  }

  function picEl(opt) {
    const btn = document.createElement("button");
    btn.className = "pic";
    btn.type = "button";
    btn.setAttribute("aria-label", opt.label || "");
    if (opt.img) {
      const im = document.createElement("img");
      im.src = opt.img;
      im.alt = opt.label || "";
      btn.appendChild(im);
    } else {
      const ico = document.createElement("span");
      ico.className = "pic-ico";
      ico.textContent = opt.ico || "";
      btn.appendChild(ico);
    }
    return btn;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function starChars(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
  }

  function award(gameId, correct, total) {
    const ratio = total ? correct / total : 1;
    const got = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    const prev = Store.stars[gameId] || 0;
    Store.stars[gameId] = Math.max(prev, got);
    Store.plays[gameId] = (Store.plays[gameId] || 0) + 1;
    Store.sessionCount = (Store.sessionCount || 0) + 1;
    save();
    return got;
  }

  function totalStars() {
    return Object.values(Store.stars).reduce((a, b) => a + b, 0);
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = el('<div class="confetti" aria-hidden="true"></div>');
    const bits = ["⭐", "🌟", "🎉", "✨", "🧡", "💛", "💚"];
    for (let i = 0; i < 22; i++) {
      const n = document.createElement("i");
      n.textContent = bits[i % bits.length];
      n.style.left = Math.random() * 100 + "vw";
      n.style.animationDelay = Math.random() * 0.4 + "s";
      n.style.fontSize = 1 + Math.random() * 1.2 + "rem";
      layer.appendChild(n);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1800);
  }

  function pips(total, index, doneCount) {
    let s = '<div class="pips" aria-hidden="true">';
    for (let i = 0; i < total; i++) {
      const cls = i < doneCount ? "done" : i === index ? "on" : "";
      s += `<span class="pip ${cls}"></span>`;
    }
    return s + "</div>";
  }

  function finishScreen(root, gameId, correct, total, onHome, onAgain) {
    const got = award(gameId, correct, total);
    const chip = document.getElementById("star-chip");
    if (chip) chip.textContent = `⭐ ${totalStars()}`;
    confetti();
    speak(L(`You earned ${got} stars! Great work.`, `你得到 ${got} 顆星星！做得好。`));
    const needBreak = Store.sessionCount > 0 && Store.sessionCount % 2 === 0;
    root.innerHTML = `
      <div class="finish">
        <img class="star" src="${asset("assets/star.jpg")}" alt="">
        <div class="big-stars">${starChars(got)}</div>
        <div class="actions" style="justify-content:center">
          ${needBreak ? `<button class="pic" data-act="break" aria-label="body break"><span class="pic-ico">🐸</span></button>` : ""}
          <button class="pic" data-act="again" aria-label="again"><span class="pic-ico">🔄</span></button>
          <button class="pic" data-act="home" aria-label="home"><span class="pic-ico">🏠</span></button>
        </div>
      </div>`;
    root.querySelector("[data-act=home]").onclick = onHome;
    root.querySelector("[data-act=again]").onclick = onAgain;
    const b = root.querySelector("[data-act=break]");
    if (b) b.onclick = () => (w.YG.go("move"));
  }

  function rulesGate(root, rules, then) {
    let heard = new Set();
    function draw() {
      root.innerHTML = `
        ${headBar(rules.length, heard.size, L("Tap each picture. Then go.", "點每個圖，然後開始。"))}
        <div class="pics" id="rules"></div>
        <div class="actions" style="justify-content:center">
          <button class="pic go" id="go" ${heard.size < rules.length ? "disabled" : ""} aria-label="go"><span class="pic-ico">▶️</span></button>
        </div>`;
      const box = root.querySelector("#rules");
      rules.forEach((r, i) => {
        const btn = picEl({ ico: r.ico || "📌", label: r.text });
        if (heard.has(i)) btn.classList.add("picked");
        btn.onclick = () => {
          heard.add(i);
          speak(r.text);
          draw();
        };
        box.appendChild(btn);
      });
      const go = root.querySelector("#go");
      go.onclick = then;
      root.querySelector("#replay").onclick = () =>
        speak(L("Tap each picture. Then the green triangle.", "點每個圖。然後按綠色三角。"));
    }
    draw();
    speak(L("Tap each picture. Then go.", "點每個圖，然後開始。"));
  }

  /**
   * Generic quiz. items: [{prompt, speak, sceneHtml, options:[{label, ico, ok, feedback}]}]
   * After a correct answer, auto-advance. Wrong answers stay for a retry (first try counted).
   */
  function runQuiz(root, gameId, items, hooks) {
    const total = items.length;
    let i = 0;
    let correct = 0;
    let locked = false;
    let missed = false;
    const onHome = hooks.onHome;
    const onAgain = () => runQuiz(root, gameId, shuffle(items).slice(0, items.length), hooks);

    function render() {
      locked = false;
      missed = false;
      const q = items[i];
      const opts = shuffle(q.options);
      const replay = q.speak || q.prompt;
      root.innerHTML = `
        ${headBar(total, i, replay)}
        ${q.sceneHtml || ""}
        <div class="pics" id="pics"></div>
        <div id="fb" class="fb-emoji"></div>`;
      const extra = opts.map((o) => o.say).filter(Boolean);
      speakQueue([replay].concat(extra));
      root.querySelector("#replay").onclick = () => speakQueue([replay].concat(extra));
      const box = root.querySelector("#pics");
      opts.forEach((opt) => {
        const btn = picEl(opt);
        btn.onclick = () => pickOpt(btn, opt, q);
        box.appendChild(btn);
      });
    }

    function pickOpt(btn, opt, q) {
      if (locked || btn.disabled) return;
      if (opt.ok) {
        locked = true;
        if (!missed) correct += 1;
        btn.classList.add("good");
        const fb = root.querySelector("#fb");
        fb.innerHTML = `<span>🎉</span>`;
        speak(opt.feedback || L("Yes! Good job.", "對啦！做得好。"));
        setTimeout(next, 1100);
      } else {
        missed = true;
        btn.classList.add("bad");
        btn.disabled = true;
        speak(opt.feedback || L("Try another picture.", "試另一張圖。"));
      }
    }

    function next() {
      i += 1;
      if (i >= total) finishScreen(root, gameId, correct, total, onHome, onAgain);
      else render();
    }

    render();
  }

  w.YG = {
    Store,
    save,
    L,
    asset,
    speak,
    speakQueue,
    headBar,
    picEl,
    shuffle,
    pick,
    $,
    el,
    starChars,
    award,
    totalStars,
    confetti,
    pips,
    finishScreen,
    rulesGate,
    runQuiz,
    go: null,
  };
})(window);
