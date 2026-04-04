from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkerViewSet, WorkerAttendanceViewSet,
    WorkerSalaryViewSet, WorkerLeaveViewSet
)

router = DefaultRouter()
router.register(r'workers', WorkerViewSet, basename='worker')
router.register(r'attendance', WorkerAttendanceViewSet, basename='worker-attendance')
router.register(r'salaries', WorkerSalaryViewSet, basename='worker-salary')
router.register(r'leaves', WorkerLeaveViewSet, basename='worker-leave')

urlpatterns = [
    path('', include(router.urls)),
]
