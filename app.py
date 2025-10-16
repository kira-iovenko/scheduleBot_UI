from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

employees = [
    {"id": 1, "name": "Alice Johnson", "age": 29, "job": "manager", "start": "08:00", "end": "16:00"},
    {"id": 2, "name": "Ben Carter", "age": 22, "job": "server", "start": "10:00", "end": "18:00"},
    {"id": 3, "name": "Clara Kim", "age": 27, "job": "driver", "start": "12:00", "end": "20:00"},
    {"id": 4, "name": "David Lee", "age": 35, "job": "server", "start": "09:00", "end": "17:00"}
]
next_id = 5

settings = {
    "total_hours": 40,
    "show_start": "08:00",
    "show_end": "20:00",
    "jobs": ["Manager", "Server", "Driver"]
}
next_job_id = 1


@app.get("/api/employees")
def get_employees():
    return employees

@app.post("/api/employees")
def add_employee(emp: dict):
    global next_id
    emp['id'] = next_id
    next_id += 1
    employees.append(emp)
    return emp

@app.put("/api/employees/{id}")
def update_employee(id: int, data: dict):
    for emp in employees:
        if emp["id"] == id:
            emp.update(data)
            return emp
    return {"error": "Not found"}

@app.delete("/api/employees/{id}")
def delete_employee(id: int):
    global employees
    employees = [emp for emp in employees if emp["id"] != id]
    return {"message": "Deleted"}

@app.post("/api/schedule")
def schedule(data: dict):
    # schedule_grid = generate_schedule(data['employees'], data['demand'], data['school_in_session'])
    schedule_grid = {"schedule": "This is a placeholder schedule."}
    return schedule_grid

demand_db = {} 

@app.get("/demand/{date}")
def get_demand(date: str):
    return demand_db.get(date, [])

@app.post("/demand/{date}")
def save_demand(date: str, data: list):
    demand_db[date] = data
    return {"message": "Saved"}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/")
def serve_frontend():
    return FileResponse("frontend/index.html")
