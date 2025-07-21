// static/js/users.js

document.addEventListener('DOMContentLoaded', function () {
  let currentPage = 1;
  let currentRole = 'all';
  const pageSize = 10;
  const userTableBodyMap = {
    all: document.getElementById('userTableBody-all'),
    admin: document.getElementById('userTableBody-admin'),
    security: document.getElementById('userTableBody-security'),
    user: document.getElementById('userTableBody-user'),
  };
  const pageIndicator = document.getElementById('pageIndicator');

  function fetchUsers(page = 1, role = 'all') {
    const url = role === 'all'
      ? `/api/users?page=${page}&size=${pageSize}`
      : `/api/users?role=${role}&page=${page}&size=${pageSize}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log('获取到用户数据:', data);
        console.log('API返回的完整数据结构:', data);
        const users = Array.isArray(data.users) ? data.users : [];
        const total = typeof data.total === 'number' ? data.total : users.length;
        const key = role === 'all' ? 'all' : role;
        const tbody = userTableBodyMap[key];

        Object.keys(userTableBodyMap).forEach(key => {
          const section = document.getElementById(`userTableSection-${key}`);
          if (section) section.classList.add('hidden');
        });
        const visibleSection = document.getElementById(`userTableSection-${key}`);
        if (visibleSection) visibleSection.classList.remove('hidden');

        tbody.innerHTML = '';
        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">暂无数据</td></tr>';
          pageIndicator.textContent = `第 ${page} 页 / 共 1 页`;
          renderPaginationControls(1, 1);
          return;
        }
        console.log('渲染前的用户数据:', users);
        users.forEach((user, index) => {
          console.log('渲染用户:', user);
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="px-3 py-2 text-center">
              <input type="radio" name="userSelect" value="${user.id}" />
            </td>
            <td class="px-3 py-2">${(page - 1) * pageSize + index + 1}</td>
            <td class="px-3 py-2">${user.username}</td>
            <td class="px-3 py-2">${user.name}</td>
            <td class="px-3 py-2">
              <img src="/upload/${user.avatar1 || user.avatar2 || user.avatar3 || 'default.png'}" alt="头像" class="w-8 h-8 rounded-full object-cover" />
            </td>
            <td class="px-3 py-2">${user.gender}</td>
            <td class="px-3 py-2">${user.phone}</td>
            <td class="px-3 py-2">${user.plate}</td>
            <td class="px-3 py-2">
              <button class="text-blue-600 hover:underline" onclick="showUserDetail(${encodeURIComponent(JSON.stringify(user))})">详情</button>
            </td>
          `;
          tbody.appendChild(tr);
        });

        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        pageIndicator.textContent = `第 ${page} 页 / 共 ${totalPages} 页`;
        renderPaginationControls(page, totalPages);
      })
      .catch(err => {
        console.error('加载用户失败', err);
      });
  }

  function renderPaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.classList.add('mx-1', 'px-2', 'py-1', 'border', 'rounded');
      if (i === currentPage) {
        btn.classList.add('bg-blue-600', 'text-white');
      } else {
        btn.classList.add('bg-white', 'text-gray-700');
        btn.addEventListener('click', () => {
          fetchUsers(i, currentRole);
        });
      }
      paginationContainer.appendChild(btn);
    }
  }

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchUsers(currentPage, currentRole);
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    fetchUsers(currentPage, currentRole);
  });

  document.querySelectorAll('#userTabs button').forEach(button => {
    button.addEventListener('click', function () {
      document.querySelectorAll('#userTabs button').forEach(btn => btn.classList.remove('text-blue-600', 'border-blue-600', 'active'));
      this.classList.add('text-blue-600', 'border-blue-600', 'active');
      const selectedRole = this.dataset.tab;
      currentRole = selectedRole;
      currentPage = 1;
      fetchUsers(currentPage, selectedRole);
    });
  });

  window.showUserDetail = function (userDataStr) {
  const user = typeof userDataStr === 'string' ? JSON.parse(decodeURIComponent(userDataStr)) : userDataStr;
    document.getElementById('detail-avatar').src = `/upload/${user.avatar1 || user.avatar2 || user.avatar3 || 'default.png'}`;
    document.getElementById('detail-username').textContent = user.username;
    document.getElementById('detail-name').textContent = user.name;
    document.getElementById('detail-gender').textContent = user.gender;
    document.getElementById('detail-phone').textContent = user.phone;
    document.getElementById('detail-plate').textContent = user.plate;
    document.getElementById('userDetailModal').classList.remove('hidden');
  };

  window.closeModal = function (id) {
    document.getElementById(id).classList.add('hidden');
  };

  fetchUsers(currentPage, currentRole);
});