// Database Simulation using localStorage
class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        try {
            // Initialize default data if not exists
            if (!localStorage.getItem('adminUsers')) {
                localStorage.setItem('adminUsers', JSON.stringify([
                    { username: 'admin', password: 'admin123', name: 'messmanager' }
                ]));
            }

            if (!localStorage.getItem('students')) {
                localStorage.setItem('students', JSON.stringify([
                    { id: '9103243105', password: 'Shafkat@123', name: 'Shafkat', room: 'Room no 8', attendance: {} },
                    { id: 'STU002', password: 'student123', name: 'Jane Smith', room: 'B-205', attendance: {} },
                    { id: 'STU003', password: 'student123', name: 'Mike Johnson', room: 'C-304', attendance: {} }
                ]));
            }

            if (!localStorage.getItem('messMenu')) {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('messMenu', JSON.stringify({
                    [today]: {
                        breakfast: 'Poha, Tea, Bread Butter',
                        lunch: 'Rice, Dal, Roti, Mix Veg, Salad',
                        dinner: 'Roti, Paneer Butter Masala, Rice, Dal, Salad'
                    }
                }));
            }

            if (!localStorage.getItem('attendance')) {
                localStorage.setItem('attendance', JSON.stringify({}));
            }
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    }

    // Admin methods
    validateAdmin(username, password) {
        const admins = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        return admins.find(admin => admin.username === username && admin.password === password);
    }

    // Student methods
    validateStudent(studentId, password) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        return students.find(student => student.id === studentId && student.password === password);
    }

    getStudent(studentId) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        return students.find(student => student.id === studentId);
    }

    getAllStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }

    addStudent(studentData) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        students.push({
            id: studentData.id,
            password: studentData.password,
            name: studentData.name,
            room: studentData.room,
            attendance: {}
        });
        localStorage.setItem('students', JSON.stringify(students));
    }

    // Menu methods
    getTodayMenu() {
        const today = new Date().toISOString().split('T')[0];
        const menu = JSON.parse(localStorage.getItem('messMenu') || '{}');
        return menu[today] || {
            breakfast: 'Menu not set for today',
            lunch: 'Menu not set for today',
            dinner: 'Menu not set for today'
        };
    }

    updateMenu(date, menuData) {
        const menu = JSON.parse(localStorage.getItem('messMenu') || '{}');
        menu[date] = menuData;
        localStorage.setItem('messMenu', JSON.stringify(menu));
    }

    // Attendance methods
    markAttendance(studentId, date, mealType) {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
        if (!attendance[date]) attendance[date] = {};
        if (!attendance[date][studentId]) attendance[date][studentId] = [];

        if (!attendance[date][studentId].includes(mealType)) {
            attendance[date][studentId].push(mealType);
        }

        localStorage.setItem('attendance', JSON.stringify(attendance));

        // Update student's personal attendance record
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const studentIndex = students.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            if (!students[studentIndex].attendance[date]) {
                students[studentIndex].attendance[date] = [];
            }
            if (!students[studentIndex].attendance[date].includes(mealType)) {
                students[studentIndex].attendance[date].push(mealType);
            }
            localStorage.setItem('students', JSON.stringify(students));
        }
    }

    getAttendanceStats(date) {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
        const students = JSON.parse(localStorage.getItem('students') || '[]');

        if (!attendance[date]) {
            return { present: 0, total: students.length, percentage: 0 };
        }

        const presentCount = Object.keys(attendance[date]).length;
        return {
            present: presentCount,
            total: students.length,
            percentage: Math.round((presentCount / students.length) * 100)
        };
    }

    getStudentAttendance(studentId) {
        const student = this.getStudent(studentId);
        return student ? student.attendance : {};
    }
}

// Initialize database
const db = new Database();

// DOM Elements
const adminLoginForm = document.getElementById('adminLoginForm');
const studentLoginForm = document.getElementById('studentLoginForm');
const loadingOverlay = document.getElementById('loadingOverlay');

// Show loading animation
function showLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
}

// Hide loading animation
function hideLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

// Notification System
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 5000);
}

// Admin Login Handler
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (!username || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        showLoading();

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const admin = db.validateAdmin(username, password);
            if (admin) {
                showNotification('Admin login successful!', 'success');
                localStorage.setItem('currentAdmin', JSON.stringify(admin));
                setTimeout(() => (window.location.href = 'admin-dashboard.html'), 1000);
            } else {
                showNotification('Invalid admin credentials', 'error');
            }
        } catch (error) {
            showNotification('Login failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Student Login Handler
if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('studentUsername').value.trim();
        const password = document.getElementById('studentPassword').value.trim();

        if (!studentId || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        showLoading();

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const student = db.validateStudent(studentId, password);
            if (student) {
                showNotification(`Welcome back, ${student.name}!`, 'success');
                localStorage.setItem('currentStudent', JSON.stringify(student));
                setTimeout(() => (window.location.href = 'student-dashboard.html'), 1000);
            } else {
                showNotification('Invalid student ID or password', 'error');
            }
        } catch (error) {
            showNotification('Login failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Logout Function
function logout() {
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('currentStudent');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => (window.location.href = 'index.html'), 1000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Hostel Mess Management System initialized');

    const currentAdmin = localStorage.getItem('currentAdmin');
    const currentStudent = localStorage.getItem('currentStudent');

    if (currentAdmin && window.location.pathname.includes('index.html')) {
        window.location.href = 'admin-dashboard.html';
    }

    if (currentStudent && window.location.pathname.includes('index.html')) {
        window.location.href = 'student-dashboard.html';
    }
});
