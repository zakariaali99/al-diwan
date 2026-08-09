from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from messaging.services import create_inbound_from_contact_form

from .serializers import ContactMessageSerializer


class ContactThrottle(AnonRateThrottle):
    rate = "5/hour"


class ContactMessageView(APIView):
    """Public contact-form submit — the site's 'receiving direct messages'
    entry point. Creates a Thread directly, no email round-trip needed."""

    permission_classes = [AllowAny]
    throttle_classes = [ContactThrottle]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        thread = create_inbound_from_contact_form(
            name=data["name"],
            email=data["email"],
            subject=data.get("subject", ""),
            body=data["message"],
        )
        return Response({"thread_id": thread.id}, status=201)
