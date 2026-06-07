// ============================================
// DATA LAYER - Mock Data & Initialization
// ============================================

const USERS = [
    { id: 1, name: 'Admin User', email: 'admin@imnovyaz.com', password: 'admin123', role: 'admin', avatar: 'AU' },
    { id: 2, name: 'Priya Sharma', email: 'teacher@imnovyaz.com', password: 'teacher123', role: 'teacher', avatar: 'PS' },
    { id: 3, name: 'Rajesh Kumar', email: 'parent@imnovyaz.com', password: 'parent123', role: 'parent', avatar: 'RK' }
];

const DEFAULT_STUDENTS = [
    { id: 1, admissionNo: 'IMN-2024-001', fullName: 'Aarav Patel', dob: '2010-03-15', gender: 'Male', bloodGroup: 'B+', address: '42 MG Road, Ahmedabad', class: 'Class 5', section: 'A', fatherName: 'Vikram Patel', motherName: 'Sunita Patel', contactNumber: '9876543210', altContact: '9876543211', parentEmail: 'parent@imnovyaz.com', photo: 'http://static.photos/people/200x200/11', status: 'Active', feeStatus: 'Paid', attendance: 92 },
    { id: 2, admissionNo: 'IMN-2024-002', fullName: 'Ananya Singh', dob: '2009-07-22', gender: 'Female', bloodGroup: 'A+', address: '15 Civil Lines, Jaipur', class: 'Class 6', section: 'B', fatherName: 'Rajesh Singh', motherName: 'Meera Singh', contactNumber: '9876543220', altContact: '', parentEmail: 'rajesh@email.com', photo: 'http://static.photos/people/200x200/22', status: 'Active', feeStatus: 'Pending', attendance: 85 },
    { id: 3, admissionNo: 'IMN-2024-003', fullName: 'Rohan Mehta', dob: '2011-01-10', gender: 'Male', bloodGroup: 'O+', address: '78 Park Street, Mumbai', class: 'Class 4', section: 'A', fatherName: 'Suresh Mehta', motherName: 'Kavita Mehta', contactNumber: '9876543230', altContact: '9876543231', parentEmail: 'suresh@email.com', photo: 'http://static.photos/people/200x200/33', status: 'Active', feeStatus: 'Paid', attendance: 95 },
    { id: 4, admissionNo: 'IMN-2024-004', fullName: 'Ishika Gupta', dob: '2010-11-05', gender: 'Female', bloodGroup: 'AB+', address: '23 Sector 17, Chandigarh', class: 'Class 5', section: 'B', fatherName: 'Manoj Gupta', motherName: 'Anita Gupta', contactNumber: '9876543240', altContact: '', parentEmail: 'manoj@email.com', photo: 'http://static.photos/people/200x200/44', status: 'Active', feeStatus: 'Paid', attendance: 88 },
    { id: 5, admissionNo: 'IMN-2024-005', fullName: 'Vivaan Sharma', dob: '2008-09-18', gender: 'Male', bloodGroup: 'B-', address: '56 Lajpat Nagar, Delhi', class: 'Class 7', section: 'A', fatherName: 'Amit Sharma', motherName: 'Neha Sharma', contactNumber: '9876543250', altContact: '9876543251', parentEmail: 'amit@email.com', photo: 'http://static.photos/people/200x200/55', status: 'Active', feeStatus: 'Overdue', attendance: 72 },
    { id: 6, admissionNo: 'IMN-2024-006', fullName: 'Diya Reddy', dob: '2012-04-28', gender: 'Female', bloodGroup: 'A-', address: '12 Banjara Hills, Hyderabad', class: 'Class 3', section: 'A', fatherName: 'Krishna Reddy', motherName: 'Lakshmi Reddy', contactNumber: '9876543260', altContact: '', parentEmail: 'krishna@email.com', photo: 'http://static.photos/people/200x200/66', status: 'Active', feeStatus: 'Paid', attendance: 96 },
    { id: 7, admissionNo: 'IMN-2024-007', fullName: 'Arjun Nair', dob: '2009-12-03', gender: 'Male', bloodGroup: 'O-', address: '89 MG Road, Kochi', class: 'Class 6', section: 'C', fatherName: 'Ravi Nair', motherName: 'Padma Nair', contactNumber: '9876543270', altContact: '9876543271', parentEmail: 'ravi@email.com', photo: 'http://static.photos/people/200x200/77', status: 'Inactive', feeStatus: 'Pending', attendance: 68 },
    { id: 8, admissionNo: 'IMN-2024-008', fullName: 'Meera Joshi', dob: '2011-06-14', gender: 'Female', bloodGroup: 'B+', address: '34 FC Road, Pune', class: 'Class 4', section: 'B', fatherName: 'Deepak Joshi', motherName: 'Savita Joshi', contactNumber: '9876543280', altContact: '', parentEmail: 'deepak@email.com', photo: 'http://static.photos/people/200x200/88', status: 'Active', feeStatus: 'Paid', attendance: 91 },
    { id: 9, admissionNo: 'IMN-2024-009', fullName: 'Kabir Malhotra', dob: '2007-08-25', gender: 'Male', bloodGroup: 'AB-', address: '67 Anna Nagar, Chennai', class: 'Class 8', section: 'A', fatherName: 'Vivek Malhotra', motherName: 'Ritu Malhotra', contactNumber: '9876543290', altContact: '9876543291', parentEmail: 'vivek@email.com', photo: 'http://static.photos/people/200x200/99', status: 'Active', feeStatus: 'Paid', attendance: 94 },
    { id: 10, admissionNo: 'IMN-2024-010', fullName: 'Sara Khan', dob: '2010-02-11', gender: 'Female', bloodGroup: 'A+', address: '45 Hazratganj, Lucknow', class: 'Class 5', section: 'C', fatherName: 'Imran Khan', motherName: 'Farah Khan', contactNumber: '9876543300', altContact: '', parentEmail: 'imran@email.com', photo: 'http://static.photos/people/200x200/100', status: 'Active', feeStatus: 'Pending', attendance: 82 }
];

