// ============================================
// APP STATE
// ============================================
let currentUser = null;
let currentPage = 'dashboard';
let deleteTarget = null;
let chartInstances = {};

function isAdmin() { return currentUser?.role === 'admin'; }
function isTeacher() { return currentUser?.role === 'teacher'; }
function isParent() { return currentUser?.role === 'parent'; }

function getCurrentChildStudent() {
    if (!currentUser) return null;
    if (currentUser.role !== 'parent') return null;
    return getStudents().find(s => s.parentEmail === currentUser.email) || getStudents()[0] || null;
}

function getReportCardsForStudent(studentId) {
    if (!studentId) return [];
    return getReportCards().filter(rc => rc.studentId === studentId);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initDataStore();
    lucide.createIcons();
    
    const savedUser = getData('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showApp();
    }
});

// ============================================
// AUTH & LOGIN
// ============================================
let selectedRole = 'admin';

function setRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500/20', 'text-blue-300', 'border-blue-400/30');
        btn.classList.add('bg-white/5', 'text-gray-400', 'border-white/10');
    });
    const activeBtn = document.getElementById('role' + role.charAt(0).toUpperCase() + role.slice(1));
    activeBtn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10');
    activeBtn.classList.add('bg-blue-500/20', 'text-blue-300', 'border-blue-400/30');

    const emails = { admin: 'admin@imnovyaz.com', teacher: 'teacher@imnovyaz.com', parent: 'parent@imnovyaz.com' };
    document.getElementById('loginEmail').value = emails[role];
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }
    
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) { showToast('Invalid email or password', 'error'); return; }
    
    currentUser = { ...user };
    setData('currentUser', currentUser);
    showApp();
    showToast('Welcome back, ' + user.name + '!', 'success');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('imnovyaz_currentUser');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('loginPassword').value = '';
    showToast('Logged out successfully', 'info');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('flex');
    
    updateSidebar();
    updateUserHeader();
    updateSidebarUser();
    buildSidebarNav();
    
    navigateTo('dashboard');
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function getNavItems() {
    const items = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['admin','teacher','parent'] },
        { id: 'students', label: 'Students', icon: 'users', roles: ['admin','teacher'] },
        { id: 'teachers', label: 'Teachers', icon: 'user', roles: ['admin'] },
        { id: 'attendance', label: 'Attendance', icon: 'clipboard-check', roles: ['admin','teacher','parent'] },
        { id: 'fees', label: 'Fees', icon: 'credit-card', roles: ['admin','parent'] },
        { id: 'exams', label: 'Exams', icon: 'book-open', roles: ['admin','teacher','parent'] },
        { id: 'report-card', label: 'Report Card', icon: 'file-text', roles: ['teacher','parent'] },
        { id: 'announcements', label: 'Announcements', icon: 'megaphone', roles: ['admin','teacher','parent'] },
        { id: 'settings', label: 'Settings', icon: 'settings', roles: ['admin'] }
    ];
    if (!currentUser) return items;
    return items.filter(item => item.roles.includes(currentUser.role));
}

function buildSidebarNav() {
    const nav = document.getElementById('sidebarNav');
    const items = getNavItems();
    nav.innerHTML = items.map(item => `
        <button onclick="navigateTo('${item.id}')" class="sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
            <i data-lucide="${item.icon}" class="sidebar-icon w-[18px] h-[18px]"></i>
            <span class="sidebar-text text-sm font-medium">${item.label}</span>
        </button>
    `).join('');
    lucide.createIcons();
}

function updateSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    overlay.classList.add('hidden');
}

function updateUserHeader() {
    if (!currentUser) return;
    document.getElementById('headerAvatar').textContent = currentUser.avatar;
}

function updateSidebarUser() {
    if (!currentUser) return;
    document.getElementById('sidebarAvatar').textContent = currentUser.avatar;
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserRole').textContent = currentUser.role;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    currentPage = page;
    buildSidebarNav();
    
    const titles = {
        dashboard: ['Dashboard', 'Overview of school operations'],
        students: ['Student Management', 'Manage student records and profiles'],
        teachers: ['Teacher Management', 'Manage teacher information'],
        attendance: ['Attendance', 'Track student attendance records'],
        fees: ['Fee Management', 'View fee status and receipts'],
        exams: ['Examinations', 'Exam schedules and results'],
        'report-card': ['Report Card', 'Student progress and grades'],
        announcements: ['Announcements', 'School announcements and notices'],
        settings: ['Settings', 'System configuration']
    };
    
    const [title, subtitle] = titles[page] || ['', ''];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
    
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
    
    renderPage(page);
}

