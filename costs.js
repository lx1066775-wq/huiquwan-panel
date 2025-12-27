const API_BASE = "https://api.huiquwan.cn";

/* ===== 提示 ===== */
const toast = msg => alert(msg);

/* ===== 加载消费 ===== */
async function loadCosts() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = `<tr><td colspan="9">加载中...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/costs`);
    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("接口返回HTML");

    const json = JSON.parse(text);
    if (!json.ok) throw new Error(json.msg || "加载失败");

    tbody.innerHTML = "";
    json.data.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.date || ""}</td>
        <td>${c.market || ""}</td>
        <td>${c.source || ""}</td>
        <td>${c.ad_type || ""}</td>
        <td>${c.position || ""}</td>
        <td>${c.amount || ""}</td>
        <td>${c.remark || ""}</td>
        <td>
          <button onclick="deleteCost(${c.id})">删</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9">加载失败：${e.message}</td></tr>`;
  }
}

/* ===== 新增消费 ===== */
async function addCost() {
  const data = {
    date: date.value,
    market: market.value,
    source: source.value,
    ad_type: ad_type.value,
    position: position.value,
    amount: amount.value,
    remark: remark.value
  };

  try {
    const res = await fetch(`${API_BASE}/api/costs/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("接口返回HTML");

    const json = JSON.parse(text);
    if (!json.ok) throw new Error(json.msg || "新增失败");

    toast("新增成功");
    loadCosts();
  } catch (e) {
    toast("新增失败：" + e.message);
  }
}

/* ===== 删除消费 ===== */
async function deleteCost(id) {
  if (!confirm("确定删除？")) return;

  try {
    const res = await fetch(`${API_BASE}/api/costs/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("接口返回HTML");

    const json = JSON.parse(text);
    if (!json.ok) throw new Error(json.msg || "删除失败");

    toast("已删除");
    loadCosts();
  } catch (e) {
    toast("删除失败：" + e.message);
  }
}

/* ===== 页面加载 ===== */
document.addEventListener("DOMContentLoaded", loadCosts);
