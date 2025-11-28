// 星币管理系统 JavaScript 核心逻辑

// 全局数据存储
let classes = [];
let students = [];
let currentClass = '';
let editingStudentId = null;
let batchOperation = null;
let pendingExcelData = null;
let selectedImportMode = null;

// 初始化系统
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeDefaultData();
    updateStats();
    renderClassSelect();
    renderStudentsTable();
    showMessage('系统已加载完成', 'success');
    
    // 添加滚动事件监听，用于显示/隐藏浮动操作栏
    window.addEventListener('scroll', handleScroll);
    
    // 初始化浮动操作栏状态
    updateFloatingActions();
});

// 滚动事件处理函数
function handleScroll() {
    const studentOperations = document.querySelector('.student-operations');
    const floatingActions = document.getElementById('floatingActions');
    
    if (!studentOperations || !floatingActions) return;
    
    // 获取操作区域的位置信息
    const operationsRect = studentOperations.getBoundingClientRect();
    
    // 判断操作区域是否被完全遮盖
    const isOperationsHidden = operationsRect.bottom < 0;
    
    // 显示/隐藏浮动操作栏
    if (isOperationsHidden) {
        floatingActions.classList.add('visible');
    } else {
        floatingActions.classList.remove('visible');
    }
}

// 更新浮动操作栏按钮状态
function updateFloatingActions() {
    const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
    const floatingAddBtn = document.getElementById('floatingSelectedAddBtn');
    const floatingSubtractBtn = document.getElementById('floatingSelectedSubtractBtn');
    
    if (floatingAddBtn && floatingSubtractBtn) {
        floatingAddBtn.disabled = selectedCount === 0;
        floatingSubtractBtn.disabled = selectedCount === 0;
    }
}

// 数据持久化
function saveData() {
    const data = {
        classes: classes,
        students: students,
        currentClass: currentClass,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('starCoinSystem', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('starCoinSystem');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            classes = data.classes || [];
            students = data.students || [];
            currentClass = data.currentClass || '';
        } catch (error) {
            console.error('数据加载失败:', error);
            showMessage('数据加载失败，已重置系统', 'warning');
        }
    }
}

// 初始化默认数据
function initializeDefaultData() {
    if (classes.length === 0) {
        classes = [
            { id: 'summer1030', name: '暑假1030' },
            { id: 'spring2024', name: '春季2024' }
        ];
        
        students = [
            { id: generateId(), name: '谭靖宜', classId: 'summer1030', coins: 106 },
            { id: generateId(), name: '李明华', classId: 'summer1030', coins: 85 },
            { id: generateId(), name: '张小雅', classId: 'summer1030', coins: 72 },
            { id: generateId(), name: '王大伟', classId: 'summer1030', coins: 45 },
            { id: generateId(), name: '刘晓敏', classId: 'summer1030', coins: 38 },
            { id: generateId(), name: '陈思涵', classId: 'spring2024', coins: 92 },
            { id: generateId(), name: '林志强', classId: 'spring2024', coins: 67 }
        ];
        
        currentClass = 'all_classes'; // 默认选择所有班级
        saveData();
    }
    
    // 如果当前班级为空，也设置为所有班级
    if (!currentClass) {
        currentClass = 'all_classes';
        saveData();
    }
}

// 生成唯一ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 班级管理功能
function showAddClassModal() {
    document.getElementById('addClassModal').style.display = 'block';
    document.getElementById('newClassName').value = '';
    document.getElementById('newClassName').focus();
}

function closeAddClassModal() {
    document.getElementById('addClassModal').style.display = 'none';
}

function addClass() {
    const className = document.getElementById('newClassName').value.trim();
    
    if (!className) {
        showMessage('请输入班级名称', 'warning');
        return;
    }
    
    if (classes.some(cls => cls.name === className)) {
        showMessage('班级名称已存在', 'warning');
        return;
    }
    
    const newClass = {
        id: generateId(),
        name: className
    };
    
    classes.push(newClass);
    currentClass = newClass.id;
    
    saveData();
    renderClassSelect();
    updateStats();
    renderStudentsTable();
    closeAddClassModal();
    showMessage(`班级"${className}"添加成功`, 'success');
}

