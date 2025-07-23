// 新增车位类型
document.getElementById("addSlotTypeBtn")?.addEventListener("click", () => {
  const modalHtml = `
    <div id="addSlotTypeModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white p-6 rounded shadow w-96">
        <h2 class="text-lg font-bold mb-4">新增车位类型</h2>
        <form id="slotTypeForm">
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">车位类型名称</label>
            <input name="type_name" required class="w-full px-3 py-2 border rounded" />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">描述</label>
            <textarea name="description" class="w-full px-3 py-2 border rounded"></textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" id="cancelAddSlotType" class="px-3 py-1 bg-gray-300 rounded">取消</button>
            <button type="submit" class="px-3 py-1 bg-green-600 text-white rounded">保存</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("cancelAddSlotType").addEventListener("click", () => {
    document.getElementById("addSlotTypeModal").remove();
  });

  document.getElementById("slotTypeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch("/api/reservation/slot_types/add", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(res => {
        alert(res.message || "添加成功");
        document.getElementById("addSlotTypeModal").remove();
        location.reload();
      });
  });
});

// 删除车位类型
document.getElementById("deleteSlotTypeBtn")?.addEventListener("click", () => {
  const checked = document.querySelector("input[name='slotTypeCheckbox']:checked");
  if (!checked) {
    alert("请先选择一个要删除的车位类型");
    return;
  }
  if (confirm("确定要删除该车位类型吗？")) {
    fetch(`/api/reservation/slot_types/delete?id=${checked.value}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(res => {
        alert(res.message || "删除成功");
        location.reload();
      });
  }
});

// 加载车位类型列表
function loadSlotTypes() {
  fetch("/api/reservation/slot_types")
    .then(res => res.json())
    .then(data => {
      data.sort((a, b) => a.id - b.id);  // 添加这行代码实现正序排序
      const tbody = document.getElementById("slotTypeList");
      tbody.innerHTML = "";
      data.forEach((item, index) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50";
        row.innerHTML = `
          <td class="px-4 py-2 text-left">
            <input type="radio" name="slotTypeCheckbox" value="${item.id}" />
          </td>
          <td class="px-4 py-2 text-left">${index + 1}</td>
          <td class="px-4 py-2 text-left">${item.type_name}</td>
          <td class="px-4 py-2 text-left">
            <button class="detail-btn text-blue-600 hover:underline" data-id="${item.id}">详情</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // 绑定详情按钮事件
      document.querySelectorAll(".detail-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          fetch(`/api/reservation/slot_types/detail?id=${id}`)
            .then(res => res.json())
            .then(data => {
              const modalHtml = `
                <div id="slotTypeDetailModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div class="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
                    <h2 class="text-xl font-bold mb-4 text-center text-gray-800">车位类型详情</h2>
                    <div class="space-y-2 text-gray-700 text-sm">
                      <p><strong class="inline-block w-20 text-gray-600">类型名称：</strong> ${data.type_name}</p>
                      <p><strong class="inline-block w-20 text-gray-600">描述：</strong> ${data.description || "无"}</p>
                    </div>
                    <div class="flex justify-end mt-6">
                      <button id="closeSlotTypeDetail" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">关闭</button>
                    </div>
                  </div>
                </div>
              `;
              document.body.insertAdjacentHTML("beforeend", modalHtml);
              document.getElementById("closeSlotTypeDetail").addEventListener("click", () => {
                document.getElementById("slotTypeDetailModal").remove();
              });
            });
        });
      });
    });
}

// 页面加载时初始化列表
window.addEventListener("DOMContentLoaded", loadSlotTypes);

// 顶部“详情”按钮行为
document.getElementById("viewSlotTypeBtn")?.addEventListener("click", () => {
  const checked = document.querySelector("input[name='slotTypeCheckbox']:checked");
  if (!checked) {
    alert("请先选择一个车位类型");
    return;
  }
  const id = checked.value;
  fetch(`/api/reservation/slot_types/detail?id=${id}`)
    .then(res => res.json())
    .then(data => {
      const modalHtml = `
        <div id="slotTypeDetailModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div class="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h2 class="text-xl font-bold mb-4 text-center text-gray-800">车位类型详情</h2>
            <div class="space-y-2 text-gray-700 text-sm">
              <p><strong class="inline-block w-20 text-gray-600">类型名称：</strong> ${data.type_name}</p>
              <p><strong class="inline-block w-20 text-gray-600">描述：</strong> ${data.description || "无"}</p>
            </div>
            <div class="flex justify-end mt-6">
              <button id="closeSlotTypeDetail" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">关闭</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      document.getElementById("closeSlotTypeDetail").addEventListener("click", () => {
        document.getElementById("slotTypeDetailModal").remove();
      });
    });
});

// 编辑车位类型
document.getElementById("editSlotTypeBtn")?.addEventListener("click", () => {
  const checked = document.querySelector("input[name='slotTypeCheckbox']:checked");
  if (!checked) {
    alert("请先选择一个要编辑的车位类型");
    return;
  }
  const id = checked.value;
  fetch(`/api/reservation/slot_types/detail?id=${id}`)
    .then(res => res.json())
    .then(data => {
      const modalHtml = `
        <div id="editSlotTypeModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div class="bg-white p-6 rounded shadow w-96">
            <h2 class="text-lg font-bold mb-4">编辑车位类型</h2>
            <form id="editSlotTypeForm">
              <input type="hidden" name="id" value="${id}" />
              <div class="mb-4">
                <label class="block mb-1 text-sm font-medium">车位类型名称</label>
                <input name="type_name" required class="w-full px-3 py-2 border rounded" value="${data.type_name}" />
              </div>
              <div class="mb-4">
                <label class="block mb-1 text-sm font-medium">描述</label>
                <textarea name="description" class="w-full px-3 py-2 border rounded">${data.description || ""}</textarea>
              </div>
              <div class="flex justify-end space-x-2">
                <button type="button" id="cancelEditSlotType" class="px-3 py-1 bg-gray-300 rounded">取消</button>
                <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded">保存</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHtml);

      document.getElementById("cancelEditSlotType").addEventListener("click", () => {
        document.getElementById("editSlotTypeModal").remove();
      });

      document.getElementById("editSlotTypeForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch("/api/reservation/slot_types/edit", {
          method: "POST",
          body: formData
        })
          .then(res => res.json())
          .then(res => {
            alert(res.message || "修改成功");
            document.getElementById("editSlotTypeModal").remove();
            location.reload();
          });
      });
    });
});