const DEFAULT_TEACHERS = [
    { id: 1, name: 'Dr. Kavita Sharma', subject: 'Mathematics', class: 'Class 8', email: 'kavita@imnovyaz.com', phone: '9876510001', qualification: 'Ph.D Mathematics', experience: '12 years', status: 'Active', photo: 'http://static.photos/people/200x200/101' },
    { id: 2, name: 'Mr. Arvind Kumar', subject: 'Science', class: 'Class 7', email: 'arvind@imnovyaz.com', phone: '9876510002', qualification: 'M.Sc Physics', experience: '8 years', status: 'Active', photo: 'http://static.photos/people/200x200/102' },
    { id: 3, name: 'Ms. Priya Verma', subject: 'English', class: 'Class 6', email: 'priya.v@imnovyaz.com', phone: '9876510003', qualification: 'M.A English', experience: '6 years', status: 'Active', photo: 'http://static.photos/people/200x200/103' },
    { id: 4, name: 'Mr. Raghu Iyer', subject: 'Hindi', class: 'Class 5', email: 'raghu@imnovyaz.com', phone: '9876510004', qualification: 'M.A Hindi', experience: '10 years', status: 'Active', photo: 'http://static.photos/people/200x200/104' },
    { id: 5, name: 'Ms. Nisha Patel', subject: 'Social Science', class: 'Class 4', email: 'nisha@imnovyaz.com', phone: '9876510005', qualification: 'M.A History', experience: '5 years', status: 'On Leave', photo: 'http://static.photos/people/200x200/105' },
    { id: 6, name: 'Mr. Suresh Menon', subject: 'Computer Science', class: 'Class 9', email: 'suresh@imnovyaz.com', phone: '9876510006', qualification: 'M.Tech', experience: '7 years', status: 'Active', photo: 'http://static.photos/people/200x200/106' },
    { id: 7, name: 'Ms. Deepa Nair', subject: 'Art', class: 'Class 3', email: 'deepa@imnovyaz.com', phone: '9876510007', qualification: 'BFA', experience: '4 years', status: 'Active', photo: 'http://static.photos/people/200x200/107' },
    { id: 8, name: 'Mr. Rajan Chauhan', subject: 'Physical Education', class: 'All', email: 'rajan@imnovyaz.com', phone: '9876510008', qualification: 'M.P.Ed', experience: '9 years', status: 'Active', photo: 'http://static.photos/people/200x200/108' }
];

const DEFAULT_ANNOUNCEMENTS = [
    { id: 1, title: 'Annual Sports Day', content: 'The annual sports day will be held on 15th March 2024. All students are expected to participate.', date: '2024-03-10', priority: 'high', author: 'Principal' },
    { id: 2, title: 'Parent-Teacher Meeting', content: 'PTM scheduled for 20th March 2024 from 9 AM to 1 PM. Parents are requested to attend.', date: '2024-03-12', priority: 'high', author: 'Admin' },
    { id: 3, title: 'Science Exhibition', content: 'Inter-school science exhibition entries due by 25th March. Register with your class teacher.', date: '2024-03-08', priority: 'medium', author: 'HOD Science' },
    { id: 4, title: 'Summer Camp Registration', content: 'Summer camp registration begins from 1st April. Activities include robotics, art, and sports.', date: '2024-03-15', priority: 'low', author: 'Admin' },
    { id: 5, title: 'Mid-Term Exam Schedule', content: 'Mid-term examinations will commence from 10th April. Timetable will be shared shortly.', date: '2024-03-18', priority: 'high', author: 'Exam Cell' }
];

