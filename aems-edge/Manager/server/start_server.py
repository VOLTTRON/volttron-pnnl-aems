from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
import uvicorn
import argparse
import os

app = FastAPI()
security = HTTPBasic()

# Authentication credentials
VALID_USERNAME = "admin"
VALID_PASSWORD = "admin"

class JSONRPCRequest(BaseModel):
    jsonrpc: str
    method: str
    params: dict
    id: int

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username == VALID_USERNAME and credentials.password == VALID_PASSWORD:
        return True
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth")
def auth(credentials: HTTPBasicCredentials = Depends(security)):
    if authenticate(credentials):
        return {"message": "Authenticated"}

@app.post("/gs")
def gs(request: JSONRPCRequest):
    # Process the JSON-RPC request here
    return {"jsonrpc": request.jsonrpc, "result": "success", "id": request.id}

def main():
    parser = argparse.ArgumentParser(description="Start the FastAPI server with SSL.")
    parser.add_argument('--certfile', type=str, required=True, help='Path to the SSL certificate file')
    parser.add_argument('--keyfile', type=str, required=True, help='Path to the SSL key file')
    parser.add_argument('--port', type=int, default=8443, help='Port to run the server on (default: 8443)')
    args = parser.parse_args()

    # Validate file paths
    if not os.path.isfile(args.certfile):
        raise FileNotFoundError(f"Certificate file not found: {args.certfile}")
    if not os.path.isfile(args.keyfile):
        raise FileNotFoundError(f"Key file not found: {args.keyfile}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=args.port,
        ssl_certfile=args.certfile,
        ssl_keyfile=args.keyfile
    )

if __name__ == "__main__":
    main()
