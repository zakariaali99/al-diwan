from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("login/", views.DashboardLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("", views.home, name="home"),

    path("posts/", views.post_list, name="post_list"),
    path("posts/new/", views.post_create, name="post_create"),
    path("posts/<int:pk>/edit/", views.post_edit, name="post_edit"),
    path("posts/<int:pk>/delete/", views.post_delete, name="post_delete"),

    path("inbox/", views.inbox_list, name="inbox_list"),
    path("inbox/compose/", views.thread_compose, name="thread_compose"),
    path("inbox/<int:pk>/", views.thread_detail, name="thread_detail"),
    path("inbox/<int:pk>/assign-to-me/", views.thread_assign_to_me, name="thread_assign_to_me"),
    path("inbox/<int:pk>/close/", views.thread_close, name="thread_close"),
]
