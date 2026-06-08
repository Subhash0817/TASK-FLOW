from flask import Flask, request

app = Flask(__name__)
tasks_list = [
    {
        "id": 1,
        "title": "Watch Anime",
        "completed": False
    },
    {
        "id": 2,
        "title": "Learn Flask",
        "completed": True
    },
    {
        "id": 3,
        "title": "Go Gym",
        "completed": False
    }
]
@app.route("/")
def home():
    return "Hello TaskFlow Backend!"

@app.route("/about")
def about():
    return "Welcome to TaskFlow Backend"

@app.route("/tasks")
def get_tasks():
    return {
        "tasks": tasks_list
    }
@app.route("/tasks", methods=["POST"])
def add_task():

    new_task = {
        "id": len(tasks_list) + 1,
        "title": "Watch anime",
        "completed": False
    }

    tasks_list.append(new_task)

    return {
        "message": "Task added",
        "task": new_task
    }
app.run()