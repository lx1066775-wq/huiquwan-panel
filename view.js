// ====== 兜底：哪怕 HTML 没注入，也不会 undefined ======
const API = window.API_BASE || "https://xt.huiquwan.cn/api";
const tbody = document.getElementById("tbody");

function toast(msg) {
  alert(msg);
}

// ====== 加载录粉数据 ======
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="11">加载中...</td></tr>`;

  try {
    const res = await fetch(`${API}/records`);
    const json = await res.json();

    if (!json.ok) throw new Error("接口返回失败");

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
      `;
      tbody.appendChild(tr);
    });

    if (!json.data.length) {
      tbody.innerHTML = `<tr><td colspan="11">暂无数据</td></tr>`;
    }

  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="11">加载失败</td></tr>`;
    toast("加载失败：接口未通");
  }
}

// 初始加载
loadRecords();
