from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialViewSet,
    ExpenseViewSet,
    ExpenseCategoryViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register(r"materials", MaterialViewSet)
router.register(r"expenses", ExpenseViewSet)
router.register(r"categories", ExpenseCategoryViewSet)
router.register(r"transactions", TransactionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
