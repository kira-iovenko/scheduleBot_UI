const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    const target = button.getAttribute('data-tab');
    if (target) {
      const el = document.getElementById(target);
      if (el) el.classList.add('active');
    }
  });
});

const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const employeeForm = document.getElementById('employeeForm');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const employeeTableBody = document.getElementById('employeeTableBody');

let editingIndex = null;

const employees = [
  { name: "Alice Johnson", age: "29", job: "Manager", start: "08:00", end: "16:00" },
  { name: "Ben Carter", age: "22", job: "Server", start: "10:00", end: "18:00" },
  { name: "Clara Kim", age: "27", job: "Driver", start: "12:00", end: "20:00" },
  { name: "David Lee", age: "35", job: "Server", start: "09:00", end: "17:00" }
];

function showForm() {
  employeeForm.style.display = 'block';
}
function hideForm() {
  employeeForm.style.display = 'none';
}
function clearForm() {
  document.getElementById('employeeName').value = '';
  document.getElementById('employeeAge').value = '';
  document.getElementById('employeeJob').value = '';
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
  saveBtn.textContent = 'Save Employee';
  editingIndex = null;
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadEmployees() {
  employeeTableBody.innerHTML = '';
  employees.forEach((emp, index) => addEmployeeRow(emp, index));
}

addEmployeeBtn.addEventListener('click', () => {
  clearForm();
  showForm();
});

cancelBtn.addEventListener('click', () => {
  hideForm();
  clearForm();
});

saveBtn.addEventListener('click', () => {
  const name = document.getElementById('employeeName').value.trim();
  const age = document.getElementById('employeeAge').value.trim();
  const job = document.getElementById('employeeJob').value;
  const start = document.getElementById('startTime').value;
  const end = document.getElementById('endTime').value;

  if (!name || !job || !start || !end) {
    alert('Please fill out all required fields (Name, Job, Start, End).');
    return;
  }
  if (start >= end) {
    alert('End time must be later than start time.');
    return;
  }

  const empData = { name, age, job, start, end };

  if (editingIndex !== null) {
    employees[editingIndex] = empData;
    editingIndex = null;
    clearForm();
    hideForm();
    loadEmployees();
    return;
  }

  employees.push(empData);
  clearForm();
  hideForm();
  loadEmployees();
});

function addEmployeeRow(empData, index) {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${escapeHtml(empData.name)}</td>
    <td>${escapeHtml(empData.age || 'N/A')}</td>
    <td>${escapeHtml(empData.job)}</td>
    <td>${escapeHtml(empData.start)}</td>
    <td>${escapeHtml(empData.end)}</td>
    <td>
      <button class="action-btn edit-btn">Edit</button>
      <button class="action-btn delete-btn">Delete</button>
    </td>
  `;

  row.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete ${empData.name}?`)) {
      employees.splice(index, 1);
      loadEmployees();
    }
  });

  row.querySelector('.edit-btn').addEventListener('click', () => {
    editingIndex = index;
    document.getElementById('employeeName').value = empData.name;
    document.getElementById('employeeAge').value = empData.age;
    document.getElementById('employeeJob').value = empData.job;
    document.getElementById('startTime').value = empData.start;
    document.getElementById('endTime').value = empData.end;
    saveBtn.textContent = 'Update Employee';
    showForm();
  });

  employeeTableBody.appendChild(row);
}

hideForm();
loadEmployees();
