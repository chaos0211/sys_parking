// entry-management.js
class EntryManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.totalItems = 0;
        this.entries = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadEntries();
    }

    bindEvents() {
        // 按钮事件绑定（仅在按钮存在时绑定，避免按钮被隐藏或移除时报错）
        const addBtn = document.getElementById('addEntryBtn');
        const viewBtn = document.getElementById('viewEntryBtn');
        const approveBtn = document.getElementById('approveEntryBtn');
        const rejectBtn = document.getElementById('rejectEntryBtn');

        if (addBtn) addBtn.addEventListener('click', () => this.showAddModal());
        if (viewBtn) viewBtn.addEventListener('click', () => this.showMessage('请在操作列中点击详情按钮查看具体信息', 'info'));
        if (approveBtn) approveBtn.addEventListener('click', () => this.batchApprove());
        if (rejectBtn) rejectBtn.addEventListener('click', () => this.batchReject());
    }

    // 加载入场记录列表
    async loadEntries() {
        try {
            const response = await fetch(`/api/reservation/entry?page=${this.currentPage}&page_size=${this.pageSize}`);
            const data = await response.json();

            if (response.ok) {
                this.entries = data.items;
                this.totalItems = data.total;
                this.totalPages = Math.ceil(data.total / this.pageSize);
                this.renderTable();
                this.renderPagination();
            } else {
                this.showMessage('加载入场记录失败', 'error');
            }
        } catch (error) {
            console.error('Error loading entries:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 渲染表格
    renderTable() {
        const tbody = document.getElementById('entryTableBody');
        tbody.innerHTML = '';

        // 排序逻辑：待审核优先，然后已通过/已拒绝，然后按id升序
        this.entries.sort((a, b) => {
            const statusPriority = {
                '待审核': 1,
                '已通过': 2,
                '已拒绝': 2
            };

            const aPriority = statusPriority[a.review_status] || 3;
            const bPriority = statusPriority[b.review_status] || 3;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            // 第二排序规则：按 id 升序
            return a.id - b.id;
        });

        this.entries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3">${(this.currentPage - 1) * this.pageSize + index + 1}</td>
                <td class="px-4 py-3 font-medium">${entry.slot_number || 'N/A'}</td>
                <td class="px-4 py-3">${entry.parking_name || 'N/A'}</td>
                <td class="px-4 py-3">${entry.slot_name || 'N/A'}</td>
                <td class="px-4 py-3 text-green-600 font-medium">¥${entry.price_per_hour || 0}/小时</td>
                <td class="px-4 py-3">${entry.username || 'N/A'}</td>
                <td class="px-4 py-3 font-mono">${entry.license_plate || 'N/A'}</td>
                <td class="px-4 py-3">${this.formatDateTime(entry.entry_time)}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getExitStatusClass(entry.exit_status)}">
                        ${this.getExitStatusText(entry.exit_status)}
                    </span>
                </td>
                <td class="px-4 py-3 max-w-32 truncate" title="${entry.review_reply || ''}">
                    ${entry.review_reply || '-'}
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getAuditStatusClass(entry.review_status)}">
                        ${this.getAuditStatusText(entry.review_status)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-1">
                        ${entry.review_status === '待审核' ? `
                            <button onclick="entryManager.showAuditModal(${entry.id})" 
                                    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600" 
                                    title="审核">
                                <i class="fas fa-gavel"></i>
                            </button>
                        ` : ''}
                        <button onclick="entryManager.viewEntry(${entry.id})" 
                                class="px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600" 
                                title="详情">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 渲染分页
    renderPagination() {
        const paginationDiv = document.getElementById('pagination');
        paginationDiv.innerHTML = '';

        if (this.totalPages <= 1) {
            paginationDiv.innerHTML = '<span class="text-gray-500">暂无更多数据</span>';
            return;
        }

        // 首页按钮
        const firstBtn = this.createPageButton('首页', 1, this.currentPage === 1);
        paginationDiv.appendChild(firstBtn);

        // 上一页按钮
        const prevBtn = this.createPageButton('上一页', this.currentPage - 1, this.currentPage === 1);
        paginationDiv.appendChild(prevBtn);

        // 页码按钮
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i.toString(), i, false, i === this.currentPage);
            paginationDiv.appendChild(pageBtn);
        }

        // 下一页按钮
        const nextBtn = this.createPageButton('下一页', this.currentPage + 1, this.currentPage === this.totalPages);
        paginationDiv.appendChild(nextBtn);

        // 末页按钮
        const lastBtn = this.createPageButton('末页', this.totalPages, this.currentPage === this.totalPages);
        paginationDiv.appendChild(lastBtn);

        // 页面信息
        const pageInfo = document.createElement('span');
        pageInfo.className = 'ml-4 text-gray-600';
        pageInfo.textContent = `第 ${this.currentPage} / ${this.totalPages} 页，共 ${this.totalItems} 条记录`;
        paginationDiv.appendChild(pageInfo);
    }

    createPageButton(text, page, disabled, active = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `px-3 py-1 border rounded ${
            disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
            active ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
        }`;

        if (!disabled) {
            button.addEventListener('click', () => this.goToPage(page));
        }

        return button;
    }

    // 分页跳转
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadEntries();
        }
    }

    // 显示添加模态框
    showAddModal() {
        this.showModal('添加入场记录', {
            slot_id: '',
            user_id: '',
            entry_time: new Date().toISOString().slice(0, 16),
            exit_status: 'not_exited',
            review_status: 'pending',
            review_reply: ''
        }, 'add');
    }

    // 查看入场记录详情
    async viewEntry(id) {
        try {
            const response = await fetch(`/api/reservation/entry/detail?id=${id}`);
            const entry = await response.json();

            if (response.ok) {
                this.showModal('入场记录详情', entry, 'view');
            } else {
                this.showMessage('获取入场记录详情失败', 'error');
            }
        } catch (error) {
            console.error('Error fetching entry:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 显示审核模态框
    async showAuditModal(id) {
        try {
            const response = await fetch(`/api/reservation/entry/detail?id=${id}`);
            const entry = await response.json();

            if (response.ok) {
                this.showAuditForm(entry);
            } else {
                this.showMessage('获取入场记录信息失败', 'error');
            }
        } catch (error) {
            console.error('Error fetching entry:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 显示审核表单
    showAuditForm(entry) {
        // 移除现有模态框
        const existingModal = document.getElementById('auditModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'auditModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 class="text-lg font-bold mb-4">审核入场申请</h2>
                <div class="mb-4 p-4 bg-gray-50 rounded">
                    <div class="text-sm space-y-2">
                        <div><span class="font-medium">车位编号：</span>${entry.slot_number || 'N/A'}</div>
                        <div><span class="font-medium">车位位置：</span>${entry.parking_name || 'N/A'}</div>
                        <div><span class="font-medium">用户姓名：</span>${entry.username || 'N/A'}</div>
                        <div><span class="font-medium">车牌号：</span>${entry.license_plate || 'N/A'}</div>
                        <div><span class="font-medium">入场时间：</span>${this.formatDateTime(entry.entry_time)}</div>
                    </div>
                </div>
                <form id="auditForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">审核回复</label>
                        <textarea name="review_reply" rows="3" 
                                  class="w-full border rounded px-3 py-2 text-sm resize-none" 
                                  placeholder="请输入审核意见..."></textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" onclick="this.closest('#auditModal').remove()" 
                                class="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                            取消
                        </button>
                        <button type="button" onclick="entryManager.submitAudit(${entry.id}, 'rejected')" 
                                class="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                            拒绝
                        </button>
                        <button type="button" onclick="entryManager.submitAudit(${entry.id}, 'approved')" 
                                class="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                            通过
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // 提交审核结果
    async submitAudit(id, status) {
        const auditReply = document.querySelector('#auditForm textarea[name="review_reply"]').value.trim();

        if (!auditReply && status === 'rejected') {
            this.showMessage('拒绝时必须填写审核回复', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append("id", id);
            formData.append("review_status", status);
            formData.append("review_reply", auditReply);

            const response = await fetch(`/api/reservation/entry/review`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showMessage(`审核${status === 'approved' ? '通过' : '拒绝'}成功`, 'success');
                document.getElementById('auditModal').remove();
                this.loadEntries();
            } else {
                const error = await response.json();
                this.showMessage(error.detail || '审核失败', 'error');
            }
        } catch (error) {
            console.error('Error submitting audit:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 批量审核通过
    async batchApprove() {
        const pendingEntries = this.entries.filter(entry => entry.review_status === 'pending');

        if (pendingEntries.length === 0) {
            this.showMessage('当前页面没有待审核的记录', 'warning');
            return;
        }

        if (confirm(`确定要批量通过当前页面的 ${pendingEntries.length} 条待审核记录吗？`)) {
            try {
                const promises = pendingEntries.map(entry =>
                    fetch(`/api/reservation/entry/review?id=${entry.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            review_status: 'approved',
                            review_reply: '批量审核通过'
                        })
                    })
                );

                await Promise.all(promises);
                this.showMessage('批量审核通过成功', 'success');
                this.loadEntries();
            } catch (error) {
                console.error('Error batch approving:', error);
                this.showMessage('批量审核失败，请稍后重试', 'error');
            }
        }
    }

    // 批量审核拒绝
    async batchReject() {
        const pendingEntries = this.entries.filter(entry => entry.review_status === 'pending');

        if (pendingEntries.length === 0) {
            this.showMessage('当前页面没有待审核的记录', 'warning');
            return;
        }

        const reason = prompt(`当前页面有 ${pendingEntries.length} 条待审核记录\n请输入拒绝理由：`);
        if (reason === null) return; // 用户取消

        if (!reason.trim()) {
            this.showMessage('拒绝理由不能为空', 'warning');
            return;
        }

        try {
            const promises = pendingEntries.map(entry =>
                fetch(`/api/reservation/entry/review?id=${entry.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        review_status: 'rejected',
                        review_reply: reason.trim()
                    })
                })
            );

            await Promise.all(promises);
            this.showMessage('批量审核拒绝成功', 'success');
            this.loadEntries();
        } catch (error) {
            console.error('Error batch rejecting:', error);
            this.showMessage('批量审核失败，请稍后重试', 'error');
        }
    }

    // 显示通用模态框
    showModal(title, data, mode) {
        // 移除现有模态框
        const existingModal = document.getElementById('entryModal');
        if (existingModal) {
            existingModal.remove();
        }

        const isView = mode === 'view';
        const isAdd = mode === 'add';

        const modal = document.createElement('div');
        modal.id = 'entryModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-96 overflow-y-auto">
                <h2 class="text-lg font-bold mb-4">${title}</h2>
                ${isView ? `
                    <div class="space-y-3 text-sm">
                        <div class="grid grid-cols-2 gap-4">
                            <div><span class="font-medium text-gray-600">车位编号：</span>${data.slot_number || 'N/A'}</div>
                            <div><span class="font-medium text-gray-600">车位位置：</span>${data.parking_name || 'N/A'}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><span class="font-medium text-gray-600">车位名称：</span>${data.slot_name || 'N/A'}</div>
                            <div><span class="font-medium text-gray-600">小时价格：</span>¥${data.price_per_hour || 0}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><span class="font-medium text-gray-600">用户姓名：</span>${data.username || 'N/A'}</div>
                            <div><span class="font-medium text-gray-600">车牌号：</span>${data.license_plate || 'N/A'}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><span class="font-medium text-gray-600">入场时间：</span>${this.formatDateTime(data.entry_time)}</div>
                            <div><span class="font-medium text-gray-600">离场状态：</span>
                                <span class="px-2 py-1 text-xs rounded-full ${this.getExitStatusClass(data.exit_status)}">
                                    ${this.getExitStatusText(data.exit_status)}
                                </span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><span class="font-medium text-gray-600">审核状态：</span>
                                <span class="px-2 py-1 text-xs rounded-full ${this.getAuditStatusClass(data.review_status)}">
                                    ${this.getAuditStatusText(data.review_status)}
                                </span>
                            </div>
                            <div><span class="font-medium text-gray-600">创建时间：</span>${this.formatDateTime(data.created_at)}</div>
                        </div>
                        ${data.review_reply ? `
                            <div class="col-span-2">
                                <span class="font-medium text-gray-600">审核回复：</span>
                                <div class="mt-1 p-2 bg-gray-50 rounded">${data.review_reply}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <form id="entryForm">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">车位ID</label>
                                <input type="number" name="slot_id" value="${data.slot_id || ''}" 
                                       class="w-full border rounded px-3 py-2 text-sm" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">用户ID</label>
                                <input type="number" name="user_id" value="${data.user_id || ''}" 
                                       class="w-full border rounded px-3 py-2 text-sm" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">入场时间</label>
                                <input type="datetime-local" name="entry_time" value="${data.entry_time || ''}" 
                                       class="w-full border rounded px-3 py-2 text-sm" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">离场状态</label>
                                <select name="exit_status" class="w-full border rounded px-3 py-2 text-sm" required>
                                    <option value="not_exited" ${data.exit_status === 'not_exit' ? 'selected' : ''}>未离场</option>
                                    <option value="exited" ${data.exit_status === 'exited' ? 'selected' : ''}>已离场</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">审核状态</label>
                                <select name="review_status" class="w-full border rounded px-3 py-2 text-sm" required>
                                    <option value="pending" ${data.review_status === 'pending' ? 'selected' : ''}>待审核</option>
                                    <option value="approved" ${data.review_status === 'approved' ? 'selected' : ''}>已通过</option>
                                    <option value="rejected" ${data.review_status === 'rejected' ? 'selected' : ''}>已拒绝</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">审核回复</label>
                                <textarea name="review_reply" rows="3" 
                                          class="w-full border rounded px-3 py-2 text-sm resize-none">${data.review_reply || ''}</textarea>
                            </div>
                        </div>
                    </form>
                `}
                <div class="flex justify-end space-x-2 mt-6">
                    <button type="button" onclick="this.closest('#entryModal').remove()" 
                            class="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                        ${isView ? '关闭' : '取消'}
                    </button>
                    ${isAdd ? `
                        <button type="button" onclick="entryManager.handleFormSubmit()" 
                                class="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                            添加
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // 处理表单提交
    async handleFormSubmit() {
        const form = document.getElementById('entryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage('添加成功', 'success');
                document.getElementById('entryModal').remove();
                this.loadEntries();
            } else {
                const error = await response.json();
                this.showMessage(error.detail || '添加失败', 'error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 工具方法
    getExitStatusClass(status) {
        return status === '已离场' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    }

    getExitStatusText(status) {
        if (status === '未离场') return '未离场';
        if (status === '已离场') return '已离场';
        return status;
    }

    getAuditStatusClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getAuditStatusText(status) {
        const texts = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return texts[status] || status;
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showMessage(message, type) {
        // 移除现有消息
        const existingMessage = document.getElementById('message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.className = `fixed top-4 right-4 px-4 py-2 rounded text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // 3秒后自动消失
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// 初始化入场管理器
let entryManager;
document.addEventListener('DOMContentLoaded', () => {
    entryManager = new EntryManager();
});