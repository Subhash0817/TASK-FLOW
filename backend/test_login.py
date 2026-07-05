import requests

response = requests.post(
    "http://127.0.0.1:5000/login",
    json={
        "email": "subhash@gmail.com",
        "password": "123456"
    }
)

print("Status:", response.status_code)
print(response.text)