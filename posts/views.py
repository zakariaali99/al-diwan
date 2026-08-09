from django.shortcuts import get_object_or_404, render
from django.core.paginator import Paginator

from .models import Category, Post


def post_list(request):
    posts = Post.objects.filter(status=Post.Status.PUBLISHED).select_related("category", "author")

    category_slug = request.GET.get("category")
    active_category = None
    if category_slug:
        active_category = Category.objects.filter(translations__slug=category_slug).first()
        if active_category:
            posts = posts.filter(category=active_category)

    paginator = Paginator(posts, 9)
    page = paginator.get_page(request.GET.get("page"))

    return render(request, "posts/post_list.html", {
        "page_obj": page,
        "categories": Category.objects.all(),
        "active_category": active_category,
    })


def post_detail(request, slug):
    post = get_object_or_404(
        Post.objects.filter(status=Post.Status.PUBLISHED).select_related("category", "author"),
        translations__slug=slug,
    )
    related = (
        Post.objects.filter(status=Post.Status.PUBLISHED, category=post.category)
        .exclude(pk=post.pk)[:3]
    )
    return render(request, "posts/post_detail.html", {"post": post, "related": related})
