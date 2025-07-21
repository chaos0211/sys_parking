document.addEventListener('DOMContentLoaded', function () {
  // 插入添加用户模态框HTML
  const modalHTML = `
<div id="addUserModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden">
  <div class="bg-white p-6 rounded w-[500px] shadow-md">
    <h2 class="text-lg font-semibold mb-4">添加用户</h2>
    <form id="addUserForm" enctype="multipart/form-data">
      <div class="space-y-4">
        <input required type="text" name="username" placeholder="用户名" class="w-full border px-3 py-2 rounded" />
        <input required type="password" name="password" placeholder="密码" class="w-full border px-3 py-2 rounded" />
        <input type="text" name="name" placeholder="姓名" class="w-full border px-3 py-2 rounded" />
        <select name="gender" class="w-full border px-3 py-2 rounded">
          <option value="男">男</option>
          <option value="女">女</option>
          <option value="保密">保密</option>
        </select>
        <select name="role" class="w-full border px-3 py-2 rounded">
          <option value="admin">管理员</option>
          <option value="security">保安</option>
          <option value="user" selected>用户</option>
        </select>
        <input type="text" name="phone" placeholder="手机号" class="w-full border px-3 py-2 rounded" />
        <input type="text" name="plate" placeholder="车牌号" class="w-full border px-3 py-2 rounded" />
        <input type="file" name="avatar1" />
        <input type="file" name="avatar2" />
        <input type="file" name="avatar3" />
      </div>
      <div class="flex justify-end mt-4 gap-4">
        <button type="button" id="cancelAddUser" class="px-4 py-2 bg-gray-300 rounded">取消</button>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">提交</button>
      </div>
    </form>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const detailModalHTML = `
  <div id="userDetailModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden">
    <div class="bg-white p-6 rounded w-[600px] shadow-md flex gap-6">
      <img id="detail-avatar" src="/static/upload/default.png" class="w-32 h-32 rounded-full object-cover border" alt="用户头像" />
      <div class="flex-1 space-y-2 text-sm">
        <p><strong>ID：</strong><span id="detail-id"></span></p>
        <p><strong>用户名：</strong><span id="detail-username"></span></p>
        <p><strong>姓名：</strong><span id="detail-name"></span></p>
        <p><strong>性别：</strong><span id="detail-gender"></span></p>
        <p><strong>手机号：</strong><span id="detail-phone"></span></p>
        <p><strong>车牌号：</strong><span id="detail-plate"></span></p>
        <p><strong>角色：</strong><span id="detail-role"></span></p>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', detailModalHTML);

  const editModalHTML = `
  <div id="editUserModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden">
    <div class="bg-white p-6 rounded w-[500px] shadow-md">
      <h2 class="text-lg font-semibold mb-4">修改用户</h2>
      <form id="editUserForm" enctype="multipart/form-data">
        <input type="hidden" name="id" />
        <div class="space-y-4">
          <input type="text" name="username" placeholder="用户名" class="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed" disabled />
          <input type="password" name="password" placeholder="密码（留空表示不修改）" class="w-full border px-3 py-2 rounded" />
          <input type="text" name="name" placeholder="姓名" class="w-full border px-3 py-2 rounded" />
          <select name="gender" class="w-full border px-3 py-2 rounded">
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="保密">保密</option>
          </select>
          <select name="role" class="w-full border px-3 py-2 rounded">
            <option value="admin">管理员</option>
            <option value="security">保安</option>
            <option value="user">用户</option>
          </select>
          <input type="text" name="phone" placeholder="手机号" class="w-full border px-3 py-2 rounded" />
          <input type="text" name="plate" placeholder="车牌号" class="w-full border px-3 py-2 rounded" />
          <input type="file" name="avatar1" />
          <input type="file" name="avatar2" />
          <input type="file" name="avatar3" />
        </div>
        <div class="flex justify-end mt-4 gap-4">
          <button type="button" id="cancelEditUser" class="px-4 py-2 bg-gray-300 rounded">取消</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">修改</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', editModalHTML);

  // 绑定模态框取消按钮关闭
  document.getElementById('cancelAddUser').addEventListener('click', () => {
    document.getElementById('addUserModal').classList.add('hidden');
  });

  document.getElementById('cancelEditUser').addEventListener('click', () => {
    document.getElementById('editUserModal').classList.add('hidden');
  });

  document.getElementById('userDetailModal')?.addEventListener('click', function (e) {
    if (e.target.id === 'userDetailModal') {
      this.classList.add('hidden');
    }
  });

  // 绑定模态框表单提交
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const resp = await fetch('/api/users/add', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) throw new Error('添加失败');

      alert('添加成功');
      document.getElementById('addUserModal').classList.add('hidden');
      form.reset();

      const role = document.querySelector('.user-tab.text-primary').dataset.role;
      fetchUsersByRole(role);
    } catch (err) {
      alert('添加失败');
    }
  });

  document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const resp = await fetch(`/api/users/${form.id.value}/update`, {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) throw new Error('修改失败');

      alert('修改成功');
      form.reset();
      document.getElementById('editUserModal').classList.add('hidden');
      const role = document.querySelector('.user-tab.text-primary').dataset.role;
      fetchUsersByRole(role);
    } catch {
      alert('修改失败');
    }
  });

  initUserTabSwitch();
  bindTopActions();
  fetchUsersByRole('admin');  // 默认载入管理员
});

function initUserTabSwitch() {
  const tabs = document.querySelectorAll('.user-tab');
  const contents = document.querySelectorAll('.user-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const role = tab.dataset.role;

      // 1. 样式切换
      tabs.forEach(t => {
        t.classList.remove('text-primary', 'border-b-2', 'border-primary');
        t.classList.add('text-gray-500');
      });
      tab.classList.add('text-primary', 'border-b-2', 'border-primary');
      tab.classList.remove('text-gray-500');

      // 2. 内容容器切换
      contents.forEach(c => c.classList.add('hidden'));
      document.getElementById(`${role}-content`).classList.remove('hidden');

      // 3. 加载数据
      fetchUsersByRole(role);
    });
  });
}

function bindTopActions() {
  // Helper to get selected user ids from the active tab
  const getSelectedIds = () => {
    const activeRoleTab = document.querySelector('.user-tab.text-primary');
    if (!activeRoleTab) return [];
    const activeRole = activeRoleTab.dataset.role;
    const checkboxes = document.querySelectorAll(`#${activeRole}-content tbody input[name="user-checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
  };

  // Polyfill for :contains selector (since querySelector doesn't support it natively)
  function queryButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.trim() === text) return btn;
    }
    return null;
  }

  queryButtonByText('添加')?.addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('hidden');
  });

  queryButtonByText('删除')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return alert('请先选择要删除的用户');
    if (!confirm(`确认删除 ${ids.length} 个用户？`)) return;

    Promise.all(ids.map(id => fetch(`/api/users/${id}/delete`, { method: 'DELETE' })))
      .then(() => {
        alert('删除成功');
        const role = document.querySelector('.user-tab.text-primary').dataset.role;
        fetchUsersByRole(role);
      })
      .catch(() => alert('删除失败'));
  });

  queryButtonByText('详情')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) return alert('请选择一个用户查看详情');
    viewDetails(ids[0]);
  });

  queryButtonByText('修改')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) return alert('请选择一个用户进行修改');
    editUser(ids[0]);
  });
}

