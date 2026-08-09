from django.contrib import messages as flash
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from messaging.models import Thread
from messaging.services import send_reply, start_thread
from posts.models import Post

from .decorators import dashboard_permission_required
from .forms import ComposeForm, PostForm, ReplyForm


class DashboardLoginView(auth_views.LoginView):
    template_name = "dashboard/login.html"


@login_required
def home(request):
    if request.user.has_perm("messaging.view_thread"):
        return redirect("dashboard:inbox_list")
    if request.user.has_perm("posts.view_post"):
        return redirect("dashboard:post_list")
    return render(request, "dashboard/home.html")


# --- Posts ---------------------------------------------------------------

@dashboard_permission_required("posts.view_post")
def post_list(request):
    posts = Post.objects.all().select_related("category", "author")
    return render(request, "dashboard/post_list.html", {"posts": posts})


@dashboard_permission_required("posts.add_post")
def post_create(request):
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES, _current_language="ar")
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            flash.success(request, "تم إنشاء المنشور.")
            return redirect("dashboard:post_edit", pk=post.pk)
    else:
        form = PostForm(_current_language="ar")
    return render(request, "dashboard/post_form.html", {"form": form, "post": None, "lang": "ar"})


@dashboard_permission_required("posts.change_post")
def post_edit(request, pk):
    post = get_object_or_404(Post, pk=pk)
    lang = request.GET.get("lang", "ar")
    # parler's form only honours _current_language when there's no `instance`
    # (with an instance it reads instance.get_current_language() instead, which
    # falls back to the request's active language, not our own ?lang= param).
    post.set_current_language(lang)
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES, instance=post, _current_language=lang)
        if form.is_valid():
            form.save()
            flash.success(request, "تم حفظ المنشور.")
            return redirect(f"{request.path}?lang={lang}")
    else:
        form = PostForm(instance=post, _current_language=lang)
    return render(request, "dashboard/post_form.html", {"form": form, "post": post, "lang": lang})


@dashboard_permission_required("posts.delete_post")
def post_delete(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == "POST":
        post.delete()
        flash.success(request, "تم حذف المنشور.")
        return redirect("dashboard:post_list")
    return render(request, "dashboard/post_confirm_delete.html", {"post": post})


# --- Inbox -----------------------------------------------------------------

@dashboard_permission_required("messaging.view_thread")
def inbox_list(request):
    threads = Thread.objects.select_related("correspondent", "assigned_to")
    status = request.GET.get("status")
    if status:
        threads = threads.filter(status=status)
    if request.GET.get("mine") == "1":
        threads = threads.filter(assigned_to=request.user)
    return render(request, "dashboard/inbox_list.html", {
        "threads": threads,
        "status": status or "",
        "mine": request.GET.get("mine") == "1",
    })


@dashboard_permission_required("messaging.view_thread")
def thread_detail(request, pk):
    thread = get_object_or_404(Thread.objects.select_related("correspondent"), pk=pk)

    if request.method == "POST":
        form = ReplyForm(request.POST)
        if form.is_valid():
            send_reply(thread, form.cleaned_data["body"], request.user)
            flash.success(request, "تم إرسال الرد.")
            return redirect("dashboard:thread_detail", pk=pk)
    else:
        form = ReplyForm()

    thread.messages.filter(is_read=False).update(is_read=True)
    if thread.is_unread:
        thread.is_unread = False
        thread.save(update_fields=["is_unread"])

    return render(request, "dashboard/thread_detail.html", {
        "thread": thread,
        "messages_list": thread.messages.select_related("sent_by").prefetch_related("attachments"),
        "form": form,
    })


@dashboard_permission_required("messaging.change_thread")
def thread_assign_to_me(request, pk):
    thread = get_object_or_404(Thread, pk=pk)
    if request.method == "POST":
        thread.assigned_to = request.user
        thread.save(update_fields=["assigned_to"])
        flash.success(request, "تم إسناد المحادثة إليك.")
    return redirect("dashboard:thread_detail", pk=pk)


@dashboard_permission_required("messaging.change_thread")
def thread_close(request, pk):
    thread = get_object_or_404(Thread, pk=pk)
    if request.method == "POST":
        thread.status = Thread.Status.CLOSED
        thread.save(update_fields=["status"])
        flash.success(request, "تم إغلاق المحادثة.")
    return redirect("dashboard:thread_detail", pk=pk)


@dashboard_permission_required("messaging.add_thread")
def thread_compose(request):
    if request.method == "POST":
        form = ComposeForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            thread = start_thread(
                subject=data["subject"],
                body=data["body"],
                to_email=data["to_email"],
                sent_by=request.user,
                correspondent_name=data["to_name"],
            )
            flash.success(request, "تم إرسال الرسالة.")
            return redirect("dashboard:thread_detail", pk=thread.pk)
    else:
        form = ComposeForm()
    return render(request, "dashboard/thread_compose.html", {"form": form})
