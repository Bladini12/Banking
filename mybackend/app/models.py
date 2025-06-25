from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.db import transaction

class CustomUser(AbstractUser):
    class AccountStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')

    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_verified = models.BooleanField(default=False)
    status = models.CharField(
        max_length=10,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING
    )
    status_changed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    loan_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    account_number = models.CharField(max_length=10, unique=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def generate_account_number(self):
        """Generate a unique 10-digit account number"""
        while True:
            # Generate a 10-digit number
            account_number = ''.join(random.choices(string.digits, k=10))
            # Check if it already exists
            if not CustomUser.objects.filter(account_number=account_number).exists():
                return account_number

    def save(self, *args, **kwargs):
        if not self.account_number:
            self.account_number = self.generate_account_number()
        super().save(*args, **kwargs)

    def mark_as_rejected(self):
        self.status = self.AccountStatus.REJECTED
        self.status_changed_at = timezone.now()
        self.save()

    def mark_as_approved(self):
        self.status = self.AccountStatus.APPROVED
        self.status_changed_at = timezone.now()
        self.save()

    def should_be_deleted(self):
        if self.status == self.AccountStatus.REJECTED and self.status_changed_at:
            return timezone.now() - self.status_changed_at > timedelta(days=1)
        return False

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('transfer', 'Transfer'),
        ('loan','Loan'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    loan_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    processed_at = models.DateTimeField(null=True, blank=True)
    recipient = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transfers')
    description = models.CharField(max_length=255, blank=True)
    processed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_transactions')
    recipient_email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.transaction_type_display()} - {self.amount}"

    def transaction_type_display(self):
        if self.transaction_type == 'deposit':
            return 'Deposit'
        elif self.transaction_type == 'transfer':
            return 'Transfer'
        elif self.transaction_type == 'loan':
            return 'Loan'
        else:
            return self.transaction_type

    def approve(self, admin_user):
        if self.status != 'pending':
            raise ValueError("Only pending transactions can be approved")
        
        with transaction.atomic():
            if self.transaction_type == 'deposit':
                self.user.balance += self.amount
                self.user.save()
            elif self.transaction_type == 'transfer':
                # Check if recipient exists
                try:
                    recipient = CustomUser.objects.get(email=self.recipient_email)
                except CustomUser.DoesNotExist:
                    raise ValueError("Recipient does not exist")
                
                # Check if sender has sufficient balance
                if self.user.balance < self.amount:
                    raise ValueError("Insufficient balance")
                
                # Deduct from sender
                self.user.balance -= self.amount
                self.user.save()
                
                # Add to recipient
                recipient.balance += self.amount
                recipient.save()
                
                # Create a separate transaction record for the recipient
                Transaction.objects.create(
                    user=recipient,
                    transaction_type='transfer',
                    amount=self.amount,
                    status='approved',
                    description=f"Received transfer from {self.user.email}",
                    recipient_email=self.user.email,  # Store sender's email as recipient for the incoming transfer
                    processed_by=admin_user
                )
            elif self.transaction_type == 'loan':
                # Validate loan amount
                if self.amount <= 0:
                    raise ValueError("Loan amount must be greater than zero")
                
                # Update user's loan balance and regular balance
                self.user.loan_balance += self.amount
                self.user.balance += self.amount
                self.user.save()
                
                # Update the transaction's loan balance field
                self.loan_balance = self.user.loan_balance
            else:
                raise ValueError(f"Invalid transaction type: {self.transaction_type}")
            
            self.status = 'approved'
            self.processed_at = timezone.now()
            self.processed_by = admin_user
            self.save()

    def reject(self, admin_user):
        if self.status != 'pending':
            raise ValueError("Only pending transactions can be rejected")
        
        self.status = 'rejected'
        self.processed_at = timezone.now()
        self.processed_by = admin_user
        self.save()

    class Meta:
        ordering = ['-created_at']