// 删除班级功能
function showDeleteClassModal() {
    if (!currentClass || currentClass === 'all_classes') {
        showMessage('请先选择具体的班级', 'warning');
        return;
    }
    
    const currentClassObj = classes.find(cls => cls.id === currentClass);
    if (!currentClassObj) {
        showMessage('班级不存在', 'error');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === currentClass);
    const studentCount = classStudents.length;
    
    // 设置警告信息
    const warningTitle = document.getElementById('deleteWarningTitle');
    const warningMessage = document.getElementById('deleteWarningMessage');
    const studentTransferSection = document.getElementById('studentTransferSection');
    
    if (studentCount > 0) {
        // 有学生的班级
        warningTitle.textContent = '警告：班级内有学生';
        warningMessage.innerHTML = `班级"${currentClassObj.name}"中有 <strong>${studentCount}</strong> 名学生。<br>请选择如何处理这些学生：`;
        studentTransferSection.style.display = 'block';
        
        // 填充目标班级选择器
        fillTransferTargetSelect();
        
        // 默认选择转移模式
        document.querySelector('input[name="deleteOption"][value="transfer"]').checked = true;
    } else {
        // 空班级
        warningTitle.textContent = '确认删除';
        warningMessage.textContent = `即将删除空班级"${currentClassObj.name}"。`;
        studentTransferSection.style.display = 'none';
    }
    
    document.getElementById('deleteClassModal').style.display = 'block';
}

function fillTransferTargetSelect() {
    const select = document.getElementById('transferTargetClass');
    select.innerHTML = '<option value="">请选择目标班级</option>';
    
    // 只显示其他班级（不包括当前要删除的班级）
    classes.forEach(cls => {
        if (cls.id !== currentClass) {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            select.appendChild(option);
        }
    });
}

function closeDeleteClassModal() {
    document.getElementById('deleteClassModal').style.display = 'none';
}

function executeDeleteClass() {
    if (!currentClass || currentClass === 'all_classes') {
        showMessage('请先选择具体的班级', 'warning');
        return;
    }
    
    const currentClassObj = classes.find(cls => cls.id === currentClass);
    if (!currentClassObj) {
        showMessage('班级不存在', 'error');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === currentClass);
    const deleteOption = document.querySelector('input[name="deleteOption"]:checked')?.value;
    
    // 如果有学生且选择了转移模式，检查目标班级
    if (classStudents.length > 0 && deleteOption === 'transfer') {
        const targetClassId = document.getElementById('transferTargetClass').value;
        if (!targetClassId) {
            showMessage('请选择目标班级用于转移学生', 'warning');
            return;
        }
        
        // 检查目标班级中是否有重名学生
        const targetClass = classes.find(cls => cls.id === targetClassId);
        const targetStudents = students.filter(s => s.classId === targetClassId);
        
        const duplicateNames = [];
        classStudents.forEach(student => {
            const isDuplicate = targetStudents.some(targetStudent => 
                targetStudent.name === student.name
            );
            if (isDuplicate) {
                duplicateNames.push(student.name);
            }
        });
        
        if (duplicateNames.length > 0) {
            showMessage(`目标班级"${targetClass.name}"中已有同名学生：${duplicateNames.join('、')}。请选择其他班级或先处理重名问题。`, 'warning');
            return;
        }
        
        // 转移学生
        classStudents.forEach(student => {
            student.classId = targetClassId;
        });
        
        showMessage(`已将 ${classStudents.length} 名学生从"${currentClassObj.name}"转移到"${targetClass.name}"`, 'success');
    } else if (classStudents.length > 0 && deleteOption === 'force') {
        // 强制删除，同时删除学生
        students = students.filter(s => s.classId !== currentClass);
        showMessage(`已删除班级"${currentClassObj.name}"及其 ${classStudents.length} 名学生`, 'warning');
    } else {
        // 空班级直接删除
        showMessage(`已删除空班级"${currentClassObj.name}"`, 'success');
    }
    
    // 删除班级
    classes = classes.filter(cls => cls.id !== currentClass);
    
    // 如果删除的是当前选中的班级，重置选择
    if (classes.length > 0) {
        currentClass = classes[0].id;
    } else {
        currentClass = '';
    }
    
    // 更新界面
    saveData();
    renderClassSelect();
    updateStats();
    renderStudentsTable();
    closeDeleteClassModal();
}

function switchClass() {
    const selectElement = document.getElementById('classSelect');
    currentClass = selectElement.value;
    saveData();
    updateStats();
    renderStudentsTable();
    clearSelection();
    
    // 更新删除按钮状态
    const deleteBtn = document.getElementById('deleteClassBtn');
    if (currentClass && currentClass !== 'all_classes') {
        deleteBtn.disabled = false;
    } else {
        deleteBtn.disabled = true;
    }
    
    const className = getCurrentClassName();
    if (className) {
        showMessage(`已切换到班级：${className}`, 'info');
    }
}

function getCurrentClassName() {
    if (currentClass === 'all_classes') {
        return '所有班级';
    }
    const currentClassObj = classes.find(cls => cls.id === currentClass);
    return currentClassObj ? currentClassObj.name : '';
}

