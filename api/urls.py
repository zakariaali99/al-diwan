from django.urls import path

from .views import ContactMessageView

app_name = "api"

urlpatterns = [
    path("contact/", ContactMessageView.as_view(), name="contact"),
]
