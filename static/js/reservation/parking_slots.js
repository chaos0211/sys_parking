// 初始化：车位类型示例数据
const slotTypes = [
  { id: 1, type: "标准车位" },
  { id: 2, type: "大型车位" },
  { id: 3, type: "充电车位" }
];

const slotTypeTable = document.querySelector("#slot-type-table tbody");
if (slotTypeTable) {
  slotTypes.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" name="slotTypeCheckbox" value="${item.id}"></td>
      <td>${index + 1}</td>
      <td>${item.type}</td>
      <td><button class="detail-btn bg-blue-500 text-white px-2 py-1 rounded" data-id="${item.id}">详情</button></td>
    `;
    slotTypeTable.appendChild(row);
  });
}

// 动态获取车位信息并渲染（带分页）
const slotTable = document.querySelector("#slotTableBody");
let currentPage = 1;
const pageSize = 10;

function loadSlots(page = 1) {
  if (!slotTable) return;
  fetch(`/api/reservation/slots?page=${page}&page_size=${pageSize}`)
    .then(res => res.json())
    .then(data => {
      slotTable.innerHTML = "";
      const slots = Array.isArray(data) ? data : (data.items || []);
      slots.forEach((item, index) => {
        const imageSrc = item.avatar1 ? `/static/upload/${item.avatar1}` : "";
        const imageHtml = imageSrc ? `<img src="${imageSrc}" class="w-20 h-14 object-cover rounded" />` : "无";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="px-4 py-3 text-left"><input type="checkbox" name="slotCheckbox" value="${item.id}"></td>
          <td class="px-4 py-3 text-left">${item.slot_number || ""}</td>
          <td class="px-4 py-3 text-left">${item.name || ""}</td>
          <td class="px-4 py-3 text-left">${item.type_name || ""}</td>
          <td class="px-4 py-3 text-left">${imageHtml}</td>
          <td class="px-4 py-3 text-left">${item.parking_name || ""}</td>
          <td class="px-4 py-3 text-left">${item.charge_rule || ""}</td>
          <td class="px-4 py-3 text-left">${item.price_per_hour || 0} 元</td>
          <td class="px-4 py-3 text-left">${item.status || ""}</td>
          <td class="px-4 py-3 text-left">
            <button class="detail-btn bg-blue-500 text-white px-2 py-1 rounded" data-id="${item.id}">详情</button>
          </td>
        `;
        slotTable.appendChild(row);
      });
      // 仅在 data.total 存在时渲染分页
      if (typeof data.total !== "undefined") {
        renderPagination(data.total, data.page, data.page_size);
      }
    });
}

