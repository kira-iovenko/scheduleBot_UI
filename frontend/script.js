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

    const demandTableBody = document.getElementById('demandTableBody');
    const addHourBtn = document.getElementById('addHourBtn');
    const saveDemandBtn = document.getElementById('saveDemandBtn');
    const demandDate = document.getElementById('demandDate');

    let demandData = {
        "2025-10-14": [
            { hour: "08:00", manager: 1, server: 2, driver: 1 },
            { hour: "09:00", manager: 1, server: 3, driver: 1 },
            { hour: "10:00", manager: 2, server: 3, driver: 2 }
        ]
    };

    function loadDemand(date) {
        demandTableBody.innerHTML = '';
        const rows = demandData[date] || [];
        rows.forEach((slot, index) => addDemandRow(slot, index, date));
    }

    function addDemandRow(slot, index, date) {
        const row = document.createElement('tr');

        row.innerHTML = `
    <td><input type="time" value="${slot.hour}" class="hour-input"></td>
    <td><input type="number" min="0" value="${slot.manager}" class="demand-input" data-role="manager"></td>
    <td><input type="number" min="0" value="${slot.server}" class="demand-input" data-role="server"></td>
    <td><input type="number" min="0" value="${slot.driver}" class="demand-input" data-role="driver"></td>
  `;

        demandTableBody.appendChild(row);
    }

    addHourBtn.addEventListener('click', () => {
        const currentDate = demandDate.value;
        if (!demandData[currentDate]) demandData[currentDate] = [];
        demandData[currentDate].push({ hour: "00:00", manager: 0, server: 0, driver: 0 });
        loadDemand(currentDate);
    });

    saveDemandBtn.addEventListener('click', () => {
        const currentDate = demandDate.value;
        const newRows = Array.from(demandTableBody.querySelectorAll('tr')).map(row => ({
            hour: row.querySelector('.hour-input').value,
            manager: parseInt(row.querySelector('[data-role="manager"]').value),
            server: parseInt(row.querySelector('[data-role="server"]').value),
            driver: parseInt(row.querySelector('[data-role="driver"]').value)
        }));
        demandData[currentDate] = newRows;
        alert(`Demand for ${currentDate} saved!`);
        console.log(demandData);
    });

    demandDate.addEventListener('change', () => {
        loadDemand(demandDate.value);
    });

    loadDemand(demandDate.value);

    const jobTableBody = document.getElementById('jobTableBody');
    const addJobBtn = document.getElementById('addJobBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    const totalHoursInput = document.getElementById('totalHours');
    const showStartInput = document.getElementById('showStart');
    const showEndInput = document.getElementById('showEnd');

    let editingJobIndex = null;

    let settings = {
        totalHours: 40,
        showStart: "08:00",
        showEnd: "20:00",
        jobs: [
            { name: "Manager" },
            { name: "Server" },
            { name: "Driver" }
        ]
    };

    function loadSettings() {
        totalHoursInput.value = settings.totalHours;
        showStartInput.value = settings.showStart;
        showEndInput.value = settings.showEnd;

        jobTableBody.innerHTML = '';
        settings.jobs.forEach((job, index) => addJobRow(job, index));
    }

    function addJobRow(job, index) {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${escapeHtml(job.name)}</td>
        <td>
            <button class="action-btn edit-job-btn">Edit</button>
            <button class="action-btn delete-job-btn">Delete</button>
        </td>
    `;

        row.querySelector('.delete-job-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the job "${job.name}"?`)) {
                settings.jobs.splice(index, 1);
                loadSettings();
            }
        });

        row.querySelector('.edit-job-btn').addEventListener('click', () => {
            const newName = prompt("Edit job name:", job.name);
            if (newName && newName.trim() !== "") {
                settings.jobs[index].name = newName.trim();
                loadSettings();
            }
        });

        jobTableBody.appendChild(row);
    }

    addJobBtn.addEventListener('click', () => {
        const newJobName = prompt("Enter new job name:");
        if (newJobName && newJobName.trim() !== "") {
            settings.jobs.push({ name: newJobName.trim() });
            loadSettings();
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        const totalHours = parseInt(totalHoursInput.value);
        const showStart = showStartInput.value;
        const showEnd = showEndInput.value;

        if (isNaN(totalHours) || totalHours <= 0) {
            alert("Please enter a valid Total Hour Cap.");
            return;
        }
        if (!showStart || !showEnd || showStart >= showEnd) {
            alert("Please enter valid Show Start and End times.");
            return;
        }

        settings.totalHours = totalHours;
        settings.showStart = showStart;
        settings.showEnd = showEnd;

        alert("Settings saved!");
        console.log(settings);
    });

    loadSettings();



}

hideForm();
loadEmployees();
