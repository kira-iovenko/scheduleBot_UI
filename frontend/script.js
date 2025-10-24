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

let employees = [];

async function fetchEmployees() {
    try {
        const response = await fetch("/api/employees");
        if (!response.ok) throw new Error("Failed to fetch employees");
        employees = await response.json();
        loadEmployees();
        await generateAndLoadSchedule();
    } catch (err) {
        console.error(err);
        alert("Could not load employees from server");
    }
}

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

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function addEmployeeRow(empData, index) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${escapeHtml(empData.name)}</td>
        <td>${escapeHtml(empData.age || 'N/A')}</td>
        <td>${escapeHtml(capitalize(empData.job))}</td>
        <td>${escapeHtml(empData.start)}</td>
        <td>${escapeHtml(empData.end)}</td>
        <td>
            <button class="action-btn edit-btn">Edit</button>
            <button class="action-btn delete-btn">Delete</button>
        </td>
    `;
    row.querySelector('.delete-btn').addEventListener('click', async() => {
        if (confirm(`Are you sure you want to delete ${empData.name}?`)) {
            try {
                const response = await fetch(`/api/employees/${empData.id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete employee');
                employees.splice(index, 1);
                loadEmployees();
                await generateAndLoadSchedule();
            } catch (err) {
                console.error(err);
                alert('Failed to delete employee on server.');
            }
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

addEmployeeBtn.addEventListener('click', () => {
    clearForm();
    showForm();
});
cancelBtn.addEventListener('click', () => {
    hideForm();
    clearForm();
});
saveBtn.addEventListener('click', async () => {
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

    try {
        if (editingIndex !== null) {
            // Update existing employee
            const id = employees[editingIndex].id;
            const response = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empData)
            });
            if (!response.ok) throw new Error('Failed to update employee');
            const updated = await response.json();
            employees[editingIndex] = updated;
            editingIndex = null;
        } else {
            // Add new employee
            const response = await fetch("/api/employees", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empData)
            });
            if (!response.ok) throw new Error('Failed to add employee');
            const newEmp = await response.json();
            employees.push(newEmp);
        }
        clearForm();
        hideForm();
        loadEmployees();
        await generateAndLoadSchedule();
    } catch (err) {
        console.error(err);
        alert('Error saving employee to server.');
    }
});

fetchEmployees();

const demandTableBody = document.getElementById('demandTableBody');
const addHourBtn = document.getElementById('addHourBtn');
const saveDemandBtn = document.getElementById('saveDemandBtn');
const demandDate = document.getElementById('demandDate');

let demandData = {};

async function loadDemand(date) {
    try {
        const response = await fetch(`/demand/${date}`);
        if (!response.ok) throw new Error('Failed to fetch demand');
        const rows = await response.json();
        demandData[date] = rows;
        demandTableBody.innerHTML = '';
        rows.forEach((slot, index) => addDemandRow(slot, index, date));
    } catch (err) {
        console.error(err);
        demandData[date] = [];
        demandTableBody.innerHTML = '';
    }
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

saveDemandBtn.addEventListener('click', async () => {
    const currentDate = demandDate.value;
    const newRows = Array.from(demandTableBody.querySelectorAll('tr')).map(row => ({
        hour: row.querySelector('.hour-input').value,
        manager: parseInt(row.querySelector('[data-role="manager"]').value),
        server: parseInt(row.querySelector('[data-role="server"]').value),
        driver: parseInt(row.querySelector('[data-role="driver"]').value)
    }));
    demandData[currentDate] = newRows;
    try {
        const response = await fetch(`/demand/${currentDate}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRows)
        });
        if (!response.ok) throw new Error('Failed to save demand');
        alert(`Demand for ${currentDate} saved!`);
        await generateAndLoadSchedule();
    } catch (err) {
        console.error(err);
        alert('Failed to save demand to server.');
    }
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

let settings = {
    totalHours: 40,
    showStart: "08:00",
    showEnd: "20:00",
    jobs: [
        { name: "manager" },
        { name: "server" },
        { name: "driver" }
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


const scheduleTableBody = document.getElementById('scheduleTableBody');

let scheduleData = [];

function loadSchedule() {
    scheduleTableBody.innerHTML = '';
    scheduleData.forEach(slot => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${slot.hour}</td>
            <td>${slot.manager.join(", ") || "-"}</td>
            <td>${slot.server.join(", ") || "-"}</td>
            <td>${slot.driver.join(", ") || "-"}</td>
        `;

        scheduleTableBody.appendChild(row);
    });
}

async function generateAndLoadSchedule() {
    const employeesForApi = employees.map(emp => ({
        id: emp.id, name: emp.name, job: emp.job, start: emp.start, end: emp.end, age: emp.age
    }));
    const demandForApi = demandData[demandDate.value] || [];
    if(demandForApi.length === 0) {
        alert("Please enter at least one demand row before generating schedule.");
        return;
    }
    const demandMatrix = demandForApi.map(row => [row.manager, row.server, row.driver]);

    try {
        const res = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employees: employeesForApi,
                demand: demandMatrix,
                school_in_session: false
            })
        });
        if (!res.ok) throw new Error('Failed to generate schedule');
        const data = await res.json();

        const names = {};
        employeesForApi.forEach(emp => { names[emp.id] = emp.name; });

        scheduleData = Object.keys(data.schedule || {}).sort().map(hour => ({
            hour: hour.padStart(2,'0') + ":00",
            manager: (data.schedule[hour].manager || []).map(id => names[id]),
            server: (data.schedule[hour].server || []).map(id => names[id]),
            driver: (data.schedule[hour].driver || []).map(id => names[id])
        }));

        loadSchedule();
    } catch (err) {
        console.error(err);
        alert('Failed to generate schedule from server.');
    }
}

generateAndLoadSchedule();