/* ===== API ===== */
const API_BASE = "https://api.huiquwan.cn";

/* ===== 枚举（与录入系统完全一致）===== */
const MARKETS = ["新疆", "张家界", "贵州", "四川", "云南"];

const SOURCES = [
  { label: "广告", hasCost: true },
  { label: "自然", hasCost: false }
];

const AD_TYPES = [
  "dou+",
  "小AD",
  "大AD",
  "视频号",
  "小红书",
  "FB",
  "TikTok",
  "快手"
];

/* ===== 工具：初始化下拉 ===== */
function initSelect(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">请选择</option>`;
  list.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.innerText = v;
    el.appendChild(opt);
  });
}

/* ===== 来源联动规则 ===== */
function initSourceRule() {
  const sourceEl = document.getElementById("source");
  const moneyEl = document.getElementById("amount");

  if (!sourceEl || !moneyEl) return;

  sourceEl.addEventListener("change", () => {
    const s = SOURCES.find(x => x.label === sourceEl.value);
    if (!s) return;

    if (s.hasCost) {
      moneyEl.disabled = false;
      moneyEl.placeholder = "例如：35.50";
    } else {
      moneyEl.value = "";
      moneyEl.disabled = true;
      moneyEl.placeholder = "自然流无需填写";
    }
  });
}

/* ===== 页面初始化 ===== */
document.addEventListener("DOMContentLoaded", () => {
  initSelect("market", MARKETS);
  initSelect("ad_type", AD_TYPES);

  // 来源单独处理（有规则）
  const sourceEl = document.getElementById("source");
  if (sourceEl) {
    sourceEl.innerHTML = `<option value="">请选择</option>`;
    SOURCES.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.label;
      opt.innerText = s.label;
      sourceEl.appendChild(opt);
    });
  }

  initSourceRule();
  loadCosts();
});
