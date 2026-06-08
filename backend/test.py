import requests

response = requests.post(
    "http://127.0.0.1:5000/tasks",
    json={
        "title": "Study Python"
    }
)

print(response.json())