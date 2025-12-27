/* costs.js — 最终版（B）
 * 目标：
 * 1) view(=records) 实时统计：加粉/有效/成交
 * 2) costs 只存 spend（运营第二天填）
 * 3) view=0 也允许新增一行只填 spend（广告烧钱但没粉）
 * 4) 自然流：spend=0，disabled，但必须展示统计数据
 * 5) 新增行默认：market=新疆，ad_type=dou+
 */

const API = window.API_BASE || ""; // 例如 https://api.huiquwan.cn
const DEFAULT_MARKET = "新疆";
const DEFAULT_ADTYPE = "dou+";
const SOURCE_AD = "广告";
const SOURCE_NATURAL = "自然";

const $ = (id) => document.getElementById(id);
const tbody = $("tbody");
const dayInput = $("day");          // <input type="date" id="day">
const btnReload = $("btnReload");   // 可选：<button id="btnReload">刷新</button>
const btnAdd = $("btnAdd");         // <button id="btnAdd">新增消费行</button>

function toast(msg) {
  const t = $("toast");
  if (!t) { alert(msg); return; }
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

/** 安全字符串 */
function s(v) { return (v === null || v === undefined) ? "" : String(v); }

/** 生成“组合键”：date+market+operator+source+ad_type */
function keyOf(x) {
  return [x.date, x.market, x.operator, x.source, x.ad_type].map(s).join("||");
}

/** 除法显示：分母=0 -> '--' */
function divShow(n, d) {
  const nn = Number(n || 0);
  const dd = Number(d || 0);
  if (!dd) return "--";
  const v = nn / dd;
  // 保留 2 位，去掉多余 0
  return Number.isFinite(v) ? (Math.round(v * 100) / 100).toString() : "--";
}

/** 今日默认日期（yyyy-mm-dd） */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** ===== 1) 拉取 records（view 数据），按当天统计 =====
 * 期望后端支持：
 *   GET /records?date=YYYY-MM-DD    -> { data: [ ...records ] }
 * 如果你后端没有 date 过滤，它也能跑（会在前端再过滤一次），但不推荐。
 */
