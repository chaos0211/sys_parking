// reservation-management.js
class ReservationManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.selectedIds = new Set();
        this.reservations = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReservations();
    }

    bindEvents() {
        // 按钮事件绑定
        document.getElementById('addReservationBtn').addEventListener('click', () => this.showAddModal());
        document.getElementById('viewReservationBtn').addEventListener('click', () => this.viewSelected());
        document.getElementById('editReservationBtn').addEventListener('click', () => this.editSelected());
        document.getElementById('deleteReservationBtn').addEventListener('click', () => this.deleteSelected());

        // 全选复选框事件
        document.addEventListener('change', (e) => {
            if (e.target.id === 'selectAll') {
                this.toggleSelectAll(e.target.checked);
            } else if (e.target.classList.contains('row-checkbox')) {
                this.toggleRowSelection(e.target.value, e.target.checked);
            }
        });
    }

    // 加载预约列表
    async loadReservations() {
        try {
            const response = await fetch(`/api/reservation/reserve?page=${this.currentPage}&page_size=${this.pageSize}`);
            const data = await response.json();
            
            if (response.ok) {
                this.reservations = data.items;
                this.totalPages = Math.ceil(data.total / this.pageSize);
                this.renderTable();
                this.renderPagination();
            } else {
                this.showMessage('加载预约列表失败', 'error');
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 渲染表格
    renderTable() {
        const tbody = document.querySelector('#reservationTable tbody') || this.createTableBody();
        tbody.innerHTML = '';

        this.reservations.forEach((reservation, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3 border-b">
                    <input type="checkbox" class="row-checkbox" value="${reservation.id}" 
                           ${this.selectedIds.has(reservation.id.toString()) ? 'checked' : ''}>
                </td>
                <td class="px-4 py-3 border-b">${(this.currentPage - 1) * this.pageSize + index + 1}</td>
                <td class="px-4 py-3 border-b">${reservation.slot_number}</td>
                <td class="px-4 py-3 border-b">${reservation.parking_name}</td>
                <td class="px-4 py-3 border-b">${reservation.slot_name}</td>
                <td class="px-4 py-3 border-b">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getTypeClass(reservation.slot_type)}">
                        ${this.getTypeText(reservation.slot_type)}
                    </span>
                </td>
                <td class="px-4 py-3 border-b">${reservation.license_plate}</td>
                <td class="px-4 py-3 border-b">${this.formatDateTime(reservation.reserved_at)}</td>
                <td class="px-4 py-3 border-b">${this.formatDateTime(reservation.updated_at)}</td>
                <td class="px-4 py-3 border-b">
                    <button onclick="reservationManager.viewReservation(${reservation.id})" 
                            class="px-2 py-1 bg-blue-500 text-white rounded text-xs mr-1 hover:bg-blue-600">
                        查看
                    </button>
                    <button onclick="reservationManager.editReservation(${reservation.id})" 
                            class="px-2 py-1 bg-yellow-500 text-white rounded text-xs mr-1 hover:bg-yellow-600">
                        编辑
                    </button>
                    <button onclick="reservationManager.deleteReservation(${reservation.id})" 
                            class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateSelectAllCheckbox();
    }

    createTableBody() {
        const table = document.querySelector('.min-w-full');
        if (!table.querySelector('tbody')) {
            const tbody = document.createElement('tbody');
            tbody.id = 'reservationTableBody';
            table.appendChild(tbody);
        }
        return table.querySelector('tbody');
    }

    // 渲染分页
    renderPagination() {
        let paginationDiv = document.getElementById('pagination');
        if (!paginationDiv) {
            paginationDiv = document.createElement('div');
            paginationDiv.id = 'pagination';
            paginationDiv.className = 'mt-4 flex justify-between items-center';
            document.querySelector('.overflow-x-auto').parentNode.appendChild(paginationDiv);
        }

        paginationDiv.innerHTML = `
            <div class="text-sm text-gray-700">
                显示第 ${(this.currentPage - 1) * this.pageSize + 1} - ${Math.min(this.currentPage * this.pageSize, this.reservations.length)} 条，
                共 ${this.totalPages} 页
            </div>
            <div class="flex space-x-2">
                <button onclick="reservationManager.goToPage(1)" 
                        class="px-3 py-1 border rounded text-sm ${this.currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}"
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    首页
                </button>
                <button onclick="reservationManager.goToPage(${this.currentPage - 1})" 
                        class="px-3 py-1 border rounded text-sm ${this.currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}"
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    上一页
                </button>
                <span class="px-3 py-1 border rounded text-sm bg-blue-500 text-white">
                    ${this.currentPage}
                </span>
                <button onclick="reservationManager.goToPage(${this.currentPage + 1})" 
                        class="px-3 py-1 border rounded text-sm ${this.currentPage === this.totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}"
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    下一页
                </button>
                <button onclick="reservationManager.goToPage(${this.totalPages})" 
                        class="px-3 py-1 border rounded text-sm ${this.currentPage === this.totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}"
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    末页
                </button>
            </div>
        `;
    }

    // 分页跳转
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.selectedIds.clear();
            this.loadReservations();
        }
    }

    // 显示添加模态框
    showAddModal() {
        this.showModal('添加预约', {
            slot_id: '',
            license_plate: '',
            reservation_time: ''
        }, 'add');
    }

    // 查看选中的预约
    viewSelected() {
        if (this.selectedIds.size === 0) {
            this.showMessage('请先选择要查看的预约', 'warning');
            return;
        }
        if (this.selectedIds.size > 1) {
            this.showMessage('请只选择一个预约进行查看', 'warning');
            return;
        }
        const id = Array.from(this.selectedIds)[0];
        this.viewReservation(parseInt(id));
    }

    // 编辑选中的预约
    editSelected() {
        if (this.selectedIds.size === 0) {
            this.showMessage('请先选择要编辑的预约', 'warning');
            return;
        }
        if (this.selectedIds.size > 1) {
            this.showMessage('请只选择一个预约进行编辑', 'warning');
            return;
        }
        const id = Array.from(this.selectedIds)[0];
        this.editReservation(parseInt(id));
    }

    // 删除选中的预约
    async deleteSelected() {
        if (this.selectedIds.size === 0) {
            this.showMessage('请先选择要删除的预约', 'warning');
            return;
        }

        if (confirm(`确定要删除选中的 ${this.selectedIds.size} 个预约吗？`)) {
            try {
                const deletePromises = Array.from(this.selectedIds).map(id =>
                    fetch(`/api/reservations/${id}`, { method: 'DELETE' })
                );

                await Promise.all(deletePromises);
                this.showMessage('删除成功', 'success');
                this.selectedIds.clear();
                this.loadReservations();
            } catch (error) {
                console.error('Error deleting reservations:', error);
                this.showMessage('删除失败，请稍后重试', 'error');
            }
        }
    }

    // 查看单个预约
    async viewReservation(id) {
        try {
            const response = await fetch(`/api/reservations/${id}`);
            const reservation = await response.json();

            if (response.ok) {
                this.showModal('预约详情', reservation, 'view');
            } else {
                this.showMessage('获取预约详情失败', 'error');
            }
        } catch (error) {
            console.error('Error fetching reservation:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 编辑单个预约
    async editReservation(id) {
        try {
            const response = await fetch(`/api/reservations/${id}`);
            const reservation = await response.json();

            if (response.ok) {
                this.showModal('编辑预约', reservation, 'edit');
            } else {
                this.showMessage('获取预约信息失败', 'error');
            }
        } catch (error) {
            console.error('Error fetching reservation:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 删除单个预约
    async deleteReservation(id) {
        if (confirm('确定要删除这个预约吗？')) {
            try {
                const response = await fetch(`/api/reservations/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.showMessage('删除成功', 'success');
                    this.loadReservations();
                } else {
                    this.showMessage('删除失败', 'error');
                }
            } catch (error) {
                console.error('Error deleting reservation:', error);
                this.showMessage('网络错误，请稍后重试', 'error');
            }
        }
    }

    // 显示模态框
    showModal(title, data, mode) {
        // 移除现有模态框
        const existingModal = document.getElementById('reservationModal');
        if (existingModal) {
            existingModal.remove();
        }

        const isView = mode === 'view';
        const isEdit = mode === 'edit';
        const isAdd = mode === 'add';

        const modal = document.createElement('div');
        modal.id = 'reservationModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 class="text-lg font-bold mb-4">${title}</h2>
                <form id="reservationForm">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">车位</label>
                            <select name="slot_id" id="slotSelect" class="w-full border rounded px-3 py-2 text-sm" ${isView ? 'disabled' : ''} required></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">车牌号</label>
                            <div class="flex space-x-2">
                                <input type="text" name="license_plate" value="${data.license_plate || ''}" 
                                       class="w-full border rounded px-3 py-2 text-sm" ${isView ? 'readonly' : ''} required>
                                ${!isView ? `<button type="button" id="generatePlate" class="px-3 py-1 bg-gray-200 rounded text-sm">生成</button>` : ''}
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">预约时间</label>
                            <input type="datetime-local" name="reservation_time" 
                                   value="${data.reservation_time ? this.formatDateTimeInput(data.reservation_time) : ''}" 
                                   class="w-full border rounded px-3 py-2 text-sm" ${isView ? 'readonly' : ''} required>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-2 mt-6">
                        <button type="button" onclick="this.closest('#reservationModal').remove()" 
                                class="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                            ${isView ? '关闭' : '取消'}
                        </button>
                        ${!isView ? `
                            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                ${isAdd ? '添加' : '保存'}
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // 填充下拉框选项与生成车牌号按钮逻辑
        if (!isView) {
            fetch('/api/reservation/slots')
                .then(res => res.json())
                .then(res => {
                    const slotSelect = modal.querySelector('#slotSelect');
                    res.items.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot.id;
                        option.textContent = `${slot.id} - ${slot.name}`;
                        if (data.slot_id == slot.id) option.selected = true;
                        slotSelect.appendChild(option);
                    });
                });

            const genBtn = modal.querySelector('#generatePlate');
            if (genBtn) {
                genBtn.addEventListener('click', () => {
                    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const nums = Math.floor(Math.random() * 9000 + 1000);
                    const plate = '苏' + letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)] + nums;
                    modal.querySelector('input[name="license_plate"]').value = plate;
                });
            }
        }

        // 绑定表单提交事件
        if (!isView) {
            document.getElementById('reservationForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(e.target, mode, data.id);
            });
        }
    }

    // 处理表单提交
    async handleFormSubmit(form, mode, id) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const url = mode === 'add' ? '/api/reservation/reserve/add' : `/api/reservations/${id}`;
            const method = mode === 'add' ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage(mode === 'add' ? '添加成功' : '更新成功', 'success');
                document.getElementById('reservationModal').remove();
                this.loadReservations();
            } else {
                const error = await response.json();
                this.showMessage(error.detail || '操作失败', 'error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 选择相关方法
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                this.selectedIds.add(cb.value);
            } else {
                this.selectedIds.delete(cb.value);
            }
        });
    }

    toggleRowSelection(id, checked) {
        if (checked) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
        this.updateSelectAllCheckbox();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAll');
        if (!selectAllCheckbox) {
            // 创建全选复选框
            const headerCheckbox = document.createElement('input');
            headerCheckbox.type = 'checkbox';
            headerCheckbox.id = 'selectAll';
            const firstHeaderCell = document.querySelector('thead th');
            if (firstHeaderCell && !firstHeaderCell.querySelector('#selectAll')) {
                firstHeaderCell.innerHTML = '<input type="checkbox" id="selectAll">';
            }
            return;
        }

        const visibleCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCount = Array.from(visibleCheckboxes).filter(cb => cb.checked).length;
        
        selectAllCheckbox.checked = visibleCheckboxes.length > 0 && checkedCount === visibleCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < visibleCheckboxes.length;
    }

    // 工具方法
    getTypeClass(type) {
        const classes = {
            'standard': 'bg-blue-100 text-blue-800',
            'compact': 'bg-green-100 text-green-800',
            'large': 'bg-purple-100 text-purple-800',
            'electric': 'bg-yellow-100 text-yellow-800'
        };
        return classes[type] || 'bg-gray-100 text-gray-800';
    }

    getTypeText(type) {
        const texts = {
            'standard': '标准车位',
            'compact': '紧凑车位',
            'large': '大型车位',
            'electric': '充电车位'
        };
        return texts[type] || type;
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

    formatDateTimeInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
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

// 初始化预约管理器
let reservationManager;
document.addEventListener('DOMContentLoaded', () => {
    reservationManager = new ReservationManager();
});