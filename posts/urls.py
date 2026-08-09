from django.urls import path, register_converter

from config.converters import UnicodeSlugConverter

from . import views

register_converter(UnicodeSlugConverter, "uslug")

app_name = "posts"

urlpatterns = [
    path("", views.post_list, name="list"),
    path("<uslug:slug>/", views.post_detail, name="detail"),
]