function renderPage(page) {
    const content = document.getElementById('mainContent');
    
    // Destroy existing charts
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};
    
    switch(page) {
        case 'dashboard': content.innerHTML = renderDashboard(); break;
        case 'students': content.innerHTML = renderStudents(); break;
        case 'teachers': content.innerHTML = renderTeachers(); break;
        case 'attendance': content.innerHTML = renderAttendance(); break;
        case 'fees': content.innerHTML = renderFees(); break;
        case 'exams': content.innerHTML = renderExams(); break;
        case 'report-card': content.innerHTML = renderReportCards(); break;
        case 'announcements': content.innerHTML = renderAnnouncements(); break;
        case 'settings': content.innerHTML = renderSettings(); break;
        default: content.innerHTML = renderDashboard();
    }
    
    lucide.createIcons();
    
    // Initialize charts if dashboard
    if (page === 'dashboard') initDashboardCharts();
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
    const students = getStudents();
    const teachers = getTeachers();
    const fees = getFees();
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const avgAttendance = students.length > 0 ? Math.round(students.reduce((a,s) => a + s.attendance, 0) / students.length) : 0;
    const totalFeesCollected = fees.filter(f => f.status === 'Paid').reduce((a,f) => a + f.paid, 0);
    const totalFeesDue = fees.filter(f => f.status !== 'Paid').reduce((a,f) => a + f.due, 0);
    const uniqueClasses = [...new Set(students.map(s => s.class))].length;
    const exams = getExams().filter(e => e.status === 'Upcoming');
    const currentChild = getCurrentChildStudent();

    if (isParent()) {
        const childFees = getFees().filter(f => f.studentId === currentChild?.id);
        const paid = childFees.filter(f => f.status === 'Paid').reduce((a,f) => a + f.paid, 0);
        const due = childFees.filter(f => f.status !== 'Paid').reduce((a,f) => a + f.due, 0);
        const latestReport = getReportCardsForStudent(currentChild?.id)[0];

        return `
        <div class="fade-in space-y-6">
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${currentChild?.fullName || 'My Child'}</h2>
                        <p class="text-sm text-gray-500">${currentChild?.class || 'Class'} - ${currentChild?.section || ''}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase tracking-[0.2em] text-gray-400">Parent Dashboard</p>
                        <p class="text-sm text-gray-500">Only your child's records are shown here.</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-blue-50 rounded-2xl p-5 text-center">
                    <p class="text-3xl font-bold text-blue-600">${currentChild?.attendance || 0}%</p>
                    <p class="text-sm text-blue-500 mt-1">Attendance</p>
                </div>
                <div class="bg-emerald-50 rounded-2xl p-5 text-center">
                    <p class="text-3xl font-bold text-emerald-600">₹${(paid/1000).toFixed(0)}K</p>
                    <p class="text-sm text-emerald-600 mt-1">Fees Paid</p>
                </div>
                <div class="bg-amber-50 rounded-2xl p-5 text-center">
                    <p class="text-3xl font-bold text-amber-600">₹${(due/1000).toFixed(0)}K</p>
                    <p class="text-sm text-amber-600 mt-1">Fees Due</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 class="font-semibold text-gray-800 mb-4">Attendance Summary</h3>
                    <p class="text-sm text-gray-500">Latest attendance snapshot for ${currentChild?.fullName || 'your child'}.</p>
                    <div class="mt-6 grid grid-cols-2 gap-3">
                        <div class="bg-blue-50 rounded-xl p-4 text-center">
                            <p class="text-xl font-bold text-blue-600">${currentChild?.attendance || 0}%</p>
                            <p class="text-xs text-blue-500 mt-1">Current</p>
                        </div>
                        <div class="bg-emerald-50 rounded-xl p-4 text-center">
                            <p class="text-xl font-bold text-emerald-600">${latestReport ? Object.keys(latestReport.grades).length : 0}</p>
                            <p class="text-xs text-emerald-500 mt-1">Subjects</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 class="font-semibold text-gray-800 mb-4">Latest Report Card</h3>
                    ${latestReport ? `
                        <p class="text-sm text-gray-600 mb-4">${latestReport.examName}</p>
                        <div class="space-y-2 text-sm text-gray-700">
                            ${Object.entries(latestReport.grades).map(([subject, score]) => `<div class="flex justify-between"><span>${subject}</span><span class="font-semibold">${score}</span></div>`).join('')}
                        </div>
                        <div class="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p class="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Teacher Remarks</p>
                            <p class="text-sm text-gray-600">${latestReport.remarks}</p>
                        </div>
                    ` : '<p class="text-sm text-gray-500">No report card available yet.</p>'}
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="fade-in space-y-6">
        <!-- Welcome Banner -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
            <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div class="absolute right-20 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2"></div>
            <div class="relative z-10">
                <h2 class="text-2xl font-bold mb-2">Welcome back, ${currentUser?.name?.split(' ')[0] || 'User'}! 👋</h2>
                <p class="text-blue-100 text-sm">Here's what's happening at Imnovyaz School today.</p>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${statCard('Total Students', activeStudents, 'users', 'from-blue-500 to-blue-600', '+12 this month')}
            ${statCard('Total Teachers', teachers.filter(t=>t.status==='Active').length, 'user', 'from-emerald-500 to-emerald-600', `${uniqueClasses} classes assigned`)}
            ${statCard('Avg Attendance', avgAttendance + '%', 'clipboard-check', 'from-amber-500 to-orange-600', 'This semester')}
            ${statCard('Fee Collected', '₹' + (totalFeesCollected/1000).toFixed(0) + 'K', 'credit-card', 'from-violet-500 to-purple-600', `₹${(totalFeesDue/1000).toFixed(0)}K pending`)}
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800">Attendance Analytics</h3>
                    <span class="text-xs text-gray-400">Last 7 days</span>
                </div>
                <div class="chart-container"><canvas id="attendanceChart"></canvas></div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800">Fee Status</h3>
                    <span class="text-xs text-gray-400">This quarter</span>
                </div>
                <div class="chart-container"><canvas id="feeChart"></canvas></div>
            </div>
        </div>

        <!-- Performance + Fee Collection -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800">Student Performance</h3>
                    <span class="text-xs text-gray-400">By subject</span>
                </div>
                <div class="chart-container"><canvas id="performanceChart"></canvas></div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800">Fee Collection Analytics</h3>
                    <span class="text-xs text-gray-400">Monthly</span>
                </div>
                <div class="chart-container"><canvas id="feeCollectionChart"></canvas></div>
            </div>
        </div>
    </div>`;
}

function statCard(label, value, icon, gradient, subtitle) {
    return `
    <div class="stat-card bg-white rounded-2xl border border-gray-100 p-5">
        <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center">
                <i data-lucide="${icon}" class="w-5 h-5 text-white"></i>
            </div>
        </div>
        <p class="text-2xl font-bold text-gray-800">${value}</p>
        <p class="text-xs text-gray-500 mt-1">${label}</p>
        <p class="text-[10px] text-gray-400 mt-0.5">${subtitle}</p>
    </div>`;
}

function activityColor(type) {
    const colors = { admission: 'bg-blue-500', fee: 'bg-emerald-500', attendance: 'bg-amber-500', exam: 'bg-violet-500', announcement: 'bg-rose-500' };
    return colors[type] || 'bg-gray-500';
}

function priorityBadge(p) {
    const m = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
    return m[p] || 'bg-gray-100 text-gray-700';
}

function initDashboardCharts() {
    // Attendance Chart
    const attCtx = document.getElementById('attendanceChart')?.getContext('2d');
    if (attCtx) {
        chartInstances.attendance = new Chart(attCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Attendance %',
                    data: [92, 88, 95, 91, 87, 75, 0],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
        });
    }

    // Fee Pie Chart
    const feeCtx = document.getElementById('feeChart')?.getContext('2d');
    if (feeCtx) {
        const fees = getFees();
        const paid = fees.filter(f => f.status === 'Paid').length;
        const pending = fees.filter(f => f.status === 'Pending').length;
        const overdue = fees.filter(f => f.status === 'Overdue').length;
        chartInstances.fee = new Chart(feeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Pending', 'Overdue'],
                datasets: [{ data: [paid, pending, overdue], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0, cutout: '70%' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } } }
        });
    }

    // Performance Radar
    const perfCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (perfCtx) {
        chartInstances.performance = new Chart(perfCtx, {
            type: 'radar',
            data: {
                labels: ['Math', 'Science', 'English', 'Hindi', 'Social Sci', 'Computer'],
                datasets: [{
                    label: 'Average Score',
                    data: [82, 78, 85, 90, 75, 88],
                    backgroundColor: 'rgba(139,92,246,0.15)',
                    borderColor: '#8b5cf6',
                    pointBackgroundColor: '#8b5cf6',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20, font: { size: 9 } }, grid: { color: '#e2e8f0' }, angleLines: { color: '#e2e8f0' }, pointLabels: { font: { size: 10 } } } } }
        });
    }

    // Fee Collection Bar
    const feeCollCtx = document.getElementById('feeCollectionChart')?.getContext('2d');
    if (feeCollCtx) {
        chartInstances.feeCollection = new Chart(feeCollCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    { label: 'Collected', data: [135000, 142000, 128000, 155000, 148000, 152000], backgroundColor: '#3b82f6', borderRadius: 8, barPercentage: 0.5 },
                    { label: 'Pending', data: [15000, 8000, 22000, 5000, 12000, 8000], backgroundColor: '#f59e0b', borderRadius: 8, barPercentage: 0.5 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => '₹' + (v/1000) + 'K' } }, x: { grid: { display: false } } } }
        });
    }
}