function renderClassSelect() {
    const select = document.getElementById('classSelect');
    select.innerHTML = '<option value="">请选择班级</option><option value="all_classes">📊 所有班级</option>';
    
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        if (cls.id === currentClass) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // 确保"所有班级"选项在当前班级为all_classes时被选中
    if (currentClass === 'all_classes') {
        const allClassesOption = select.querySelector('option[value="all_classes"]');
        if (allClassesOption) {
            allClassesOption.selected = true;
        }
    }
    
    // 更新删除按钮状态
    const deleteBtn = document.getElementById('deleteClassBtn');
    if (currentClass && currentClass !== 'all_classes') {
        deleteBtn.disabled = false;
    } else {
        deleteBtn.disabled = true;
    }
}

// 学生管理功能
function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const coins = parseInt(document.getElementById('initialCoins').value) || 0;
    
    if (!name) {
        showMessage('请输入学生姓名', 'warning');
        return;
    }
    
    if (!currentClass || currentClass === 'all_classes') {
        showMessage('请先选择具体的班级（不能选择“所有班级”）', 'warning');
        return;
    }
    
    // 检查同班级内是否有重名学生
    const existingStudent = students.find(student => 
        student.classId === currentClass && student.name === name
    );
    
    if (existingStudent) {
        showMessage('该班级已有同名学生', 'warning');
        return;
    }
    
    const newStudent = {
        id: generateId(),
        name: name,
        classId: currentClass,
        coins: coins
    };
    
    students.push(newStudent);
    
    // 清空输入框
    document.getElementById('studentName').value = '';
    document.getElementById('initialCoins').value = '0';
    
    saveData();
    updateStats();
    renderStudentsTable();
    showMessage(`学生"${name}"添加成功`, 'success');
}

function deleteStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    if (confirm(`确定要删除学生"${student.name}"吗？`)) {
        students = students.filter(s => s.id !== studentId);
        saveData();
        updateStats();
        renderStudentsTable();
        clearSelection();
        showMessage(`学生"${student.name}"已删除`, 'success');
    }
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    editingStudentId = studentId;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentCoins').value = student.coins;
    
    // 填充班级选择器
    const classSelect = document.getElementById('editStudentClass');
    classSelect.innerHTML = '<option value="">请选择班级</option>';
    
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        if (cls.id === student.classId) {
            option.selected = true;
        }
        classSelect.appendChild(option);
    });
    
    document.getElementById('editStudentModal').style.display = 'block';
}

function closeEditStudentModal() {
    document.getElementById('editStudentModal').style.display = 'none';
    editingStudentId = null;
}

function saveStudentEdit() {
    if (!editingStudentId) return;
    
    const name = document.getElementById('editStudentName').value.trim();
    const coins = parseInt(document.getElementById('editStudentCoins').value) || 0;
    const newClassId = document.getElementById('editStudentClass').value;
    
    if (!name) {
        showMessage('请输入学生姓名', 'warning');
        return;
    }
    
    if (!newClassId) {
        showMessage('请选择班级', 'warning');
        return;
    }
    
    const student = students.find(s => s.id === editingStudentId);
    if (!student) return;
    
    // 检查是否与其他学生重名（在目标班级中）
    const existingStudent = students.find(s => 
        s.id !== editingStudentId && 
        s.classId === newClassId && 
        s.name === name
    );
    
    if (existingStudent) {
        const targetClass = classes.find(cls => cls.id === newClassId);
        const targetClassName = targetClass ? targetClass.name : '未知班级';
        showMessage(`班级"${targetClassName}"已有同名学生`, 'warning');
        return;
    }
    
    // 检查是否进行了转班操作
    const originalClass = classes.find(cls => cls.id === student.classId);
    const newClass = classes.find(cls => cls.id === newClassId);
    const isClassChanged = student.classId !== newClassId;
    
    // 更新学生信息
    student.name = name;
    student.coins = coins;
    student.classId = newClassId;
    
    saveData();
    updateStats();
    renderStudentsTable();
    closeEditStudentModal();
    
    // 显示适当的成功信息
    if (isClassChanged) {
        const originalClassName = originalClass ? originalClass.name : '未知班级';
        const newClassName = newClass ? newClass.name : '未知班级';
        showMessage(`学生"${name}"已从"${originalClassName}"转入"${newClassName}"`, 'success');
    } else {
        showMessage(`学生信息已更新`, 'success');
    }
}

// 星币操作功能
function addCoinsToStudent(studentId, amount = 1) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.coins += amount;
        saveData();
        updateStats();
        renderStudentsTable();
        showMessage(`${student.name} +${amount} 星币`, 'success');
    }
}

function subtractCoinsFromStudent(studentId, amount = 1) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.coins = student.coins - amount;
        saveData();
        updateStats();
        renderStudentsTable();
        showMessage(`${student.name} -${amount} 星币`, 'warning');
    }
}

