(function () {
  const { Store, save, L, speak, totalStars, starChars } = YG;
  const stage = document.getElementById("stage");
  let filter = "all";
  let currentId = null;

  function byId(id) {
    return GAME_LIST.find((g) => g.id === id);
  }

  function topbar() {
    const showBack = currentId !== null;
    document.body.classList.toggle("in-game", showBack);
    document.getElementById("back-slot").innerHTML = showBack
      ? `<button class="back-btn" id="back" aria-label="home">🏠</button>`
      : "";
    document.getElementById("brand-title").textContent = L("Yannick's Skill Play", "Yannick 的技能小遊戲");
    document.getElementById("brand-sub").textContent = L("Practice the skills from the June 2026 report", "練習 2026 年 6 月報告裡的技能");
    document.getElementById("lang-btn").textContent = Store.lang === "zh" ? "EN" : "中文";
    document.getElementById("sound-btn").textContent = Store.sound ? "🔊" : "🔇";
    document.getElementById("star-chip").textContent = `⭐ ${totalStars()}`;
    const back = document.getElementById("back");
    if (back) back.onclick = () => goHome();
  }

  function cleanupStage() {
    const root = document.getElementById("game-root");
    if (root && root._cleanup) root._cleanup();
    if (stage._cleanup) stage._cleanup();
    stage._cleanup = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function goHome() {
    cleanupStage();
    currentId = null;
    renderHub();
  }

  function goGame(id) {
    const g = byId(id);
    if (!g) return;
    cleanupStage();
    currentId = id;
    topbar();
    stage.innerHTML = `<div class="panel" id="game-root"></div>`;
    const root = document.getElementById("game-root");
    g.run(root, { onHome: goHome });
  }

  YG.go = goGame;

  function renderHub() {
    currentId = null;
    topbar();
    const cats = [
      { id: "all", label: "⭐" },
      { id: "social", label: "👫" },
      { id: "feel", label: "😊" },
      { id: "words", label: "🔤" },
      { id: "hands", label: "✋" },
      { id: "move", label: "🐸" },
    ];
    const list = GAME_LIST.filter((g) => filter === "all" || g.cat === filter);

    stage.innerHTML = `
      <section class="hero" id="hi">
        <img src="${YG.asset("assets/boy.jpg")}" alt="">
      </section>
      <div class="filters">
        ${cats
          .map(
            (c) =>
              `<button class="chip ${filter === c.id ? "on" : ""}" data-f="${c.id}">${c.label}</button>`
          )
          .join("")}
      </div>
      <div class="grid" id="grid"></div>
      <p style="text-align:center;margin-top:18px">
        <button class="icon-btn" id="grown" aria-label="grown-up">👤</button>
        <button class="icon-btn" id="voice" aria-label="gentle voice">💧</button>
      </p>
    `;
    document.getElementById("hi").onclick = () =>
      speak(L(`Hi ${Store.name}! Pick a picture.`, `你好，${Store.name}！選一張圖。`));
    const grid = document.getElementById("grid");
    list.forEach((g) => {
      const n = Store.stars[g.id] || 0;
      const card = document.createElement("button");
      card.className = "game-card";
      card.setAttribute("aria-label", g.title());
      card.innerHTML = `
        <img class="cover" src="${YG.asset(g.img)}" alt="">
        <div class="body">
          <div class="stars">${starChars(n)}</div>
        </div>`;
      card.onclick = () => goGame(g.id);
      grid.appendChild(card);
    });
    stage.querySelectorAll("[data-f]").forEach((b) => {
      b.onclick = () => {
        filter = b.getAttribute("data-f");
        renderHub();
      };
    });
    document.getElementById("grown").onclick = renderParent;
    document.getElementById("voice").onclick = () => {
      speak(
        L(
          "Gentle voice. Have a sip of water. No shouting. Take a deeper breath, then talk.",
          "輕輕的聲音。喝一口水。不要叫喊。先深呼吸，再說話。"
        )
      );
      /* spoken only — no alert for the child */
    };
  }

  function renderParent() {
    currentId = "parent";
    topbar();
    const rows = GAME_LIST.map(
      (g) => `<tr><th>${g.title()}</th><td>${g.report()}</td></tr>`
    ).join("");
    stage.innerHTML = `
      <div class="parent">
        <h2>${L("Grown-up guide", "給大人的說明")}</h2>
        <p>${L(
          "These games follow Watchdog OPRS discharge recommendations for Yannick (June 2026): SEN teacher Cindy Lam, speech therapist Cindy Chan, occupational therapist Amy Lai. They are practice tools at home — not a replacement for school or therapy.",
          "這些遊戲跟從監護者 OPRS 2026 年 6 月離院建議：SEN 老師 Cindy Lam、言語治療師 Cindy Chan、職業治療師 Amy Lai。這是家裡的練習工具，不能代替學校或治療。"
        )}</p>
        <h3>${L("How to play", "怎樣玩")}</h3>
        <ul>
          <li>${L("Sit beside him. Keep rounds short (3–5 minutes).", "坐在他旁邊。每局短一點（3–5 分鐘）。")}</li>
          <li>${L("Praise waiting, kind words, and NEW ideas — not only correct answers.", "稱讚等待、友善的話和新主意——不只是答對。")}</li>
          <li>${L("If he wants to share immediately, use the same line as school: wait, listen, share at the end.", "如果他想立刻分享，用學校同一句：等、聽、最後才分享。")}</li>
          <li>${L("After two table games, open Body Break (frog jumps, wall push, bear walk, Superman).", "兩局桌面遊戲後，打開「動一動」（青蛙跳、推牆、小熊走、超人式）。")}</li>
          <li>${L("He is left-handed. Keep the right side of the paper clear. Start letters at the top star.", "他是左撇子。紙的右邊要清空。字母從上面的星星起筆。")}</li>
          <li>${L("If he says buyed, recast: “Oh! Yesterday you bought a toy.” Do not make him say sorry for the error.", "如果他說 buyed，重述：「哦！昨天你 bought 了一件玩具。」不必為文法錯誤道歉。")}</li>
        </ul>
        <h3>${L("Game → report skill", "遊戲 → 報告技能")}</h3>
        <table class="map-table">
          <thead><tr><th>${L("Game", "遊戲")}</th><th>${L("From the report", "來自報告")}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <h3>${L("Still better in real life", "現實生活仍然更重要")}</h3>
        <p>${L(
          "Playdates, swimming, playgrounds, opening bottles, buttons, and handwriting practice with a pencil cannot be replaced by a screen. Use the games as a warm-up, then do the real thing.",
          "約玩、游水、遊樂場、開瓶、扣鈕、用鉛筆寫字，螢幕不能代替。遊戲只是熱身，然後做真的。"
        )}</p>
        <div class="actions">
          <button class="primary" id="home">${L("Back to games", "返回遊戲")}</button>
        </div>
      </div>`;
    document.getElementById("home").onclick = goHome;
  }

  document.getElementById("lang-btn").onclick = () => {
    Store.lang = Store.lang === "zh" ? "en" : "zh";
    save();
    if (currentId && currentId !== "parent") goGame(currentId);
    else if (currentId === "parent") renderParent();
    else renderHub();
  };
  document.getElementById("sound-btn").onclick = () => {
    Store.sound = !Store.sound;
    save();
    topbar();
    if (Store.sound) speak(L("Sound on", "開啟聲音"));
  };

  renderHub();
})();
