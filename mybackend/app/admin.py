from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from django.utils.html import format_html
from django.db.models import Sum
from .models import CustomUser, Transaction

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'account_number', 'phone_number', 'is_verified', 'status_badge', 'balance_display', 'is_staff', 'date_joined','loan_balance')
    list_filter = ('status', 'is_verified', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'phone_number', 'account_number')
    ordering = ('-date_joined',)
    actions = ['approve_users', 'reject_users']
    readonly_fields = ('account_number', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number', 'account_number')}),
        ('Account Status', {'fields': ('status', 'is_verified', 'status_changed_at')}),
        ('Financial', {'fields': ('balance','loan_balance')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px; border-radius: 5px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def balance_display(self, obj):
        color = 'green' if obj.balance >= 0 else 'red'
        amount = f"{obj.balance:,.2f}FCFA"
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            amount
        )
    def loan_display(self, obj):
        color = 'red' 
        amount = f"-{obj.balance:,.2f}FCFA"
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            amount
        )
    loan_display.short_description = 'Loan Balance'

    def approve_users(self, request, queryset):
        for user in queryset:
            user.mark_as_approved()
        self.message_user(request, f"{queryset.count()} users were approved.")
    approve_users.short_description = "Approve selected users"

    def reject_users(self, request, queryset):
        for user in queryset:
            user.mark_as_rejected()
        self.message_user(request, f"{queryset.count()} users were rejected.")
    reject_users.short_description = "Reject selected users"

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_transaction_type', 'amount', 'get_status', 'created_at', 'processed_by','loan_balance')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('user__email', 'recipient_email', 'description')
    readonly_fields = ('created_at',)
    actions = ['approve_transactions', 'reject_transactions']
    
    def get_transaction_type(self, obj):
        return obj.get_transaction_type_display()
    get_transaction_type.short_description = 'Type'
    
    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'Status'

    def approve_transactions(self, request, queryset):
        success_count = 0
        error_count = 0
        for transaction in queryset:
            if transaction.status == 'pending':
                try:
                    transaction.approve(request.user)
                    success_count += 1
                except ValueError as e:
                    error_count += 1
                    self.message_user(request, f"Error approving transaction {transaction.id}: {str(e)}", level='error')
        
        if success_count > 0:
            self.message_user(request, f"{success_count} transactions were successfully approved.")
        if error_count > 0:
            self.message_user(request, f"{error_count} transactions failed to approve.", level='warning')
    approve_transactions.short_description = "Approve selected transactions"

    def reject_transactions(self, request, queryset):
        success_count = 0
        error_count = 0
        for transaction in queryset:
            if transaction.status == 'pending':
                try:
                    transaction.reject(request.user)
                    success_count += 1
                except ValueError as e:
                    error_count += 1
                    self.message_user(request, f"Error rejecting transaction {transaction.id}: {str(e)}", level='error')
        
        if success_count > 0:
            self.message_user(request, f"{success_count} transactions were successfully rejected.")
        if error_count > 0:
            self.message_user(request, f"{error_count} transactions failed to reject.", level='warning')
    reject_transactions.short_description = "Reject selected transactions"

    def save_model(self, request, obj, form, change):
        if not change:  # Only for new transactions
            obj.user = request.user
        super().save_model(request, obj, form, change)
