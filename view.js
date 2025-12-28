const API = window.API_BASE;
const tbody = document.getElementById("tbody");
const toastEl = document.getElementById("toast");

/** 安全 toast（不会再 null） */
function toast(msg) {
  if (!toastEl) return alert(msg);
  toastEl.innerText = msg;
  toastEl.style.display = "block";
  setTimeout(() => toastEl.style.display = "none", 2000);
}

/** 加载数据 */
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="11">加载中...</td></tr>`;
  try {
    const res = await fetch(`${API}/records`);
    if (!res.ok) throw new Error("接口异常");

    const json = await res.json();
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11">暂无数据</td></tr>`;
      return;
    }

    json.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.date || ""}</td>
        <td>${r.market || ""}</td>
        <td>${r.operator || ""}</td>
        <td>${r.source || ""}</td>
        <td>${r.ad_type || ""}</td>
        <td>${r.user_mark || ""}</td>
        <td>${r.service || ""}</td>
        <td>${r.valid || ""}</td>
        <td>${r.deal || ""}</td>
        <td>${r.remark || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="11">加载失败</td></tr>`;
    toast("加载失败（接口未通）");
  }
}

loadRecords();
