from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "department", "position", "created_at")
    search_fields = ("user__username", "user__email", "position")
    list_filter = ("department", "created_at")
