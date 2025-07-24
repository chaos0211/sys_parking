document.addEventListener("DOMContentLoaded", function () {
  fetchExits();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalItems = 0;

function fetchExits(page = 1, pageSize = 10) {
  currentPage = page;
  console.log("页面加载完成，准备请求 exits/init");
  fetch("/api/reservation/exits/init", { method: "GET" })
    .then(() => {
      // 添加排序参数：payment_status优先，entry_id升序
      return fetch(`/api/reservation/exits?page=${page}&page_size=${pageSize}&sort_by=payment_status,entry_id`);
    })
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById("exitTableBody");
      tbody.innerHTML = "";
      totalItems = data.total;
      totalPages = Math.ceil(totalItems / pageSize);

      data.items.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="border px-4 py-2">${(page - 1) * pageSize + index + 1}</td>
          <td class="border px-4 py-2">${item.slot_number || ""}</td>
          <td class="border px-4 py-2">${item.parking_name || ""}</td>
          <td class="border px-4 py-2">${item.slot_name || ""}</td>
          <td class="border px-4 py-2">${formatDateTime(item.entry_time)}</td>
          <td class="border px-4 py-2">${item.exit_time ? formatDateTime(item.exit_time) : "—"}</td>
          <td class="border px-4 py-2">${item.duration != null ? item.duration.toFixed(2) : "—"}</td>
          <td class="border px-4 py-2">${item.price_per_hour != null ? item.price_per_hour.toFixed(2) : "—"}</td>
          <td class="border px-4 py-2">${item.fee != null ? item.fee.toFixed(2) : "—"}</td>
          <td class="border px-4 py-2">${item.username || ""}</td>
          <td class="border px-4 py-2">${item.license_plate || ""}</td>
          <td class="border px-4 py-2">${item.payment_status}</td>
          <td class="border px-4 py-2 whitespace-nowrap">
            <div class="inline-flex space-x-2">
              <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      onclick="viewExitDetails(${item.entry_id})">
                详情
              </button>
              ${item.payment_status === "未支付" ? `
              <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                      onclick="payExit(${item.entry_id})">
                支付
              </button>
              ` : ""}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      renderPagination(); // 渲染分页组件
    })
    .catch(error => {
      console.error("Error fetching exit data:", error);
    });
}

function renderPagination() {
  const paginationDiv = document.getElementById('pagination');
  paginationDiv.innerHTML = '';

  // Removed "暂无更多数据" block so pagination always renders

  const firstBtn = createPageButton('首页', 1, currentPage === 1);
  paginationDiv.appendChild(firstBtn);

  const prevBtn = createPageButton('上一页', currentPage - 1, currentPage === 1);
  paginationDiv.appendChild(prevBtn);

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = createPageButton(i.toString(), i, false, i === currentPage);
    paginationDiv.appendChild(pageBtn);
  }

  const nextBtn = createPageButton('下一页', currentPage + 1, currentPage === totalPages);
  paginationDiv.appendChild(nextBtn);

  const lastBtn = createPageButton('末页', totalPages, currentPage === totalPages);
  paginationDiv.appendChild(lastBtn);

  const pageInfo = document.createElement('span');
  pageInfo.className = 'ml-4 text-gray-600';
  pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页，共 ${totalItems} 条记录`;
  paginationDiv.appendChild(pageInfo);
}

function createPageButton(text, page, disabled, active = false) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = `mx-1 px-2 py-1 rounded border text-sm ${
    active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
  }`;
  btn.disabled = disabled;
  btn.onclick = () => fetchExits(page);
  return btn;
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}

function payExit(entryId) {
  const formData = new FormData();
  formData.append("entry_id", entryId);

  fetch("/api/reservation/exits/pay", {
    method: "POST",
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      alert(data.message || "支付成功");
      fetchExits(); // Refresh table
    })
    .catch(error => {
      console.error("支付失败:", error);
    });
}

function viewExitDetails(entryId) {
  alert("查看详情，Entry ID: " + entryId);
}
