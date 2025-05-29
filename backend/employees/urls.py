from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet,
    DepartmentViewSet,
    ConstructionViewSet,
    ConstructionSectorViewSet,
    DashboardView,
)

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet)
router.register(r"departments", DepartmentViewSet)
router.register(r"constructions", ConstructionViewSet)
router.register(r"construction-sectors", ConstructionSectorViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
