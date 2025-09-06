# Two-Factor Authentication Implementation Guide

## Option 1: Django OTP (Recommended)
```bash
pip install django-otp qrcode[pil]
```

## Option 2: Email OTP (Simple)
```python
# In views_auth.py
from django.core.mail import send_mail
import random
import string

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(user, otp):
    send_mail(
        'Your Login OTP',
        f'Your OTP is: {otp}',
        'noreply@yourdomain.com',
        [user.email],
        fail_silently=False,
    )
```

## Option 3: SMS OTP
```python
# Using Twilio
from twilio.rest import Client

def send_otp_sms(phone_number, otp):
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=f'Your login OTP is: {otp}',
        from_='+1234567890',
        to=phone_number
    )
```

## Option 4: Google Authenticator/Authy
```python
# Using django-otp
from django_otp.models import Device
from django_otp.plugins.otp_totp.models import TOTPDevice

def setup_totp(user):
    device = TOTPDevice.objects.create(
        user=user,
        name='default',
        confirmed=True
    )
    return device.config_url  # QR code URL
```
