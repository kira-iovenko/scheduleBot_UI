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



@app.get("/")
def read_root():
    return {"message": "Hello World"}
