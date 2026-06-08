import sqlite3

connection = sqlite3.connect("tasks.db")
cursor = connection.cursor()

cursor.execute("SELECT * FROM tasks")

rows = cursor.fetchall()

print(rows)

connection.close()