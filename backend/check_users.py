import sqlite3

connection = sqlite3.connect("tasks.db")
cursor = connection.cursor()

cursor.execute("SELECT * FROM users")

print(cursor.fetchall())

connection.close()