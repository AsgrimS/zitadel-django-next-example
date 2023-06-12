import json
import logging
import os
import time
from typing import Dict

import jwt
import requests
from authlib.oauth2.rfc7662 import IntrospectTokenValidator
from django.contrib.auth.models import AnonymousUser
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

load_dotenv()
ZITADEL_DOMAIN = os.environ.get("ZITADEL_ISSUER")
CLIENT_ID = os.environ.get("ZITADEL_CLIENT_ID")
CLIENT_SECRET = os.environ.get("ZITADEL_CLIENT_SECRET")


class ValidatorError(Exception):
    def __init__(self, error: Dict[str, str], status_code: int):
        super().__init__()
        self.error = error
        self.status_code = status_code


class TokenNoopUser(AnonymousUser):
    """
    Django Rest Framework needs an user to consider authenticated
    """

    def __init__(self, user_info):
        super().__init__()
        self.user_info = user_info

    @property
    def is_authenticated(self):
        return True


class ZitadelAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get("Authorization")
        if not token:
            raise AuthenticationFailed()

        try:
            _, token = token.split(" ")
        except AttributeError:
            raise AuthenticationFailed()

        validator = ZitadelIntrospectTokenValidator()

        introspected_token = validator(token)
        validator.validate_token(introspected_token)

        print("\n--------------------------------")
        print("Introspected token: ")
        print(introspected_token)
        print("--------------------------------\n")

        return (TokenNoopUser(user_info=token), None)


class ZitadelIntrospectTokenValidator(IntrospectTokenValidator):
    def introspect_token(self, token_string):
        if not ZITADEL_DOMAIN or not CLIENT_ID or not CLIENT_SECRET:
            raise Exception("Variable missing from .env")

        url = f"{ZITADEL_DOMAIN}/oauth/v2/introspect"
        data = {
            "token": token_string,
            "token_type_hint": "access_token",
            "scope": "openid",
        }
        auth = HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET)
        resp = requests.post(url, data=data, auth=auth)
        resp.raise_for_status()
        return resp.json()

    # def validate_token(self, token, scopes, request):
    def validate_token(
        self,
        token,
    ):
        now = int(time.time())
        if not token:
            raise ValidatorError(
                {"code": "invalid_token_revoked", "description": "Token was revoked."},
                401,
            )
        """Expired"""
        if token["exp"] < now:
            raise ValidatorError(
                {"code": "invalid_token_expired", "description": "Token has expired."},
                401,
            )
        """Revoked"""
        if not token["active"]:
            raise AuthenticationFailed()
        """Insufficient Scope"""
        # if not self.match_token_scopes(token, scopes):
        #     raise ValidatorError(
        #         {
        #             "code": "insufficient_scope",
        #             "description": f"Token has insufficient scope. Route requires: {scopes}",
        #         },
        #         401,
        #     )

    def __call__(self, *args, **kwargs):
        res = self.introspect_token(*args, **kwargs)
        return res


class ZitadelLocalAuthentication(BaseAuthentication):
    ALGORITHM = "RS256"

    def authenticate(self, request):
        token = request.headers.get("Authorization")
        if not token:
            raise AuthenticationFailed()

        try:
            _, token = token.split(" ")
        except AttributeError:
            raise AuthenticationFailed()

        jwks = self.get_jwks()
        decoded_token = self.decode_token(token, jwks)
        self.validate_token(decoded_token)

        print("\n--------------------------------")
        print("Locally decoded token: ")
        print(decoded_token)
        print("--------------------------------\n")

        return (TokenNoopUser(user_info=decoded_token), None)

    def get_jwks(self):
        if not ZITADEL_DOMAIN or not CLIENT_ID or not CLIENT_SECRET:
            raise Exception("Variable missing from .env")

        url = f"{ZITADEL_DOMAIN}/oauth/v2/keys"
        auth = HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET)
        resp = requests.get(url, auth=auth, headers={"Host": "localhost:8000"})
        return resp.json()

    def decode_token(self, token, jwks):
        public_keys = {}
        for jwk in jwks["keys"]:
            kid = jwk["kid"]
            public_keys[kid] = jwt.get_algorithm_by_name(self.ALGORITHM).from_jwk(
                json.dumps(jwk)
            )

        kid = jwt.get_unverified_header(token)["kid"]
        key = public_keys[kid]
        return jwt.decode(
            token, key=key, algorithms=[self.ALGORITHM], audience=CLIENT_ID
        )

    def validate_token(self, token):
        now = int(time.time())
        if not token:
            raise AuthenticationFailed(
                detail={"code": "invalid_token", "description": "Invalid Token."}
            )
        if token["exp"] < now:
            raise AuthenticationFailed(
                detail={
                    "code": "invalid_token_expired",
                    "description": "Token has expired.",
                }
            )
