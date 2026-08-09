from django.urls import path

from . import views

app_name = "pages"

urlpatterns = [
    path("", views.home, name="home"),
    path("services/", views.services, name="services"),
    path("about-us/", views.about, name="about"),
    path("contact-us/", views.contact, name="contact"),
]