// 批量操作功能
function batchAddCoins() {
    if (!currentClass || currentClass === 'all_classes') {
        showMessage('请先选择具体的班级（不能选择“所有班级”）', 'warning');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === currentClass);
    if (classStudents.length === 0) {
        showMessage('当前班级没有学生', 'warning');
        return;
    }
    
    batchOperation = 'addAll';
    showBatchModal('全班加星币', `为 ${getCurrentClassName()} 班级的所有 ${classStudents.length} 名学生加星币`);
}

function batchSubtractCoins() {
    if (!currentClass || currentClass === 'all_classes') {
        showMessage('请先选择具体的班级（不能选择“所有班级”）', 'warning');
        return;
    }
    
    const classStudents = students.filter(s => s.classId === currentClass);
    if (classStudents.length === 0) {
        showMessage('当前班级没有学生', 'warning');
        return;
    }
    
    batchOperation = 'subtractAll';
    showBatchModal('全班减星币', `为 ${getCurrentClassName()} 班级的所有 ${classStudents.length} 名学生减星币`);
}

function selectedAddCoins() {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
        showMessage('请先选择学生', 'warning');
        return;
    }
    
    batchOperation = 'addSelected';
    const studentNames = selectedStudents.map(s => s.name).join('、');
    showBatchModal('选中加星币', `为选中的 ${selectedStudents.length} 名学生（${studentNames}）加星币`);
}

function selectedSubtractCoins() {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
        showMessage('请先选择学生', 'warning');
        return;
    }
    
    batchOperation = 'subtractSelected';
    const studentNames = selectedStudents.map(s => s.name).join('、');
    showBatchModal('选中减星币', `为选中的 ${selectedStudents.length} 名学生（${studentNames}）减星币`);
}

function showBatchModal(title, info) {
    document.getElementById('batchModalTitle').textContent = title;
    document.getElementById('batchTargetInfo').textContent = info;
    document.getElementById('batchCoinsInput').value = '1';
    document.getElementById('batchModal').style.display = 'block';
    document.getElementById('batchCoinsInput').focus();
}

function closeBatchModal() {
    document.getElementById('batchModal').style.display = 'none';
    batchOperation = null;
}

function executeBatchOperation() {
    const amount = parseInt(document.getElementById('batchCoinsInput').value) || 0;
    
    if (amount === 0) {
        showMessage('请输入有效的星币数量', 'warning');
        return;
    }
    
    let affectedStudents = [];
    
    switch (batchOperation) {
        case 'addAll':
            affectedStudents = students.filter(s => s.classId === currentClass);
            affectedStudents.forEach(student => {
                student.coins += amount;
            });
            showMessage(`全班 ${affectedStudents.length} 名学生每人 +${amount} 星币`, 'success');
            break;
            
        case 'subtractAll':
            affectedStudents = students.filter(s => s.classId === currentClass);
            affectedStudents.forEach(student => {
                student.coins = student.coins - amount;
            });
            showMessage(`全班 ${affectedStudents.length} 名学生每人 -${amount} 星币`, 'warning');
            break;
            
        case 'addSelected':
            affectedStudents = getSelectedStudents();
            affectedStudents.forEach(student => {
                student.coins += amount;
            });
            showMessage(`选中 ${affectedStudents.length} 名学生每人 +${amount} 星币`, 'success');
            break;
            
        case 'subtractSelected':
            affectedStudents = getSelectedStudents();
            affectedStudents.forEach(student => {
                student.coins = student.coins - amount;
            });
            showMessage(`选中 ${affectedStudents.length} 名学生每人 -${amount} 星币`, 'warning');
            break;
    }
    
    if (affectedStudents.length > 0) {
        saveData();
        updateStats();
        renderStudentsTable();
        clearSelection();
    }
    
    closeBatchModal();
}

// 选择功能
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');
    
    studentCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const row = checkbox.closest('tr');
        if (selectAllCheckbox.checked) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    });
    
    updateSelectedButtons();
    updateFloatingActions(); // 更新浮动操作栏按钮状态
}

function toggleStudentSelection(checkbox, studentId) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
    
    // 更新全选状态
    const allCheckboxes = document.querySelectorAll('.student-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    
    updateSelectedButtons();
    updateFloatingActions(); // 更新浮动操作栏按钮状态
}

// 行点击选择功能
function toggleRowSelection(row, studentId) {
    // 找到当前行的checkbox
    const checkbox = row.querySelector('.student-checkbox');
    if (checkbox) {
        // 切换checkbox状态
        checkbox.checked = !checkbox.checked;
        // 调用toggleStudentSelection更新状态
        toggleStudentSelection(checkbox, studentId);
    }
}

