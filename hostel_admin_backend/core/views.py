from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Branch, Room, Tenant, RoomOccupancy, RentPayment
from .serializers import (
    BranchSerializer, RoomSerializer,
    TenantSerializer, RoomOccupancySerializer,
    RentPaymentSerializer
)

# Legacy ViewSets kept for URL backward-compatibility only.
# All active traffic uses /api/v2/* (views_enhanced.py).
# These return empty querysets to prevent data leakage.

class BranchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Branch.objects.none()
    serializer_class = BranchSerializer

class RoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Room.objects.none()
    serializer_class = RoomSerializer

class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Tenant.objects.none()
    serializer_class = TenantSerializer

class RoomOccupancyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RoomOccupancy.objects.none()
    serializer_class = RoomOccupancySerializer

class RentPaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RentPayment.objects.none()
    serializer_class = RentPaymentSerializer
