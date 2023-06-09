from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.authentication import ZitadelAuthentication


class SampleProtectedResource(ViewSet):
    authentication_classes = [ZitadelAuthentication]

    def list(self, _):
        return Response("Hello from protected world!")


class SamplePublicResource(ViewSet):
    def list(self, _):
        return Response("Hello from public world!")
