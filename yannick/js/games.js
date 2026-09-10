/* All mini-games. Each run(root, hooks) with hooks.onHome */
(function (w) {
  const { L, speak, shuffle, pick, el, pips, finishScreen, rulesGate, runQuiz, Store, headBar, picEl, asset } = w.YG;

  function name() {
    return Store.name || "Yannick";
  }

  function timers() {
    const ids = [];
    return {
      later(fn, ms) {
        const id = setTimeout(fn, ms);
        ids.push(id);
        return id;
      },
      clear() {
        ids.forEach(clearTimeout);
      },
    };
  }

  /* ---------------- WAIT, THEN SHARE ---------------- */
  function gameWait(root, hooks) {
    const T = timers();
    root._cleanup = T.clear;
    const friends = [
      { id: "mia", name: L("Mia", "米亞"), img: asset("assets/friend-mia.jpg") },
      { id: "leo", name: L("Leo", "利奧"), img: asset("assets/friend-leo.jpg") },
      { id: "yan", name: name(), img: asset("assets/boy.jpg") },
    ];
    const scripts = [
      {
        topic: L("favourite animal", "最喜歡的動物"),
        mia: L("I like cats. They are soft.", "我喜歡貓。貓毛毛很軟。"),
        leo: L("I like dinosaurs. They are huge!", "我喜歡恐龍。牠們好大！"),
        ideas: [
          { ico: "🐕", say: L("I like dogs because they run fast.", "我喜歡狗，因為牠們跑得快。") },
          { ico: "🐟", say: L("I like fish because they swim.", "我喜歡魚，因為牠們會游水。") },
          { ico: "🐦", say: L("I like birds because they can fly.", "我喜歡鳥，因為牠們會飛。") },
        ],
      },
      {
        topic: L("weekend", "週末"),
        mia: L("I went to the park.", "我去了公園。"),
        leo: L("I played with my brother.", "我和哥哥一起玩。"),
        ideas: [
          { ico: "📖", say: L("I read a book at home.", "我在家看書。") },
          { ico: "🏊", say: L("I went swimming.", "我去游水。") },
          { ico: "🧱", say: L("I built a block tower.", "我砌了一座積木塔。") },
        ],
      },
      {
        topic: L("snack", "小食"),
        mia: L("I like apples.", "我喜歡蘋果。"),
        leo: L("I like biscuits.", "我喜歡餅乾。"),
        ideas: [
          { ico: "🍌", say: L("I like bananas.", "我喜歡香蕉。") },
          { ico: "🥛", say: L("I like yogurt.", "我喜歡乳酪。") },
          { ico: "🍘", say: L("I like rice crackers.", "我喜歡米餅。") },
        ],
      },
      {
        topic: L("a game we like", "喜歡的遊戲"),
        mia: L("I like puzzles.", "我喜歡砌圖。"),
        leo: L("I like football.", "我喜歡踢足球。"),
        ideas: [
          { ico: "🎨", say: L("I like drawing.", "我喜歡畫畫。") },
          { ico: "🙈", say: L("I like hide and seek.", "我喜歡捉迷藏。") },
          { ico: "🧱", say: L("I like building with blocks.", "我喜歡玩積木。") },
        ],
      },
    ];
    const total = scripts.length;
    let round = 0;
    let correct = 0;
    let early = 0;

    const rules = [
      { ico: "👀", text: L("Eyes on the person talking.", "眼睛看着正在說話的人。") },
      { ico: "⏳", text: L("Wait. Do not jump in.", "等一等。不要搶着說。") },
      { ico: "💬", text: L("Share when it is your turn.", "輪到你才分享。") },
    ];

    function start() {
      round = 0;
      correct = 0;
      early = 0;
      playRound();
    }

    function seats(talkingId, bubble, waiting) {
      return `
        ${headBar(total, round, bubble || L("Wait. Listen.", "等。聽。"))}
        <div class="circle">
          ${friends
            .map(
              (f) => `
            <div class="seat ${f.id === talkingId ? "talking" : ""}">
              <div class="mic">${f.id === talkingId ? "🎤" : "&nbsp;"}</div>
              <img src="${f.img}" alt="">
            </div>`
            )
            .join("")}
        </div>
        <div class="light">${waiting ? "🔴" : "🟢"}</div>
        <div class="jar-wrap"><div class="jar"><span id="jar"></span></div></div>
        <div class="pics" style="max-width:420px">
          ${
            waiting
              ? `<button class="pic" id="waitok" aria-label="wait"><span class="pic-ico">👂</span></button>
                 <button class="pic" id="share" aria-label="share"><span class="pic-ico">💬</span></button>`
              : `<button class="pic ready" id="share" aria-label="share"><span class="pic-ico">💬</span></button>`
          }
        </div>
        <div id="fb" class="fb-emoji"></div>`;
    }

    function playRound() {
      T.clear();
      const s = scripts[round];
      let phase = "mia";
      let patience = 0;
      root.innerHTML = seats("mia", "…", true);
      speak(L(`${friends[0].name} is talking. Wait.`, `${friends[0].name}正在說話。等一等。`));
      const jar = () => {
        const j = root.querySelector("#jar");
        if (j) j.style.width = patience + "%";
      };
      const bindShare = () => {
        const rp = root.querySelector("#replay");
        const sr = root.querySelector("#prompt-sr");
        if (rp && sr) rp.onclick = () => speak(sr.textContent);
        const waitBtn = root.querySelector("#waitok");
        if (waitBtn) {
          waitBtn.onclick = () => {
            speak(L("Good waiting. Eyes on the speaker.", "等得很好。眼睛看着正在說話的人。"));
            const fb = root.querySelector("#fb");
            if (fb) fb.innerHTML = `<span>👍</span>`;
          };
        }
        const btn = root.querySelector("#share");
        if (!btn) return;
        btn.onclick = () => {
          if (phase !== "yan") {
            early += 1;
            speak(L("Oops! Wait. Listen first. Share at the end.", "哎呀！等一等。先聽。最後才分享。"));
            const fb = root.querySelector("#fb");
            fb.innerHTML = `<span>🙈</span>`;
            return;
          }
          chooseIdea(s);
        };
      };
      bindShare();
      T.later(() => {
        patience = 35;
        root.innerHTML = seats("mia", s.mia, true);
        jar();
        bindShare();
        speak(s.mia);
      }, 700);
      T.later(() => {
        phase = "leo";
        patience = 70;
        root.innerHTML = seats("leo", s.leo, true);
        jar();
        bindShare();
        speak(s.leo);
      }, 3800);
      T.later(() => {
        phase = "yan";
        patience = 100;
        root.innerHTML = seats("yan", L("Now it is your turn.", "現在輪到你了。"), false);
        jar();
        bindShare();
        speak(L("Now it is your turn. Share your idea.", "現在輪到你了。分享你的主意。"));
      }, 7000);
    }

    function chooseIdea(s) {
      T.clear();
      correct += 1;
      root.innerHTML = `
        ${headBar(total, round, L("Pick a new idea.", "選一個新主意。"))}
        <div class="pics" id="ideas"></div>`;
      root.querySelector("#replay").onclick = () => speak(L("Pick a new idea.", "選一個新主意。"));
      s.ideas.forEach((idea) => {
        const b = picEl({ ico: idea.ico, label: idea.say });
        b.onclick = () => {
          speak(idea.say);
          T.later(next, 900);
        };
        root.querySelector("#ideas").appendChild(b);
      });
    }

    function next() {
      round += 1;
      if (round >= total) {
        const score = Math.max(0, total - Math.min(early, total));
        finishScreen(root, "wait", score, total, hooks.onHome, () => gameWait(root, hooks));
      } else playRound();
    }

    rulesGate(root, rules, start);
  }

  /* ---------------- SPACE BUBBLE ---------------- */
  function gameBubble(root, hooks) {
    const T = timers();
    root._cleanup = T.clear;
    const rounds = [
      {
        who: "mia",
        where: L("at the classroom door", "在課室門口"),
        prompt: L("A friend comes to say hello at school. What do you do?", "同學在學校來打招呼。你會怎樣做？"),
        options: [
          { ico: "👋", label: L("Wave or high-five", "揮手或擊掌"), ok: true, feedback: L("Yes. At school we wave or high-five.", "對。在學校我們揮手或擊掌。") },
          { ico: "🤗", label: L("Give a big hug", "大力擁抱"), ok: false, feedback: L("Hugs are for family at home. At school, wave.", "擁抱留給家人和家。在學校請揮手。") },
          { ico: "😘", label: L("Kiss their cheek", "親一下臉"), ok: false, feedback: L("Kissing is not for school friends. Wave instead.", "親親不是給學校朋友的。改為揮手。") },
        ],
      },
      {
        who: "leo",
        where: L("on the carpet", "在地毯上"),
        prompt: L("Leo sits very close. Your bubble feels squashed. What do you say?", "利奧坐得很近。你的氣泡被擠到。你會說什麼？"),
        options: [
          { ico: "🫧", label: L("Please give me a little space", "請給我一點空間"), ok: true, feedback: L("Kind words and a little space. Perfect.", "溫柔的話，加上一點空間。很好。") },
          { ico: "✋", label: L("Push him away", "推開他"), ok: false, feedback: L("Pushing hurts. Use words: please give me space.", "推人會痛。用說話：請給我空間。") },
          { ico: "🤗", label: L("Hug him tighter", "抱得更緊"), ok: false, feedback: L("That makes the bubble even smaller. Ask for space.", "那樣氣泡會更小。請要求空間。") },
        ],
      },
      {
        who: "home",
        where: L("at home with family", "在家裡和家人"),
        prompt: L("You are at HOME. Mum or Dad says hello. A hug is OK here.", "你在家。爸爸或媽媽打招呼。這裡可以擁抱。"),
        options: [
          { ico: "🤗", label: L("Hug family", "擁抱家人"), ok: true, feedback: L("Yes. Hugs are for family at home.", "對。擁抱是給家人和家的。") },
          { ico: "🚫", label: L("Never hug anyone, ever", "永遠不要擁抱任何人"), ok: false, feedback: L("Family hugs at home are OK. School is different.", "在家擁抱家人是可以的。學校不一樣。") },
          { ico: "🏃", label: L("Run away and hide", "跑走躲起來"), ok: false, feedback: L("At home, a family hug is a kind hello.", "在家，給家人一個擁抱是友善的打招呼。") },
        ],
      },
      {
        who: "mia",
        where: L("in the line", "排隊時"),
        prompt: L("You are lining up. Keep a gap. What helps?", "你在排隊。要留空隙。怎樣做最好？"),
        options: [
          { ico: "🧍", label: L("Stand behind, hands to myself", "站在後面，手放好"), ok: true, feedback: L("Hands to yourself and a little gap. Super.", "手放好，留一點空隙。太棒了。") },
          { ico: "🤗", label: L("Hug the person in front", "抱着前面的人"), ok: false, feedback: L("That pops their bubble. Keep a gap in the line.", "那會碰到別人的氣泡。排隊時要留空隙。") },
          { ico: "🎯", label: L("Squeeze to the front", "擠到最前面"), ok: false, feedback: L("Wait in your spot. The line has a turn too.", "站在自己的位置等。排隊也要輪流。") },
        ],
      },
      {
        who: "leo",
        where: L("at playtime", "遊戲時間"),
        prompt: L("Leo runs in very close, laughing. Choose a school-OK action.", "利奧笑着衝得很近。選一個學校合適的做法。"),
        options: [
          { ico: "🙌", label: L("High-five and step back a little", "擊掌，然後退後一點"), ok: true, feedback: L("Playful AND with space. Yes!", "好玩，也有空間。對！") },
          { ico: "😘", label: L("Kiss hello", "親親打招呼"), ok: false, feedback: L("At school we keep kisses for family at home.", "在學校，親親留給家人和家。") },
          { ico: "😤", label: L("Shout GO AWAY", "大聲叫走開"), ok: false, feedback: L("A calm voice: please give me space.", "用平靜的聲音：請給我空間。") },
        ],
      },
    ];
    const total = rounds.length;
    let i = 0;
    let correct = 0;

    function show() {
      const r = rounds[i];
      const img = r.who === "mia" ? asset("assets/friend-mia.jpg") : r.who === "leo" ? asset("assets/friend-leo.jpg") : asset("assets/teacher.jpg");
      root.innerHTML = `
        ${headBar(total, i, r.prompt)}
        <div class="playground" id="pg">
          <div class="bubble-ring" id="ring"></div>
          <div class="me">
            <img src="${asset("assets/boy.jpg")}" alt="">
          </div>
          <div class="friend-walk" id="fw" style="left:4%">
            <img src="${img}" alt="">
          </div>
        </div>
        <div class="pics" id="pics"></div>
        <div id="fb" class="fb-emoji"></div>`;
      speak(r.prompt);
      root.querySelector("#replay").onclick = () => speak(r.prompt);
      T.later(() => {
        const fw = root.querySelector("#fw");
        if (fw) fw.style.left = "10%";
      }, 80);
      T.later(() => {
        const fw = root.querySelector("#fw");
        const ring = root.querySelector("#ring");
        if (fw) fw.style.left = "20%";
        if (ring) ring.classList.add("danger");
      }, 900);
      const box = root.querySelector("#pics");
      shuffle(r.options).forEach((opt) => {
        const b = picEl(opt);
        b.onclick = () => {
          const fb = root.querySelector("#fb");
          if (opt.ok) {
            correct += 1;
            b.classList.add("good");
            const ring = root.querySelector("#ring");
            if (ring) ring.classList.remove("danger");
            fb.innerHTML = `<span>🎉</span>`;
            speak(opt.feedback);
            T.later(next, 1200);
          } else {
            b.classList.add("bad");
            b.disabled = true;
            fb.innerHTML = `<span>🙈</span>`;
            speak(opt.feedback);
          }
        };
        box.appendChild(b);
      });
    }
    function next() {
      i += 1;
      if (i >= total) finishScreen(root, "bubble", correct, total, hooks.onHome, () => gameBubble(root, hooks));
      else show();
    }
    show();
  }

  /* ---------------- FEELINGS ---------------- */
  function gameFeel(root, hooks) {
    const items = [
      {
        prompt: L("The ice cream fell on the floor. How does he feel?", "雪糕掉在地上。他有什麼感覺？"),
        sceneHtml: `<div class="scene"><div class="emoji">🍦💦</div></div>`,
        options: [
          { ico: "😢", label: L("Sad", "傷心"), ok: true, feedback: L("Yes, sad. The ice cream is gone.", "對，傷心。雪糕沒有了。") },
          { ico: "😄", label: L("Happy", "開心"), ok: false, feedback: L("Losing ice cream does not feel happy.", "雪糕掉了，通常不會開心。") },
          { ico: "😴", label: L("Sleepy", "困"), ok: false, feedback: L("This is about a feeling from what happened.", "這是因為剛剛發生的事。") },
        ],
      },
      {
        prompt: L("It is his birthday cake. How does he feel?", "這是他的生日蛋糕。他有什麼感覺？"),
        sceneHtml: `<div class="scene"><div class="emoji">🎂🎉</div></div>`,
        options: [
          { ico: "😄", label: L("Happy", "開心"), ok: true, feedback: L("Yes, happy and excited!", "對，開心又興奮！") },
          { ico: "😡", label: L("Angry", "生氣"), ok: false, feedback: L("A birthday cake is a happy surprise.", "生日蛋糕是開心的驚喜。") },
          { ico: "😱", label: L("Scared", "害怕"), ok: false, feedback: L("Cake is yummy, not scary.", "蛋糕好吃，不可怕。") },
        ],
      },
      {
        prompt: L("Thunder is very loud. How might she feel?", "雷聲很大。她可能有什麼感覺？"),
        sceneHtml: `<div class="scene"><div class="emoji">⛈️</div></div>`,
        options: [
          { ico: "😱", label: L("Scared", "害怕"), ok: true, feedback: L("Loud thunder can feel scary. That is OK.", "很大的雷聲會讓人害怕。沒關係。") },
          { ico: "😄", label: L("Happy", "開心"), ok: false, feedback: L("Some people like rain. This loud boom often feels scary.", "有人喜歡下雨。但這聲巨響常常讓人害怕。") },
          { ico: "😡", label: L("Angry", "生氣"), ok: false, feedback: L("The sky is not being mean. It can still feel scary.", "天空不是故意的。但還是會害怕。") },
        ],
      },
      {
        prompt: L("First day at a new big school. This feeling is nervous.", "第一天去新的大學校。這種感覺叫緊張。"),
        sceneHtml: `<div class="scene"><img class="big" src="${asset("assets/faces/nervous.jpg")}" alt=""></div>`,
        speak: L("First day at a new school. He might feel nervous. Tummy wobbly, not sure what will happen.", "第一天去新學校。他可能覺得緊張。肚子怪怪的，不知道會怎樣。"),
        options: [
          { ico: "😬", label: L("Nervous", "緊張"), ok: true, feedback: L("Yes, nervous. New places can feel wobbly inside.", "對，緊張。新地方會讓肚子怪怪的。") },
          { ico: "😴", label: L("Sleepy", "困"), ok: false, feedback: L("Nervous is when something new is coming.", "緊張是有新事情要發生。") },
          { ico: "😡", label: L("Angry", "生氣"), ok: false, feedback: L("He is not mad. He is unsure. That is nervous.", "他不是生氣。他不確定。那是緊張。") },
        ],
      },
      {
        prompt: L("He fell down in front of the class. This feeling is embarrassed.", "他在全班面前跌倒。這種感覺叫尷尬。"),
        sceneHtml: `<div class="scene"><img class="big" src="${asset("assets/faces/embarrassed.jpg")}" alt=""></div>`,
        options: [
          { ico: "😳", label: L("Embarrassed", "尷尬"), ok: true, feedback: L("Yes, embarrassed. Cheeks feel hot. It will pass.", "對，尷尬。臉會熱熱的。很快會過去。") },
          { ico: "😄", label: L("Happy", "開心"), ok: false, feedback: L("Falling in front of friends often feels embarrassing.", "在朋友面前跌倒常常會尷尬。") },
          { ico: "😴", label: L("Sleepy", "困"), ok: false, feedback: L("Embarrassed is a hot, shy feeling.", "尷尬是一種臉熱、想躲起來的感覺。") },
        ],
      },
      {
        prompt: L("Mum is late and he cannot see her. This feeling is worried.", "媽媽遲了，他看不見她。這種感覺叫擔心。"),
        sceneHtml: `<div class="scene"><img class="big" src="${asset("assets/faces/worried.jpg")}" alt=""></div>`,
        options: [
          { ico: "😟", label: L("Worried", "擔心"), ok: true, feedback: L("Yes, worried. The mind keeps asking 'what if?'.", "對，擔心。腦子會一直想「如果怎樣」。") },
          { ico: "😄", label: L("Happy", "開心"), ok: false, feedback: L("Not knowing where Mum is can feel worried.", "不知道媽媽在哪會擔心。") },
          { ico: "😡", label: L("Angry", "生氣"), ok: false, feedback: L("He might feel a bit mad AND worried. The big feeling is worry.", "他可能有點生氣，但最大的感覺是擔心。") },
        ],
      },
      {
        prompt: L("The block tower fell again. This feeling is frustrated.", "積木塔又倒了。這種感覺叫沮喪／懊惱。"),
        sceneHtml: `<div class="scene"><img class="big" src="${asset("assets/faces/frustrated.jpg")}" alt=""></div>`,
        options: [
          { ico: "😤", label: L("Frustrated", "沮喪"), ok: true, feedback: L("Yes, frustrated. It is hard when a plan does not work.", "對，沮喪。計劃不成功時會這樣。") },
          { ico: "😄", label: L("Calm", "平靜"), ok: false, feedback: L("The tower falling again feels frustrating, not calm.", "塔又倒了，會沮喪，不是平靜。") },
          { ico: "😴", label: L("Sleepy", "困"), ok: false, feedback: L("Frustrated is a stuck, stormy feeling.", "沮喪是卡住、有點風暴的感覺。") },
        ],
      },
      {
        prompt: L("He feels frustrated. What could HELP?", "他覺得很沮喪。怎樣可以幫忙？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧱💥</div></div>`,
        options: [
          { ico: "🌬️", label: L("Take a breath, then try a new idea", "先深呼吸，再試新方法"), ok: true, feedback: L("Breath, then a new idea. That is flexible thinking.", "呼吸，然後新主意。這就是靈活思考。") },
          { ico: "🤏", label: L("Pinch someone", "捏別人"), ok: false, feedback: L("Pinching hurts. Hands are not for hurting.", "捏人會痛。手不是用來傷害人的。") },
          { ico: "🌪️", label: L("Knock all the blocks", "把積木全部推倒"), ok: false, feedback: L("That makes a bigger mess. Breath, then rebuild.", "那樣更亂。先呼吸，再重建。") },
        ],
      },
    ];
    runQuiz(root, "feel", shuffle(items), {
      title: L("Feeling Finder", "心情探險"),
      onHome: hooks.onHome,
    });
  }

  /* ---------------- MIND READER (theory of mind) ---------------- */
  function gameMind(root, hooks) {
    const items = [
      {
        prompt: L("YOU like cars. SAM likes dinosaurs. Teacher says: pick a gift for Sam. What do you pick?", "你喜歡車。森喜歡恐龍。老師說：選一份給森的禮物。你選什麼？"),
        sceneHtml: `<div class="scene"><div class="emoji">🎁</div></div>`,
        options: [
          { ico: "🦕", label: L("A dinosaur", "恐龍"), ok: true, feedback: L("Yes! Sam likes dinosaurs, not the same as you.", "對！森喜歡恐龍，和他喜歡的不一樣。") },
          { ico: "🚗", label: L("A car", "車"), ok: false, feedback: L("You like cars. Sam likes dinosaurs. Pick what SAM likes.", "你喜歡車。森喜歡恐龍。要選森喜歡的。") },
          { ico: "🥦", label: L("Broccoli", "西蘭花"), ok: false, feedback: L("Sam did not say he likes broccoli.", "森沒有說他喜歡西蘭花。") },
        ],
      },
      {
        prompt: L("The crayon box has SPOONS inside. You saw. A new friend did NOT look. What does the new friend think is inside?", "蠟筆盒裡面其實是匙羹。你看見了。新朋友沒有看。新朋友會以為裡面是什麼？"),
        sceneHtml: `<div class="scene"><div class="emoji">🖍️➡️🥄</div></div>`,
        options: [
          { ico: "🖍️", label: L("Crayons", "蠟筆"), ok: true, feedback: L("Yes. He did not look, so he thinks crayons.", "對。他沒看過，所以會以為是蠟筆。") },
          { ico: "🥄", label: L("Spoons", "匙羹"), ok: false, feedback: L("YOU know it is spoons. He did not see, so he thinks crayons.", "你知道是匙羹。他沒看見，所以以為是蠟筆。") },
          { ico: "🐱", label: L("A cat", "一隻貓"), ok: false, feedback: L("It looks like a crayon box.", "它看起來是蠟筆盒。") },
        ],
      },
      {
        prompt: L("Mia put her ball in the BLUE box and went away. Leo moved it to the RED box. Mia comes back. Where will Mia LOOK first?", "米亞把球放進藍色盒子然後走開。利奧把球移到紅色盒子。米亞回來。她會先看哪裡？"),
        sceneHtml: `<div class="scene"><div class="emoji">🔵📦  🔴📦</div></div>`,
        options: [
          { ico: "🔵", label: L("The blue box", "藍色盒子"), ok: true, feedback: L("Yes. Mia did not see it move, so she looks where she left it.", "對。米亞沒看見球被移走，所以會看她放的地方。") },
          { ico: "🔴", label: L("The red box", "紅色盒子"), ok: false, feedback: L("YOU saw the move. Mia did not. She looks in blue.", "你看見球被移走。米亞沒看見。她會看藍色。") },
          { ico: "🌳", label: L("Outside", "外面"), ok: false, feedback: L("She thinks it is still in the blue box.", "她會以為球還在藍色盒子。") },
        ],
      },
      {
        prompt: L("The box is closed. You saw a kitten go in. Leo did not look. What does Leo know?", "盒子蓋着。你看見一隻小貓走進去。利奧沒有看。利奧知道什麼？"),
        sceneHtml: `<div class="scene"><div class="emoji">📦😺</div></div>`,
        options: [
          { ico: "❓", label: L("He does not know what is inside", "他不知道裡面有什麼"), ok: true, feedback: L("Yes. If he did not see, he does not know.", "對。他沒看見，就不知道。") },
          { ico: "😺", label: L("He knows there is a kitten", "他知道有小貓"), ok: false, feedback: L("He did not see, so he does not know yet.", "他沒看見，所以還不知道。") },
          { ico: "🐶", label: L("He knows there is a dog", "他知道有狗"), ok: false, feedback: L("Nobody said a dog. Leo just does not know.", "沒有人說有狗。利奧只是不知道。") },
        ],
      },
      {
        prompt: L("YOU won two stickers. Your friend got zero. How might your FRIEND feel?", "你得到兩張貼紙。朋友一張也沒有。朋友可能有什麼感覺？"),
        sceneHtml: `<div class="scene"><div class="emoji">⭐⭐  vs  🤍</div></div>`,
        options: [
          { ico: "😢", label: L("Sad or left out", "傷心或被留下"), ok: true, feedback: L("Yes. You feel happy. Your friend may feel sad. Feelings can be different.", "對。你開心。朋友可能傷心。感覺可以不一樣。") },
          { ico: "😄", label: L("The same happy as you", "和你一樣開心"), ok: false, feedback: L("You are happy. Your friend might not feel the same.", "你開心。朋友未必一樣。") },
          { ico: "😴", label: L("Sleepy", "困"), ok: false, feedback: L("Think about what your friend wanted.", "想想朋友想要什麼。") },
        ],
      },
      {
        prompt: L("Leo is facing the window. Behind him, Mia is crying. Does Leo know Mia is sad?", "利奧面向窗戶。他背後，米亞在哭。利奧知道米亞傷心嗎？"),
        sceneHtml: `<div class="scene"><div class="emoji">🪟👦   👧😢</div></div>`,
        options: [
          { ico: "🚫", label: L("No, he cannot see her", "不知道，他看不見她"), ok: true, feedback: L("Yes. We know things we can see or hear. He cannot see her.", "對。我們知道能看見或聽見的事。他看不見她。") },
          { ico: "✅", label: L("Yes, he must know", "知道，他一定知道"), ok: false, feedback: L("He is looking the other way, so he may not know.", "他望着另一邊，所以可能不知道。") },
          { ico: "🎂", label: L("He thinks it is a party", "他以為在開派對"), ok: false, feedback: L("He simply cannot see Mia.", "他只是看不見米亞。") },
        ],
      },
    ];
    runQuiz(root, "mind", items, { title: L("Mind Reader", "猜心思"), onHome: hooks.onHome });
  }

  /* ---------------- KIND CHOICES ---------------- */
  function gameKind(root, hooks) {
    const items = [
      {
        prompt: L("A friend has the red truck you want. What is a kind choice?", "朋友拿着你想要的紅卡車。哪個是友善的選擇？"),
        sceneHtml: `<div class="scene"><div class="emoji">🚚</div></div>`,
        options: [
          { ico: "💬", label: L("Can I have a turn when you are done?", "你玩完可以讓我玩嗎？"), ok: true, feedback: L("Words and waiting. That is a strong choice.", "用說話，再等待。這是很棒的選擇。") },
          { ico: "🤏", label: L("Pinch and take it", "捏人然後搶走"), ok: false, feedback: L("Pinching hurts. Hands are not for hurting. Try words.", "捏人會痛。手不是用來傷害人的。試用說話。") },
          { ico: "🏃", label: L("Grab it and run", "搶了就跑"), ok: false, feedback: L("Grabbing pops the fun. Ask for a turn.", "搶走會破壞遊戲。請要求輪流。") },
        ],
      },
      {
        prompt: L("You lost the game. What can you do?", "你輸了遊戲。你可以怎樣做？"),
        sceneHtml: `<div class="scene"><div class="emoji">🎲</div></div>`,
        options: [
          { ico: "🤝", label: L("Good game! Can we play again?", "玩得真好！我們再玩一次？"), ok: true, feedback: L("You can feel sad AND be a good sport.", "你可以覺得傷心，同時做個好選手。") },
          { ico: "🌪️", label: L("Knock the board", "推翻棋盤"), ok: false, feedback: L("The board did not mean to win. Take a breath. Try good game.", "棋盤不是故意贏你。先呼吸。試試說玩得真好。") },
          { ico: "🤏", label: L("Pinch the winner", "捏贏的人"), ok: false, feedback: L("Pinching is not OK. Say the feeling: I feel sad.", "不可以捏人。說出感覺：我覺得傷心。") },
        ],
      },
      {
        prompt: L("Someone bumped you. What helps?", "有人撞到你。怎樣幫忙？"),
        sceneHtml: `<div class="scene"><div class="emoji">💥</div></div>`,
        options: [
          { ico: "💬", label: L("Please be careful. Are you OK?", "請小心一點。你沒事嗎？"), ok: true, feedback: L("Calm words. You looked after both of you.", "平靜的話。你照顧了兩個人。") },
          { ico: "👊", label: L("Push back harder", "推得更大力"), ok: false, feedback: L("Pushing back makes a bigger bump. Use words.", "推回去會撞得更重。用說話。") },
          { ico: "🤏", label: L("Pinch them", "捏他們"), ok: false, feedback: L("Pinching is not a solution. Try please be careful.", "捏人不是辦法。試試請小心一點。") },
        ],
      },
      {
        prompt: L("You have an idea. The teacher is still talking. What do you do?", "你有一個主意。老師還在說話。你會怎樣做？"),
        sceneHtml: `<div class="scene"><img class="big" src="${asset("assets/teacher.jpg")}" alt="" style="width:160px"></div>`,
        options: [
          { ico: "✋", label: L("Hand up. Wait. Then share.", "舉手。等。然後分享。"), ok: true, feedback: L("Listen first. Share at the end. Super waiting.", "先聽。最後才分享。等得很好。") },
          { ico: "📢", label: L("Shout the idea now", "現在就大聲說出來"), ok: false, feedback: L("The idea can wait. Hand up, then share.", "主意可以等。先舉手，再分享。") },
          { ico: "🙊", label: L("Talk to a friend instead", "轉頭和朋友說話"), ok: false, feedback: L("Eyes on the teacher. Your turn will come.", "眼睛看着老師。會輪到你。") },
        ],
      },
      {
        prompt: L("You want it YOUR way and feel stuck. What is a flexible choice?", "你想用自己的方法，覺得卡住了。哪個是靈活的選擇？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧠</div></div>`,
        options: [
          { ico: "💡", label: L("Take a breath. Try a new idea.", "先呼吸。試一個新主意。"), ok: true, feedback: L("New ideas keep the game going.", "新主意讓遊戲繼續。") },
          { ico: "🚫", label: L("I won't play unless it is my way", "不是我的方法就不玩"), ok: false, feedback: L("Rigid thinking gets stuck. Try one new idea.", "死板的想法會卡住。試一個新主意。") },
          { ico: "🤏", label: L("Make them do it your way", "逼別人跟你的方法"), ok: false, feedback: L("Friends have ideas too. Compromise.", "朋友也有主意。一起讓一讓。") },
        ],
      },
      {
        prompt: L("A friend looks sad. What can you do from a little space?", "朋友看起來傷心。你可以在一點空間外怎樣做？"),
        sceneHtml: `<div class="scene"><div class="emoji">🌧️👧</div></div>`,
        options: [
          { ico: "💬", label: L("Are you OK? Do you want to play?", "你還好嗎？想一起玩嗎？"), ok: true, feedback: L("Kind words, and you kept their bubble.", "溫柔的話，也保留了他們的氣泡。") },
          { ico: "🤗", label: L("Hug and kiss until they smile", "抱和親到他們笑"), ok: false, feedback: L("Ask first. At school, words are safer than big hugs.", "先問。在學校，說話比大力擁抱更合適。") },
          { ico: "😂", label: L("Copy a silly noise so they laugh", "發出傻聲音讓他們笑"), ok: false, feedback: L("Silly noises can miss the feeling. Try are you OK?", "傻聲音可能錯過心情。試試你還好嗎？") },
        ],
      },
    ];
    const rules = [
      { ico: "💬", text: L("Use words, not hands that hurt.", "用說話，不用會痛的手。") },
      { ico: "🌬️", text: L("Take a breath when you feel stuck.", "卡住時先呼吸。") },
      { ico: "🤝", text: L("Try a kind new idea.", "試一個友善的新主意。") },
    ];
    rulesGate(root, rules, () =>
      runQuiz(root, "kind", items, { title: L("Kind Choices", "友善選擇"), onHome: hooks.onHome })
    );
  }

  /* ---------------- MANY IDEAS ---------------- */
  function gameIdeas(root, hooks) {
    const puzzles = [
      {
        prompt: L("A cardboard box can be MANY things. Pick 3 different ideas.", "紙皮箱可以變成很多東西。選 3 個不同的主意。"),
        ideas: [
          { ico: "🚗", label: L("a car", "一輛車"), cat: "v" },
          { ico: "🏠", label: L("a house", "一間屋"), cat: "h" },
          { ico: "📺", label: L("a TV", "電視"), cat: "m" },
          { ico: "🚀", label: L("a rocket", "火箭"), cat: "r" },
          { ico: "🐢", label: L("a turtle shell", "烏龜殼"), cat: "a" },
          { ico: "🎭", label: L("a puppet theatre", "木偶戲台"), cat: "p" },
        ],
      },
      {
        prompt: L("Draw a house — but not the same house every time. Pick 3 different homes.", "畫一間屋——但不要每次都一樣。選 3 種不同的家。"),
        ideas: [
          { ico: "🏠", label: L("a city house", "城市的屋"), cat: "c" },
          { ico: "⛺️", label: L("a tent", "帳篷"), cat: "t" },
          { ico: "⛵️", label: L("a houseboat", "船屋"), cat: "b" },
          { ico: "🌳", label: L("a treehouse", "樹屋"), cat: "tr" },
          { ico: "🏰", label: L("a castle", "城堡"), cat: "k" },
          { ico: "🧊", label: L("an igloo", "冰屋"), cat: "i" },
        ],
      },
      {
        prompt: L("Pretend play: who could you BE? Pick 3 different roles.", "扮演遊戲：你可以變成誰？選 3 個不同角色。"),
        ideas: [
          { ico: "👩‍⚕️", label: L("a doctor", "醫生"), cat: "d" },
          { ico: "👨‍🍳", label: L("a chef", "廚師"), cat: "c" },
          { ico: "🧑‍🚀", label: L("an astronaut", "太空人"), cat: "a" },
          { ico: "🦖", label: L("a dinosaur", "恐龍"), cat: "di" },
          { ico: "🚌", label: L("a bus driver", "巴士司機"), cat: "b" },
          { ico: "🧑‍🏫", label: L("a teacher", "老師"), cat: "t" },
        ],
      },
    ];
    let p = 0;
    let correct = 0;
    const total = puzzles.length;

    function show() {
      const z = puzzles[p];
      const picked = [];
      root.innerHTML = `
        ${headBar(total, p, z.prompt)}
        <div class="idea-grid" id="ig"></div>
        <div class="pips" id="count" aria-hidden="true">${"⚪".repeat(3)}</div>
        <div id="fb" class="fb-emoji"></div>
        <div class="actions" style="justify-content:center">
          <button class="pic" id="next" disabled aria-label="next"><span class="pic-ico">✅</span></button>
        </div>`;
      speak(z.prompt);
      root.querySelector("#replay").onclick = () => speak(z.prompt);
      const ig = root.querySelector("#ig");
      z.ideas.forEach((idea) => {
        const b = el(`<button class="idea"><div class="ico">${idea.ico}</div></button>`);
        b.onclick = () => {
          if (picked.find((x) => x.cat === idea.cat)) {
            speak(L("You already picked that kind of idea. Try a NEW one.", "你已經選過這一類。試一個新的。"));
            root.querySelector("#fb").innerHTML = `<span>🔄</span>`;
            return;
          }
          if (picked.length >= 3) return;
          picked.push(idea);
          b.classList.add("on");
          root.querySelector("#count").textContent = "🔵".repeat(picked.length) + "⚪".repeat(3 - picked.length);
          speak(idea.label);
          if (picked.length === 3) {
            correct += 1;
            root.querySelector("#next").disabled = false;
            root.querySelector("#fb").innerHTML = `<span>🎉</span>`;
          }
        };
        ig.appendChild(b);
      });
      root.querySelector("#next").onclick = () => {
        p += 1;
        if (p >= total) finishScreen(root, "ideas", correct, total, hooks.onHome, () => gameIdeas(root, hooks));
        else show();
      };
    }
    show();
  }

  /* ---------------- SCHOOL READY ---------------- */
  function gameSchool(root, hooks) {
    const items = [
      {
        prompt: L("Carpet time. The teacher is talking. What do you do?", "地毯時間。老師正在說話。你會怎樣做？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧘‍♂️👂</div></div>`,
        options: [
          { ico: "👀", label: L("Sit, eyes on teacher, wait", "坐好，看着老師，等"), ok: true, feedback: L("Ready body. Ready ears.", "準備好的身體。準備好的耳朵。") },
          { ico: "🏃", label: L("Walk around the room", "在房間走來走去"), ok: false, feedback: L("Carpet time means sit and listen.", "地毯時間是坐下聽。") },
          { ico: "📢", label: L("Tell your idea right now", "現在就說出主意"), ok: false, feedback: L("Hand up. Wait. Then share.", "舉手。等。然後分享。") },
        ],
      },
      {
        prompt: L("You need the toilet during class. What do you do?", "上課時要上廁所。你會怎樣做？"),
        sceneHtml: `<div class="scene"><div class="emoji">🚻</div></div>`,
        options: [
          { ico: "✋", label: L("Hand up: May I go to the toilet?", "舉手：我可以去廁所嗎？"), ok: true, feedback: L("Ask, then go. Grown-ups can help.", "先問，然後去。大人可以幫忙。") },
          { ico: "🚪", label: L("Just leave", "直接離開"), ok: false, feedback: L("In primary school we ask first.", "小學要先問。") },
          { ico: "😶", label: L("Wait until it hurts", "忍到不舒服"), ok: false, feedback: L("Ask as soon as you need to. That is OK.", "需要就問。沒問題。") },
        ],
      },
      {
        prompt: L("Recess. Kids are playing a running game. How do you join?", "小息。小朋友在玩跑步遊戲。你怎樣加入？"),
        sceneHtml: `<div class="scene"><div class="emoji">🏃‍♀️🏃</div></div>`,
        options: [
          { ico: "💬", label: L("Can I play? What is the rule?", "我可以玩嗎？規則是什麼？"), ok: true, feedback: L("Ask, then follow the rule. Super joining.", "先問，再跟規則。加入得很好。") },
          { ico: "🌪️", label: L("Run through and make silly sounds", "衝進去並發出傻聲音"), ok: false, feedback: L("Silly running without rules misses the game. Ask to join.", "沒有規則的傻跑會錯過遊戲。請要求加入。") },
          { ico: "🛑", label: L("Grab the ball and keep it", "搶球自己拿着"), ok: false, feedback: L("The ball belongs to the game. Ask for a turn.", "球屬於遊戲。請要求輪流。") },
        ],
      },
      {
        prompt: L("You do not know where to put your bag. What helps?", "你不知道書包放哪裡。怎樣幫忙？"),
        sceneHtml: `<div class="scene"><div class="emoji">🎒</div></div>`,
        options: [
          { ico: "🙋", label: L("Ask the teacher: where does my bag go?", "問老師：書包放哪裡？"), ok: true, feedback: L("Asking is a smart school skill.", "發問是很棒的學校技能。") },
          { ico: "📦", label: L("Throw it on the floor", "扔在地上"), ok: false, feedback: L("Bags have a home. Ask where.", "書包有位置。問問在哪。") },
          { ico: "😢", label: L("Hide and wait", "躲起來等"), ok: false, feedback: L("Teachers like questions. Ask.", "老師喜歡你發問。問問。") },
        ],
      },
      {
        prompt: L("Lunch. What is the plan?", "午餐。計劃是什麼？"),
        sceneHtml: `<div class="scene"><div class="emoji">🍱</div></div>`,
        options: [
          { ico: "1️⃣", label: L("Sit, open box, eat, pack away", "坐下、打開、吃、收拾"), ok: true, feedback: L("Four steps. You can remember them.", "四個步驟。你記得住。") },
          { ico: "🏃", label: L("Eat while running", "邊跑邊吃"), ok: false, feedback: L("Sit to eat. Then play.", "坐下吃。然後才玩。") },
          { ico: "🎭", label: L("Play with the food as toys", "把食物當玩具"), ok: false, feedback: L("Food is for eating. Toys are for play.", "食物是用來吃的。玩具才用來玩。") },
        ],
      },
      {
        prompt: L("You want a crayon someone else is using. School way?", "你想要別人正在用的蠟筆。學校的做法是？"),
        sceneHtml: `<div class="scene"><div class="emoji">🖍️</div></div>`,
        options: [
          { ico: "⏳", label: L("Please can I use it when you finish?", "你用完可以給我嗎？"), ok: true, feedback: L("Waiting words. Primary school ready.", "等待的說話。準備好上小學。") },
          { ico: "🤏", label: L("Take it from their hand", "從他們手裡拿走"), ok: false, feedback: L("Ask and wait. Do not grab.", "先問再等。不要搶。") },
          { ico: "😭", label: L("Cry until they give it", "哭到他們給你"), ok: false, feedback: L("Feelings are OK. Still use words and wait.", "有感覺沒問題。還是要用說話和等待。") },
        ],
      },
    ];
    const rules = [
      { ico: "👂", text: L("Listen first.", "先聽。") },
      { ico: "🫧", text: L("Keep your space bubble.", "保持你的小小氣泡。") },
      { ico: "💬", text: L("Use kind words and ask for help.", "用友善的話，並請求幫忙。") },
    ];
    rulesGate(root, rules, () =>
      runQuiz(root, "school", items, { title: L("School Ready", "小學準備"), onHome: hooks.onHome })
    );
  }

  /* ---------------- FOLLOW THE STEPS ---------------- */
  function gameSteps(root, hooks) {
    const T = timers();
    root._cleanup = T.clear;
    const seqs = [
      {
        title: L("Write your name", "寫名字"),
        steps: [
          { ico: "📄", label: L("Get paper", "拿紙") },
          { ico: "✏️", label: L("Pick up pencil", "拿起鉛筆") },
          { ico: "⭐", label: L("Start at the top", "從上面開始") },
          { ico: "🔤", label: L("Write your name", "寫你的名字") },
        ],
      },
      {
        title: L("Morning at school", "早上到學校"),
        steps: [
          { ico: "🎒", label: L("Hang your bag", "掛書包") },
          { ico: "🪑", label: L("Sit on the carpet", "坐在地毯上") },
          { ico: "👀", label: L("Eyes on the teacher", "看着老師") },
        ],
      },
      {
        title: L("Art time", "美勞時間"),
        steps: [
          { ico: "👕", label: L("Put on a smock", "穿上圍裙") },
          { ico: "🖍️", label: L("Get a crayon", "拿蠟筆") },
          { ico: "🌞", label: L("Draw the picture", "畫畫") },
          { ico: "📦", label: L("Put the crayon back", "把蠟筆放回去") },
        ],
      },
      {
        title: L("A turn-taking game", "輪流遊戲"),
        steps: [
          { ico: "📜", label: L("Say the rules", "說出規則") },
          { ico: "⏳", label: L("Wait for your turn", "等輪到你") },
          { ico: "🎲", label: L("Take your turn", "輪到你就玩") },
          { ico: "🎁", label: L("Pass the toy on", "把玩具傳下去") },
        ],
      },
    ];
    let i = 0;
    let correct = 0;
    const total = seqs.length;

    function showWatch() {
      T.clear();
      const s = seqs[i];
      root.innerHTML = `
        ${headBar(total, i, L("Watch.", "看。"))}
        <div class="steps" id="st"></div>
        <div class="light">👀</div>`;
      speak(L(`Watch the steps for ${s.title}.`, `看着「${s.title}」的步驟。`));
      root.querySelector("#replay").onclick = () => speak(L("Watch.", "看。"));
      s.steps.forEach((st, idx) => {
        T.later(() => {
          const card = el(`<div class="step-card"><div class="n">${idx + 1}</div><div class="ico">${st.ico}</div></div>`);
          root.querySelector("#st").appendChild(card);
          speak(`${idx + 1}. ${st.label}`);
        }, 700 + idx * 1100);
      });
      T.later(showBuild, 700 + s.steps.length * 1100 + 700);
    }

    function showBuild() {
      const s = seqs[i];
      const built = [];
      const bank = shuffle(s.steps.map((st, idx) => Object.assign({ idx }, st)));
      root.innerHTML = `
        ${headBar(total, i, L("Put the pictures in order.", "把圖排好次序。"))}
        <div class="steps" id="built"></div>
        <div class="pics" id="bank"></div>
        <div id="fb" class="fb-emoji"></div>`;
      speak(L("Now put the steps in order.", "現在把步驟排好次序。"));
      root.querySelector("#replay").onclick = () => speak(L("Put the pictures in order.", "把圖排好次序。"));
      const bankEl = root.querySelector("#bank");
      bank.forEach((st) => {
        const b = picEl({ ico: st.ico, label: st.label });
        b.onclick = () => {
          const need = built.length;
          if (st.idx === need) {
            built.push(st);
            b.disabled = true;
            b.classList.add("good");
            root.querySelector("#built").appendChild(
              el(`<div class="step-card"><div class="n">${built.length}</div><div class="ico">${st.ico}</div></div>`)
            );
            speak(st.label);
            if (built.length === s.steps.length) {
              correct += 1;
              root.querySelector("#fb").innerHTML = `<span>🎉</span>
                <div class="actions" style="justify-content:center"><button class="pic" id="go" aria-label="next"><span class="pic-ico">▶️</span></button></div>`;
              root.querySelector("#go").onclick = next;
            }
          } else {
            b.classList.add("bad");
            speak(L("Not yet. What comes first?", "還不是。哪一步先來？"));
            T.later(() => b.classList.remove("bad"), 700);
          }
        };
        bankEl.appendChild(b);
      });
    }
    function next() {
      i += 1;
      if (i >= total) finishScreen(root, "steps", correct, total, hooks.onHome, () => gameSteps(root, hooks));
      else showWatch();
    }
    showWatch();
  }

  /* ---------------- SOUND SUPERSTAR ---------------- */
  function gameSounds(root, hooks) {
    const items = [
      {
        prompt: L("Which one RHYMES with cat?", "哪一個和 cat 押韻？"),
        sceneHtml: `<div class="scene"><div class="emoji">🐱</div></div>`,
        options: [
          { ico: "🎩", label: "hat", ok: true, feedback: L("Cat, hat. Same ending. Rhyme!", "cat、hat。結尾一樣。押韻！") },
          { ico: "☀️", label: "sun", ok: false, feedback: L("Sun does not sound like cat. Try hat.", "sun 的聲音不像 cat。試試 hat。") },
          { ico: "👟", label: "shoe", ok: false, feedback: L("Listen for the -at ending.", "聽 -at 的結尾。") },
        ],
      },
      {
        prompt: L("Which one rhymes with dog?", "哪一個和 dog 押韻？"),
        sceneHtml: `<div class="scene"><div class="emoji">🐶</div></div>`,
        options: [
          { ico: "🪵", label: "log", ok: true, feedback: L("Dog, log. Yes!", "dog、log。對！") },
          { ico: "🖊️", label: "pen", ok: false, feedback: L("Pen does not rhyme with dog.", "pen 不和 dog 押韻。") },
          { ico: "🚗", label: "car", ok: false, feedback: L("Listen for the -og ending.", "聽 -og 的結尾。") },
        ],
      },
      {
        prompt: L("SUN starts with which sound?", "SUN 的第一個音是？"),
        sceneHtml: `<div class="scene"><div class="emoji">☀️</div></div>`,
        options: [
          { ico: "S", label: "sss", ok: true, feedback: L("Sssun. Sss is the first sound.", "Sssun。第一個音是 sss。") },
          { ico: "M", label: "mmm", ok: false, feedback: L("Mmm is for mop. Sun is sss.", "mmm 是 mop。sun 是 sss。") },
          { ico: "B", label: "buh", ok: false, feedback: L("Buh is for bus. Sun is sss.", "buh 是 bus。sun 是 sss。") },
        ],
      },
      {
        prompt: L("MOP starts with which sound?", "MOP 的第一個音是？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧹</div></div>`,
        options: [
          { ico: "M", label: "mmm", ok: true, feedback: L("Mmmop. Yes!", "Mmmop。對！") },
          { ico: "S", label: "sss", ok: false, feedback: L("Sss is for sun.", "sss 是 sun。") },
          { ico: "T", label: "tuh", ok: false, feedback: L("Tuh is for top. Mop is mmm.", "tuh 是 top。mop 是 mmm。") },
        ],
      },
      {
        prompt: L("Blend the sounds: c - a - t. What word?", "把聲音連起來：c - a - t。是什麼字？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧩</div></div>`,
        options: [
          { ico: "🐱", label: "cat", ok: true, feedback: L("C-a-t, cat. Super blending.", "C-a-t，cat。拼得很棒。") },
          { ico: "🧢", label: "cap", ok: false, feedback: L("Cap would be c-a-p. This is c-a-t.", "cap 是 c-a-p。這是 c-a-t。") },
          { ico: "🐶", label: "dog", ok: false, feedback: L("Listen again: c… a… t.", "再聽：c… a… t。") },
        ],
      },
      {
        prompt: L("Blend: s - u - n. What word?", "連起來：s - u - n。是什麼字？"),
        sceneHtml: `<div class="scene"><div class="emoji">🧩</div></div>`,
        options: [
          { ico: "☀️", label: "sun", ok: true, feedback: L("S-u-n, sun!", "S-u-n，sun！") },
          { ico: "👟", label: "sock", ok: false, feedback: L("Sock has more sounds. This is sun.", "sock 有更多音。這是 sun。") },
          { ico: "🚌", label: "bus", ok: false, feedback: L("Bus is b-u-s. We said s-u-n.", "bus 是 b-u-s。我們說的是 s-u-n。") },
        ],
      },
      {
        prompt: L("How many claps in ba-na-na?", "ba-na-na 有幾下拍子？"),
        sceneHtml: `<div class="scene"><div class="emoji">🍌👏</div></div>`,
        options: [
          { ico: "3️⃣", label: L("3 claps", "3 下"), ok: true, feedback: L("Ba-na-na. Three parts.", "Ba-na-na。三部分。") },
          { ico: "1️⃣", label: L("1 clap", "1 下"), ok: false, feedback: L("Try clapping each bit: ba, na, na.", "試每部分拍一下：ba、na、na。") },
          { ico: "2️⃣", label: L("2 claps", "2 下"), ok: false, feedback: L("Almost. Banana has three beats.", "差一點。banana 有三拍。") },
        ],
      },
      {
        prompt: L("How many claps in Yan-nick?", "Yan-nick 有幾下拍子？"),
        sceneHtml: `<div class="scene"><div class="emoji">⭐👏</div></div>`,
        options: [
          { ico: "2️⃣", label: L("2 claps", "2 下"), ok: true, feedback: L("Yan-nick. Two claps. That is your name!", "Yan-nick。兩下。那是你的名字！") },
          { ico: "1️⃣", label: L("1 clap", "1 下"), ok: false, feedback: L("Yan… nick. Two parts.", "Yan……nick。兩部分。") },
          { ico: "4️⃣", label: L("4 claps", "4 下"), ok: false, feedback: L("Just two: Yan-nick.", "只有兩下：Yan-nick。") },
        ],
      },
    ];
    runQuiz(root, "sounds", items, { title: L("Sound Superstar", "聲音小明星"), onHome: hooks.onHome });
  }

  /* ---------------- SUPER SENTENCES ---------------- */
  function gameSent(root, hooks) {
    const items = [
      {
        prompt: L("Who said it the right way? Listen.", "誰說得對？聽一聽。"),
        sceneHtml: `<div class="scene"><div class="emoji">🧸🌙</div></div>`,
        options: [
          { img: asset("assets/friend-mia.jpg"), say: "Yesterday I bought a toy.", ok: true, feedback: L("Oh! Yesterday you BOUGHT a new toy.", "哦！昨天你 bought 了一件新玩具。") },
          { img: asset("assets/friend-leo.jpg"), say: "Yesterday I buyed a toy.", ok: false, feedback: L("We say bought, not buyed.", "我們說 bought，不是 buyed。") },
        ],
      },
      {
        prompt: L("Who said it the right way? Listen.", "誰說得對？聽一聽。"),
        sceneHtml: `<div class="scene"><div class="emoji">🏃</div></div>`,
        options: [
          { img: asset("assets/friend-mia.jpg"), say: "He ran fast.", ok: true, feedback: L("He RAN fast. Yes.", "He RAN fast。對。") },
          { img: asset("assets/friend-leo.jpg"), say: "He runned fast.", ok: false, feedback: L("We say ran, not runned.", "我們說 ran，不是 runned。") },
        ],
      },
      {
        prompt: L("I wear a coat because…", "I wear a coat because…"),
        sceneHtml: `<div class="scene"><div class="emoji">🧥</div></div>`,
        options: [
          { ico: "❄️", label: L("it is cold", "天氣冷"), ok: true, feedback: L("Because tells WHY. It is cold.", "because 說明原因。天氣冷。") },
          { ico: "🐸", label: L("frogs can jump", "青蛙會跳"), ok: false, feedback: L("That is not why we wear a coat.", "那不是穿大衣的原因。") },
          { ico: "🎨", label: L("the coat is a dinosaur", "大衣是恐龍"), ok: false, feedback: L("Because needs a real reason.", "because 需要真正的原因。") },
        ],
      },
      {
        prompt: L("If it rains…", "If it rains…"),
        sceneHtml: `<div class="scene"><div class="emoji">🌧️</div></div>`,
        options: [
          { ico: "☂️", label: L("we use an umbrella", "我們用雨傘"), ok: true, feedback: L("If… then. That is a smart sentence.", "如果……就。這是聰明的句子。") },
          { ico: "🍦", label: L("we eat ice cream in the sun", "我們在太陽下吃雪糕"), ok: false, feedback: L("If it rains, the sun plan does not fit.", "如果下雨，太陽計劃就不合適。") },
          { ico: "🚀", label: L("the moon turns into cheese", "月亮變成芝士"), ok: false, feedback: L("Make a real if-then.", "做一個真實的如果……就。") },
        ],
      },
      {
        prompt: L("Point to the HANDLE of the cup.", "指出杯子的「手柄」。"),
        sceneHtml: `<div class="scene"><div class="emoji">☕️</div></div>`,
        options: [
          { ico: "👉", label: L("The side loop you hold", "旁邊給手拿的圈"), ok: true, feedback: L("Handle. A precise word. Super vocabulary.", "Handle。精確的詞。詞彙很棒。") },
          { ico: "⬇️", label: L("The bottom sitting on the table", "放在桌上的底部"), ok: false, feedback: L("That is the base. The handle is the loop.", "那是底部。手柄是那個圈。") },
          { ico: "🌊", label: L("The tea inside", "裡面的茶"), ok: false, feedback: L("That is the drink. Handle is the holding part.", "那是飲料。手柄是拿着的部分。") },
        ],
      },
      {
        prompt: L("Point to the PEDAL on a bike.", "指出單車的「踏板」。"),
        sceneHtml: `<div class="scene"><div class="emoji">🚲</div></div>`,
        options: [
          { ico: "🦶", label: L("Where your feet push", "腳踏的地方"), ok: true, feedback: L("Pedals. Precise parts!", "Pedals。精確的部分！") },
          { ico: "⭕", label: L("The round wheels", "圓圓的輪"), ok: false, feedback: L("Wheels roll. Pedals are for feet.", "輪子會轉。踏板是給腳的。") },
          { ico: "✋", label: L("The handlebars", "車把"), ok: false, feedback: L("Handlebars are for hands. Pedals are for feet.", "車把給手。踏板給腳。") },
        ],
      },
      {
        prompt: L("The child is hopping. Pick the precise verb.", "小朋友在單腳跳。選精確的動詞。"),
        sceneHtml: `<div class="scene"><div class="emoji">🐰</div></div>`,
        options: [
          { ico: "🐰", label: L("hop", "hop 單腳跳"), ok: true, feedback: L("Hop is the precise verb. Not just jump.", "hop 是精確的動詞。不只是 jump。") },
          { ico: "😴", label: L("sleep", "sleep 睡覺"), ok: false, feedback: L("Sleeping is still. This is hopping.", "睡覺是靜的。這是單腳跳。") },
          { ico: "🪑", label: L("sit", "sit 坐"), ok: false, feedback: L("Sitting stays on the chair. Hopping bounces.", "坐在椅上。hop 會彈。") },
        ],
      },
      {
        prompt: L("She is pouring water. Precise verb?", "她正在倒水。精確動詞？"),
        sceneHtml: `<div class="scene"><div class="emoji">🫗</div></div>`,
        options: [
          { ico: "🫗", label: L("pour", "pour 倒"), ok: true, feedback: L("Pour, not just put. Precise!", "pour，不只是 put。精確！") },
          { ico: "🙈", label: L("hide", "hide 藏"), ok: false, feedback: L("Hiding covers. Pouring lets liquid out.", "藏是蓋住。倒是讓液體出來。") },
          { ico: "🤾", label: L("throw", "throw 扔"), ok: false, feedback: L("Throwing is a toss. Pouring is a gentle tip.", "扔是拋。倒是輕輕傾斜。") },
        ],
      },
    ];
    runQuiz(root, "sent", items, { title: L("Super Sentences", "超級句子"), onHome: hooks.onHome });
  }

  /* ---------------- START AT THE TOP (handwriting) ---------------- */
  function gameLetters(root, hooks) {
    const glyphs = [
      { ch: "L", sx: 0.38, tip: L("Start at the star on top. Down, then across.", "從上面的星星開始。先向下，再橫過。") },
      { ch: "T", sx: 0.34, tip: L("Start at the star on top. Across, then down the middle.", "從上面的星星開始。先橫，再從中間向下。") },
      { ch: "I", sx: 0.5, tip: L("Start at the star on top. Straight down.", "從上面的星星開始。一直向下。") },
      { ch: "Y", sx: 0.36, tip: L("Start at the star on top. Slide in, then down.", "從上面的星星開始。向內斜，再向下。") },
      { ch: "A", sx: 0.5, tip: L("Start at the star on top. Down one side, down the other, then across.", "從上面的星星開始。一邊向下，另一邊向下，再橫過。") },
      { ch: "N", sx: 0.36, tip: L("Start at the star on top. Down, slide, down.", "從上面的星星開始。向下、斜過、再向下。") },
      { ch: "C", sx: 0.62, tip: L("Start near the top. Curve around like a moon.", "靠近上面開始。像月亮一樣彎。") },
      { ch: "K", sx: 0.38, tip: L("Start at the star on top. Down, then two kicks.", "從上面的星星開始。向下，再兩個斜踢。") },
    ];
    const set = pick(glyphs, 6);
    let i = 0;
    let correct = 0;
    const total = set.length;

    function show() {
      const g = set[i];
      root.innerHTML = `
        ${headBar(total, i, g.tip)}
        <div class="trace-wrap">
          <canvas id="trace" width="520" height="360"></canvas>
          <div class="pics" style="grid-template-columns:1fr 1fr;max-width:240px">
            <button class="pic" id="clear" aria-label="wipe"><span class="pic-ico">🧹</span></button>
            <button class="pic" id="done" disabled aria-label="done"><span class="pic-ico">✅</span></button>
          </div>
          <div id="fb" class="fb-emoji"></div>
        </div>`;
      root.querySelector("#replay").onclick = () => speak(g.tip);
      speak(g.tip);
      const canvas = root.querySelector("#trace");
      const ctx = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;
      const star = { x: W * (g.sx || 0.5), y: 70 };
      let drawing = false;
      let startedOk = false;
      let dist = 0;
      let last = null;

      function guide() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#fffdf8";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#e8dfd4";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(40, 78);
        ctx.lineTo(W - 40, 78);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(27,54,93,0.12)";
        ctx.font = "260px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(g.ch, W / 2, H / 2 + 20);
        ctx.fillStyle = "#f4b400";
        ctx.beginPath();
        ctx.arc(star.x, star.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "18px Fredoka, sans-serif";
        ctx.fillText("★", star.x, star.y + 1);
        /* star only — no words */
      }
      guide();

      function pos(ev) {
        const r = canvas.getBoundingClientRect();
        const x = ((ev.clientX || (ev.touches && ev.touches[0].clientX)) - r.left) * (W / r.width);
        const y = ((ev.clientY || (ev.touches && ev.touches[0].clientY)) - r.top) * (H / r.height);
        return { x, y };
      }
      function nearStar(p) {
        const dx = p.x - star.x;
        const dy = p.y - star.y;
        return dx * dx + dy * dy < 38 * 38;
      }
      function down(ev) {
        ev.preventDefault();
        const p = pos(ev);
        if (!nearStar(p)) {
          speak(L("Start at the star on top!", "從上面的星星開始！"));
          const fb = root.querySelector("#fb");
          fb.innerHTML = `<span>⭐</span>`;
          return;
        }
        startedOk = true;
        drawing = true;
        last = p;
        root.querySelector("#fb").innerHTML = "";
      }
      function move(ev) {
        if (!drawing) return;
        ev.preventDefault();
        const p = pos(ev);
        ctx.strokeStyle = "#1aa6a6";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        dist += Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
        if (startedOk && dist > 90) root.querySelector("#done").disabled = false;
      }
      function up() {
        drawing = false;
      }
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointerleave", up);
      canvas.addEventListener("pointercancel", up);
      root._cleanup = () => {
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointerleave", up);
        canvas.removeEventListener("pointercancel", up);
      };
      root.querySelector("#clear").onclick = () => {
        startedOk = false;
        dist = 0;
        root.querySelector("#done").disabled = true;
        guide();
      };
      root.querySelector("#done").onclick = () => {
        if (!startedOk) return;
        correct += 1;
        speak(L("You started at the top. Beautiful letter!", "你從上面開始。字母很美！"));
        i += 1;
        if (i >= total) finishScreen(root, "letters", correct, total, hooks.onHome, () => gameLetters(root, hooks));
        else show();
      };
    }
    show();
  }

  /* ---------------- GUESS WHAT (describe) ---------------- */
  function gameGuess(root, hooks) {
    const items = [
      { clues: [L("It is yellow.", "它是黃色的。"), L("We can eat it.", "我們可以吃。"), L("Monkeys like it.", "猴子喜歡它。")], answer: "🍌", labels: ["🍌 banana", "🚗 car", "👟 shoe", "⚽ ball"] },
      { clues: [L("It has two wheels.", "它有兩個輪。"), L("You sit on it.", "你可以坐上去。"), L("Your feet push the pedals.", "腳踏踏板。")], answer: "🚲", labels: ["🚲 bike", "🚌 bus", "✈️ plane", "🛴 scooter"] },
      { clues: [L("It is round.", "它是圓的。"), L("We throw and catch it.", "我們扔和接。"), L("We kick it in football.", "踢足球時會踢它。")], answer: "⚽", labels: ["⚽ ball", "📕 book", "🍎 apple", "🧸 teddy"] },
      { clues: [L("It has a handle.", "它有手柄。"), L("It holds a drink.", "它裝飲料。"), L("We sip from it.", "我們用它喝。")], answer: "☕️", labels: ["☕️ cup", "🍴 fork", "🔑 key", "📱 phone"] },
      { clues: [L("It has pages.", "它有頁。"), L("We read it.", "我們閱讀它。"), L("A story lives inside.", "裡面有故事。")], answer: "📖", labels: ["📖 book", "🖍️ crayon", "🧩 puzzle", "🎁 gift"] },
    ];
    let i = 0;
    let correct = 0;
    let clueN = 1;
    const total = items.length;

    function show() {
      const z = items[i];
      clueN = 1;
      draw();
      function draw() {
        root.innerHTML = `
          ${headBar(total, i, z.clues.slice(0, clueN).join(" "))}
          <div class="light">${"👂".repeat(clueN)}</div>
          <div class="pics" id="ch"></div>
          <div class="actions" style="justify-content:center">
            <button class="pic" id="more" ${clueN >= 3 ? "disabled" : ""} aria-label="more clue"><span class="pic-ico">➕</span></button>
          </div>
          <div id="fb" class="fb-emoji"></div>`;
        speak(z.clues[clueN - 1]);
        root.querySelector("#replay").onclick = () => speak(z.clues.slice(0, clueN).join(" "));
        shuffle(z.labels).forEach((lab) => {
          const ico = lab.split(" ")[0];
          const b = picEl({ ico, label: lab });
          b.onclick = () => {
            if (ico === z.answer) {
              correct += 1;
              b.classList.add("good");
              speak(L("Yes!", "對！"));
              root.querySelector("#fb").innerHTML = `<span>🎉</span>
                <div class="actions" style="justify-content:center"><button class="pic" id="go" aria-label="next"><span class="pic-ico">▶️</span></button></div>`;
              root.querySelector("#go").onclick = () => {
                i += 1;
                if (i >= total) finishScreen(root, "guess", correct, total, hooks.onHome, () => gameGuess(root, hooks));
                else show();
              };
            } else {
              b.classList.add("bad");
              b.disabled = true;
              speak(L("Not that one. Hear another clue.", "不是那個。再聽一個線索。"));
            }
          };
          root.querySelector("#ch").appendChild(b);
        });
        root.querySelector("#more").onclick = () => {
          if (clueN < 3) {
            clueN += 1;
            draw();
          }
        };
      }
    }
    show();
  }

  /* ---------------- BODY BREAK ---------------- */
  function gameMove(root, hooks) {
    const T = timers();
    root._cleanup = T.clear;
    const moves = [
      { ico: "🐸", name: L("Frog jumps", "青蛙跳"), say: L("Jump like a frog!", "像青蛙一樣跳！"), secs: 10 },
      { ico: "🧱", name: L("Wall push", "推牆"), say: L("Push the wall with both hands. Strong shoulders!", "用兩隻手推牆。肩膀用力！"), secs: 10 },
      { ico: "🐻", name: L("Bear walk", "小熊走"), say: L("Hands and feet on the floor. Walk like a bear.", "手和腳在地上。像小熊走路。"), secs: 10 },
      { ico: "🦸", name: L("Superman", "超人式"), say: L("Lie on your tummy and fly. Hold your arms and legs up.", "趴着飛。手和腳抬起來。"), secs: 8 },
    ];
    let i = 0;
    function show() {
      T.clear();
      const m = moves[i];
      let left = m.secs;
      root.innerHTML = `
        ${headBar(moves.length, i, m.say)}
        <div class="move-card">
          <div class="ico">${m.ico}</div>
          <div class="move-timer" id="tm">${left}</div>
        </div>`;
      speak(m.say);
      root.querySelector("#replay").onclick = () => speak(m.say);
      const tick = () => {
        left -= 1;
        const eltm = root.querySelector("#tm");
        if (eltm) eltm.textContent = Math.max(0, left);
        if (left <= 0) {
          i += 1;
          if (i >= moves.length) {
            speak(L("Body is ready. Eyes, hands, go.", "身體準備好了。眼睛、手，出發。"));
            finishScreen(root, "move", moves.length, moves.length, hooks.onHome, () => gameMove(root, hooks));
          } else show();
        } else T.later(tick, 1000);
      };
      T.later(tick, 1000);
    }
    show();
  }

  w.GAME_LIST = [
    {
      id: "wait",
      cat: "social",
      img: "assets/illust/turntaking.jpg",
      title: () => L("Wait, Then Share", "等一等，然後分享"),
      blurb: () => L("Listen first. Wait. Then share your idea.", "先聽，再等，然後才分享。"),
      report: () =>
        L(
          "SEN: turn-taking, waiting, not interrupting. Rec. 3 & 7: recall rules first.",
          "SEN：輪流、等待、不插嘴。建議 3 及 7：先回想規則。"
        ),
      run: gameWait,
    },
    {
      id: "bubble",
      cat: "social",
      img: "assets/illust/space.jpg",
      title: () => L("My Space Bubble", "小小氣泡"),
      blurb: () => L("Wave at school. Hug at home. Keep a little gap.", "學校揮手。家裡擁抱。留一點空隙。"),
      report: () =>
        L(
          "SEN: personal space, school-OK greetings, generalising boundaries.",
          "SEN：個人空間、學校合適的打招呼、把界線類化。"
        ),
      run: gameBubble,
    },
    {
      id: "feel",
      cat: "feel",
      img: "assets/illust/emotions.jpg",
      title: () => L("Feeling Finder", "心情探險"),
      blurb: () => L("Name happy, sad… then worried, nervous, embarrassed, frustrated.", "認識開心、傷心……再學擔心、緊張、尷尬、沮喪。"),
      report: () =>
        L(
          "SEN rec. 8: complex emotions one or two at a time, with pictures.",
          "SEN 建議 8：一次介紹一至兩種複雜情緒，配圖片。"
        ),
      run: gameFeel,
    },
    {
      id: "mind",
      cat: "feel",
      img: "assets/illust/roleplay.jpg",
      title: () => L("Mind Reader", "猜心思"),
      blurb: () => L("Other people can think and feel differently from you.", "別人可以有和你不一樣的想法和感覺。"),
      report: () =>
        L("SEN rec. 5: introduce Theory of Mind / mind reading.", "SEN 建議 5：引入心智理論／猜心思。"),
      run: gameMind,
    },
    {
      id: "kind",
      cat: "feel",
      img: "assets/illust/social.jpg",
      title: () => L("Kind Choices", "友善選擇"),
      blurb: () => L("Words, not pinching. Breath, then a new idea.", "用說話，不捏人。先呼吸，再想新主意。"),
      report: () =>
        L(
          "SEN rec. 1: conflict resolution, replace impulsive/physical responses.",
          "SEN 建議 1：解決衝突，用建設性方法代替衝動或動手。"
        ),
      run: gameKind,
    },
    {
      id: "ideas",
      cat: "feel",
      img: "assets/illust/team.jpg",
      title: () => L("Many Ideas", "好多主意"),
      blurb: () => L("The same topic can have lots of different ideas.", "同一個主題可以有很多不同主意。"),
      report: () =>
        L(
          "SEN rec. 2: flexible thinking, open-ended ideas, less rigid drawings.",
          "SEN 建議 2：靈活思考、開放題、減少重複的畫。"
        ),
      run: gameIdeas,
    },
    {
      id: "school",
      cat: "social",
      img: "assets/illust/school.jpg",
      title: () => L("School Ready", "小學準備"),
      blurb: () => L("Carpet, lining up, recess, asking the teacher.", "地毯時間、排隊、小息、問老師。"),
      report: () =>
        L("SEN rec. 6: practise primary-school social situations.", "SEN 建議 6：練習小學可能遇到的社交情境。"),
      run: gameSchool,
    },
    {
      id: "steps",
      cat: "hands",
      img: "assets/illust/selfcare.jpg",
      title: () => L("Follow the Steps", "跟著步驟"),
      blurb: () => L("Watch 3–4 steps, then put them in order.", "看 3 至 4 步，然後排好次序。"),
      report: () =>
        L(
          "SEN rec. 2: structured multi-step tasks. Also recalling rules before a game.",
          "SEN 建議 2：有結構的多步驟任務。也練習遊戲前先回想規則。"
        ),
      run: gameSteps,
    },
    {
      id: "sounds",
      cat: "words",
      img: "assets/illust/speech.jpg",
      title: () => L("Sound Superstar", "聲音小明星"),
      blurb: () => L("Rhyme, first sound, blend, clap the beats.", "押韻、第一個音、拼音、拍手節奏。"),
      report: () =>
        L(
          "AEPS H: phonological awareness and emergent reading still beginner.",
          "AEPS H：語音覺識和早期閱讀仍在初學階段。"
        ),
      run: gameSounds,
    },
    {
      id: "sent",
      cat: "words",
      img: "assets/illust/cover.jpg",
      title: () => L("Super Sentences", "超級句子"),
      blurb: () => L("Bought not buyed. Because, if. Handles, pedals, hop, pour.", "bought 不是 buyed。because、if。手柄、踏板、hop、pour。"),
      report: () =>
        L(
          "SLT: grammar recasts, complex sentences, precise verbs and object parts.",
          "言語：文法重述、複雜句、精確動詞和物件部分。"
        ),
      run: gameSent,
    },
    {
      id: "letters",
      cat: "hands",
      img: "assets/illust/finemotor.jpg",
      title: () => L("Start at the Top", "從上面開始"),
      blurb: () => L("Trace letters from the star on top. Left-hand friendly.", "從上面的星星起筆描字母。方便左撇子。"),
      report: () =>
        L(
          "OT: Handwriting Without Tears, start at the top, not the baseline. Left-hand preference.",
          "職能：Handwriting Without Tears，從上面起筆，不要從底線。左利手。"
        ),
      run: gameLetters,
    },
    {
      id: "guess",
      cat: "words",
      img: "assets/illust/home.jpg",
      title: () => L("Guess What", "猜猜看"),
      blurb: () => L("Hear describing clues. Guess the object.", "聽描述線索。猜是什麼。"),
      report: () =>
        L("SLT: guessing games that involve describing; grow vocabulary.", "言語：需要描述的猜謎遊戲；擴充詞彙。"),
      run: gameGuess,
    },
    {
      id: "move",
      cat: "move",
      img: "assets/illust/ot_gym.jpg",
      title: () => L("Body Break", "動一動"),
      blurb: () => L("Frog jumps, wall push, bear walk, Superman. Then table work.", "青蛙跳、推牆、小熊走、超人式。然後再做桌面。"),
      report: () =>
        L(
          "OT: movement / heavy-work breaks between table tasks; wall push, animal walks, anti-gravity.",
          "職能：桌面任務之間加入動作／重工作休息；推牆、動物走、抗地心吸力。"
        ),
      run: gameMove,
    },
  ];
})(window);
