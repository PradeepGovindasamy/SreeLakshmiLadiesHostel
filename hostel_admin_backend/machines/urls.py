from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MachineCategoryViewSet, MachineViewSet, MaintenanceRecordViewSet,
    MachineIssueViewSet, MachineUsageLogViewSet
)

router = DefaultRouter()
router.register(r'categories', MachineCategoryViewSet, basename='machine-category')
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'maintenance', MaintenanceRecordViewSet, basename='maintenance-record')
router.register(r'issues', MachineIssueViewSet, basename='machine-issue')
router.register(r'usage', MachineUsageLogViewSet, basename='machine-usage')

urlpatterns = [
    path('', include(router.urls)),
]
