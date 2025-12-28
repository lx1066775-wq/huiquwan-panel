// ===== 基础 =====
const API = window.API_BASE;
const tbody = document.getElementById("tbody");
const dayInput = document.getElementById("day");
const toast = (msg) => {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

// 默认当天
dayInput.value = new Date().toISOString().slice(0, 10);

// ===== 加载经营数据 =====
async function loadCosts() {
  const day = dayInput.value;
  tbody.innerHTML = `<tr><td colspan="12">加载中...</td></tr>`;

  try {
    const res = await fetch(`${API}/records?date=${day}`);
    const json = await res.json();

    if (!json.ok) throw new Error("接口返回失败");

    tbody.innerHTML = "";

    // 👉 按 运营 / 市场 / 广告类型 聚合
    const map = {};
    json.data.forEach(r => {
      const key = `${r.market}|${r.operator}|${r.source}|${r.ad_type}`;
      if (!map[key]) {
        map[key] = {
          date: r.date,
          market: r.market,
          operator: r.operator,
          source: r.source,
          ad_type: r.ad_type,
          cost: 0,
          fans: 0,
          valid: 0,
          deal: 0,
        };
      }
      map[key].fans++;
      if (r.valid === "有效") map[key].valid++;
      if (r.deal === "是") map[key].deal++;
    });

    Object.values(map).forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.date}</td>
        <td>${row.market}</td>
        <td>${row.operator}</td>
        <td>${row.source}</td>
        <td>${row.ad_type}</td>
        <td><input class="in num" type="number" value="0"></td>
        <td class="num">${row.fans}</td>
        <td class="num">${row.valid}</td>
        <td class="num">${row.deal}</td>
        <td class="num">${row.valid ? "-" : "--"}</td>
        <td class="num">${row.deal ? "-" : "--"}</td>
        <td><button onclick="saveRow(this)">保存</button></td>
      `;
      tbody.appendChild(tr);
    });

    if (!Object.keys(map).length) {
      tbody.innerHTML = `<tr><td colspan="12">当天无录粉数据，可新增消费行</td></tr>`;
    }

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
    toast("加载失败：接口未通");
  }
}

// ===== 新增空消费行（无粉也能记）=====
function addEmptyRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${dayInput.value}</td>
    <td><select><option>新疆</option></select></td>
    <td><select><option>彭长爱</option></select></td>
    <td><select><option>广告</option><option>自然</option></select></td>
    <td><select><option>dou+</option></select></td>
    <td><input class="in num" type="number" value="0"></td>
    <td class="num">0</td>
    <td class="num">0</td>
    <td class="num">0</td>
    <td class="num">--</td>
    <td class="num">--</td>
    <td><button onclick="saveRow(this)">保存</button></td>
  `;
  tbody.prepend(tr);
}

// ===== 保存消费（只存 cost 表）=====
async function saveRow(btn) {
  const tr = btn.closest("tr");
  const tds = tr.children;

  const payload = {
    date: tds[0].innerText || dayInput.value,
    market: tds[1].querySelector("select")?.value || tds[1].innerText,
    operator: tds[2].querySelector("select")?.value || tds[2].innerText,
    source: tds[3].querySelector("select")?.value || tds[3].innerText,
    ad_type: tds[4].querySelector("select")?.value || tds[4].innerText,
    cost: Number(tds[5].querySelector("input").value || 0)
  };

  try {
    const res = await fetch(`${API}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error();

    toast("保存成功");
  } catch {
    toast("保存失败（接口未通）");
  }
}

// ===== 事件 =====
document.getElementById("btnReload")?.addEventListener("click", loadCosts);
document.getElementById("btnAdd")?.addEventListener("click", addEmptyRow);

// 初始加载
loadCosts();
