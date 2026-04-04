from django.db import models
from django.contrib.auth.models import User
from core.models import Branch


class GroceryCategory(models.Model):
    """Categories for grocery items"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Grocery Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class GroceryItem(models.Model):
    """Master list of grocery items"""
    
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('g', 'Gram'),
        ('l', 'Liter'),
        ('ml', 'Milliliter'),
        ('piece', 'Piece'),
        ('packet', 'Packet'),
        ('bag', 'Bag'),
        ('bottle', 'Bottle'),
        ('box', 'Box'),
    ]
    
    name = models.CharField(max_length=200)
    category = models.ForeignKey(GroceryCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='kg')
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Minimum quantity to maintain")
    
    # Average pricing (for reference)
    avg_price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.unit})"


class Vendor(models.Model):
    """Suppliers/Vendors for grocery items"""
    
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField()
    
    # Business details
    gstin = models.CharField(max_length=15, blank=True, verbose_name="GST Number")
    pan_number = models.CharField(max_length=10, blank=True)
    
    # Payment terms
    payment_terms = models.CharField(max_length=100, blank=True, help_text="e.g., Net 30 days, Cash on delivery")
    
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class GroceryStock(models.Model):
    """Current stock levels per branch"""
    
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='grocery_stocks')
    item = models.ForeignKey(GroceryItem, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_restocked = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['branch', 'item']
        ordering = ['branch', 'item']
        indexes = [
            models.Index(fields=['branch', 'quantity']),
        ]
    
    def __str__(self):
        return f"{self.item.name} - {self.branch.name}: {self.quantity} {self.item.unit}"
    
    @property
    def is_low_stock(self):
        """Check if stock is below minimum level"""
        return self.quantity < self.item.min_stock_level
    
    @property
    def stock_status(self):
        """Get stock status"""
        if self.quantity == 0:
            return 'out_of_stock'
        elif self.is_low_stock:
            return 'low_stock'
        else:
            return 'in_stock'


class GroceryPurchase(models.Model):
    """Record of grocery purchases"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('cheque', 'Cheque'),
        ('credit', 'Credit'),
    ]
    
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='grocery_purchases')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name='purchases')
    
    purchase_date = models.DateField()
    invoice_number = models.CharField(max_length=100, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-purchase_date']
        indexes = [
            models.Index(fields=['branch', 'purchase_date']),
            models.Index(fields=['vendor', 'payment_status']),
        ]
    
    def __str__(self):
        return f"Purchase #{self.id} - {self.branch.name} - {self.purchase_date}"
    
    @property
    def balance_amount(self):
        """Calculate remaining balance"""
        return self.total_amount - self.amount_paid


class GroceryPurchaseItem(models.Model):
    """Individual items in a purchase"""
    
    purchase = models.ForeignKey(GroceryPurchase, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(GroceryItem, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        ordering = ['item__name']
    
    def __str__(self):
        return f"{self.item.name} - {self.quantity} {self.item.unit}"
    
    def save(self, *args, **kwargs):
        # Calculate total price automatically
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class GroceryConsumption(models.Model):
    """Track daily/monthly consumption"""
    
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='grocery_consumptions')
    item = models.ForeignKey(GroceryItem, on_delete=models.CASCADE, related_name='consumptions')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    consumption_date = models.DateField()
    
    purpose = models.CharField(max_length=200, blank=True, help_text="e.g., Daily cooking, Event, etc.")
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-consumption_date']
        indexes = [
            models.Index(fields=['branch', 'consumption_date']),
            models.Index(fields=['item', 'consumption_date']),
        ]
    
    def __str__(self):
        return f"{self.item.name} - {self.quantity} {self.item.unit} on {self.consumption_date}"