async function fetchRecordsByDate(date) {
  const url = `${API}/records?date=${encodeURIComponent(date)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`records 拉取失败：${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  // 二次保险：只取指定日期
  return rows.filter(r => s(r.date) === date);
}

/** ===== 2) 拉取 costs（只存 spend）=====
 * 期望后端支持：
 *   GET /costs?date=YYYY-MM-DD      -> { data: [ {id,date,market,operator,source,ad_type,spend} ] }
 */
async function fetchCostsByDate(date) {
  const url = `${API}/costs?date=${encodeURIComponent(date)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`costs 拉取失败：${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  return rows.filter(r => s(r.date) === date);
}

/** ===== 3) 保存（upsert）costs spend =====
 * 推荐后端支持 UPSERT：
 *   POST /costs  body: {date,market,operator,source,ad_type,spend}
 * 返回：{ ok: true, id: xxx }
 */
async function saveCostSpend(row) {
  const payload = {
    date: row.date,
    market: row.market,
    operator: row.operator,
    source: row.source,
    ad_type: row.ad_type,
    spend: Number(row.spend || 0)
  };
  const res = await fetch(`${API}/costs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`保存失败：${res.status} ${txt}`);
  }
  const json = await res.json().catch(() => ({}));
  return json;
}

/** ===== 4) 从 records 统计 ===== */
function buildStats(records, date) {
  // 维度：date + market + operator + source + ad_type
  const map = new Map();
  for (const r of records) {
    const item = {
      date,
      market: s(r.market) || DEFAULT_MARKET,
      operator: s(r.operator) || "",
      source: s(r.source) || SOURCE_AD,
      ad_type: s(r.ad_type) || DEFAULT_ADTYPE,
    };
    const k = keyOf(item);
    if (!map.has(k)) {
      map.set(k, {
        ...item,
        add_cnt: 0,
        valid_cnt: 0,
        deal_cnt: 0
      });
    }
    const agg = map.get(k);
    agg.add_cnt += 1;

    const valid = s(r.valid);
    if (valid === "有效") agg.valid_cnt += 1;

    const deal = s(r.deal);
    if (deal === "是") agg.deal_cnt += 1;
  }
  return map;
}

/** ===== 5) 合并 stats + costs（spend）=====
 * 规则：
 * - stats 有的组合：必须显示
 * - costs 有但 stats 没：也必须显示（加粉/有效/成交=0）
 * - 自然流：spend=0 且不可编辑
 */
function mergeRows(date, statsMap, costsRows) {
  const merged = new Map();

  // 先塞入 stats
  for (const [k, st] of statsMap.entries()) {
    merged.set(k, {
      id: null, // 如果 costs 有会覆盖
      ...st,
      spend: "" // 后面用 costs 覆盖
    });
  }

  // 再塞入 costs（保证 view=0 也能显示）
  for (const c of costsRows) {
    const base = {
      date,
      market: s(c.market) || DEFAULT_MARKET,
      operator: s(c.operator) || "",
      source: s(c.source) || SOURCE_AD,
      ad_type: s(c.ad_type) || DEFAULT_ADTYPE,
    };
    const k = keyOf(base);
    if (!merged.has(k)) {
      merged.set(k, {
        id: c.id ?? null,
        ...base,
        add_cnt: 0,
        valid_cnt: 0,
        deal_cnt: 0,
        spend: s(c.spend ?? "")
      });
    } else {
      const m = merged.get(k);
      m.id = c.id ?? m.id;
      m.spend = s(c.spend ?? "");
    }
  }

  // 自然流 spend 规则
  for (const row of merged.values()) {
    if (row.source === SOURCE_NATURAL) {
      row.spend = 0;
    } else if (row.spend === "") {
      // 广告行没填就空着（让运营填）
      row.spend = "";
    }
  }

  // 排序：market(新疆优先) -> source(广告优先) -> ad_type(dou+优先) -> operator
  const arr = Array.from(merged.values());
  arr.sort((a, b) => {
    const am = (a.market === DEFAULT_MARKET) ? 0 : 1;
    const bm = (b.market === DEFAULT_MARKET) ? 0 : 1;
    if (am !== bm) return am - bm;

    const as = (a.source === SOURCE_AD) ? 0 : 1;
    const bs = (b.source === SOURCE_AD) ? 0 : 1;
    if (as !== bs) return as - bs;

    const aa = (a.ad_type === DEFAULT_ADTYPE) ? 0 : 1;
    const ba = (b.ad_type === DEFAULT_ADTYPE) ? 0 : 1;
    if (aa !== ba) return aa - ba;

    return s(a.operator).localeCompare(s(b.operator), "zh-Hans-CN");
  });

  return arr;
}

/** ===== 6) 渲染 ===== */
function render(rows) {
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12">无数据。可点击「新增消费行」记录当天花费。</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  for (const row of rows) {
    const k = keyOf(row);
    const isNatural = (row.source === SOURCE_NATURAL);

    const spendVal = (row.spend === "" ? "" : Number(row.spend));
    const validCost = isNatural ? "--" : divShow(spendVal, row.valid_cnt);
    const dealCost  = isNatural ? "--" : divShow(spendVal, row.deal_cnt);

    const tr = document.createElement("tr");
    tr.dataset.key = k;

    tr.innerHTML = `
      <td>${s(row.date)}</td>

      <td>
        <input class="in market" value="${s(row.market)}" ${isNatural ? "" : ""} />
      </td>

      <td>
        <input class="in operator" value="${s(row.operator)}" placeholder="运营人" />
      </td>

      <td>
        <select class="in source">
          <option value="${SOURCE_AD}" ${row.source === SOURCE_AD ? "selected" : ""}>${SOURCE_AD}</option>
          <option value="${SOURCE_NATURAL}" ${row.source === SOURCE_NATURAL ? "selected" : ""}>${SOURCE_NATURAL}</option>
        </select>
      </td>

      <td>
        <input class="in ad_type" value="${s(row.ad_type)}" />
      </td>

      <td>
        <input class="in spend" type="number" min="0" step="0.01"
          value="${isNatural ? 0 : (row.spend === "" ? "" : s(spendVal))}"
          ${isNatural ? "disabled" : ""}
          placeholder="${isNatural ? "0" : "填写消费"}"
        />
      </td>

      <td class="num add_cnt">${row.add_cnt}</td>
      <td class="num valid_cnt">${row.valid_cnt}</td>
      <td class="num deal_cnt">${row.deal_cnt}</td>

      <td class="num valid_cost">${validCost}</td>
      <td class="num deal_cost">${dealCost}</td>

      <td>
        <button class="btnSave" ${isNatural ? "disabled" : ""}>保存</button>
      </td>
    `;

    // 绑定保存
    tr.querySelector(".btnSave")?.addEventListener("click", async () => {
      try {
        const payload = readRow(tr);
        // 自然流不保存（或者你也可以允许保存但 spend 永远 0）
        if (payload.source === SOURCE_NATURAL) return;
        await saveCostSpend(payload);
        toast("保存成功");
        // 保存后刷新一遍（实时统计 & 合并）
        await load();
      } catch (e) {
        toast(e.message || "保存失败");
      }
    });

    // source 切换：自然->广告 / 广告->自然（自然则 spend=0 disabled）
    tr.querySelector(".source")?.addEventListener("change", (ev) => {
      const src = ev.target.value;
      const spend = tr.querySelector(".spend");
      if (!spend) return;
      if (src === SOURCE_NATURAL) {
        spend.value = 0;
        spend.disabled = true;
        tr.querySelector(".btnSave")?.setAttribute("disabled", "disabled");
      } else {
        spend.disabled = false;
        tr.querySelector(".btnSave")?.removeAttribute("disabled");
        // 广告切回默认可空，让运营填
        if (Number(spend.value) === 0) spend.value = "";
      }
    });

    tbody.appendChild(tr);
  }
}

/** 读取一行（用于保存） */
function readRow(tr) {
  const date = s(dayInput?.value || todayStr());
  const market = s(tr.querySelector(".market")?.value || DEFAULT_MARKET).trim() || DEFAULT_MARKET;
  const operator = s(tr.querySelector(".operator")?.value || "").trim();
  const source = s(tr.querySelector(".source")?.value || SOURCE_AD).trim() || SOURCE_AD;
  const ad_type = s(tr.querySelector(".ad_type")?.value || DEFAULT_ADTYPE).trim() || DEFAULT_ADTYPE;
  const spendStr = s(tr.querySelector(".spend")?.value || "0");
  const spend = Number(spendStr || 0);

  if (!operator) throw new Error("请填写运营人");
  if (!market) throw new Error("请填写市场");
  if (!ad_type) throw new Error("请填写广告类型");
  if (source === SOURCE_AD && !(spend >= 0)) throw new Error("消费金额不合法");

  return { date, market, operator, source, ad_type, spend };
}

/** ===== 7) 新增“纯消费行”（view=0 也可） ===== */
function addManualRow() {
  const date = s(dayInput?.value || todayStr());
  const tr = document.createElement("tr");
  tr.dataset.manual = "1";

  tr.innerHTML = `
    <td>${date}</td>

    <td><input class="in market" value="${DEFAULT_MARKET}" /></td>
    <td><input class="in operator" placeholder="运营人" /></td>

    <td>
      <select class="in source">
        <option value="${SOURCE_AD}" selected>${SOURCE_AD}</option>
        <option value="${SOURCE_NATURAL}">${SOURCE_NATURAL}</option>
      </select>
    </td>

    <td><input class="in ad_type" value="${DEFAULT_ADTYPE}" /></td>

    <td><input class="in spend" type="number" min="0" step="0.01" placeholder="填写消费" /></td>

    <td class="num add_cnt">0</td>
    <td class="num valid_cnt">0</td>
    <td class="num deal_cnt">0</td>

    <td class="num valid_cost">--</td>
    <td class="num deal_cost">--</td>

    <td><button class="btnSave">保存</button></td>
  `;

  tr.querySelector(".btnSave")?.addEventListener("click", async () => {
    try {
      const payload = readRow(tr);
      if (payload.source === SOURCE_NATURAL) {
        // 自然流：spend 固定 0，且通常不需要手动新增（但如果你硬要，也允许）
        payload.spend = 0;
      }
      await saveCostSpend(payload);
      toast("保存成功");
      await load();
    } catch (e) {
      toast(e.message || "保存失败");
    }
  });

  tr.querySelector(".source")?.addEventListener("change", (ev) => {
    const src = ev.target.value;
    const spend = tr.querySelector(".spend");
    if (!spend) return;
    if (src === SOURCE_NATURAL) {
      spend.value = 0;
      spend.disabled = true;
    } else {
      spend.disabled = false;
      if (Number(spend.value) === 0) spend.value = "";
    }
  });

  // 插到最上面，方便立刻填
  if (tbody && tbody.firstChild) tbody.insertBefore(tr, tbody.firstChild);
  else tbody.appendChild(tr);
}

/** ===== 8) 主加载 ===== */
async function load() {
  const date = s(dayInput?.value || todayStr());
  if (tbody) tbody.innerHTML = `<tr><td colspan="12">加载中…</td></tr>`;

  try {
    const [records, costsRows] = await Promise.all([
      fetchRecordsByDate(date),
      fetchCostsByDate(date),
    ]);

    const statsMap = buildStats(records, date);
    const rows = mergeRows(date, statsMap, costsRows);

    // 额外：如果某天 records 里出现自然流组合，merge 已显示；
    // 如果你希望“即使 records 没有自然流，也固定显示一个自然汇总行”，那属于另一条需求（目前不做）。
    render(rows);
  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="12">加载失败：${s(e.message)}</td></tr>`;
    toast(e.message || "加载失败");
  }
}

/** ===== 9) 初始化 ===== */
(function init() {
  if (dayInput && !dayInput.value) dayInput.value = todayStr();

  btnReload?.addEventListener("click", load);
  btnAdd?.addEventListener("click", addManualRow);
  dayInput?.addEventListener("change", load);

  load();
})();
