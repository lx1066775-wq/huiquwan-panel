const API = window.API_BASE || "https://xt.huiquwan.cn/api";
const tbody = document.getElementById("tbody");
const dayInput = document.getElementById("day");

// 默认今天
dayInput.value = new Date().toISOString().slice(0, 10);

// ===== 加载经营数据 =====
async function loadCosts() {
  const day = dayInput.value;
  tbody.innerHTML = `<tr><td colspan="10">加载中...</td></tr>`;

  try {
    const res = await fetch(`${API}/records?date=${day}`);
    const json = await res.json();
    if (!json.ok) throw new Error();

    tbody.innerHTML = "";

    if (!json.data.length) {
      tbody.innerHTML = `<tr><td colspan="10">当天无数据</td></tr>`;
      return;
    }

    json.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.market}</td>
        <td>${r.operator}</td>
        <td>${r.source}</td>
        <td>${r.ad_type}</td>
        <td><input type="number" value="0"></td>
        <td>1</td>
        <td>${r.valid === "有效" ? 1 : 0}</td>
        <td>${r.deal === "是" ? 1 : 0}</td>
        <td><button onclick="saveRow(this)">保存</button></td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="10">加载失败</td></tr>`;
    alert("接口未通");
  }
}

// ===== 新增空消费 =====
function addEmptyRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${dayInput.value}</td>
    <td>新疆</td>
    <td>彭长爱</td>
    <td>广告</td>
    <td>dou+</td>
    <td><input type="number" value="0"></td>
    <td>0</td>
    <td>0</td>
    <td>0</td>
    <td><button onclick="saveRow(this)">保存</button></td>
  `;
  tbody.prepend(tr);
}

// ===== 保存消费 =====
async function saveRow(btn) {
  const tr = btn.closest("tr");
  const tds = tr.children;

  const payload = {
    date: tds[0].innerText,
    market: tds[1].innerText,
    operator: tds[2].innerText,
    source: tds[3].innerText,
    ad_type: tds[4].innerText,
    cost: Number(tds[5].querySelector("input").value)
  };

  try {
    const res = await fetch(`${API}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error();
    alert("保存成功");
  } catch {
    alert("保存失败");
  }
}

// 初始加载
loadCosts();
