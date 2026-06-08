import requests

response = requests.delete(
    "http://127.0.0.1:5000/tasks/6"
)

print(response.status_code)
print(response.text)