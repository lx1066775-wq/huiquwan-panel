// ===== 基础 =====
const API = window.API_BASE;
const tbody = document.getElementById("tbody");
const toast = msg => {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

// ===== 加载录粉数据 =====
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="12">加载中...</td></tr>`;

  try {
    const res = await fetch(`${API}/records`);
    const json = await res.json();

    if (!json.ok) throw new Error();

    tbody.innerHTML = "";
    json.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.date}</td>
        <td>${r.market}</td>
        <td>${r.operator}</td>
        <td>${r.source}</td>
        <td>${r.ad_type}</td>
        <td>${r.user_mark || ""}</td>
        <td>${r.service || ""}</td>
        <td>${r.valid}</td>
        <td>${r.deal}</td>
        <td>${r.remark || ""}</td>
        <td>-</td>
      `;
      tbody.appendChild(tr);
    });

    if (!json.data.length) {
      tbody.innerHTML = `<tr><td colspan="12">暂无数据</td></tr>`;
    }

  } catch {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
    toast("加载失败：接口未通");
  }
}

// ===== 初始化 =====
loadRecords();
