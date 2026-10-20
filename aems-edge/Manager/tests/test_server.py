import pytest
from fastapi.testclient import TestClient
from server.start_server import app  # Import the FastAPI app from the correct module

# Create a new TestClient instance with your FastAPI app
client = TestClient(app)

RPC_PATH = "/vui/platforms/volttron1/agents/manager.rtu1/rpc/set_schedule"


def login() -> str:
    response = client.post("/authenticate", json={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_authentication_success():
    # Test successful authentication
    response = client.post("/authenticate", json={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert isinstance(body["refresh_token"], str) and body["refresh_token"]


def test_authentication_failure():
    # Test failed authentication with wrong credentials
    response = client.post("/authenticate", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401


def test_rpc_success():
    # The VUI RPC proxy answers with the raw RPC return value
    token = login()
    response = client.post(RPC_PATH, json={"data": {"Monday": "always_off"}},
                           headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() is True


def test_rpc_requires_bearer_token():
    response = client.post(RPC_PATH, json={"data": {}})
    assert response.status_code == 401

    response = client.post(RPC_PATH, json={"data": {}}, headers={"Authorization": "Bearer not-a-token"})
    assert response.status_code == 401


def test_rpc_requires_json_body():
    token = login()
    response = client.post(RPC_PATH, content="not json",
                           headers={"Authorization": f"Bearer {token}", "Content-Type": "text/plain"})
    assert response.status_code == 415


def test_gs_gateway_is_gone():
    # The retired JSON-RPC gateway is not served
    response = client.post("/gs", json={"jsonrpc": "2.0", "id": "manager.rtu1", "method": "set_schedule", "params": {}})
    assert response.status_code == 404
