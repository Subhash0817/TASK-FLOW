import sqlite3

connection = sqlite3.connect(
    "tasks.db"
)

cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks(
    id INTEGER PRIMARY KEY,
    title TEXT,
    completed INTEGER
)
""")

connection.commit()
connection.close()

print("Database Created!")