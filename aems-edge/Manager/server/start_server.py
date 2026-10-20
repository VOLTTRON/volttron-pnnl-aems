"""
Stand-in for the VOLTTRON web service, for exercising the AEMS app without a platform.

It serves the two endpoints the app uses:

* ``POST /authenticate`` takes a JSON username and password and returns access and
  refresh tokens, as VOLTTRON's AuthenticateEndpoints does.
* ``POST /vui/platforms/{platform}/agents/{identity}/rpc/{method}`` is the VOLTTRON
  User Interface (VUI) RPC proxy. It requires the access token as a bearer header and
  a JSON body of keyword arguments, and answers with the raw RPC return value. The
  AEMS Manager and ILC methods return ``True`` on success, which is what is echoed here.

The former ``/gs`` JSON-RPC gateway is not served: VOLTTRON no longer forwards agent
RPC through it.
"""
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel
import uvicorn
import argparse
import os
import secrets

app = FastAPI()

# Authentication credentials
VALID_USERNAME = "admin"
VALID_PASSWORD = "admin"

# Access tokens issued by /authenticate and accepted by the RPC endpoint.
_tokens: set[str] = set()


class Credentials(BaseModel):
    username: str
    password: str


def issue_token() -> str:
    token = secrets.token_urlsafe(32)
    _tokens.add(token)
    return token


def require_bearer(authorization: str | None = Header(default=None)) -> str:
    parts = (authorization or "").split(" ")
    if len(parts) != 2 or parts[0].upper() != "BEARER" or parts[1] not in _tokens:
        raise HTTPException(status_code=401, detail={"error": "Not Authorized"})
    return parts[1]


@app.post("/authenticate")
def authenticate(credentials: Credentials):
    if credentials.username == VALID_USERNAME and credentials.password == VALID_PASSWORD:
        return {"access_token": issue_token(), "refresh_token": issue_token()}
    raise HTTPException(status_code=401, detail={"error": "Not Authorized"})


@app.post("/vui/platforms/{platform}/agents/{identity}/rpc/{method}")
async def rpc(platform: str, identity: str, method: str, request: Request,
              _token: str = Depends(require_bearer)):
    if request.headers.get("content-type", "").split(";")[0].strip().lower() != "application/json":
        raise HTTPException(status_code=415, detail={"error": "Unsupported Media Type"})
    body = await request.json()
    if not isinstance(body, (dict, list)):
        raise HTTPException(status_code=400, detail={"error": "malformed request body"})
    # The real proxy forwards the body as the RPC arguments; the AEMS agents return True.
    return True


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
