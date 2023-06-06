from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.authentication import ZitadelAuthentication


class SampleResource(ViewSet):
    authentication_classes = [ZitadelAuthentication]

    def list(self, request):
        print("---------------------")
        print(request.headers.get("Authorization"))
        print("---------------------")
        # return Response(request.user.user_info)
        return Response("Hello World!")
