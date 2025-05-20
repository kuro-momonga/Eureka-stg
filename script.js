/* ========== master data ========== */
const FOODS = [
  {name:"マメミート",    img:"img/マメミート.png"},
  {name:"とくせんリンゴ",img:"img/とくせんリンゴ.png"},
  {name:"げきからハーブ",img:"img/げきからハーブ.png"},
  {name:"モーモーミルク",img:"img/モーモーミルク.png"},
  {name:"あまいミツ",    img:"img/あまいミツ.png"},
  {name:"ワカクサ大豆",  img:"img/ワカクサ大豆.png"},
  {name:"ワカクサコーン",img:"img/ワカクサコーン.png"},
  {name:"めざましコーヒー",img:"img/めざましコーヒー.png"}
];

/* 画像プリロード：遅延防止 */
(function preload(){
  FOODS.forEach(f=>{ const im=new Image(); im.src=f.img; });
})();

const YELLOW=[
  "睡眠EXPボーナス","おてつだいボーナス","げんき回復ボーナス",
  "ゆめのかけらボーナス","リサーチEXPボーナス","きのみの数S",
  "スキルレベルアップM"
];
const BLUE=[
  "スキルレベルアップS","最大所持数アップL","最大所持数アップM",
  "おてつだいスピードM","食材確率アップM","スキル確率アップM"
];
const WHITE=[
  "最大所持数アップS","おてつだいスピードS",
  "食材確率アップS","スキル確率アップS"
];
const SKILLS=[...YELLOW,...BLUE,...WHITE];   // 22 種

/* ========== dom ========== */
const seedCountEl   = document.getElementById("seed-count");
const toast         = document.getElementById("toast");
const modal         = document.getElementById("modal");
const slotTabs      = document.getElementById("slot-tabs");
const optionGrid    = document.getElementById("option-grid");
const closeModalBtn = document.getElementById("close-modal");

const foodImgs   = [...document.querySelectorAll(".food-slot img")];
const foodNames  = [...document.querySelectorAll(".food-slot p")];
const skillSpans = [...document.querySelectorAll(".skill-slot span")];
const skillSlots = [...document.querySelectorAll(".skill-slot")];

const undoBtn    = document.getElementById("undo-btn");   /* ⟲ 1つ戻す */

/* 手動選択フラグ */
const foodManual  = [false,false,false];
const skillManual = [false,false,false,false,false];

let seedCount = 0;
let editType  = "food";
let currentIdx= 0;

/* ========== undo（1 手だけ保持） ========== */
let lastState = null;

function saveState(){          // 抽選直前に呼び出す
  lastState = {
    foodNames : foodNames.map(p => p.textContent),
    foodSrcs  : foodImgs .map(img => img.src),
    skillNames: skillSpans.map(s => s.textContent),
    foodMan   : [...foodManual],
    skillMan  : [...skillManual]
  };
  undoBtn.disabled = false;
}

function undo(){
  if(!lastState) return;

  /* 食材を復元 */
  lastState.foodNames.forEach((txt,i)=>{
    if(txt){
      const plain = txt.replace(/\s*✎$/,"");
      const obj   = FOODS.find(f=>f.name===plain);
      setFood(i,obj,lastState.foodMan[i]);
    }else{
      setFood(i,{img:"",name:""},false);
    }
  });

  /* サブスキルを復元 */
  lastState.skillNames.forEach((txt,i)=>{
    setSkill(i,txt,lastState.skillMan[i]);
  });

  /* 1 回限り */
  lastState = null;
  undoBtn.disabled = true;
}
undoBtn.onclick = undo;
undoBtn.disabled = true;        // 初期は押せない







/* ---------- 初期値をセット ---------- */
function initFirstFood(){
  const mame = FOODS.find(f => f.name === "マメミート");
  setFood(0, mame, true);     // manual=true → ✎ を付ける
}
initFirstFood();              // ページ読み込み直後に 1 回呼び出し









/* ========== helpers ========== */
const showToast = msg=>{
  toast.textContent=msg;toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),2200);
};
const randExcept=(arr,ban)=>{
  let v; do{v=arr[Math.floor(Math.random()*arr.length)];}while(ban.has(v));
  return v;
};
const incSeed = ()=>{seedCount++; seedCountEl.value=seedCount;};

/* ✎ を取り除いた文字列を返す */
const clean = str => str.replace(/\s*✎$/,"");

/* ---------- 表示セット関数 ---------- */
function setFood(idx,obj,manual){
  foodImgs[idx].src         = obj.img;
  foodImgs[idx].dataset.name= obj.name;
  foodManual[idx]           = manual;
  foodNames[idx].textContent= manual ? `${obj.name} ✎` : obj.name;
}
function setSkill(idx,name,manual){
  skillManual[idx]          = manual;
  skillSpans[idx].textContent = manual && name ? `${name} ✎` : name;
  skillSlots[idx].classList.remove("yellow","blue");
  const plain = clean(name);
  if(YELLOW.includes(plain)) skillSlots[idx].classList.add("yellow");
  else if(BLUE.includes(plain)) skillSlots[idx].classList.add("blue");
}

/* ========== roll buttons ========== */
document.querySelectorAll(".roll-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    saveState();               /* ★ 抽選直前に状態を保存 */

    const type=btn.dataset.type,idx=+btn.dataset.idx;

    if(type==="food"){
      const prev=foodImgs[idx].dataset.name||"";
      const next=randExcept(FOODS.map(f=>f.name), new Set([prev]));
      const obj = FOODS.find(f=>f.name===next);
      setFood(idx,obj,false);              // manual = false

    }else{
      /* ----- サブスキル抽選 ----- */
      const used = new Set(
        skillSpans.map(s=>clean(s.textContent)).filter(Boolean)
      );
     const prev = clean(skillSpans[idx].textContent);     // 現在値
      
      const next = randExcept(SKILLS, used);              // “なし” は除外
      setSkill(idx,next,false);
    }
    incSeed();
  });
});