const DEFAULT_CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const DEFAULT_FEES = [
    { id: 1, studentId: 1, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-15' },
    { id: 2, studentId: 2, type: 'Tuition Fee', amount: 15000, paid: 10000, due: 5000, status: 'Pending', date: '2024-01-20' },
    { id: 3, studentId: 5, type: 'Tuition Fee', amount: 15000, paid: 0, due: 15000, status: 'Overdue', date: '2023-12-15' },
    { id: 4, studentId: 3, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-10' },
    { id: 5, studentId: 4, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-18' },
    { id: 6, studentId: 6, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-12' },
    { id: 7, studentId: 8, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-22' },
    { id: 8, studentId: 9, type: 'Tuition Fee', amount: 15000, paid: 15000, due: 0, status: 'Paid', date: '2024-01-08' },
    { id: 9, studentId: 7, type: 'Tuition Fee', amount: 15000, paid: 5000, due: 10000, status: 'Pending', date: '2024-01-25' },
    { id: 10, studentId: 10, type: 'Tuition Fee', amount: 15000, paid: 10000, due: 5000, status: 'Pending', date: '2024-01-28' }
];

const DEFAULT_EXAMS = [
    { id: 1, name: 'Mid-Term Examination', startDate: '2024-04-10', endDate: '2024-04-20', classes: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'], status: 'Upcoming' },
    { id: 2, name: 'Unit Test 3', startDate: '2024-03-25', endDate: '2024-03-28', classes: ['Class 6','Class 7','Class 8'], status: 'Upcoming' },
    { id: 3, name: 'Annual Examination', startDate: '2024-05-15', endDate: '2024-05-30', classes: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'], status: 'Scheduled' }
];

const DEFAULT_REPORT_CARDS = [
    { id: 1, studentId: 1, examName: 'Mid-Term Examination 2024', grades: { Mathematics: 88, Science: 92, English: 85, Social: 90, Computer: 95 }, remarks: 'Excellent performance, keep up the strong focus.' },
    { id: 2, studentId: 2, examName: 'Mid-Term Examination 2024', grades: { Mathematics: 78, Science: 80, English: 82, Social: 75, Computer: 88 }, remarks: 'Good work, needs improvement in Social Studies.' },
    { id: 3, studentId: 5, examName: 'Mid-Term Examination 2024', grades: { Mathematics: 72, Science: 70, English: 78, Social: 68, Computer: 80 }, remarks: 'Attendance is affecting performance, encourage practice.' }
];

const RECENT_ACTIVITIES = [
    { id: 1, type: 'admission', message: 'New student Aarav Patel admitted to Class 5', time: '2 hours ago', icon: 'user-plus' },
    { id: 2, type: 'fee', message: 'Fee payment received from Ishika Gupta - ₹15,000', time: '3 hours ago', icon: 'credit-card' },
    { id: 3, type: 'attendance', message: 'Class 8 attendance marked by Dr. Kavita Sharma', time: '5 hours ago', icon: 'clipboard-check' },
    { id: 4, type: 'exam', message: 'Mid-Term Exam schedule published', time: '1 day ago', icon: 'book-open' },
    { id: 5, type: 'announcement', message: 'Annual Sports Day announcement posted', time: '1 day ago', icon: 'megaphone' },
    { id: 6, type: 'admission', message: 'New student Sara Khan admitted to Class 5', time: '2 days ago', icon: 'user-plus' },
    { id: 7, type: 'fee', message: 'Fee overdue for Vivaan Sharma - Class 7', time: '3 days ago', icon: 'alert-circle' }
];

// ============================================
// Data Access Layer
// ============================================
function getData(key) {
    const raw = localStorage.getItem('imnovyaz_' + key);
    return raw ? JSON.parse(raw) : null;
}

function setData(key, data) {
    localStorage.setItem('imnovyaz_' + key, JSON.stringify(data));
}

function initDataStore() {
    if (!getData('students')) setData('students', DEFAULT_STUDENTS);
    if (!getData('teachers')) setData('teachers', DEFAULT_TEACHERS);
    if (!getData('announcements')) setData('announcements', DEFAULT_ANNOUNCEMENTS);
    if (!getData('fees')) setData('fees', DEFAULT_FEES);
    if (!getData('exams')) setData('exams', DEFAULT_EXAMS);
    if (!getData('reportCards')) setData('reportCards', DEFAULT_REPORT_CARDS);
}

function getStudents() { return getData('students') || []; }
function setStudents(s) { setData('students', s); }
function getTeachers() { return getData('teachers') || []; }
function setTeachers(t) { setData('teachers', t); }
function getAnnouncements() { return getData('announcements') || []; }
function setAnnouncements(a) { setData('announcements', a); }
function getFees() { return getData('fees') || []; }
function setFees(f) { setData('fees', f); }
function getExams() { return getData('exams') || []; }
function setExams(e) { setData('exams', e); }
function getReportCards() { return getData('reportCards') || []; }
function setReportCards(r) { setData('reportCards', r); }

function generateAdmissionNo() {
    const students = getStudents();
    const num = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    return `IMN-2024-${String(num).padStart(3, '0')}`;
}

function generateId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(s => s.id)) + 1 : 1;
}
