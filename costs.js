/* =========================================================
 * COSTS.JS  (FINAL)
 * 依赖：
 *  - costs.html 已注入： window.API_BASE = "/api"
 *  - 后端接口：
 *      GET  /api/records?date=YYYY-MM-DD
 *      GET  /api/costs?date=YYYY-MM-DD
 *      POST /api/costs
 * ========================================================= */

const API = window.API_BASE || "/api";
console.log("COSTS API =", API);

/* ===== 常量 ===== */
const DEFAULT_MARKET = "新疆";
const DEFAULT_ADTYPE = "dou+";
const SOURCE_AD = "广告";
const SOURCE_NATURAL = "自然";

/* ===== DOM ===== */
const $ = id => document.getElementById(id);
const tbody = $("tbody");
const dayInput = $("day");
const btnReload = $("btnReload");
const btnAdd = $("btnAdd");

/* ===== 工具 ===== */
function toast(msg) {
  const t = $("toast");
  if (!t) return alert(msg);
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}
const s = v => (v === null || v === undefined) ? "" : String(v);

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function keyOf(x) {
  return [x.date, x.market, x.operator, x.source, x.ad_type].map(s).join("||");
}

function divShow(n, d) {
  if (!d) return "--";
  return (Math.round((n / d) * 100) / 100).toString();
}

/* ===== API ===== */
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function fetchRecords(date) {
  const j = await fetchJSON(`${API}/records?date=${date}`);
  return j.data || [];
}

async function fetchCosts(date) {
  const j = await fetchJSON(`${API}/costs?date=${date}`);
  return j.data || [];
}

async function saveCost(row) {
  await fetchJSON(`${API}/costs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row)
  });
}

/* ===== 统计 view(records) ===== */
function buildStats(records, date) {
  const map = new Map();

  records.forEach(r => {
    const item = {
      date,
      market: r.market || DEFAULT_MARKET,
      operator: r.operator || "",
      source: r.source || SOURCE_AD,
      ad_type: r.ad_type || DEFAULT_ADTYPE
    };
    const k = keyOf(item);
    if (!map.has(k)) {
      map.set(k, { ...item, add: 0, valid: 0, deal: 0 });
    }
    const m = map.get(k);
    m.add++;
    if (r.valid === "有效") m.valid++;
    if (r.deal === "是") m.deal++;
  });

  return map;
}

/* ===== 合并 costs + stats ===== */
function mergeRows(date, statsMap, costs) {
  const rows = new Map();

  // 来自 view
  statsMap.forEach((v, k) => {
    rows.set(k, { ...v, spend: "" });
  });

  // 来自 costs（即使 view=0）
  costs.forEach(c => {
    const base = {
      date,
      market: c.market || DEFAULT_MARKET,
      operator: c.operator || "",
      source: c.source || SOURCE_AD,
      ad_type: c.ad_type || DEFAULT_ADTYPE
    };
    const k = keyOf(base);
    if (!rows.has(k)) {
      rows.set(k, { ...base, add: 0, valid: 0, deal: 0 });
    }
    rows.get(k).spend = Number(c.spend || 0);
  });

  return Array.from(rows.values());
}

/* ===== 渲染 ===== */
function render(list) {
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="12">无数据</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  list.forEach(row => {
    const isNatural = row.source === SOURCE_NATURAL;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.date}</td>
      <td><input class="in market" value="${row.market}"></td>
      <td><input class="in operator" value="${row.operator}"></td>
      <td>
        <select class="in source">
          <option ${row.source===SOURCE_AD?"selected":""}>广告</option>
          <option ${row.source===SOURCE_NATURAL?"selected":""}>自然</option>
        </select>
      </td>
      <td><input class="in ad_type" value="${row.ad_type}"></td>
      <td>
        <input class="in spend" type="number" value="${isNatural?0:row.spend||""}" ${isNatural?"disabled":""}>
      </td>
      <td class="num">${row.add}</td>
      <td class="num">${row.valid}</td>
      <td class="num">${row.deal}</td>
      <td class="num">${isNatural?"--":divShow(row.spend,row.valid)}</td>
      <td class="num">${isNatural?"--":divShow(row.spend,row.deal)}</td>
      <td><button class="btnSave" ${isNatural?"disabled":""}>保存</button></td>
    `;

    tr.querySelector(".btnSave")?.addEventListener("click", async () => {
      try {
        const payload = {
          date: row.date,
          market: tr.querySelector(".market").value,
          operator: tr.querySelector(".operator").value,
          source: tr.querySelector(".source").value,
          ad_type: tr.querySelector(".ad_type").value,
          spend: Number(tr.querySelector(".spend").value || 0)
        };
        await saveCost(payload);
        toast("保存成功");
        load();
      } catch (e) {
        toast("保存失败");
      }
    });

    tbody.appendChild(tr);
  });
}

/* ===== 新增纯消费行 ===== */
function addManualRow() {
  render([{
    date: dayInput.value,
    market: DEFAULT_MARKET,
    operator: "",
    source: SOURCE_AD,
    ad_type: DEFAULT_ADTYPE,
    spend: "",
    add: 0, valid: 0, deal: 0
  }]);
}

/* ===== 主加载 ===== */
async function load() {
  const date = dayInput.value;
  tbody.innerHTML = `<tr><td colspan="12">加载中…</td></tr>`;
  try {
    const [records, costs] = await Promise.all([
      fetchRecords(date),
      fetchCosts(date)
    ]);
    const stats = buildStats(records, date);
    const rows = mergeRows(date, stats, costs);
    render(rows);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
  }
}

/* ===== 初始化 ===== */
(function init() {
  if (!dayInput.value) dayInput.value = todayStr();
  btnReload.onclick = load;
  btnAdd.onclick = addManualRow;
  dayInput.onchange = load;
  load();
})();
