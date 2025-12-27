const API = window.API_BASE;
const tbody = document.getElementById("tbody");

const toast = msg => {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

/* ================= 工具 ================= */
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/* ================= 下拉选项 ================= */
async function loadOptions() {
  const map = {
    market: "fMarket",
    operator: "fOperator",
    source: "fSource",
    ad_type: "fAdType",
    service: "fService",
    valid: "fValid",
    deal: "fDeal"
  };

  for (const k in map) {
    try {
      const sel = document.getElementById(map[k]);
      if (!sel) continue;

      sel.innerHTML = `<option value="">全部</option>`;
      const j = await safeFetch(`${API}/options/${k}`);
      j.data.forEach(v => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        sel.appendChild(o);
      });
    } catch (e) {
      console.error("options error:", k, e);
    }
  }
}

/* ================= 加载数据 ================= */
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="12">加载中...</td></tr>`;

  try {
    const j = await safeFetch(`${API}/records`);
    tbody.innerHTML = "";

    j.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td><input type="date" value="${r.date || ""}"></td>
        <td><input value="${r.market || ""}"></td>
        <td><input value="${r.operator || ""}"></td>
        <td><input value="${r.source || ""}"></td>
        <td><input value="${r.ad_type || ""}"></td>
        <td><input value="${r.user_mark || ""}"></td>
        <td><input value="${r.service || ""}"></td>
        <td><input value="${r.valid || ""}"></td>
        <td><input value="${r.deal || ""}"></td>
        <td><input value="${r.remark || ""}"></td>
        <td>
          <button class="btn save">保存</button>
          <button class="btn danger del">删</button>
        </td>
      `;

      /* 保存 */
      tr.querySelector(".save").onclick = async () => {
        const i = tr.querySelectorAll("input");
        const payload = {
          id: r.id,
          date: i[0].value,
          market: i[1].value,
          operator: i[2].value,
          source: i[3].value,
          ad_type: i[4].value,
          user_mark: i[5].value,
          service: i[6].value,
          valid: i[7].value,
          deal: i[8].value,
          remark: i[9].value
        };

        try {
          await safeFetch(`${API}/records/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          toast("已保存");
        } catch {
          toast("保存失败");
        }
      };

      /* 删除 */
      tr.querySelector(".del").onclick = async () => {
        if (!confirm("确定删除？")) return;
        await safeFetch(`${API}/records/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: r.id })
        });
        loadRecords();
      };

      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
    console.error(e);
  }
}

/* ================= 新增 ================= */
document.getElementById("btnAdd").onclick = async () => {
  try {
    await safeFetch(`${API}/records/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString().slice(0, 10)
      })
    });
    loadRecords();
    toast("已新增一行");
  } catch {
    toast("新增失败");
  }
};

/* ================= 启动 ================= */
loadOptions();
loadRecords();
