import logging
import time
from typing import Dict

import requests
from authlib.oauth2.rfc7662 import IntrospectTokenValidator
from django.contrib.auth.models import AnonymousUser
from requests.auth import HTTPBasicAuth
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

# ZITADEL_DOMAIN = os.environ.get(
#     "ZITADEL_DOMAIN", "http://host.docker.internal:8080")
ZITADEL_DOMAIN = "http://localhost:8080"
CLIENT_ID = "217768039133806595@aai-demo"
CLIENT_SECRET = "65h4Pzs0xcbTedByUOZQoovsB7dOkdkAVoQjU7ZszhQhbNZ28kTzgaUJS77u8Z1T"


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

        return (TokenNoopUser(user_info=token), None)


class ZitadelIntrospectTokenValidator(IntrospectTokenValidator):
    def introspect_token(self, token_string):
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