function fetchUsersByRole(role, page = 1) {
  const size = 10;
  fetch(`/api/users?role=${role}&page=${page}&size=${size}`)
    .then(res => res.json())
    .then(data => renderTable(role, data.users, page, size, data.total))
    .catch(err => console.error(`加载${role}失败`, err));
}

function renderTable(role, users, page, size, total) {
  const container = document.getElementById(`${role}-content`);
  if (!container) return;

  const totalPages = Math.ceil(total / size);

  container.innerHTML = `
    <table class="min-w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="py-3 px-4"><input type="checkbox" /> </th>
          <th class="text-left py-3 px-4">序号</th>
          <th class="text-left py-3 px-4">用户账号</th>
          <th class="text-left py-3 px-4">用户姓名</th>
          <th class="text-left py-3 px-4">头像</th>
          <th class="text-left py-3 px-4">性别</th>
          <th class="text-left py-3 px-4">手机号码</th>
          <th class="text-left py-3 px-4">车牌号</th>
          <th class="text-left py-3 px-4">操作</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-4 px-4"><input type="checkbox" name="user-checkbox" value="${u.id}" onchange="handleCheckboxChange(this)" /></td>
            <td class="py-4 px-4">${u.id}</td>
            <td class="py-4 px-4">${u.username || ''}</td>
            <td class="py-4 px-4">${u.name || ''}</td>
            <td class="py-4 px-4"><img src="/static/upload/${u.avatar1 || 'default.png'}" alt="头像" class="h-10 w-10 rounded-full object-cover" /></td>
            <td class="py-4 px-4">${u.gender || ''}</td>
            <td class="py-4 px-4">${u.phone || ''}</td>
            <td class="py-4 px-4">${u.plate || ''}</td>
            <td class="py-4 px-4">
              <button class="text-primary hover:text-primary/80" onclick="viewDetails(${u.id})">查看详情</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="flex justify-center items-center gap-4 mt-4">
      <button class="px-3 py-1 border rounded ${page <= 1 ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-blue-400'}"
              ${page <= 1 ? 'disabled' : ''}
              onclick="changePage('${role}', ${page - 1})">上一页</button>
      <span>第 ${page} 页</span>
      <button class="px-3 py-1 border rounded ${page >= totalPages ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-blue-400'}"
              ${page >= totalPages ? 'disabled' : ''}
              onclick="changePage('${role}', ${page + 1})">下一页</button>
    </div>
  `;
}

