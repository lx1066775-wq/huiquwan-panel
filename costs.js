const API = window.API_BASE;
const tbody = document.getElementById("tbody");
const toastEl = document.getElementById("toast");

function toast(msg) {
  if (!toastEl) return alert(msg);
  toastEl.innerText = msg;
  toastEl.style.display = "block";
  setTimeout(() => toastEl.style.display = "none", 2000);
}

async function loadCosts() {
  const date = document.getElementById("date").value;
  tbody.innerHTML = `<tr><td colspan="7">加载中...</td></tr>`;
  try {
    const res = await fetch(`${API}/records?date=${date}`);
    if (!res.ok) throw new Error("接口异常");

    const json = await res.json();
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">暂无数据</td></tr>`;
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
        <td>${r.cost || 0}</td>
        <td>-</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="7">加载失败</td></tr>`;
    toast("加载失败（接口未通）");
  }
}

function addRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${new Date().toISOString().slice(0,10)}"></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><input type="number"></td>
    <td><button onclick="saveRow(this)">保存</button></td>
  `;
  tbody.prepend(tr);
}

async function saveRow(btn) {
  const tds = btn.parentNode.parentNode.querySelectorAll("input");
  const body = {
    date: tds[0].value,
    market: tds[1].value,
    operator: tds[2].value,
    source: tds[3].value,
    ad_type: tds[4].value,
    cost: tds[5].value
  };

  try {
    const res = await fetch(`${API}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error();
    toast("保存成功");
    loadCosts();
  } catch {
    toast("保存失败");
  }
}

loadCosts();
