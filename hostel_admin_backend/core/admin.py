from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django import forms
from .models import Branch, Room, Tenant, RoomOccupancy, RentPayment, UserProfile, WardenAssignment, TenantRequest, BranchPermission


# Custom User creation form with role selection
class UserProfileInlineForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['role', 'phone_number', 'business_name', 'business_license', 'branch', 'is_active']


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    form = UserProfileInlineForm
    can_delete = False
    verbose_name_plural = 'Profile Information'
    fieldsets = (
        ('Role & Contact', {
            'fields': ('role', 'phone_number')
        }),
        ('Business Information (For Owners)', {
            'fields': ('business_name', 'business_license'),
            'classes': ('collapse',)
        }),
        ('Assignment', {
            'fields': ('branch', 'is_active')
        }),
    )


# Enhanced User Admin with Profile
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_role', 'get_branch', 'is_active')
    list_filter = ('is_active', 'profile__role', 'profile__branch')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'profile__phone_number')
    
    def get_role(self, obj):
        return obj.profile.get_role_display() if hasattr(obj, 'profile') else 'No Profile'
    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'
    
    def get_branch(self, obj):
        return obj.profile.branch.name if hasattr(obj, 'profile') and obj.profile.branch else 'No Branch'
    get_branch.short_description = 'Branch'
    get_branch.admin_order_field = 'profile__branch'
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Ensure UserProfile is created if it doesn't exist
        if not hasattr(obj, 'profile'):
            UserProfile.objects.create(user=obj)


# Branch Admin
class RoomInline(admin.TabularInline):
    model = Room
    extra = 1
    fields = ['room_name', 'sharing_type', 'attached_bath', 'ac_room', 'rent', 'floor_number', 'is_available']


class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'num_rooms', 'num_bathrooms', 'contact_phone', 'is_active']
    list_filter = ['is_active', 'owner']
    search_fields = ['name', 'address', 'contact_phone', 'contact_email']
    inlines = [RoomInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'address', 'description', 'owner')
        }),
        ('Facilities', {
            'fields': ('num_rooms', 'num_bathrooms')
        }),
        ('Contact Information', {
            'fields': ('contact_phone', 'contact_email')
        }),
        ('Status', {
            'fields': ('established_date', 'is_active')
        }),
    )


# Room Admin
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_name', 'branch', 'sharing_type', 'rent', 'floor_number', 'attached_bath', 'ac_room', 'is_available', 'current_occupancy']
    list_filter = ['branch', 'sharing_type', 'attached_bath', 'ac_room', 'is_available', 'floor_number']
    search_fields = ['room_name', 'branch__name']
    ordering = ['branch', 'floor_number', 'room_name']


# Tenant Admin
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'room', 'stay_type', 'joining_date', 'phone_number']
    list_filter = ['stay_type', 'room__branch', 'joining_date']
    search_fields = ['name', 'phone_number', 'email', 'user__username']
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'name', 'address', 'phone_number', 'email')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Stay Details', {
            'fields': ('stay_type', 'joining_date', 'vacating_date', 'room')
        }),
        ('ID Proof', {
            'fields': ('id_proof_type', 'id_proof_number')
        }),
        ('System Info', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        }),
    )


# Room Occupancy Admin
class RoomOccupancyAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'start_date', 'end_date', 'monthly_rent_agreed']
    list_filter = ['room__branch', 'start_date', 'end_date']
    search_fields = ['tenant__name', 'room__room_name']


# Rent Payment Admin
class RentPaymentAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'for_month', 'amount_paid', 'payment_date', 'payment_method', 'collected_by']
    list_filter = ['payment_method', 'payment_date', 'for_month', 'tenant__room__branch']
    search_fields = ['tenant__name', 'reference_number']
    date_hierarchy = 'payment_date'


# Warden Assignment Admin
class WardenAssignmentAdmin(admin.ModelAdmin):
    list_display = ['warden', 'branch', 'assigned_date', 'is_active', 'assigned_by']
    list_filter = ['is_active', 'branch', 'assigned_date']
    search_fields = ['warden__username', 'warden__first_name', 'branch__name']


# Tenant Request Admin
class TenantRequestAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'title', 'request_type', 'priority', 'status', 'created_at']
    list_filter = ['request_type', 'priority', 'status', 'tenant__room__branch']
    search_fields = ['title', 'tenant__name', 'description']
    date_hierarchy = 'created_at'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Register all models with custom admin
admin.site.register(Branch, BranchAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Tenant, TenantAdmin)
admin.site.register(RoomOccupancy, RoomOccupancyAdmin)
admin.site.register(RentPayment, RentPaymentAdmin)
admin.site.register(WardenAssignment, WardenAssignmentAdmin)
admin.site.register(TenantRequest, TenantRequestAdmin)
admin.site.register(BranchPermission)

# Customize admin site header
admin.site.site_header = "Sree Lakshmi Ladies Hostel Admin"
admin.site.site_title = "Hostel Admin Portal"
admin.site.index_title = "Welcome to Hostel Management System"