/* ========== section-edit ========== */
document.querySelectorAll(".section-edit").forEach(btn=>{
  btn.onclick=()=>{
    editType = btn.dataset.type;
    currentIdx = 0;
    buildModal();
    modal.classList.add("show");
  };
});

function buildTabs(labels){
  slotTabs.innerHTML="";
  labels.forEach((lab,i)=>{
    const b=document.createElement("button");
    b.textContent=lab;
    b.className="slot-tab-btn"+(i===0?" active":"");
    b.onclick=()=>{
      currentIdx=i;
      [...slotTabs.children].forEach((c,j)=>c.classList.toggle("active",j===i));
      renderOptions();
    };
    slotTabs.appendChild(b);
  });
}
function buildModal(){
  editType==="food"
    ? buildTabs(["第1","第2","第3"])
    : buildTabs(["10","25","50","75","100"]);
  renderOptions();
}
function renderOptions(){
  optionGrid.innerHTML="";
  if(editType==="food"){
    FOODS.forEach(f=>{
      const b=document.createElement("button");
      b.className="option-btn"; b.textContent=f.name;
      b.onclick=()=>{ setFood(currentIdx,f,true); modal.classList.remove("show"); };
      optionGrid.appendChild(b);
    });
  }else{
    /* ----- サブスキル候補リスト ----- */
    const used = new Set(
      skillSpans.map(s=>clean(s.textContent)).filter(Boolean)
    );
    used.delete( clean(skillSpans[currentIdx].textContent) );

    [...SKILLS,""].forEach(sk=>{
      const b=document.createElement("button");
      b.className="option-btn";
      if(YELLOW.includes(sk)) b.classList.add("yellow");
      else if(BLUE.includes(sk)) b.classList.add("blue");
      b.textContent=sk||"(なし)";
      if(used.has(sk)) b.disabled=true;
      b.onclick=()=>{ setSkill(currentIdx,sk,true); modal.classList.remove("show"); };
      optionGrid.appendChild(b);
    });
  }
}
closeModalBtn.onclick=()=>modal.classList.remove("show");
modal.addEventListener("click",e=>{ if(e.target===modal) modal.classList.remove("show"); });

/* ========== reset ========== */
document.getElementById("reset-btn").onclick = () => {

  /* --- クリア処理 --- */
  foodImgs.forEach(i => { i.src = ""; i.dataset.name = ""; });
  foodNames.forEach(p => p.textContent = "");
  skillSpans.forEach(s => s.textContent = "");
  skillSlots.forEach(sl => sl.classList.remove("yellow","blue"));
  foodManual.fill(false);
  skillManual.fill(false);
  lastState = null;            // undo をクリア
  undoBtn.disabled = true;
  seedCount = 0;
  seedCountEl.value = 0;

  /* --- 最後にマメミート ✎ をセット --- */
  initFirstFood();
};


/* ========== share (変更なし) ========== */
/* ---- ここ以降は元の share 関数とズーム対策を維持 ---- */

/* ========== share ========== */
document.getElementById("share-btn").onclick = async () => {
  const n = seedCount;
  const tweetText =
`ひらめきのたねシミュレーター（ダークライ）でこんな個体ができました！
たね使用回数は…${n}回！

シミュレーターはこちら↓
https://kuro-momonga.github.io/Eureka-Seeds-simulator/

#ひらめきのたねシミュレーター`;

  /* 1) ---- キャプチャ用に“写し身”を作る ---- */
  const original = document.querySelector("main");
  const clone    = original.cloneNode(true);

  /* ボタン行を非表示 */
  const btnRow = clone.querySelector(".btn-row");
  if(btnRow) btnRow.style.display = "none";

/* 個別編集ボタン & 抽選ボタンを非表示 */
 clone.querySelectorAll(".section-edit, .roll-btn")
      .forEach(el => el.style.display = "none");
  
  /* 余白 & 背景を付与 */
  clone.style.padding   = "48px 24px";
  clone.style.background= "#fffaf0";

  /* 画面外に置いてから撮影 */
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  document.body.appendChild(clone);

  /* 2) ---- html2canvas で PNG 取得 ---- */
  const canvas = await html2canvas(clone,{
  backgroundColor:"#fffaf0",
  scale: window.devicePixelRatio   // ★ 追加
});
  document.body.removeChild(clone);

  const blob = await new Promise(r => canvas.toBlob(r,"image/png"));
  const file = new File([blob],"eureka.png",{type:"image/png"});

  /* 3) ---- 共有フロー ---- */
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file],text:tweetText});
      return;
    }catch(e){ /* cancel → fallback */ }
  }

  /* fallback: PNG を保存 & ツイート本文だけ開く */
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href=url; a.download="eureka_seeds.png"; a.click();
  URL.revokeObjectURL(url);

  window.open(
    "https://twitter.com/intent/tweet?text="+encodeURIComponent(tweetText),
    "_blank"
  );
};


  
/* ---- iOS Safari 用：ピンチ＆ダブルタップ拡大を強制無効 ---- */
(() => {
  let lastTouchEnd = 0;

  document.addEventListener('gesturestart', e => e.preventDefault(), {passive:false});
  document.addEventListener('gesturechange',e => e.preventDefault(), {passive:false});
  document.addEventListener('gestureend',   e => e.preventDefault(), {passive:false});

  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) e.preventDefault();  // ダブルタップ判定
    lastTouchEnd = now;
  }, {passive:false});
})();

  
