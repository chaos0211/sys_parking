document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded 已触发");
    // 顶部按钮事件绑定
    // 等待 #parkingModal 渲染完成再绑定事件
    const waitForModal = setInterval(() => {
        const modal = document.getElementById("parkingModal");
        if (modal) {
            clearInterval(waitForModal);
            document.getElementById("addParkingBtn")?.addEventListener("click", () => {
                modal.classList.remove("hidden");
            });

            // 关闭按钮绑定（支持类名 modal-close）
            modal.querySelectorAll(".modal-close").forEach(btn => {
                btn.addEventListener("click", () => modal.classList.add("hidden"));
            });
        }
    }, 100);

    document.getElementById("viewParkingBtn")?.addEventListener("click", () => {
        const selected = document.querySelector("input[name='parking-select']:checked");
        if (!selected) return alert("请先选择一个停车场");
        viewParking(selected.value);
    });

    document.getElementById("editParkingBtn")?.addEventListener("click", () => {
        const selected = document.querySelector("input[name='parking-select']:checked");
        if (!selected) return alert("请先选择一个停车场");
        editParking(selected.value);
    });

    document.getElementById("deleteParkingBtn")?.addEventListener("click", () => {
        const selected = document.querySelector("input[name='parking-select']:checked");
        if (!selected) return alert("请先选择一个停车场");
        deleteParking(selected.value);
    });

    const tbody = document.querySelector("tbody");
    const loginInfo = document.getElementById("login-info");

    // 获取用户登录信息
    // fetch("/me")
    //     .then(res => res.text())
    //     .then(html => {
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(html, "text/html");
    //         const avatar = doc.querySelector("#topbar-avatar");
    //         const name = doc.querySelector("#topbar-username");
    //         const role = doc.querySelector("#topbar-role");
    //         if (avatar && name && role && loginInfo) {
    //             loginInfo.innerHTML = `
    //                 <img src="${avatar.src}" class="h-8 w-8 rounded-full">
    //                 <span class="ml-2">${name.textContent}（${role.textContent}）</span>
    //             `;
    //         }
    //     });

    // 加载停车场数据
    function loadParkings() {
        fetch("/api/parkings")
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = "";
                data.forEach((p, index) => {
                    const row = document.createElement("tr");
                    row.className = "border-b";
                    row.innerHTML = `
                        <td class="px-4 py-3 text-center whitespace-nowrap">
                            <input type="radio" name="parking-select" value="${p.id}" />
                        </td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.name}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap"><img src="/static/upload/${p.cover || 'default.png'}" class="h-10 w-16 rounded mx-auto" /></td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.floor}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.type}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.slots}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.facilities}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.charge} 元/小时</td>
<!--                        <td class="px-4 py-3 text-center whitespace-nowrap">${p.description}</td>-->
                        <td class="px-4 py-3 text-center whitespace-nowrap">
                            <button class="text-blue-500 hover:underline" onclick="viewParking(${p.id})">详情</button>
                            <button class="text-green-500 hover:underline ml-2" onclick="editParking(${p.id})">修改</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            });
    }

    window.loadParkings = loadParkings;
    loadParkings();

    // 添加停车场
    document.getElementById("add-parking-form")?.addEventListener("submit", function (e) {
        e.preventDefault();
        const form = this;  // 明确保存 form 引用
        const formData = new FormData(form);
        fetch("/api/parkings/add", {
            method: "POST",
            body: formData
        }).then(res => res.json())
          .then(res => {
              alert(res.message);
              loadParkings();
              form.reset();
              document.getElementById("parkingModal").classList.add("hidden");
          });
    });
});

function viewParking(id) {
    fetch(`/api/parkings/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById("view-cover").src = `/static/upload/${p.cover || 'default.png'}`;
            document.getElementById("view-name").textContent = p.name;
            document.getElementById("view-floor").textContent = p.floor;
            document.getElementById("view-type").textContent = p.type;
            document.getElementById("view-slots").textContent = p.slots;
            document.getElementById("view-facilities").textContent = p.facilities;
            document.getElementById("view-charge").textContent = p.charge;
            document.getElementById("view-description").textContent = p.description || "暂无描述";
            document.getElementById("view-modal").classList.remove("hidden");
        });
}

function editParking(id) {
    fetch(`/api/parkings/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById("edit-id").value = p.id;
            document.getElementById("edit-name").value = p.name;
            document.getElementById("edit-floor").value = p.floor;
            document.getElementById("edit-type").value = p.type;
            document.getElementById("edit-slots").value = p.slots;
            document.getElementById("edit-facilities").value = p.facilities;
            document.getElementById("edit-charge").value = p.charge;
            document.getElementById("edit-description").value = p.description;
            const modal = document.getElementById("edit-modal");
            modal.classList.remove("hidden");
            modal.classList.add("flex", "items-center", "justify-center"); // Ensure modal is centered
        });

    // 防止重复绑定
    const form = document.getElementById("edit-parking-form");
    if (form) {
        form.onsubmit = function (e) {
            e.preventDefault();
            const id = document.getElementById("edit-id").value;
            const formData = new FormData(form);
            fetch(`/api/parkings/edit/${id}`, {
                method: "POST",
                body: formData
            }).then(res => res.json())
              .then(res => {
                  const successTip = document.createElement("div");
                  successTip.textContent = res.message;
                  successTip.style.position = "absolute";
                  successTip.style.top = "50%";
                  successTip.style.left = "50%";
                  successTip.style.transform = "translate(-50%, -50%)";
                  successTip.style.backgroundColor = "#4CAF50";
                  successTip.style.color = "white";
                  successTip.style.padding = "10px 20px";
                  successTip.style.borderRadius = "5px";
                  successTip.style.zIndex = "9999";
                  const modal = document.getElementById("edit-modal");
                  modal.appendChild(successTip);
                  setTimeout(() => {
                      successTip.remove();
                      if (window.loadParkings) window.loadParkings();
                      modal.classList.add("hidden");
                  }, 1500);
              });
        };
    }
}

function deleteParking(id) {
    if (!confirm("确定要删除该停车场吗？")) return;
    fetch(`/api/parkings/delete/${id}`, {
        method: "POST"
    }).then(res => res.json())
      .then(res => {
          alert(res.message);
          if (window.loadParkings) window.loadParkings();
      });
}