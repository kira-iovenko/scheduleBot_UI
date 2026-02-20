---
title: ScheduleBot App
emoji: 🧭
colorFrom: yellow
colorTo: red
sdk: docker
sdk_version: "1.0"
pinned: false
---

# 🧭 ScheduleBot App

ScheduleBot is an employee scheduling web application powered by a **FastAPI** backend and a static HTML/CSS/JS frontend. It automatically generates optimized work schedules based on employee availability, job roles, demand data, and labor law constraints (including minor work-hour restrictions).

---

## ✨ Features

- **Employee management** – Add, edit, and remove employees with their job role and availability window.
- **Demand-based scheduling** – Input hourly staffing demand per job role; the algorithm fills shifts to best match that demand.
- **Labor law compliance** – Automatically enforces work-hour caps and restricted hours for minor employees (under 18).
- **Split shift support** – Schedules non-contiguous shifts when needed to cover demand gaps.
- **Visual schedule grid** – View the generated schedule in an interactive, color-coded hourly grid.
- **Docker-ready** – Ships as a single Docker image for easy deployment (including Hugging Face Spaces).

---

## 🗂️ Project Structure

```
scheduleBot_UI/
├── app.py                  # FastAPI application and REST API routes
├── schedule_generator.py   # Core scheduling algorithm
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container build instructions
└── frontend/
    ├── index.html          # Main UI page
    ├── script.js           # Frontend logic (API calls, schedule rendering)
    └── style.css           # Styles
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- `pip`
- (Optional) Docker

### Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app:app --host 0.0.0.0 --port 7860 --reload
```

Open your browser at [http://localhost:7860](http://localhost:7860).

### Run with Docker

```bash
# Build the image
docker build -t schedulebot .

# Run the container
docker run -p 7860:7860 schedulebot
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees` | List all employees |
| `POST` | `/api/employees` | Add a new employee |
| `PUT` | `/api/employees/{id}` | Update an existing employee |
| `DELETE` | `/api/employees/{id}` | Remove an employee |
| `POST` | `/api/schedule` | Generate a schedule from employees and demand |
| `GET` | `/demand/{date}` | Retrieve saved demand for a date |
| `POST` | `/demand/{date}` | Save demand data for a date |

### Employee Object

```json
{
  "name": "Alice Johnson",
  "age": 29,
  "job": "manager",
  "start": "08:00",
  "end": "16:00"
}
```

Supported `job` values: `manager`, `server`, `driver`.

### Schedule Request Body

```json
{
  "employees": [ /* array of employee objects */ ],
  "demand": [ /* array of hourly demand rows: [manager_count, server_count, driver_count] */ ],
  "school_in_session": false
}
```

---

## 🧠 Scheduling Algorithm

The algorithm in `schedule_generator.py` runs in six steps:

1. **Anchor placement** – For each employee, find the hour of highest demand for their job and place an initial one-hour anchor shift there.
2. **Greedy expansion** – Iteratively extend each shift left or right when doing so improves demand coverage, while penalizing employees who already have many hours (to spread workload evenly).
3. **Split shifts** – When contiguous expansion is exhausted, add a non-adjacent hour as a split shift.
4. **Gap filling** – Assign any remaining unscheduled employees to the highest-demand hours they can cover.
5. **Single-hour cleanup** – Replace or remove isolated one-hour assignments by extending an adjacent employee's shift instead.
6. **Grid construction** – Convert the final shift map into an hourly schedule grid keyed by hour and job role.

#### Labor Law Constraints

| Age | Max hours/day | Earliest start | Latest end | School day restriction |
|-----|--------------|----------------|------------|------------------------|
| ≤ 15 | 3 hours | 7:00 AM | 9:00 PM | None (7 AM limit applies every day) |
| 16–17 | 8 hours | 7:00 AM (school days only) | 11:00 PM | Cannot start before 7 AM on school days |
| 18+ | 24 hours | None | None | None |

Continuous shifts for minors (under 18) are also capped at 4 consecutive hours.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) |
| Server | [Uvicorn](https://www.uvicorn.org/) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Containerization | Docker |
| Hosting | [Hugging Face Spaces](https://huggingface.co/spaces) |

---

## 📄 License

This project is provided as-is for educational and demonstration purposes.
