import sqlite3

connection = sqlite3.connect("tasks.db")
cursor = connection.cursor()

# -----------------------------
# Tasks Table
# -----------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL
)
""")

# -----------------------------
# Users Table
# -----------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
""")

connection.commit()
connection.close()

print("Database created successfully!")