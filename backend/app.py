from flask_cors import CORS
import os
print("=================================")
print("RUNNING THIS APP.PY")
print(__file__)
print("=================================")
BASE_DIR = os.path.dirname(__file__)

DB_PATH = os.path.join(BASE_DIR, "tasks.db")

print("Database Path:", DB_PATH)

from flask import Flask, request
import sqlite3
app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return "Hello TaskFlow Backend!"

@app.route("/about")
def about():
    return "Welcome to TaskFlow Backend"
@app.route("/tasks")
def get_tasks():

    connection = sqlite3.connect(DB_PATH)
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

    connection = sqlite3.connect(DB_PATH)
    

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
            data["text"],
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

    connection = sqlite3.connect(DB_PATH)
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
    import os

    print(os.getcwd())

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute(
    """
    UPDATE tasks
    SET title = ?, completed = ?
    WHERE id = ?
    """,
    (
        data["title"],
        data["completed"],
        task_id
    )
)

    connection.commit()
    connection.close()

    return {
        "message": "Task updated"
    }
@app.route("/signup", methods=["POST"])
def signup():

    data = request.get_json()

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO users
            (username, email, password)
            VALUES (?, ?, ?)
            """,
            (
                data["username"],
                data["email"],
                data["password"]
            )
        )

        connection.commit()

        return {
            "message": "User created successfully"
        }, 201

    except sqlite3.IntegrityError:

        return {
            "message": "Email already exists"
        }, 400

    finally:

        connection.close()
@app.route("/test")
def test():
    return "Signup route is loaded!"
app.run()