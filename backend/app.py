from flask import Flask, request
import sqlite3
app = Flask(__name__)

@app.route("/")
def home():
    return "Hello TaskFlow Backend!"

@app.route("/about")
def about():
    return "Welcome to TaskFlow Backend"
@app.route("/tasks")
def get_tasks():

    connection = sqlite3.connect("tasks.db")
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM tasks"
    )

    rows = cursor.fetchall()

    connection.close()

    tasks = []

    for row in rows:
        tasks.append({
            "id": row[0],
            "title": row[1],
            "completed": bool(row[2])
        })

    return {
        "tasks": tasks
    }


@app.route(
    "/tasks",
    methods=["POST"]
)
def add_task():

    data = request.get_json()

    connection = sqlite3.connect(
        "tasks.db"
    )

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO tasks(
            title,
            completed
        )
        VALUES(?, ?)
        """,
        (
            data["title"],
            0
        )
    )

    connection.commit()

    connection.close()

    return {
        "message":
        "Task added successfully"
    }
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    connection = sqlite3.connect("tasks.db")
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM tasks WHERE id=?",
        (task_id,)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Task deleted"
    }
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    connection = sqlite3.connect("tasks.db")
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE tasks
        SET title = ?
        WHERE id = ?
        """,
        (
            data["title"],
            task_id
        )
    )

    connection.commit()
    connection.close()

    return {
        "message": "Task updated"
    }
app.run()