from rest_framework import viewsets
from .models import Branch, Room, Tenant, RoomOccupancy, RentPayment
from .serializers import (
    BranchSerializer, RoomSerializer,
    TenantSerializer, RoomOccupancySerializer,
    RentPaymentSerializer
)

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

class RoomOccupancyViewSet(viewsets.ModelViewSet):
    queryset = RoomOccupancy.objects.all()
    serializer_class = RoomOccupancySerializer

class RentPaymentViewSet(viewsets.ModelViewSet):
    queryset = RentPayment.objects.all()
    serializer_class = RentPaymentSerializer