// ============================================
// STUDENTS PAGE
// ============================================
function renderStudents() {
    const students = getStudents();
    if (isAdmin()) {
        return `
        <div class="fade-in space-y-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Student Records</h3>
                        <p class="text-sm text-gray-500">Select a class to view the student list for that class.</p>
                    </div>
                    <select id="adminClassFilter" class="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-300" onchange="renderAdminStudentsByClass()">
                        <option value="">Choose class</option>
                        ${DEFAULT_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div id="studentsTableWrapper" class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div class="p-10 text-center text-gray-500">Choose a class to view students.</div>
            </div>
        </div>`;
    }
    return `
    <div class="fade-in space-y-4">
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <div class="relative flex-1 sm:flex-none">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                    <input type="text" id="studentSearch" placeholder="Search students..." class="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 w-full sm:w-64" onkeyup="filterStudents()">
                </div>
                <select id="classFilter" class="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" onchange="filterStudents()">
                    <option value="">All Classes</option>
                    ${DEFAULT_CLASSES.map(c => `<option>${c}</option>`).join('')}
                </select>
            </div>
                ${isTeacher() ? `<button onclick="openAddStudent()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/25">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Add Student
                </button>` : ''}
            </div>
            <div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p class="text-2xl font-bold text-amber-600">${students.filter(s=>s.feeStatus==='Pending').length}</p>
                <p class="text-xs text-gray-500">Fee Pending</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p class="text-2xl font-bold text-red-600">${students.filter(s=>s.feeStatus==='Overdue').length}</p>
                <p class="text-xs text-gray-500">Fee Overdue</p>
            </div>
        </div>

        <!-- Students Table -->
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50/80">
                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Adm. No</th>
                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody" class="divide-y divide-gray-50">
                        ${renderStudentRows(students)}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderStudentRows(students) {
    if (students.length === 0) return '<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">No students found</td></tr>';
    
    return students.map(s => `
        <tr class="table-row-hover">
            <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                    <img src="${s.photo || 'http://static.photos/people/200x200/1'}" alt="${s.fullName}" class="w-9 h-9 rounded-full object-cover border border-gray-200" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=3b82f6&color=fff&size=36'">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${s.fullName}</p>
                        <p class="text-[11px] text-gray-400 sm:hidden">${s.admissionNo}</p>
                    </div>
                </div>
            </td>
            <td class="px-5 py-3 text-sm text-gray-600 hidden sm:table-cell">${s.admissionNo}</td>
            <td class="px-5 py-3 text-sm text-gray-600 hidden md:table-cell">${s.class} - ${s.section}</td>
            <td class="px-5 py-3 text-sm text-gray-600 hidden lg:table-cell">${s.contactNumber}</td>
            <td class="px-5 py-3">
                <span class="badge ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">${s.status}</span>
            </td>
            <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="viewStudent(${s.id})" class="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="View">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                    ${isTeacher() ? `
                    <button onclick="editStudent(${s.id})" class="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors" title="Edit">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderAdminStudentsByClass() {
    const selectedClass = document.getElementById('adminClassFilter')?.value;
    const container = document.getElementById('studentsTableWrapper');
    if (!container) return;
    if (!selectedClass) {
        container.innerHTML = '<div class="p-10 text-center text-gray-500">Choose a class to view students.</div>';
        return;
    }
    const students = getStudents().filter(s => s.class === selectedClass);
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50/80">
                        <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                        <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Adm. No</th>
                        <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                        <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                        <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${students.length === 0 ? `<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">No students found for ${selectedClass}.</td></tr>` : students.map(s => `
                        <tr class="table-row-hover">
                            <td class="px-5 py-3 text-sm font-medium text-gray-800">${s.fullName}</td>
                            <td class="px-5 py-3 text-sm text-gray-600 hidden sm:table-cell">${s.admissionNo}</td>
                            <td class="px-5 py-3 text-sm text-gray-600">${s.section}</td>
                            <td class="px-5 py-3 text-sm text-gray-600 hidden lg:table-cell">${s.contactNumber}</td>
                            <td class="px-5 py-3"><span class="badge ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">${s.status}</span></td>
                            <td class="px-5 py-3 text-right"><button onclick="viewStudent(${s.id})" class="px-3 py-1 rounded-xl bg-blue-500 text-white text-xs hover:bg-blue-600 transition">View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

function filterStudents() {
    const search = (document.getElementById('studentSearch')?.value || '').toLowerCase();
    const classFilter = document.getElementById('classFilter')?.value || '';
    let students = getStudents();
    
    if (search) students = students.filter(s => 
        s.fullName.toLowerCase().includes(search) || 
        s.admissionNo.toLowerCase().includes(search) ||
        s.fatherName.toLowerCase().includes(search)
    );
    if (classFilter) students = students.filter(s => s.class === classFilter);
    
    document.getElementById('studentsTableBody').innerHTML = renderStudentRows(students);
    lucide.createIcons();
}

// ============================================
// STUDENT CRUD
// ============================================
function openAddStudent() {
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('admissionNo').value = generateAdmissionNo();
    document.getElementById('photoPreview').innerHTML = '<i data-lucide="camera" class="w-6 h-6 text-gray-400"></i>';
    document.getElementById('studentModal').classList.remove('hidden');
    lucide.createIcons();
}

function editStudent(id) {
    const s = getStudents().find(st => st.id === id);
    if (!s) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = s.id;
    document.getElementById('fullName').value = s.fullName;
    document.getElementById('dob').value = s.dob;
    document.getElementById('gender').value = s.gender;
    document.getElementById('bloodGroup').value = s.bloodGroup || '';
    document.getElementById('admissionNo').value = s.admissionNo;
    document.getElementById('class').value = s.class;
    document.getElementById('section').value = s.section || '';
    document.getElementById('address').value = s.address || '';
    document.getElementById('fatherName').value = s.fatherName;
    document.getElementById('motherName').value = s.motherName || '';
    document.getElementById('contactNumber').value = s.contactNumber;
    document.getElementById('altContact').value = s.altContact || '';
    document.getElementById('parentEmail').value = s.parentEmail || '';
    
    if (s.photo) {
        document.getElementById('photoPreview').innerHTML = `<img src="${s.photo}" class="w-full h-full object-cover rounded-2xl">`;
    } else {
        document.getElementById('photoPreview').innerHTML = '<i data-lucide="camera" class="w-6 h-6 text-gray-400"></i>';
    }
    
    document.getElementById('studentModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.add('hidden');
}

function handleStudentSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('studentId').value;
    const photoInput = document.getElementById('studentPhoto');
    const photoPreview = document.getElementById('photoPreview').querySelector('img');
    
    const studentData = {
        fullName: document.getElementById('fullName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        admissionNo: document.getElementById('admissionNo').value,
        class: document.getElementById('class').value,
        section: document.getElementById('section').value,
        address: document.getElementById('address').value,
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        contactNumber: document.getElementById('contactNumber').value,
        altContact: document.getElementById('altContact').value,
        parentEmail: document.getElementById('parentEmail').value,
        photo: photoPreview ? photoPreview.src : `https://ui-avatars.com/api/?name=${encodeURIComponent(document.getElementById('fullName').value)}&background=3b82f6&color=fff&size=200`,
    };
    
    let students = getStudents();
    
    if (id) {
        // Edit
        const idx = students.findIndex(s => s.id === parseInt(id));
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...studentData };
            showToast('Student updated successfully', 'success');
        }
    } else {
        // Add
        studentData.id = generateId(students);
        studentData.status = 'Active';
        studentData.feeStatus = 'Pending';
        studentData.attendance = 100;
        students.push(studentData);
        showToast('Student added successfully', 'success');
    }
    
    setStudents(students);
    closeStudentModal();
    navigateTo('students');
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-2xl">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function viewStudent(id) {
    const s = getStudents().find(st => st.id === id);
    if (!s) return;
    
    const content = document.getElementById('studentProfileContent');
    content.innerHTML = `
    <div class="space-y-6">
        <!-- Profile Header -->
        <div class="flex flex-col sm:flex-row items-center gap-4">
            <img src="${s.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.fullName) + '&background=3b82f6&color=fff&size=200'}" class="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=3b82f6&color=fff&size=200'">
            <div class="text-center sm:text-left">
                <h3 class="text-xl font-bold text-gray-800">${s.fullName}</h3>
                <p class="text-sm text-gray-500">${s.admissionNo} · ${s.class} - ${s.section}</p>
                <div class="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <span class="badge ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">${s.status}</span>
                    <span class="badge ${s.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : s.feeStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">Fee: ${s.feeStatus}</span>
                </div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div class="space-y-2.5">
                    ${infoRow('Date of Birth', formatDate(s.dob))}
                    ${infoRow('Gender', s.gender)}
                    ${infoRow('Blood Group', s.bloodGroup || '-')}
                    ${infoRow('Attendance', s.attendance + '%')}
                    ${infoRow('Address', s.address || '-')}
                </div>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Parent Information</h4>
                <div class="space-y-2.5">
                    ${infoRow("Father's Name", s.fatherName)}
                    ${infoRow("Mother's Name", s.motherName || '-')}
                    ${infoRow('Contact', s.contactNumber)}
                    ${infoRow('Alt. Contact', s.altContact || '-')}
                    ${infoRow('Email', s.parentEmail || '-')}
                </div>
            </div>
        </div>

        <!-- Academic Stats -->
        <div class="grid grid-cols-3 gap-3">
            <div class="bg-blue-50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-blue-600">${s.attendance}%</p>
                <p class="text-xs text-blue-500 mt-1">Attendance</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-emerald-600">${s.feeStatus === 'Paid' ? '✓' : '!'}</p>
                <p class="text-xs text-emerald-600 mt-1">Fee Status</p>
            </div>
            <div class="bg-violet-50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-violet-600">${s.class.replace('Class ', '')}</p>
                <p class="text-xs text-violet-600 mt-1">Class</p>
            </div>
        </div>
    </div>`;
    
    document.getElementById('viewStudentModal').classList.remove('hidden');
    lucide.createIcons();
}