function renderPagination(total, page, pageSize) {
  const paginationWrapper = document.getElementById("paginationWrapper");
  if (!paginationWrapper) return;
  paginationWrapper.innerHTML = "";

  let totalPages = Math.ceil(total / pageSize);
  if (totalPages === 0) totalPages = 1; // 即使没有数据也至少显示1页

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-2 py-1 border rounded mx-1 ${i === page ? "bg-blue-600 text-white" : "bg-white text-black"}`;
    btn.addEventListener("click", () => {
      currentPage = i;
      loadSlots(currentPage);
    });
    paginationWrapper.appendChild(btn);
  }
}

if (slotTable) {
  loadSlots();
}

// 辅助函数：创建弹窗
function createModal({ title, content, onClose }) {
  // 先关闭已有弹窗
  document.querySelectorAll(".custom-modal-bg").forEach(e => e.remove());
  const modalBg = document.createElement("div");
  modalBg.className = "custom-modal-bg fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";
  const modalBox = document.createElement("div");
  modalBox.className = "bg-white p-6 rounded shadow-lg w-[1200px]";
  const closeBtn = document.createElement("button");
  closeBtn.className = "absolute top-2 right-2 text-gray-500 hover:text-gray-700";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "1rem";
  closeBtn.style.right = "1rem";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    modalBg.remove();
    if (onClose) onClose();
  });
  // 标题
  const h2 = document.createElement("h2");
  h2.className = "text-lg font-bold mb-4";
  h2.textContent = title;
  modalBox.appendChild(closeBtn);
  modalBox.appendChild(h2);
  // 内容
  if (typeof content === "string") {
    const div = document.createElement("div");
    div.innerHTML = content;
    modalBox.appendChild(div);
  } else if (content instanceof Node) {
    modalBox.appendChild(content);
  }
  modalBg.appendChild(modalBox);
  // 点击背景关闭弹窗
  modalBg.addEventListener("click", (e) => {
    if (e.target === modalBg) {
      modalBg.remove();
      if (onClose) onClose();
    }
  });
  document.body.appendChild(modalBg);
  return modalBg;
}

// 生成车位类型下拉（异步）
function slotTypeSelectHtmlFromList(slotTypeList, selectedId) {
  return `<select name="type_id" class="w-full px-3 py-2 border rounded" required>
    <option value="">请选择</option>
    ${slotTypeList.map(t => `<option value="${t.id}"${selectedId == t.id ? " selected" : ""}>${t.type_name || t.type}</option>`).join("")}
  </select>`;
}

// 生成停车场下拉（异步）
function parkingSelectHtmlFromList(parkings, selectedId) {
  return `<select name="location" class="w-full px-3 py-2 border rounded" required>
    <option value="">请选择</option>
    ${parkings.map(p => `<option value="${p.id}"${selectedId == p.id ? " selected" : ""}>${p.name}</option>`).join("")}
  </select>`;
}

// 添加车位按钮事件
const addSlotBtn = document.getElementById("addSlotBtn");
if (addSlotBtn) {
  addSlotBtn.addEventListener("click", () => {
    // 并行加载车位类型和停车场数据
    Promise.all([
      fetch("/api/reservation/slot_types").then(r => r.json()),
      fetch("/api/parkings").then(r => r.json())
    ]).then(([slotTypeRes, parkingRes]) => {
      const slotTypesList = Array.isArray(slotTypeRes) ? slotTypeRes : [];
      const parkingsList = parkingRes && parkingRes.items ? parkingRes.items : [];
      // 创建表单
      const form = document.createElement("form");
      form.id = "addSlotForm";
      form.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">车位编号</label>
            <input type="text" name="slot_number" required class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">车位名称</label>
            <input type="text" name="name" required class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">类型</label>
            ${slotTypeSelectHtmlFromList(slotTypesList, "")}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">停车场</label>
            ${parkingSelectHtmlFromList(parkingsList, "")}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">计费方式</label>
            <select name="charge_rule" class="w-full px-3 py-2 border rounded" required>
              <option value="hour" selected>小时计费</option>
              <option value="month">按月计费</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">计费价格</label>
            <input type="number" min="0" name="price_per_hour" required class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">状态</label>
            <select name="status" class="w-full px-3 py-2 border rounded" required>
              <option value="free" selected>空闲</option>
              <option value="occupy">占用</option>
              <option value="repair">维护</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">描述</label>
            <textarea name="description" class="w-full px-3 py-2 border rounded"></textarea>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">车位图片（最多上传3张）</label>
            <div class="grid grid-cols-3 gap-2">
              <input type="file" name="avatar1" accept="image/*" class="px-3 py-2 border rounded" />
              <input type="file" name="avatar2" accept="image/*" class="px-3 py-2 border rounded" />
              <input type="file" name="avatar3" accept="image/*" class="px-3 py-2 border rounded" />
            </div>
          </div>
        </div>
        <div class="text-right space-x-2 mt-4">
          <button type="button" id="cancelAddSlot" class="px-4 py-1 bg-gray-400 text-white rounded">取消</button>
          <button type="submit" class="px-4 py-1 bg-green-600 text-white rounded">保存</button>
        </div>
      `;
      const modal = createModal({
        title: "添加车位",
        content: form
      });
      form.querySelector("#cancelAddSlot").addEventListener("click", () => modal.remove());
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        ["avatar1", "avatar2", "avatar3"].forEach(name => {
          const fileInput = form.querySelector(`input[name="${name}"]`);
          if (fileInput && fileInput.files.length === 0) {
            formData.delete(name); // 如果未上传，则删除该字段，避免上传 null 文件
          }
        });

        fetch("/api/reservation/slots/add", {
          method: "POST",
          body: formData
        })
          .then(res => res.json())
          .then(res => {
            alert(res.message || "添加成功");
            modal.remove();
            location.reload();
          });
      });
    });
  });
}