function getSelectedStudents() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.studentId);
    return students.filter(s => selectedIds.includes(s.id));
}

function clearSelection() {
    const checkboxes = document.querySelectorAll('.student-checkbox, #selectAll');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.indeterminate = false;
    });
    
    const rows = document.querySelectorAll('.student-row');
    rows.forEach(row => row.classList.remove('selected'));
    
    updateSelectedButtons();
    updateFloatingActions(); // 更新浮动操作栏按钮状态
}

function updateSelectedButtons() {
    const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
    const selectedAddBtn = document.getElementById('selectedAddBtn');
    const selectedSubtractBtn = document.getElementById('selectedSubtractBtn');
    
    selectedAddBtn.disabled = selectedCount === 0;
    selectedSubtractBtn.disabled = selectedCount === 0;
    
    updateFloatingActions(); // 更新浮动操作栏按钮状态
}

// 搜索和排序功能
function searchStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    renderStudentsTable(searchTerm);
}

function sortStudents() {
    const sortBy = document.getElementById('sortBy').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    renderStudentsTable(searchTerm, sortBy);
}

// 数据统计
function updateStats() {
    let classStudents;
    
    if (currentClass === 'all_classes') {
        // 所有班级模式：显示所有学生的统计
        classStudents = students;
    } else {
        // 单个班级模式：显示当前班级的统计
        classStudents = students.filter(s => s.classId === currentClass);
    }
    
    // 学生总数
    document.getElementById('totalStudents').textContent = classStudents.length;
    
    // 星币最多的学生
    let topStudentText = '暂无数据';
    if (classStudents.length > 0) {
        const topStudent = classStudents.reduce((max, student) => 
            student.coins > max.coins ? student : max
        );
        
        if (currentClass === 'all_classes') {
            // 所有班级模式：显示学生名称和班级
            const topStudentClass = classes.find(cls => cls.id === topStudent.classId);
            topStudentText = `${topStudent.name}（${topStudentClass ? topStudentClass.name : '未知班级'}），${topStudent.coins}星币`;
        } else {
            // 单个班级模式：只显示学生名称
            topStudentText = `${topStudent.name}，${topStudent.coins}星币`;
        }
    }
    document.getElementById('topStudent').textContent = topStudentText;
    
    // 平均星币数
    let avgCoins = 0;
    if (classStudents.length > 0) {
        const totalCoins = classStudents.reduce((sum, student) => sum + student.coins, 0);
        avgCoins = Math.round(totalCoins / classStudents.length);
    }
    document.getElementById('avgCoins').textContent = avgCoins;
}

