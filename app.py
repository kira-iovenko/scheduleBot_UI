from fastapi import FastAPI

app = FastAPI()


employees = [
    {"id": 1, "name": "Alice Johnson", "age": 29, "job": "manager", "start": "08:00", "end": "16:00"},
    {"id": 2, "name": "Ben Carter", "age": 22, "job": "server", "start": "10:00", "end": "18:00"},
    {"id": 3, "name": "Clara Kim", "age": 27, "job": "driver", "start": "12:00", "end": "20:00"},
    {"id": 4, "name": "David Lee", "age": 35, "job": "server", "start": "09:00", "end": "17:00"}
]
next_id = 5

@app.get("/employees")
def get_employees():
    return employees

@app.post("/employees")
def add_employee(emp: dict):
    global next_id
    emp['id'] = next_id
    next_id += 1
    employees.append(emp)
    return emp

@app.put("/employees/{id}")
def update_employee(id: int, data: dict):
    for emp in employees:
        if emp["id"] == id:
            emp.update(data)
            return emp
    return {"error": "Not found"}

@app.delete("/employees/{id}")
def delete_employee(id: int):
    global employees
    employees = [emp for emp in employees if emp["id"] != id]
    return {"message": "Deleted"}


@app.get("/")
def read_root():
    return {"message": "Hello World"}
