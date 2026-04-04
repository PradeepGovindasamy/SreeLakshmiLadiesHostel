# Test Tenant Request API
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from core.models import UserProfile, Branch, Room, Tenant, TenantRequest


class TenantRequestAPITest(TestCase):
    """Test cases for Tenant Request API"""
    
    def setUp(self):
        """Set up test data"""
        # Create users with different roles
        self.owner_user = User.objects.create_user(
            username='owner1', email='owner@test.com', password='test123'
        )
        self.owner_profile = UserProfile.objects.create(
            user=self.owner_user, role='owner', phone_number='1234567890'
        )
        
        self.warden_user = User.objects.create_user(
            username='warden1', email='warden@test.com', password='test123'
        )
        self.warden_profile = UserProfile.objects.create(
            user=self.warden_user, role='warden', phone_number='1234567891'
        )
        
        self.tenant_user = User.objects.create_user(
            username='tenant1', email='tenant@test.com', password='test123'
        )
        self.tenant_profile = UserProfile.objects.create(
            user=self.tenant_user, role='tenant', phone_number='1234567892'
        )
        
        # Create branch
        self.branch = Branch.objects.create(
            name='Test Branch',
            address='Test Address',
            city='Test City',
            owner=self.owner_user
        )
        
        # Create room
        self.room = Room.objects.create(
            branch=self.branch,
            room_name='Room 101',
            room_type='single',
            rent_amount=5000.00,
            is_available=False
        )
        
        # Create tenant
        self.tenant = Tenant.objects.create(
            user=self.tenant_user,
            name='Test Tenant',
            room=self.room,
            phone_number='1234567892',
            email='tenant@test.com',
            date_of_joining='2024-01-01'
        )
        
        # Create API client
        self.client = APIClient()
    
    def test_tenant_can_create_request(self):
        """Test that tenant can create service request"""
        self.client.force_authenticate(user=self.tenant_user)
        
        data = {
            'request_type': 'maintenance',
            'title': 'Broken AC',
            'description': 'The air conditioner is not working properly',
            'priority': 'medium'
        }
        
        response = self.client.post('/api/tenant-requests/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TenantRequest.objects.count(), 1)
        
        request = TenantRequest.objects.first()
        self.assertEqual(request.tenant, self.tenant)
        self.assertEqual(request.title, 'Broken AC')
    
    def test_tenant_can_view_own_requests(self):
        """Test that tenant can view their own requests"""
        # Create a request
        request_obj = TenantRequest.objects.create(
            tenant=self.tenant,
            request_type='complaint',
            title='Test Request',
            description='Test Description',
            priority='high'
        )
        
        self.client.force_authenticate(user=self.tenant_user)
        response = self.client.get('/api/tenant-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Request')
    
    def test_owner_can_view_branch_requests(self):
        """Test that owner can view requests from their branches"""
        # Create a request
        request_obj = TenantRequest.objects.create(
            tenant=self.tenant,
            request_type='service',
            title='Owner Test Request',
            description='Test Description',
            priority='low'
        )
        
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.get('/api/tenant-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Owner Test Request')
    
    def test_tenant_my_requests_endpoint(self):
        """Test tenant-specific 'my' endpoint"""
        # Create a request
        request_obj = TenantRequest.objects.create(
            tenant=self.tenant,
            request_type='payment',
            title='Payment Issue',
            description='Payment not processed',
            priority='urgent'
        )
        
        self.client.force_authenticate(user=self.tenant_user)
        response = self.client.get('/api/tenant-requests/my/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Payment Issue')
    
    def test_api_filtering(self):
        """Test API filtering capabilities"""
        # Create multiple requests
        TenantRequest.objects.create(
            tenant=self.tenant,
            request_type='maintenance',
            title='High Priority Request',
            description='Urgent maintenance needed',
            priority='high'
        )
        
        TenantRequest.objects.create(
            tenant=self.tenant,
            request_type='complaint',
            title='Low Priority Request',
            description='Minor complaint',
            priority='low'
        )
        
        self.client.force_authenticate(user=self.tenant_user)
        
        # Test priority filtering
        response = self.client.get('/api/tenant-requests/?priority=high')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['priority'], 'high')
        
        # Test request type filtering
        response = self.client.get('/api/tenant-requests/?request_type=maintenance')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['request_type'], 'maintenance')