function infoRow(label, value) {
    return `<div class="flex justify-between"><span class="text-xs text-gray-500">${label}</span><span class="text-sm font-medium text-gray-800">${value}</span></div>`;
}

function closeViewModal() {
    document.getElementById('viewStudentModal').classList.add('hidden');
}

function deleteStudent(id) {
    deleteTarget = { id, type: 'student' };
    document.getElementById('deleteModal').classList.remove('hidden');
}

function openDeleteModal(type, id) {
    deleteTarget = { id, type };
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteTarget = null;
}

function confirmDelete() {
    if (!deleteTarget?.id || !deleteTarget?.type) return;
    if (deleteTarget.type === 'student') {
        let students = getStudents().filter(s => s.id !== deleteTarget.id);
        setStudents(students);
        showToast('Student deleted successfully', 'success');
        navigateTo('students');
    } else if (deleteTarget.type === 'exam') {
        let exams = getExams().filter(e => e.id !== deleteTarget.id);
        setExams(exams);
        showToast('Exam deleted successfully', 'success');
        navigateTo('exams');
    } else if (deleteTarget.type === 'announcement') {
        let announcements = getAnnouncements().filter(a => a.id !== deleteTarget.id);
        setAnnouncements(announcements);
        showToast('Announcement deleted successfully', 'success');
        navigateTo('announcements');
    }
    closeDeleteModal();
}

// ============================================
// TEACHERS PAGE
// ============================================
function renderTeachers() {
    const teachers = getTeachers();
    return `
    <div class="fade-in space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${teachers.map(t => `
            <div class="bg-white rounded-2xl border border-gray-100 p-5 stat-card">
                <div class="flex items-center gap-3 mb-4">
                    <img src="${t.photo}" alt="${t.name}" class="w-12 h-12 rounded-xl object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=22c55e&color=fff&size=48'">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate">${t.name}</p>
                        <span class="badge ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${t.status}</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-xs"><span class="text-gray-400">Subject</span><span class="font-medium text-gray-700">${t.subject}</span></div>
                    <div class="flex justify-between text-xs"><span class="text-gray-400">Class</span><span class="font-medium text-gray-700">${t.class}</span></div>
                    <div class="flex justify-between text-xs"><span class="text-gray-400">Experience</span><span class="font-medium text-gray-700">${t.experience}</span></div>
                    <div class="flex justify-between text-xs"><span class="text-gray-400">Qualification</span><span class="font-medium text-gray-700">${t.qualification}</span></div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <a href="mailto:${t.email}" class="flex-1 text-center py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Email</a>
                    <a href="tel:${t.phone}" class="flex-1 text-center py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">Call</a>
                </div>
            </div>
            `).join('')}
        </div>
    </div>`;
}

