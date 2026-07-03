import requests

response = requests.post(
    "http://127.0.0.1:5000/signup",
    json={
        "username": "Subhash",
        "email": "subhash@gmail.com",
        "password": "123456"
    }
)

print("Status Code:", response.status_code)
print("Response:")
print(response.text)