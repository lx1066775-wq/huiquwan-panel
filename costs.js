const API = "https://api.huiquwan.cn/api";
const tbody = document.getElementById("tbody");

/* ===== 基础枚举（和录入系统完全一致）===== */
const MARKETS = ["新疆", "张家界", "贵州", "四川"];
const SOURCES = ["广告", "自然流"];
const AD_TYPES = ["dou+", "小AD", "大AD", "视频号", "小红书", "FB", "TikTok", "快手"];

/* ===== 工具 ===== */
function fillSelect(id, arr, withAll = false) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  if (withAll) el.innerHTML += `<option value="">全部</option>`;
  arr.forEach(v => el.innerHTML += `<option value="${v}">${v}</option>`);
}

/* ===== 初始化 ===== */
document.addEventListener("DOMContentLoaded", () => {
  fillSelect("market", MARKETS);
  fillSelect("source", SOURCES);
  fillSelect("ad_type", AD_TYPES);

  fillSelect("q_market", MARKETS, true);
  fillSelect("q_source", SOURCES, true);
  fillSelect("q_ad_type", AD_TYPES, true);

  loadCosts();
});

/* ===== 查询 ===== */
async function loadCosts() {
  tbody.innerHTML = `<tr><td colspan="9">加载中...</td></tr>`;

  const qs = new URLSearchParams({
    market: q_market.value,
    source: q_source.value,
    ad_type: q_ad_type.value,
    keyword: q_keyword.value
  });

  const res = await fetch(`${API}/costs?` + qs.toString());
  const json = await res.json();

  tbody.innerHTML = "";
  if (!json.ok || json.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">暂无数据</td></tr>`;
    return;
  }

  json.data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.date}</td>
      <td>${r.market}</td>
      <td>${r.source}</td>
      <td>${r.ad_type}</td>
      <td>${r.slot}</td>
      <td>${r.amount}</td>
      <td>${r.remark || ""}</td>
      <td><button onclick="delCost(${r.id})">删</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===== 新增 ===== */
async function addCost() {
  const data = {
    date: date.value,
    market: market.value,
    source: source.value,
    ad_type: ad_type.value,
    slot: slot.value,
    amount: amount.value,
    remark: remark.value
  };

  // 自然流：不记录广告费
  if (data.source === "自然流") {
    data.amount = 0;
    data.slot = "自然流";
  }

  const res = await fetch(`${API}/costs/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const text = await res.text();
  if (text.startsWith("<")) {
    alert("接口返回 HTML，后端异常");
    return;
  }

  const json = JSON.parse(text);
  if (!json.ok) return alert(json.msg || "新增失败");

  loadCosts();
}

/* ===== 删除 ===== */
async function delCost(id) {
  if (!confirm("确认删除？")) return;

  const res = await fetch(`${API}/costs/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const json = await res.json();
  if (!json.ok) return alert("删除失败");

  loadCosts();
}
