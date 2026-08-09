from rest_framework import serializers


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    message = serializers.CharField()