// 通用加载车位详情函数
function loadSlotDetail(id) {
  fetch(`/api/reservation/slots/detail?id=${id}`)
    .then(res => res.json())
    .then(data => {
      const slot = data.data || data;
      // 新增美化弹窗和图片轮播
      const images = [slot.avatar1, slot.avatar2, slot.avatar3]
        .filter(Boolean)
        .map(img => `/static/upload/${img}`);

      const imgBox = document.createElement("div");
      imgBox.className = "relative w-64 h-full overflow-hidden rounded border";
      imgBox.innerHTML = images.length
        ? `<img src="${images[0]}" class="w-full h-full object-cover rounded" id="slotImage" />
           <button id="prevImg" class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white px-2">&#9664;</button>
           <button id="nextImg" class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white px-2">&#9654;</button>`
        : `<div class="flex items-center justify-center h-full text-gray-500">无图片</div>`;

      const infoBox = document.createElement("div");
      infoBox.className = "flex-1";
      infoBox.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>车位编号：</strong>${slot.slot_number || ""}</div>
          <div><strong>车位名称：</strong>${slot.name || ""}</div>
          <div><strong>类型：</strong>${slot.type_name || ""}</div>
          <div><strong>停车场：</strong>${slot.parking_name || ""}</div>
          <div><strong>计费方式：</strong>${slot.charge_rule || ""}</div>
          <div><strong>计费价格：</strong>${slot.price_per_hour || 0} 元</div>
          <div><strong>状态：</strong>${slot.status || ""}</div>
          <div class="col-span-2"><strong>描述：</strong>${slot.description || ""}</div>
          <div class="col-span-2"><strong>创建时间：</strong>${slot.created_at || ""}</div>
        </div>
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "flex gap-8 items-start w-[90vw]";
      wrapper.appendChild(imgBox);
      wrapper.appendChild(infoBox);
      createModal({ title: "车位详情", content: wrapper });

      // 图片切换逻辑
      let currentImg = 0;
      const updateImage = () => {
        document.getElementById("slotImage").src = images[currentImg];
      };
      document.getElementById("prevImg")?.addEventListener("click", () => {
        currentImg = (currentImg - 1 + images.length) % images.length;
        updateImage();
      });
      document.getElementById("nextImg")?.addEventListener("click", () => {
        currentImg = (currentImg + 1) % images.length;
        updateImage();
      });
    });
}

// 查看车位详情按钮事件
const viewSlotBtn = document.getElementById("viewSlotBtn");
if (viewSlotBtn) {
  viewSlotBtn.addEventListener("click", () => {
    const checked = document.querySelector("input[name='slotCheckbox']:checked");
    if (!checked) {
      alert("请先选择一个车位");
      return;
    }
    loadSlotDetail(checked.value);
  });
}