// 渲染学生表格
function renderStudentsTable(searchTerm = '', sortBy = 'name') {
    const tbody = document.getElementById('studentsTableBody');
    let classStudents;
    
    if (currentClass === 'all_classes') {
        // 所有班级模式：显示所有学生
        classStudents = students.slice(); // 复制数组避免修改原数组
    } else {
        // 单个班级模式：显示当前班级的学生
        classStudents = students.filter(s => s.classId === currentClass);
    }
    
    // 搜索过滤
    if (searchTerm) {
        classStudents = classStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // 排序
    switch (sortBy) {
        case 'name':
            classStudents.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
            break;
        case 'coins-desc':
            classStudents.sort((a, b) => b.coins - a.coins);
            break;
        case 'coins-asc':
            classStudents.sort((a, b) => a.coins - b.coins);
            break;
    }
    
    if (classStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>${searchTerm ? '没有找到匹配的学生' : '当前班级暂无学生'}</h3>
                    <p>${searchTerm ? '请尝试其他搜索条件' : '点击上方"添加学生"按钮开始添加'}</p>
                </td>
            </tr>
        `;
        clearSelection();
        return;
    }
    
    tbody.innerHTML = classStudents.map(student => {
        // 获取学生所在班级名称
        const studentClass = classes.find(cls => cls.id === student.classId);
        const studentClassName = studentClass ? studentClass.name : '未知班级';
        
        return `
        <tr class="student-row" onclick="toggleRowSelection(this, '${student.id}')">
            <td>
                <input type="checkbox" class="student-checkbox" 
                       data-student-id="${student.id}"
                       onchange="toggleStudentSelection(this, '${student.id}')">
            </td>
            <td>
                <span class="student-name" onclick="event.stopPropagation(); copyToClipboard('${student.name}')">
                    <span class="student-avatar">${student.name.charAt(0)}</span>
                    ${student.name}
                    <i class="fas fa-copy copy-icon" title="点击复制"></i>
                </span>
            </td>
            <td>${studentClassName}</td>
            <td>
                <span class="coins-display">
                    <i class="fas fa-star"></i>
                    ${student.coins}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); editStudent('${student.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteStudent('${student.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); addCoinsToStudent('${student.id}')" title="加星币">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); subtractCoinsFromStudent('${student.id}')" title="减星币">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
    updateSelectedButtons();
}

// 工具功能
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage(`已复制"${text}"`, 'info');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage(`已复制"${text}"`, 'info');
    } catch (err) {
        showMessage('复制失败', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showMessage(text, type = 'info') {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// Excel导入导出功能
function importExcel() {
    // 去掉必须选择班级的限制，因为现在支持根据Excel中的班级列导入
    // if (!currentClass) {
    //     showMessage('请先选择班级', 'warning');
    //     return;
    // }
    
    // 显示模式选择模态框
    showImportModeModal();
}

function showImportModeModal() {
    const currentClassName = getCurrentClassName() || '未选择班级';
    const currentStudentCount = currentClass ? students.filter(s => s.classId === currentClass).length : 0;
    
    document.getElementById('currentClassDisplay').textContent = currentClassName;
    document.getElementById('currentStudentCount').textContent = currentStudentCount;
    document.getElementById('importModeModal').style.display = 'block';
}

function closeImportModeModal() {
    document.getElementById('importModeModal').style.display = 'none';
    // 注意：不要在这里重置 selectedImportMode，因为用户可能已经选择了模式
    // selectedImportMode = null; // 移除这一行
    pendingExcelData = null;
    
    // 重置所有模式选项的选中状态
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function cancelImportMode() {
    // 完全取消导入操作，重置所有状态
    selectedImportMode = null;
    pendingExcelData = null;
    document.getElementById('importModeModal').style.display = 'none';
    
    // 重置所有模式选项的选中状态
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function selectImportMode(mode) {
    selectedImportMode = mode;
    
    // 更新选中状态
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 通过事件委托找到被点击的元素
    const clickedElement = event.target.closest('.mode-option');
    if (clickedElement) {
        clickedElement.classList.add('selected');
    }
    
    // 显示确认信息并开始文件选择
    setTimeout(() => {
        let confirmMessage = '';
        if (mode === 'append') {
            confirmMessage = '您选择了追加模式，将保留现有学生并添加新学生。';
        } else {
            confirmMessage = '您选择了覆盖模式，将清空所有学生并导入新数据。\n\n请确认您已做好数据备份！';
        }
        
        if (confirm(confirmMessage + '\n\n点击确定继续选择Excel文件。')) {
            closeImportModeModal();
            // 确保文件输入元素存在并触发点击
            const fileInput = document.getElementById('excelFileInput');
            if (fileInput) {
                fileInput.click();
            } else {
                showMessage('文件选择器未找到，请刷新页面重试', 'error');
            }
        } else {
            // 用户取消，使用完全重置函数
            cancelImportMode();
        }
    }, 300);
}

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 如果没有选择班级，使用第一个班级作为默认班级（仅用于覆盖模式）
    if (!currentClass && classes.length > 0) {
        currentClass = classes[0].id;
        document.getElementById('classSelect').value = currentClass;
    }
    
    if (!selectedImportMode) {
        showMessage('请先选择导入模式', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 读取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON数据
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                showMessage('Excel文件为空或格式不正确', 'warning');
                return;
            }
            
            // 验证数据格式
            const validData = [];
            let errorCount = 0;
            
            jsonData.forEach((row, index) => {
                const name = row['姓名'] || row['学生姓名'] || row['name'] || row['Name'];
                const coins = parseInt(row['星币'] || row['星币数量'] || row['coins'] || row['Coins'] || 0);
                const className = row['班级'] || row['班级名称'] || row['class'] || row['Class'] || row['className'];
                
                if (!name || name.trim() === '') {
                    errorCount++;
                    return;
                }
                
                // 确定目标班级
                let targetClassId;
                
                if (className && className.trim() !== '') {
                    // 如果指定了班级，尝试找到对应的班级ID
                    const existingClass = classes.find(cls => cls.name === className.trim());
                    if (existingClass) {
                        targetClassId = existingClass.id;
                    } else {
                        // 班级不存在，创建新班级
                        const newClassId = generateId();
                        const newClass = {
                            id: newClassId,
                            name: className.trim()
                        };
                        classes.push(newClass);
                        targetClassId = newClassId;
                    }
                } else {
                    // 如果没有指定班级，使用当前选中的班级
                    if (currentClass === 'all_classes') {
                        // 在"所有班级"模式下，必须指定班级
                        errorCount++;
                        return;
                    }
                    targetClassId = currentClass;
                }
                
                // 在追加模式下才检查重名
                if (selectedImportMode === 'append') {
                    const existingStudent = students.find(student => 
                        student.classId === targetClassId && student.name === name.trim()
                    );
                    
                    if (existingStudent) {
                        errorCount++;
                        return;
                    }
                }
                
                validData.push({
                    name: name.trim(),
                    coins: isNaN(coins) ? 0 : coins,
                    classId: targetClassId,
                    className: classes.find(cls => cls.id === targetClassId)?.name || getCurrentClassName()
                });
            });
            
            if (validData.length === 0) {
                const errorMsg = selectedImportMode === 'append' ? 
                    '没有找到有效的学生数据或所有学生已存在' : 
                    '没有找到有效的学生数据';
                showMessage(errorMsg, 'warning');
                return;
            }
            
            // 根据模式生成不同的确认信息
            let confirmMessage = '';
            const currentStudentCount = students.filter(s => s.classId === currentClass).length;
            
            // 统计按班级分组的学生数量
            const classCounts = {};
            validData.forEach(student => {
                if (!classCounts[student.className]) {
                    classCounts[student.className] = 0;
                }
                classCounts[student.className]++;
            });
            
            const classInfo = Object.entries(classCounts)
                .map(([className, count]) => `${className}(${count}人)`)
                .join('、');
            
            if (selectedImportMode === 'append') {
                confirmMessage = `追加模式：准备导入 ${validData.length} 名学生到以下班级：\n${classInfo}\n\n将保留所有班级的现有学生数据。`;
            } else {
                confirmMessage = `覆盖模式：准备导入 ${validData.length} 名学生到以下班级：\n${classInfo}\n\n警告：当前选中班级"${getCurrentClassName()}"的现有数据将被清空！`;
            }
            
            if (errorCount > 0) {
                confirmMessage += `\n\n跳过 ${errorCount} 条无效数据。`;
            }
            
            confirmMessage += '\n\n确定要继续吗？';
            
            if (confirm(confirmMessage)) {
                executeImport(validData, selectedImportMode, errorCount);
            }
        } catch (error) {
            console.error('Excel导入失败:', error);
            showMessage('Excel文件格式错误或损坏', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // 重置文件输入
    // 注意：不要在这里重置 selectedImportMode，因为 executeImport 还需要使用它
}

function executeImport(validData, mode, errorCount) {
    let successMessage = '';
    
    if (mode === 'replace') {
        // 覆盖模式：清空所有学生
        const originalStudentCount = students.length;
        students = [];
        
        successMessage = `覆盖模式：已清空所有 ${originalStudentCount} 名原有学生，`;
        
        // 覆盖模式下，将导入的学生自动加入到对应的班级中
        validData.forEach(studentData => {
            const newStudent = {
                id: generateId(),
                name: studentData.name,
                classId: studentData.classId, // 使用Excel中指定的班级ID
                coins: studentData.coins
            };
            students.push(newStudent);
        });
    } else {
        // 追加模式：保持原有逻辑
        successMessage = `追加模式：`;
        validData.forEach(studentData => {
            const newStudent = {
                id: generateId(),
                name: studentData.name,
                classId: studentData.classId, // 使用原有班级ID
                coins: studentData.coins
            };
            students.push(newStudent);
        });
    }
    
    // 统计按班级分组的学生数量
    const classCounts = {};
    validData.forEach(student => {
        if (!classCounts[student.className]) {
            classCounts[student.className] = 0;
        }
        classCounts[student.className]++;
    });
    
    saveData();
    renderClassSelect(); // 重新渲染班级选择器，以显示新增的班级
    updateStats();
    renderStudentsTable();
    clearSelection();
    
    // 在操作完成后重置模式
    selectedImportMode = null;
    
    const classInfo = Object.entries(classCounts)
        .map(([className, count]) => `${className}(${count}人)`)
        .join('、');
    
    successMessage += `成功导入 ${validData.length} 名学生到 ${classInfo}`;
    if (errorCount > 0) {
        successMessage += `，跳过 ${errorCount} 条无效数据`;
    }
    
    showMessage(successMessage, 'success');
}

function exportExcel() {
    if (!currentClass) {
        showMessage('请先选择班级', 'warning');
        return;
    }
    
    let classStudents;
    let fileName;
    
    if (currentClass === 'all_classes') {
        // 所有班级模式：导出所有学生
        classStudents = students;
        fileName = `所有班级_学生星币数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    } else {
        // 单个班级模式：导出当前班级
        classStudents = students.filter(s => s.classId === currentClass);
        fileName = `${getCurrentClassName()}_学生星币数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    }
    
    if (classStudents.length === 0) {
        const message = currentClass === 'all_classes' ? '没有学生数据可导出' : '当前班级没有学生数据可导出';
        showMessage(message, 'warning');
        return;
    }
    
    // 准备Excel数据（与导入模板格式一致）
    const excelData = classStudents.map(student => {
        const studentClass = classes.find(cls => cls.id === student.classId);
        return {
            '姓名': student.name,
            '班级': studentClass ? studentClass.name : '未知班级',
            '星币数量': student.coins
        };
    });
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 设置列宽（与导入模板一致）
    const colWidths = [
        { wch: 15 }, // 姓名
        { wch: 20 }, // 班级
        { wch: 12 }  // 星币数量
    ];
    worksheet['!cols'] = colWidths;
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, getCurrentClassName());
    
    // 导出文件
    XLSX.writeFile(workbook, fileName);
    
    const exportMessage = currentClass === 'all_classes' ? 
        `已导出所有 ${classStudents.length} 名学生的数据` : 
        `已导出 ${classStudents.length} 名学生的数据`;
    showMessage(exportMessage, 'success');
}

function downloadTemplate() {
    // 创建模板数据
    const templateData = [
        {
            '姓名': '张三',
            '班级': '三年级A班',
            '星币数量': 10
        },
        {
            '姓名': '李四',
            '班级': '三年级A班',
            '星币数量': 8
        },
        {
            '姓名': '王五',
            '班级': '三年级B班',
            '星币数量': 12
        },
        {
            '姓名': '赵六',
            '班级': '四年级A班',
            '星币数量': 15
        }
    ];
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // 设置列宽
    const colWidths = [
        { wch: 15 }, // 姓名
        { wch: 20 }, // 班级
        { wch: 12 }  // 星币数量
    ];
    worksheet['!cols'] = colWidths;
    
    // 添加说明信息
    const instructions = [
        ['星币管理系统 - 学生导入模板'],
        [''],
        ['使用说明：'],
        ['1. 请在下方表格中填写学生信息'],
        ['2. "姓名"列为必填项'],
        ['3. "班级"列可选，不填写将导入到当前选中的班级'],
        ['4. "星币数量"列可选，不填写默认为0'],
        ['5. 可以为负数（如-5表示扣5个星币）'],
        ['6. 支持同时导入多个班级的学生'],
        ['7. 新班级将自动创建，现有班级将被识别'],
        ['8. 保存后选择导入模式（追加/覆盖）'],
        [''],
        ['学生数据：']
    ];
    
    // 插入说明到工作表顶部
    XLSX.utils.sheet_add_aoa(worksheet, instructions, { origin: 'A1' });
    
    // 调整数据位置
    const dataRange = XLSX.utils.decode_range(worksheet['!ref']);
    const newDataStart = { r: instructions.length, c: 0 };
    
    // 重新创建工作表，包含说明和数据
    const finalWorksheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.sheet_add_json(finalWorksheet, templateData, { 
        origin: { r: instructions.length, c: 0 },
        skipHeader: false
    });
    
    // 设置整体列宽
    finalWorksheet['!cols'] = [
        { wch: 35 }, // 第一列（说明或姓名）
        { wch: 20 }, // 第二列（班级）
        { wch: 15 }  // 第三列（星币数量）
    ];
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, finalWorksheet, '学生导入模板');
    
    // 导出模板文件
    XLSX.writeFile(workbook, '星币管理系统_学生导入模板.xlsx');
    
    showMessage('模板文件下载成功，请按照模板格式填写学生信息', 'success');
}

// 快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl+S 导出Excel
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportExcel();
    }
    
    // Ctrl+A 全选（在表格区域）
    if (e.ctrlKey && e.key === 'a' && e.target.closest('.student-list')) {
        e.preventDefault();
        document.getElementById('selectAll').checked = true;
        toggleSelectAll();
    }
    
    // ESC 关闭模态框
    if (e.key === 'Escape') {
        closeAddClassModal();
        closeEditStudentModal();
        closeBatchModal();
        cancelImportMode();
        closeDeleteClassModal();
    }
    
    // Enter 在模态框中确认
    if (e.key === 'Enter') {
        if (document.getElementById('addClassModal').style.display === 'block') {
            addClass();
        } else if (document.getElementById('editStudentModal').style.display === 'block') {
            saveStudentEdit();
        } else if (document.getElementById('batchModal').style.display === 'block') {
            executeBatchOperation();
        }
    }
});

// 点击模态框外部关闭
window.addEventListener('click', function(e) {
    const modals = ['addClassModal', 'editStudentModal', 'batchModal', 'importModeModal', 'deleteClassModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (e.target === modal) {
            modal.style.display = 'none';
            if (modalId === 'editStudentModal') {
                editingStudentId = null;
            } else if (modalId === 'batchModal') {
                batchOperation = null;
            } else if (modalId === 'importModeModal') {
                cancelImportMode();
            } else if (modalId === 'deleteClassModal') {
                closeDeleteClassModal();
            }
        }
    });
});