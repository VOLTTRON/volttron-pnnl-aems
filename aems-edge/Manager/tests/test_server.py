import pytest
from fastapi.testclient import TestClient
from server.start_server import app  # Import the FastAPI app from the correct module

# Create a new TestClient instance with your FastAPI app
client = TestClient(app)

def test_authentication_success():
    # Test successful authentication
    response = client.post("/auth", auth=("admin", "admin"))
    assert response.status_code == 200
    assert response.json() == {"message": "Authenticated"}

def test_authentication_failure():
    # Test failed authentication with wrong credentials
    response = client.post("/auth", auth=("admin", "wrongpassword"))
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}

def test_jsonrpc_success():
    # Test JSON-RPC request
    jsonrpc_data = {
        "jsonrpc": "2.0",
        "method": "example_method",
        "params": {"key": "value"},
        "id": 1
    }
    response = client.post("/gs", json=jsonrpc_data)
    assert response.status_code == 200
    assert response.json() == {
        "jsonrpc": "2.0",
        "result": "success",
        "id": 1
    }

def test_jsonrpc_missing_field():
    # Test JSON-RPC request with missing fields
    jsonrpc_data = {
        "jsonrpc": "2.0",
        # "method": "example_method", # Commented out to trigger validation error
        "params": {"key": "value"},
        "id": 1
    }
    response = client.post("/gs", json=jsonrpc_data)
    assert response.status_code == 422  # Unprocessable Entity due to validation error
