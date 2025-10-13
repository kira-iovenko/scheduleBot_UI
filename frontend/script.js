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

let editingRow = null;

// === Utility functions ===
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
  editingRow = null;
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// === Local Storage ===
function loadEmployees() {
  const stored = JSON.parse(localStorage.getItem('employees')) || [];
  stored.forEach(emp => addEmployeeRow(emp));
}
function saveEmployees() {
  const rows = Array.from(employeeTableBody.querySelectorAll('tr'));
  const data = rows.map(row => ({
    name: row.cells[0].textContent,
    age: row.cells[1].textContent === 'N/A' ? '' : row.cells[1].textContent,
    job: row.cells[2].textContent,
    start: row.cells[3].textContent,
    end: row.cells[4].textContent
  }));
  localStorage.setItem('employees', JSON.stringify(data));
}

// === Event listeners ===
hideForm();
loadEmployees();

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

  if (editingRow) {
    editingRow.cells[0].textContent = name;
    editingRow.cells[1].textContent = age || 'N/A';
    editingRow.cells[2].textContent = job;
    editingRow.cells[3].textContent = start;
    editingRow.cells[4].textContent = end;
    hideForm();
    clearForm();
    saveEmployees();
    return;
  }

  addEmployeeRow(empData);
  hideForm();
  clearForm();
  saveEmployees();
});

function addEmployeeRow(empData) {
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
      row.remove();
      saveEmployees();
    }
  });

  row.querySelector('.edit-btn').addEventListener('click', () => {
    editingRow = row;
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
