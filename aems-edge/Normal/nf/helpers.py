"""Example API wrapper

This file implements helpers
"""
import sys
import json
import os
import requests
import argparse
import base64


class JsonOauth(requests.auth.AuthBase):
    def __init__(self, base, oauth=None, creds=None):
        self.token = None
        self.base = base
        self.oauth = oauth
        self.creds = creds

    def handle_401(self, r, **kwargs):
        """
        If auth is configured, we may need to acquire a token and
        retry the request.  This might not work.
        """
        r.content
        r.close()

        res = requests.post(self.base + "/api/v1/auth/token", json={
            "client_id": self.oauth[0],
            "client_secret": self.oauth[1],
            "grant_type": "client_credentials"
        })

        if res.status_code != 200:
            raise Exception("Invalid authentication: ")

        info = res.json()
        self.token = info.get("accessToken", info.get("access_token"))

        prep = r.request.copy()
        prep.headers["Authorization"] = "Bearer " + self.token
        _r = r.connection.send(prep, **kwargs)
        _r.history.append(r)
        _r.request = prep
        return _r

    def __call__(self, r):
        if self.oauth is not None:
            # if using token auth, we need to request an access token
            if self.token is None:
                r.register_hook("response", self.handle_401)
            else:
                r.headers["Authorization"] = "Bearer " + self.token
        elif self.creds is not None:
            # if using basic, just send the credentials
            r.headers["Authorization"] = "Basic " + base64.b64encode(self.creds.encode("utf-8")).decode("utf-8")

        return r

class NfClient(object):
    """A simple wrapper for requests wihch adds authentication tokens"""

    def __init__(self, config):
        self.base = config.get('url').rstrip("/")
        user = config.get("user")
        client_id = config.get("client_id")
        client_secret = config.get("client_secret")
        self.auth = JsonOauth(self.base, oauth=(client_id, client_secret) if
                              client_id and client_secret else None,
                              creds=user)
    
    def get(self, path, *args, **kwargs):
        return requests.get(self.base + path, *args, auth=self.auth, **kwargs)

    def post(self, path, json={}, *args, **kwargs):
        return requests.post(self.base + path, auth=self.auth, json=json)
    

def get_response(res):
    """Interpret the response from requests
    """
    if res.status_code == 200:
        return res.json()
    else:
        if "x-nf-unauthorized-reason" in res.headers:
            sys.stderr.write(res.headers.get("x-nf-unauthorized-reason") + "\n")
            sys.exit(1)
        else:
            # the headers should have more information for other error
            print (res.headers)
            return {}
