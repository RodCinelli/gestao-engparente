from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserListView,
    UserCreateView,
    UserDetailView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("register/", UserCreateView.as_view(), name="user-register"),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path("login/", LoginView.as_view(), name="user-login"),
    path("logout/", LogoutView.as_view(), name="user-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
