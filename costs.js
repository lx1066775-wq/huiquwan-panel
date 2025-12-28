/* ================= 最终·运营版 COSTS.JS ================= */

const API = window.API_BASE || "/api";
console.log("COSTS API =", API);

/* ===== 固定选项（后期可以接口化） ===== */
const MARKETS = ["新疆", "张家界"];
const OPERATORS = ["彭长爱", "fafo", "fafa", "卓立兵"];
const SOURCES = ["广告", "自然"];
const AD_TYPES = ["dou+", "FB", "XHS", "自然"];

const DEFAULT_MARKET = "新疆";
const DEFAULT_SOURCE = "广告";
const DEFAULT_ADTYPE = "dou+";

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

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function optionHTML(list, val) {
  return list.map(v => `<option ${v===val?"selected":""}>${v}</option>`).join("");
}

function divShow(n, d) {
  if (!d) return "--";
  return (Math.round((n / d) * 100) / 100);
}

/* ===== API ===== */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function postJSON(url, data) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

/* ===== 数据 ===== */
async function fetchRecords(date) {
  const j = await getJSON(`${API}/records?date=${date}`);
  return j.data || [];
}

async function fetchCosts(date) {
  const j = await getJSON(`${API}/costs?date=${date}`);
  return j.data || [];
}

/* ===== 核心渲染 ===== */
function renderRow(row) {
  const tr = document.createElement("tr");
  const isNatural = row.source === "自然";

  tr.innerHTML = `
    <td>${row.date}</td>
    <td>
      <select class="market">${optionHTML(MARKETS, row.market)}</select>
    </td>
    <td>
      <select class="operator">${optionHTML(OPERATORS, row.operator)}</select>
    </td>
    <td>
      <select class="source">${optionHTML(SOURCES, row.source)}</select>
    </td>
    <td>
      <select class="ad_type">${optionHTML(AD_TYPES, row.ad_type)}</select>
    </td>
    <td>
      <input class="spend" type="number" value="${isNatural?0:row.spend||""}" ${isNatural?"disabled":""}>
    </td>
    <td class="num">${row.add}</td>
    <td class="num">${row.valid}</td>
    <td class="num">${row.deal}</td>
    <td class="num">${isNatural?"--":divShow(row.spend,row.valid)}</td>
    <td class="num">${isNatural?"--":divShow(row.spend,row.deal)}</td>
    <td><button class="save">保存</button></td>
  `;

  tr.querySelector(".save").onclick = async () => {
    try {
      await postJSON(`${API}/costs`, {
        date: row.date,
        market: tr.querySelector(".market").value,
        operator: tr.querySelector(".operator").value,
        source: tr.querySelector(".source").value,
        ad_type: tr.querySelector(".ad_type").value,
        spend: Number(tr.querySelector(".spend").value || 0)
      });
      toast("保存成功");
      load();
    } catch (e) {
      toast("保存失败（接口未通）");
    }
  };

  return tr;
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

    // 统计 view
    const map = {};
    records.forEach(r => {
      const k = [r.market, r.operator, r.source, r.ad_type].join("|");
      if (!map[k]) map[k] = {
        date,
        market: r.market,
        operator: r.operator,
        source: r.source,
        ad_type: r.ad_type,
        add: 0, valid: 0, deal: 0
      };
      map[k].add++;
      if (r.valid === "有效") map[k].valid++;
      if (r.deal === "是") map[k].deal++;
    });

    // 合并 costs
    costs.forEach(c => {
      const k = [c.market, c.operator, c.source, c.ad_type].join("|");
      if (!map[k]) {
        map[k] = {
          date,
          market: c.market,
          operator: c.operator,
          source: c.source,
          ad_type: c.ad_type,
          add: 0, valid: 0, deal: 0
        };
      }
      map[k].spend = c.spend;
    });

    tbody.innerHTML = "";
    Object.values(map).forEach(row => tbody.appendChild(renderRow(row)));

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
  }
}

/* ===== 新增纯消费 ===== */
btnAdd.onclick = () => {
  tbody.prepend(renderRow({
    date: dayInput.value,
    market: DEFAULT_MARKET,
    operator: OPERATORS[0],
    source: DEFAULT_SOURCE,
    ad_type: DEFAULT_ADTYPE,
    spend: "",
    add: 0, valid: 0, deal: 0
  }));
};

/* ===== 初始化 ===== */
(function init(){
  if (!dayInput.value) dayInput.value = today();
  btnReload.onclick = load;
  dayInput.onchange = load;
  load();
})();