// 编辑车位按钮事件
const editSlotBtn = document.getElementById("editSlotBtn");
if (editSlotBtn) {
  editSlotBtn.addEventListener("click", () => {
    const checked = document.querySelector("input[name='slotCheckbox']:checked");
    if (!checked) {
      alert("请先选择一个车位");
      return;
    }
    fetch(`/api/reservation/slots/detail?id=${checked.value}`)
      .then(res => res.json())
      .then(data => {
        const slot = data;  // 接口直接返回对象而非 { data: {...} }
        if (!slot || !slot.id) {
          alert("获取详情失败");
          return;
        }
        // 并行加载车位类型和停车场数据
        Promise.all([
          fetch("/api/reservation/slot_types").then(r => r.json()),
          fetch("/api/parkings").then(r => r.json())
        ]).then(([slotTypeRes, parkingRes]) => {
          const slotTypesList = Array.isArray(slotTypeRes) ? slotTypeRes : [];
          const parkingsList = parkingRes && parkingRes.items ? parkingRes.items : [];
          // 创建表单
          const form = document.createElement("form");
          form.id = "editSlotForm";
          form.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">车位编号</label>
                <input type="text" name="slot_number" required class="w-full px-3 py-2 border rounded" value="${slot.slot_number || ""}" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">车位名称</label>
                <input type="text" name="name" required readonly class="w-full px-3 py-2 border rounded bg-gray-100" value="${slot.name || ""}" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">类型</label>
                ${slotTypeSelectHtmlFromList(slotTypesList, slot.type_id || "")}
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">停车场</label>
                ${parkingSelectHtmlFromList(parkingsList, slot.location || "")}
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">计费方式</label>
                <select name="charge_rule" class="w-full px-3 py-2 border rounded" required>
                  <option value="hour"${slot.charge_rule === "hour" ? " selected" : ""}>小时计费</option>
                  <option value="month"${slot.charge_rule === "month" ? " selected" : ""}>按月计费</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">计费价格</label>
                <input type="number" min="0" name="price_per_hour" required class="w-full px-3 py-2 border rounded" value="${slot.price_per_hour || 0}" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">状态</label>
                <select name="status" class="w-full px-3 py-2 border rounded" required>
                  <option value="free"${slot.status === "free" ? " selected" : ""}>空闲</option>
                  <option value="occupy"${slot.status === "occupy" ? " selected" : ""}>占用</option>
                  <option value="repair"${slot.status === "repair" ? " selected" : ""}>维修</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">描述</label>
                <textarea name="description" class="w-full px-3 py-2 border rounded">${slot.description || ""}</textarea>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium mb-1">车位图片（最多上传3张）</label>
                <div class="grid grid-cols-3 gap-2">
                  <input type="file" name="avatar1" accept="image/*" class="px-3 py-2 border rounded" />
                  <input type="file" name="avatar2" accept="image/*" class="px-3 py-2 border rounded" />
                  <input type="file" name="avatar3" accept="image/*" class="px-3 py-2 border rounded" />
                </div>
              </div>
            </div>
            <div class="text-right space-x-2 mt-4">
              <button type="button" id="cancelEditSlot" class="px-4 py-1 bg-gray-400 text-white rounded">取消</button>
              <button type="submit" class="px-4 py-1 bg-green-600 text-white rounded">保存</button>
            </div>
          `;
          const modal = createModal({
            title: "编辑车位",
            content: form
          });
          form.querySelector("#cancelEditSlot").addEventListener("click", () => modal.remove());
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            formData.append("id", checked.value);

            ["avatar1", "avatar2", "avatar3"].forEach(name => {
              const fileInput = form.querySelector(`input[name="${name}"]`);
              if (fileInput && fileInput.files.length === 0) {
                formData.delete(name);
              }
            });

            fetch("/api/reservation/slots/edit", {
              method: "POST",
              body: formData
            })
              .then(res => res.json())
              .then(res => {
                alert(res.message || "修改成功");
                modal.remove();
                location.reload();
              });
          });
        });
      });
  });
}

// 删除车位按钮事件
const deleteSlotBtn = document.getElementById("deleteSlotBtn");
if (deleteSlotBtn) {
  deleteSlotBtn.addEventListener("click", () => {
    const checked = document.querySelector("input[name='slotCheckbox']:checked");
    if (!checked) {
      alert("请先选择一个车位");
      return;
    }
    if (confirm("确定要删除该车位吗？")) {
      fetch(`/api/reservation/slots/delete?id=${checked.value}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(res => {
          alert(res.message || "删除成功");
          location.reload();
        });
    }
  });
}

  // 绑定所有 .detail-btn 按钮点击事件（事件委托，兼容动态添加）
  document.body.addEventListener("click", (e) => {
    if (e.target.matches(".detail-btn")) {
      const id = e.target.getAttribute("data-id");
      if (id) loadSlotDetail(id);
    }
  });