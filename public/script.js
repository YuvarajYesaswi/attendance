// ============ AUTH FUNCTIONS ============
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("❌ Please fill in all fields");
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });

    const msg = await res.text();
    
    if (msg === "Login success") {
      alert("✅ Login successful!");
      window.location = "dashboard.html";
    } else {
      alert("❌ " + msg);
    }
  } catch (error) {
    alert("❌ Login failed: " + error.message);
  }
}

function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!email || !password || !confirmPassword) {
    alert("❌ Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    alert("❌ Password must be at least 6 characters");
    return;
  }

  if (password !== confirmPassword) {
    alert("❌ Passwords do not match");
    return;
  }

  performSignup(email, password);
}

async function performSignup(email, password) {
  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });

    const msg = await res.text();
    
    if (msg === "User registered") {
      alert("✅ Account created successfully! Please login.");
      window.location = "index.html";
    } else {
      alert("❌ " + msg);
    }
  } catch (error) {
    alert("❌ Signup failed: " + error.message);
  }
}

// ============ ATTENDANCE FUNCTIONS ============

// Store attendance data in memory
let attendanceData = {};
let currentDate = new Date();
let calendarPickerDate = new Date();

function getFormattedDate() {
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = String(currentDate.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
}

function updateHeaderDate() {
  const headerDate = document.getElementById("headerDate");
  if (headerDate) {
    headerDate.textContent = getFormattedDate();
  }
}

async function loadAttendanceData() {
  try {
    const res = await fetch("/attendance");
    const data = await res.json();
    
    // Convert array to object format
    if (Array.isArray(data)) {
      attendanceData = {};
      data.forEach(record => {
        if (record.studentName) {
          attendanceData[record.studentName] = record;
        }
      });
    } else {
      attendanceData = data;
    }
    
    updateHeaderDate();
    renderTable();
  } catch (error) {
    console.error("Error loading attendance:", error);
    // Initialize with empty data if no records
    attendanceData = {};
    updateHeaderDate();
    renderTable();
  }
}

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  // Sort students alphabetically
  const students = Object.keys(attendanceData).sort();

  if (students.length === 0) {
    const row = tableBody.insertRow();
    row.innerHTML = '<td colspan="9" style="text-align: center; color: #999; padding: 20px;">No students added yet. Click "Add New Student" to begin.</td>';
    return;
  }

  students.forEach(studentName => {
    const record = attendanceData[studentName];
    const row = tableBody.insertRow();
    
    // Student name cell
    const nameCell = row.insertCell(0);
    nameCell.textContent = studentName;
    nameCell.style.fontWeight = "600";

    // Period cells
    let totalPresent = 0;
    for (let i = 1; i <= 7; i++) {
      const cell = row.insertCell(i);
      const isPresent = record[`period${i}`] || false;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = isPresent;
      checkbox.title = `${studentName} - Period ${i}`;
      checkbox.onchange = function() {
        attendanceData[studentName][`period${i}`] = this.checked;
        updateTotal(studentName);
      };
      
      cell.appendChild(checkbox);
      if (isPresent) totalPresent++;
    }

    // Total cell
    const totalCell = row.insertCell(8);
    totalCell.textContent = totalPresent + "/7";
    totalCell.style.fontWeight = "600";
    totalCell.style.backgroundColor = totalPresent >= 5 ? "#d1fae5" : "#fee2e2";
    totalCell.dataset.studentName = studentName;
  });
}

function updateTotal(studentName) {
  const row = Array.from(document.getElementById("tableBody").rows).find(r => 
    r.cells[0].textContent === studentName
  );
  
  if (row) {
    let total = 0;
    for (let i = 1; i <= 7; i++) {
      if (row.cells[i].querySelector("input").checked) {
        total++;
      }
    }
    row.cells[8].textContent = total + "/7";
    row.cells[8].style.backgroundColor = total >= 5 ? "#d1fae5" : "#fee2e2";
  }
}

async function saveAllAttendance() {
  if (Object.keys(attendanceData).length === 0) {
    alert("❌ No attendance records to save");
    return;
  }

  try {
    const res = await fetch("/attendance", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(attendanceData)
    });

    const msg = await res.text();
    alert("✅ " + msg);
    loadAttendanceData();
  } catch (error) {
    alert("❌ Error saving attendance: " + error.message);
  }
}

// ============ MODAL & STUDENT MANAGEMENT ============

function addNewStudent() {
  const modal = document.getElementById("addStudentModal");
  modal.style.display = "flex";
  document.getElementById("newStudentName").focus();
}

function closeModal() {
  document.getElementById("addStudentModal").style.display = "none";
  document.getElementById("newStudentName").value = "";
}