// ============================================
// ATTENDANCE PAGE
// ============================================
function renderAttendance() {
    const students = getStudents();
    const classes = [...new Set(students.map(s => s.class))].sort();
    const currentChild = getCurrentChildStudent();
    const teachers = getTeachers();

    if (isParent()) {
        return `
        <div class="fade-in space-y-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 class="font-semibold text-gray-800 mb-4">My Child's Attendance</h3>
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <span class="text-2xl font-bold text-blue-600">${currentChild?.attendance || 0}%</span>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${currentChild?.fullName || 'Student Name'}</p>
                        <p class="text-sm text-gray-500">${currentChild?.class || 'Class'} - ${currentChild?.section || 'Section'}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div class="bg-blue-50 rounded-xl p-4 text-center"><p class="text-lg font-bold text-blue-600">${currentChild?.attendance || 0}%</p><p class="text-xs text-blue-500 mt-1">Attendance</p></div>
                    <div class="bg-emerald-50 rounded-xl p-4 text-center"><p class="text-lg font-bold text-emerald-600">18</p><p class="text-xs text-emerald-600 mt-1">Days Present</p></div>
                    <div class="bg-red-50 rounded-xl p-4 text-center"><p class="text-lg font-bold text-red-600">2</p><p class="text-xs text-red-600 mt-1">Days Absent</p></div>
                    <div class="bg-amber-50 rounded-xl p-4 text-center"><p class="text-lg font-bold text-amber-600">1</p><p class="text-xs text-amber-600 mt-1">Late Arrivals</p></div>
                </div>
                <div class="chart-container"><canvas id="parentAttChart"></canvas></div>
            </div>
        </div>`;
    }

    if (isAdmin()) {
        return `
        <div class="fade-in space-y-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 mb-2">Student Attendance</h3>
                        <p class="text-sm text-gray-500">Select a class to view the list of students and their attendance.</p>
                    </div>
                    <select id="attClass" class="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-300" onchange="renderAttendanceTable()">
                        <option value="">Select Class</option>
                        ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div id="attendanceTableContainer">
                    <p class="text-gray-400 text-sm text-center py-10">Choose a class to view students.</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 class="font-semibold text-gray-800">Teacher Attendance</h3>
                        <p class="text-sm text-gray-500">Mark attendance for staff members.</p>
                    </div>
                    <button onclick="saveTeacherAttendance()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">Save Attendance</button>
                </div>
                <div class="space-y-3">
                    ${teachers.map(t => `
                    <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                        <div>
                            <p class="font-medium text-gray-800">${t.name}</p>
                            <p class="text-xs text-gray-500">${t.subject} · ${t.class}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-1 text-xs text-emerald-600"><input type="radio" name="teacher_att_${t.id}" value="present" class="accent-emerald-500 w-4 h-4" checked>Present</label>
                            <label class="flex items-center gap-1 text-xs text-red-600"><input type="radio" name="teacher_att_${t.id}" value="absent" class="accent-red-500 w-4 h-4">Absent</label>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="fade-in space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
                <select id="attClass" class="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-300" onchange="renderAttendanceTable()">
                    <option value="">Select Class</option>
                    ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <input type="date" id="attDate" value="${new Date().toISOString().split('T')[0]}" class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300">
                <button onclick="markAllPresent()" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">Mark All Present</button>
            </div>
            <div id="attendanceTableContainer">
                <p class="text-gray-400 text-sm text-center py-10">Select a class to mark attendance</p>
            </div>
        </div>
    </div>`;
}

function renderAttendanceTable() {
    const selectedClass = document.getElementById('attClass').value;
    if (!selectedClass) {
        document.getElementById('attendanceTableContainer').innerHTML = '<p class="text-gray-400 text-sm text-center py-10">Select a class to view attendance</p>';
        return;
    }
    const students = getStudents().filter(s => s.class === selectedClass);
    if (isAdmin()) {
        document.getElementById('attendanceTableContainer').innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <th class="px-4 py-3">Student</th>
                            <th class="px-4 py-3">Admission No</th>
                            <th class="px-4 py-3">Section</th>
                            <th class="px-4 py-3">Attendance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${students.length === 0 ? `<tr><td colspan="4" class="text-center py-10 text-gray-400">No students found for this class.</td></tr>` : students.map(s => `
                        <tr class="table-row-hover">
                            <td class="px-4 py-3">${s.fullName}</td>
                            <td class="px-4 py-3">${s.admissionNo}</td>
                            <td class="px-4 py-3">${s.section}</td>
                            <td class="px-4 py-3">${s.attendance}%</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        return;
    }
    const studentsForAttendance = students;
    document.getElementById('attendanceTableContainer').innerHTML = `
        <div class="space-y-2">
            ${studentsForAttendance.map(s => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-3">
                    <img src="${s.photo}" class="w-9 h-9 rounded-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=3b82f6&color=fff&size=36'">
                    <div>
                        <p class="text-sm font-medium text-gray-800">${s.fullName}</p>
                        <p class="text-xs text-gray-400">${s.admissionNo}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="att_${s.id}" value="present" class="accent-emerald-500 w-4 h-4" checked> 
                        <span class="text-xs font-medium text-emerald-600">P</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="att_${s.id}" value="absent" class="accent-red-500 w-4 h-4"> 
                        <span class="text-xs font-medium text-red-600">A</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="att_${s.id}" value="late" class="accent-amber-500 w-4 h-4"> 
                        <span class="text-xs font-medium text-amber-600">L</span>
                    </label>
                </div>
            </div>
            `).join('')}
        </div>
        <div class="mt-4 flex justify-end">
            <button onclick="saveAttendance()" class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/25">Save Attendance</button>
        </div>
    `;
}

function markAllPresent() {
    document.querySelectorAll('input[type="radio"][value="present"]').forEach(r => r.checked = true);
}

function saveAttendance() {
    showToast('Attendance saved successfully!', 'success');
}

function saveTeacherAttendance() {
    showToast('Teacher attendance saved successfully!', 'success');
}

function downloadFeeReceipt(feeId) {
    const fee = getFees().find(f => f.id === feeId);
    const student = getStudents().find(s => s.id === fee?.studentId);
    if (!fee || !student) {
        showToast('Unable to locate fee receipt', 'error');
        return;
    }
    const receiptHtml = `
        <html><head><title>Fee Receipt</title><style>body{font-family:Arial,sans-serif;padding:20px;}h1{color:#1d4ed8;}table{width:100%;border-collapse:collapse;margin-top:20px;}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left;}th{background:#f8fafc;}</style></head>
        <body>
        <h1>Fee Receipt</h1>
        <p><strong>Student:</strong> ${student.fullName}</p>
        <p><strong>Class:</strong> ${student.class} - ${student.section}</p>
        <p><strong>Receipt Date:</strong> ${formatDate(fee.date)}</p>
        <table>
            <tr><th>Description</th><th>Value</th></tr>
            <tr><td>Fee Type</td><td>${fee.type}</td></tr>
            <tr><td>Total Amount</td><td>₹${fee.amount.toLocaleString()}</td></tr>
            <tr><td>Paid Amount</td><td>₹${fee.paid.toLocaleString()}</td></tr>
            <tr><td>Due Amount</td><td>₹${fee.due.toLocaleString()}</td></tr>
            <tr><td>Status</td><td>${fee.status}</td></tr>
        </table>
        <p style="margin-top:20px;color:#6b7280;">Generated by Imnovyaz School ERP</p>
        </body></html>`;
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-receipt-${student.fullName.replace(/\s+/g,'-').toLowerCase()}-${fee.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================
// FEES PAGE
// ============================================
function renderFees() {
    const fees = getFees();
    const students = getStudents();
    const totalCollected = fees.filter(f => f.status === 'Paid').reduce((a,f) => a + f.paid, 0);
    const totalPending = fees.filter(f => f.status === 'Pending').reduce((a,f) => a + f.due, 0);
    const totalOverdue = fees.filter(f => f.status === 'Overdue').reduce((a,f) => a + f.due, 0);
    
    if (currentUser?.role === 'parent') {
        const currentChild = getCurrentChildStudent();
        const myFee = fees.filter(f => f.studentId === currentChild?.id);
        const paid = myFee.filter(f => f.status === 'Paid').reduce((a,f) => a + f.paid, 0);
        const due = myFee.filter(f => f.status !== 'Paid').reduce((a,f) => a + f.due, 0);

        return `
        <div class="fade-in space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="bg-emerald-50 rounded-xl p-5 text-center">
                    <p class="text-2xl font-bold text-emerald-600">₹${(paid/1000).toFixed(0)}K</p>
                    <p class="text-xs text-emerald-600 mt-1">Paid</p>
                </div>
                <div class="bg-amber-50 rounded-xl p-5 text-center">
                    <p class="text-2xl font-bold text-amber-600">₹${(due/1000).toFixed(0)}K</p>
                    <p class="text-xs text-amber-600 mt-1">Due</p>
                </div>
                <div class="bg-white rounded-xl p-5 border border-gray-100 text-center">
                    <p class="text-sm text-gray-600">${currentChild?.fullName || 'Your Child'}</p>
                    <p class="text-xs text-gray-400 mt-1">${currentChild?.class || 'Class'} - ${currentChild?.section || ''}</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table class="w-full">
                    <thead><tr class="bg-gray-50"><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Due</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Receipt</th></tr></thead>
                    <tbody class="divide-y divide-gray-50">
                        ${myFee.length === 0 ? `<tr><td colspan="7" class="text-center py-10 text-gray-400 text-sm">No fee records available for your child.</td></tr>` : myFee.map(f => `<tr class="table-row-hover"><td class="px-5 py-3 text-sm text-gray-800">${f.type}</td><td class="px-5 py-3 text-sm text-gray-600">₹${f.amount.toLocaleString()}</td><td class="px-5 py-3 text-sm text-emerald-600 font-medium">₹${f.paid.toLocaleString()}</td><td class="px-5 py-3 text-sm ${f.due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}">₹${f.due.toLocaleString()}</td><td class="px-5 py-3"><span class="badge ${f.status==='Paid'?'bg-emerald-100 text-emerald-700':f.status==='Overdue'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}">${f.status}</span></td><td class="px-5 py-3 text-sm text-gray-500">${formatDate(f.date)}</td><td class="px-5 py-3 text-sm"><button onclick="downloadFeeReceipt(${f.id})" class="px-3 py-1 rounded-xl bg-blue-500 text-white text-[11px] hover:bg-blue-600 transition">Download</button></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    
    return `
    <div class="fade-in space-y-4">
        <div class="grid grid-cols-3 gap-3">
            <div class="bg-emerald-50 rounded-xl p-5 text-center stat-card">
                <p class="text-2xl font-bold text-emerald-600">₹${(totalCollected/1000).toFixed(0)}K</p>
                <p class="text-xs text-emerald-600 mt-1">Collected</p>
            </div>
            <div class="bg-amber-50 rounded-xl p-5 text-center stat-card">
                <p class="text-2xl font-bold text-amber-600">₹${(totalPending/1000).toFixed(0)}K</p>
                <p class="text-xs text-amber-600 mt-1">Pending</p>
            </div>
            <div class="bg-red-50 rounded-xl p-5 text-center stat-card">
                <p class="text-2xl font-bold text-red-600">₹${(totalOverdue/1000).toFixed(0)}K</p>
                <p class="text-xs text-red-600 mt-1">Overdue</p>
            </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead><tr class="bg-gray-50"><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Due</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th></tr></thead>
                    <tbody class="divide-y divide-gray-50">
                        ${fees.map(f => {
                            const s = students.find(st => st.id === f.studentId);
                            return `<tr class="table-row-hover"><td class="px-5 py-3 text-sm font-medium text-gray-800">${s?.fullName || 'Unknown'}</td><td class="px-5 py-3 text-sm text-gray-600">${f.type}</td><td class="px-5 py-3 text-sm text-gray-600">₹${f.amount.toLocaleString()}</td><td class="px-5 py-3 text-sm text-emerald-600 font-medium">₹${f.paid.toLocaleString()}</td><td class="px-5 py-3 text-sm ${f.due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}">₹${f.due.toLocaleString()}</td><td class="px-5 py-3"><span class="badge ${f.status==='Paid'?'bg-emerald-100 text-emerald-700':f.status==='Overdue'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}">${f.status}</span></td><td class="px-5 py-3 text-sm text-gray-500">${formatDate(f.date)}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

// ============================================
// EXAMS PAGE
// ============================================
function renderExams() {
    const exams = getExams();
    return `
    <div class="fade-in space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">Exams</h3>
                <p class="text-sm text-gray-500">Manage exam schedules and view upcoming assessments.</p>
            </div>
            ${(isAdmin() || isTeacher()) ? `<button onclick="openAddExamModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/25"><i data-lucide="plus" class="w-4 h-4"></i>Add Exam</button>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${exams.map(e => `
            <div class="bg-white rounded-2xl border border-gray-100 p-5 stat-card">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 rounded-xl ${e.status === 'Upcoming' ? 'bg-blue-100' : 'bg-violet-100'} flex items-center justify-center">
                        <i data-lucide="book-open" class="w-6 h-6 ${e.status === 'Upcoming' ? 'text-blue-600' : 'text-violet-600'}"></i>
                    </div>
                    <span class="badge ${e.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}">${e.status}</span>
                </div>
                <h3 class="font-semibold text-gray-800 mb-2">${e.name}</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2 text-gray-600">
                        <i data-lucide="calendar" class="w-4 h-4 text-gray-400"></i>
                        ${formatDate(e.startDate)} - ${formatDate(e.endDate)}
                    </div>
                    <div class="flex items-center gap-2 text-gray-600">
                        <i data-lucide="users" class="w-4 h-4 text-gray-400"></i>
                        ${e.classes.length} Classes
                    </div>
                </div>
                ${(isAdmin() || isTeacher()) ? `<div class="mt-4 text-right"><button onclick="openDeleteModal('exam', ${e.id})" class="px-3 py-1 rounded-xl bg-red-500 text-white text-xs hover:bg-red-600 transition">Delete</button></div>` : ''}
            </div>
            `).join('')}
        </div>
    </div>`;
}

function openAddExamModal() {
    const classes = DEFAULT_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('');
    const modal = document.getElementById('examModalContent');
    modal.innerHTML = `
        <form id="examForm" onsubmit="handleExamSubmit(event)">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                    <input type="text" id="examName" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" placeholder="Enter exam title" required>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input type="date" id="examStartDate" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input type="date" id="examEndDate" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" required>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Classes</label>
                    <select id="examClasses" multiple class="w-full h-36 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 bg-white">
                        ${classes}
                    </select>
                    <p class="text-xs text-gray-400 mt-2">Hold Ctrl/Cmd to select multiple classes.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="examStatus" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 bg-white">
                        <option>Upcoming</option>
                        <option>Scheduled</option>
                        <option>Completed</option>
                    </select>
                </div>
                <div class="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="closeExamModal()" class="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium">Save Exam</button>
                </div>
            </div>
        </form>`;
    document.getElementById('examModal').classList.remove('hidden');
}

function closeExamModal() {
    document.getElementById('examModal').classList.add('hidden');
}

function handleExamSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('examName').value.trim();
    const startDate = document.getElementById('examStartDate').value;
    const endDate = document.getElementById('examEndDate').value;
    const classes = Array.from(document.getElementById('examClasses').selectedOptions).map(o => o.value);
    const status = document.getElementById('examStatus').value;
    if (!name || !startDate || !endDate || classes.length === 0) {
        showToast('Please fill all exam details', 'error');
        return;
    }
    const exams = getExams();
    const newExam = { id: generateId(exams), name, startDate, endDate, classes, status };
    exams.push(newExam);
    setExams(exams);
    closeExamModal();
    showToast('Exam added successfully', 'success');
    navigateTo('exams');
}

// ============================================
// REPORT CARD PAGE
// ============================================
function renderReportCards() {
    const currentChild = getCurrentChildStudent();
    const reportCards = isParent() ? getReportCardsForStudent(currentChild?.id) : getReportCards();
    const students = getStudents();
    return `
    <div class="fade-in space-y-4">
        ${isTeacher() ? `
        <div class="flex items-center justify-between gap-3">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">Student Report Cards</h3>
                <p class="text-sm text-gray-500">Edit grades and teacher comments for each student.</p>
            </div>
        </div>` : `
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${currentChild?.fullName || 'Your Child'}'s Report Cards</h3>
            <p class="text-sm text-gray-500">Review grades and teacher remarks.</p>
        </div>`}
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th class="px-5 py-3">Student</th>
                            <th class="px-5 py-3">Exam</th>
                            <th class="px-5 py-3">Subjects</th>
                            <th class="px-5 py-3">Remarks</th>
                            <th class="px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${reportCards.length === 0 ? `<tr><td colspan="5" class="text-center py-10 text-gray-400 text-sm">No report cards available.</td></tr>` : reportCards.map(rc => {
                            const student = students.find(s => s.id === rc.studentId);
                            return `
                            <tr class="table-row-hover">
                                <td class="px-5 py-4 text-sm font-medium text-gray-800">${student?.fullName || 'Unknown'}</td>
                                <td class="px-5 py-4 text-sm text-gray-600">${rc.examName}</td>
                                <td class="px-5 py-4 text-sm text-gray-600">${Object.entries(rc.grades).map(([sub, grade]) => `${sub}: ${grade}`).join(', ')}</td>
                                <td class="px-5 py-4 text-sm text-gray-600">${rc.remarks}</td>
                                <td class="px-5 py-4 text-sm text-right space-x-2">
                                    ${isTeacher() ? `<button onclick="openReportCardEditor(${rc.id})" class="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs hover:bg-amber-600 transition">Edit</button>` : ''}
                                    <button onclick="downloadReportCard(${rc.id})" class="px-3 py-1 rounded-xl bg-blue-500 text-white text-xs hover:bg-blue-600 transition">Download</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function downloadReportCard(reportCardId) {
    const rc = getReportCards().find(r => r.id === reportCardId);
    if (!rc) return;
    const student = getStudents().find(s => s.id === rc.studentId) || {};
    const gradeRows = Object.entries(rc.grades).map(([subject, score]) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${subject}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${score}</td>
            </tr>
        `).join('');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Card - ${student.fullName || 'Student'}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #17213d; background: #f7f8fc; }
        .container { max-width: 800px; margin: auto; background: #ffffff; padding: 24px; border-radius: 16px; box-shadow: 0 18px 60px rgba(15, 23, 42, 0.12); }
        h1 { margin: 0 0 16px; font-size: 28px; color: #0f172a; }
        .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .meta span { display: inline-block; background: #eef2ff; color: #3730a3; padding: 8px 12px; border-radius: 999px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th, td { padding: 12px 16px; border: 1px solid #e5e7eb; }
        th { background: #f8fafc; text-align: left; color: #334155; }
        .remarks { padding: 16px; background: #f8fafc; border-radius: 12px; color: #334155; }
        .footer { margin-top: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .footer span { font-size: 13px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Report Card</h1>
        <div class="meta">
            <span><strong>Student:</strong> ${student.fullName || 'N/A'}</span>
            <span><strong>Exam:</strong> ${rc.examName}</span>
            <span><strong>Date:</strong> ${formatDate(rc.date || new Date().toISOString().split('T')[0])}</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${gradeRows}
            </tbody>
        </table>
        <div class="remarks">
            <strong>Teacher Remarks</strong>
            <p>${rc.remarks}</p>
        </div>
        <div class="footer">
            <span>Generated by Imnovyaz School Portal</span>
            <span>${student.fullName ? student.fullName + ' - ' + (student.class || '') : ''}</span>
        </div>
    </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report-card-${(student.fullName || 'student').replace(/\s+/g, '-')}-${rc.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function openReportCardEditor(reportCardId) {
    const rc = getReportCards().find(r => r.id === reportCardId);
    if (!rc) return;
    const editor = document.getElementById('reportCardEditorContent');
    editor.innerHTML = `
        <form id="reportCardForm" onsubmit="handleReportCardSubmit(event)">
            <input type="hidden" id="reportCardId" value="${rc.id}">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                    <input type="text" id="reportCardExamName" value="${rc.examName}" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" required>
                </div>
                ${Object.entries(rc.grades).map(([subject, score]) => `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${subject}</label>
                        <input type="number" min="0" max="100" name="grade_${subject}" value="${score}" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" required>
                    </div>
                `).join('')}
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teacher Remarks</label>
                    <textarea id="reportCardRemarks" rows="3" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" required>${rc.remarks}</textarea>
                </div>
                <div class="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="closeReportCardModal()" class="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium">Save</button>
                </div>
            </div>
        </form>`;
    document.getElementById('reportCardModal').classList.remove('hidden');
}

function closeReportCardModal() {
    document.getElementById('reportCardModal').classList.add('hidden');
}

function handleReportCardSubmit(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('reportCardId').value, 10);
    const reportCards = getReportCards();
    const rcIndex = reportCards.findIndex(r => r.id === id);
    if (rcIndex === -1) return;
    const form = event.target;
    const examName = document.getElementById('reportCardExamName').value;
    const remarks = document.getElementById('reportCardRemarks').value;
    const updatedGrades = {};
    Object.keys(reportCards[rcIndex].grades).forEach(subject => {
        const gradeInput = form.querySelector(`[name="grade_${subject}"]`);
        updatedGrades[subject] = gradeInput ? parseInt(gradeInput.value, 10) : reportCards[rcIndex].grades[subject];
    });
    reportCards[rcIndex] = { ...reportCards[rcIndex], examName, grades: updatedGrades, remarks };
    setReportCards(reportCards);
    closeReportCardModal();
    showToast('Report card updated successfully', 'success');
    navigateTo('report-card');
}

// ============================================
// ANNOUNCEMENTS PAGE
// ============================================
function renderAnnouncements() {
    const announcements = getAnnouncements();
    return `
    <div class="fade-in space-y-4">
        ${currentUser?.role === 'admin' ? `
        <button onclick="openAddAnnouncementModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/25">
            <i data-lucide="plus" class="w-4 h-4"></i> New Announcement
        </button>` : ''}
        <div class="space-y-3">
            ${announcements.map(a => `
            <div class="bg-white rounded-2xl border border-gray-100 p-5 stat-card">
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl ${a.priority === 'high' ? 'bg-red-100' : a.priority === 'medium' ? 'bg-amber-100' : 'bg-emerald-100'} flex items-center justify-center flex-shrink-0">
                        <i data-lucide="megaphone" class="w-5 h-5 ${a.priority === 'high' ? 'text-red-600' : a.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-semibold text-gray-800">${a.title}</h3>
                            <span class="badge ${priorityBadge(a.priority)}">${a.priority}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${a.content}</p>
                        <div class="flex items-center gap-3 text-xs text-gray-400">
                            <span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${a.author}</span>
                            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${formatDate(a.date)}</span>
                        </div>
                        ${currentUser?.role === 'admin' ? `<div class="mt-3 text-right"><button onclick="openDeleteModal('announcement', ${a.id})" class="px-3 py-1 rounded-xl bg-red-500 text-white text-xs hover:bg-red-600 transition">Delete</button></div>` : ''}
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
    </div>`;
}

function openAddAnnouncementModal() {
    const modal = document.getElementById('announcementModalContent');
    if (!modal) return;
    modal.innerHTML = `
        <form id="announcementForm" onsubmit="handleAddAnnouncementSubmit(event)">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Announcement Title</label>
                    <input type="text" id="announcementTitle" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" placeholder="Enter a title" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea id="announcementContent" rows="4" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300" placeholder="Write announcement details" required></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select id="announcementPriority" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 bg-white">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div class="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="closeAnnouncementModal()" class="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium">Publish</button>
                </div>
            </div>
        </form>`;
    document.getElementById('announcementModal').classList.remove('hidden');
}

function closeAnnouncementModal() {
    document.getElementById('announcementModal').classList.add('hidden');
}

function handleAddAnnouncementSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const priority = document.getElementById('announcementPriority').value;
    if (!title || !content) {
        showToast('Please fill all announcement fields', 'error');
        return;
    }
    const announcements = getAnnouncements();
    announcements.unshift({
        id: generateId(announcements),
        title,
        content,
        date: new Date().toISOString().split('T')[0],
        priority,
        author: currentUser?.name || 'Admin'
    });
    setAnnouncements(announcements);
    closeAnnouncementModal();
    showToast('Announcement published successfully', 'success');
    navigateTo('announcements');
}

// ============================================
// SETTINGS PAGE
// ============================================
function renderSettings() {
    return `
    <div class="fade-in space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 class="font-semibold text-gray-800 mb-4">System Settings</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between py-3 border-b border-gray-100">
                    <div><p class="text-sm font-medium text-gray-700">School Name</p><p class="text-xs text-gray-400">Displayed across the system</p></div>
                    <input type="text" value="Imnovyaz School" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 w-48">
                </div>
                <div class="flex items-center justify-between py-3 border-b border-gray-100">
                    <div><p class="text-sm font-medium text-gray-700">Academic Year</p><p class="text-xs text-gray-400">Current academic session</p></div>
                    <select class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-300 w-48">
                        <option>2023-2024</option><option>2024-2025</option>
                    </select>
                </div>
                <div class="flex items-center justify-between py-3 border-b border-gray-100">
                    <div><p class="text-sm font-medium text-gray-700">Language</p><p class="text-xs text-gray-400">System display language</p></div>
                    <select class="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-300 w-48">
                        <option>English</option><option>Hindi</option>
                    </select>
                </div>
                <div class="flex items-center justify-between py-3">
                    <div><p class="text-sm font-medium text-gray-700">Reset All Data</p><p class="text-xs text-gray-400">Clear all stored data and reset to defaults</p></div>
                    <button onclick="resetData()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Reset</button>
                </div>
            </div>
        </div>
    </div>`;
}

function resetData() {
    localStorage.clear();
    initDataStore();
    showToast('Data has been reset to defaults', 'success');
    navigateTo(currentPage);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function handleGlobalSearch(query) {
    if (!query.trim()) return;
    if (currentPage === 'students') {
        document.getElementById('studentSearch').value = query;
        filterStudents();
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    
    const toast = document.createElement('div');
    toast.className = `toast flex items-center gap-3 px-5 py-3 ${colors[type]} text-white rounded-xl shadow-lg text-sm font-medium`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" class="w-4 h-4"></i> ${message}`;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