function handleCheckboxChange(checkbox) {
  const checkboxes = document.querySelectorAll('input[name="user-checkbox"]');
  checkboxes.forEach(cb => {
    if (cb !== checkbox) cb.checked = false;
  });
}

function changePage(role, page) {
  fetchUsersByRole(role, page);
}

function editUser(id) {
  fetch(`/api/users/${id}`)
    .then(resp => resp.json())
    .then(user => {
      const form = document.getElementById('editUserForm');
      form.id.value = user.id;
      form.username.value = user.username || '';
      form.password.value = '';
      form.name.value = user.name || '';
      form.gender.value = user.gender || '保密';
      form.role.value = user.role || 'user';
      form.phone.value = user.phone || '';
      form.plate.value = user.plate || '';
      document.getElementById('editUserModal').classList.remove('hidden');
    })
    .catch(() => alert('加载用户信息失败'));
}

function deleteUser(id) {
  if (confirm(`确认删除用户 ${id} 吗？`)) {
    fetch(`/api/users/${id}`, { method: 'DELETE' })
      .then(resp => {
        if (resp.ok) {
          alert('删除成功');
          const role = document.querySelector('.user-tab.text-primary').dataset.role;
          fetchUsersByRole(role);
        } else {
          alert('删除失败');
        }
      });
  }
}

function viewDetails(id) {
  fetch(`/api/users/${id}`)
    .then(resp => resp.json())
    .then(user => {
      document.getElementById('detail-id').textContent = user.id;
      document.getElementById('detail-username').textContent = user.username;
      document.getElementById('detail-name').textContent = user.name;
      document.getElementById('detail-gender').textContent = user.gender;
      document.getElementById('detail-phone').textContent = user.phone;
      document.getElementById('detail-plate').textContent = user.plate;
      document.getElementById('detail-role').textContent = user.role;
      document.getElementById('detail-avatar').src = `/static/upload/${user.avatar1 || 'default.png'}`;
      document.getElementById('userDetailModal').classList.remove('hidden');
    })
    .catch(() => alert('获取详情失败'));
}