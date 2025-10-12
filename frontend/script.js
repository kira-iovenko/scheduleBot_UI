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

hideForm();
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
  if (editingRow) {
    editingRow.cells[0].textContent = name;
    editingRow.cells[1].textContent = age || 'N/A';
    editingRow.cells[2].textContent = job;
    editingRow.cells[3].textContent = start;
    editingRow.cells[4].textContent = end;
    hideForm();
    clearForm();
    return;
  }
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${escapeHtml(name)}</td>
    <td>${escapeHtml(age || 'N/A')}</td>
    <td>${escapeHtml(job)}</td>
    <td>${escapeHtml(start)}</td>
    <td>${escapeHtml(end)}</td>
    <td>
      <button class="action-btn edit-btn">Edit</button>
      <button class="action-btn delete-btn">Delete</button>
    </td>
  `;
  row.querySelector('.delete-btn').addEventListener('click', () => {
    row.remove();
    if (editingRow === row) {
      hideForm();
      clearForm();
    }
  });

  row.querySelector('.edit-btn').addEventListener('click', () => {
    editingRow = row;
    document.getElementById('employeeName').value = row.cells[0].textContent;
    document.getElementById('employeeAge').value = (row.cells[1].textContent === 'N/A') ? '' : row.cells[1].textContent;
    document.getElementById('employeeJob').value = row.cells[2].textContent;
    document.getElementById('startTime').value = row.cells[3].textContent;
    document.getElementById('endTime').value = row.cells[4].textContent;
    saveBtn.textContent = 'Update Employee';
    showForm();
  });

  employeeTableBody.appendChild(row);
  hideForm();
  clearForm();
});
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