function confirmAddStudent() {
  const name = document.getElementById("newStudentName").value.trim();
  
  if (!name) {
    alert("❌ Please enter a student name");
    return;
  }

  if (attendanceData[name]) {
    alert("❌ Student already exists");
    return;
  }

  // Initialize attendance record for new student
  attendanceData[name] = {
    studentName: name,
    period1: false,
    period2: false,
    period3: false,
    period4: false,
    period5: false,
    period6: false,
    period7: false
  };

  renderTable();
  closeModal();
  alert("✅ Student added successfully");
}

// Close modal when clicking outside
window.onclick = function(event) {
  const addStudentModal = document.getElementById("addStudentModal");
  const calendarModal = document.getElementById("calendarModal");
  
  if (addStudentModal && event.target === addStudentModal) {
    closeModal();
  }
  
  if (calendarModal && event.target === calendarModal) {
    closeCalendarModal();
  }
}

// Allow Enter key to add student
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById("addStudentModal");
  if (modal) {
    const input = document.getElementById("newStudentName");
    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          confirmAddStudent();
        }
      });
    }
  }

  // Initialize calendar on load
  const calendarModal = document.getElementById("calendarModal");
  if (calendarModal) {
    calendarPickerDate = new Date(currentDate);
  }
});

// ============ TABLE ACTIONS ============

function sortByName() {
  const students = Object.keys(attendanceData).sort();
  renderTable();
  alert("✅ Table sorted by student name");
}

function filterPresent() {
  const tableBody = document.getElementById("tableBody");
  const rows = tableBody.querySelectorAll("tr");
  
  rows.forEach(row => {
    const checkboxes = row.querySelectorAll("input[type='checkbox']");
    const hasPresent = Array.from(checkboxes).some(cb => cb.checked);
    row.style.display = hasPresent ? "table-row" : "none";
  });
  
  alert("✅ Filtered to show only present students");
}

function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateHeaderDate();
  renderTable();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateHeaderDate();
  renderTable();
}

function resetTable() {
  // Reset all attendance data to false
  for (const studentName in attendanceData) {
    for (let i = 1; i <= 7; i++) {
      attendanceData[studentName][`period${i}`] = false;
    }
  }
  
  // Re-render the table
  renderTable();
  
  // Show all rows (remove any filters)
  const tableBody = document.getElementById("tableBody");
  const rows = tableBody.querySelectorAll("tr");
  rows.forEach(row => {
    row.style.display = "table-row";
  });
  
  alert("✅ Table reset - all attendance cleared");
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    window.location = "index.html";
  }
}

// ============ LEGACY FUNCTIONS (KEPT FOR COMPATIBILITY) ============

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/signup", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });

  alert(await res.text());
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });

  const msg = await res.text();
  alert(msg);

  if (msg === "Login success")
    window.location = "dashboard.html";
}

async function fetchAttendance() {
  const res = await fetch("/attendance");
  const data = await res.json();

  const list = document.getElementById("list");
  if (list) {
    list.innerHTML = "";
    data.forEach(d => {
      const li = document.createElement("li");
      li.textContent = `${d.name} - ${d.date} - ${d.status}`;
      list.appendChild(li);
    });
  }
}

// ============ CALENDAR MODAL FUNCTIONS ============

function openCalendarModal() {
  const modal = document.getElementById("calendarModal");
  if (modal) {
    modal.style.display = "flex";
    calendarPickerDate = new Date(currentDate);
    renderCalendar();
  }
}

function closeCalendarModal() {
  const modal = document.getElementById("calendarModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function renderCalendar() {
  const year = calendarPickerDate.getFullYear();
  const month = calendarPickerDate.getMonth();
  
  // Update month/year display
  const monthYearDiv = document.getElementById("calendarMonthYear");
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  monthYearDiv.textContent = `${monthNames[month]} ${year}`;
  
  // Get the first day of the month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create calendar days
  const calendarDays = document.getElementById("calendarDays");
  calendarDays.innerHTML = "";
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    calendarDays.appendChild(emptyCell);
  }
  
  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;
    dayCell.onclick = () => selectCalendarDate(day, month, year);

    // Highlight today
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayCell.classList.add("today");
    }

    // Highlight selected date
    if (
      day === currentDate.getDate() &&
      month === currentDate.getMonth() &&
      year === currentDate.getFullYear()
    ) {
      dayCell.classList.add("selected");
    }

    calendarDays.appendChild(dayCell);
  }
}

function selectCalendarDate(day, month, year) {
  currentDate = new Date(year, month, day);
  updateHeaderDate();
  renderTable();
  closeCalendarModal();
}

function prevCalendarMonth() {
  calendarPickerDate.setMonth(calendarPickerDate.getMonth() - 1);
  renderCalendar();
}

function nextCalendarMonth() {
  calendarPickerDate.setMonth(calendarPickerDate.getMonth() + 1);
  renderCalendar();
}
