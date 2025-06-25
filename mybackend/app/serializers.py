from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Transaction, CustomUser

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'phone_number')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class UserProfileSerializer(serializers.ModelSerializer):
    balance = serializers.FloatField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                 'phone_number', 'is_verified', 'status', 'balance', 
                 'account_number','loan_balance' ,'created_at']
        read_only_fields = ['id', 'email', 'is_verified', 'status', 
                           'balance','loan_balance', 'account_number', 'created_at']

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    processed_by = serializers.PrimaryKeyRelatedField(read_only=True)
    status = serializers.CharField(read_only=True)
    processed_at = serializers.DateTimeField(read_only=True)
    transaction_type_display = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ('id', 'user', 'amount', 'transaction_type', 'transaction_type_display', 'status', 'created_at', 'processed_at', 'processed_by', 'description')
        read_only_fields = ('id', 'user', 'status', 'created_at', 'processed_at', 'processed_by')

    def get_transaction_type_display(self, obj):
        if obj.transaction_type == 'deposit':
            return 'Deposit'
        elif obj.transaction_type == 'transfer':
            return 'Transfer'
        else:
            return obj.transaction_type

class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('amount', 'description')
        extra_kwargs = {
            'description': {'required': False}
        }

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['transaction_type'] = 'deposit'
        return super().create(validated_data)

class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('amount', 'description')
        extra_kwargs = {
            'description': {'required': False}
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated")
        
        validated_data['user'] = request.user
        validated_data['transaction_type'] = 'deposit'
        return super().create(validated_data)
    
class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('amount', 'description')
        extra_kwargs = {
            'description': {'required': True}
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated")
        
        validated_data['user'] = request.user
        validated_data['transaction_type'] = 'loan'
        return super().create(validated_data)

class TransferSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    recipient_account_number = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        user = self.context['request'].user
        amount = data['amount']
        recipient_account_number = data['recipient_account_number']
        if amount <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        if user.balance < amount:
            raise serializers.ValidationError('Insufficient balance.')
        try:
            recipient = CustomUser.objects.get(account_number=recipient_account_number)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Recipient account number does not exist.')
        if recipient == user:
            raise serializers.ValidationError('Cannot transfer to your own account.')
        data['recipient'] = recipient
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        recipient = validated_data['recipient']
        amount = validated_data['amount']
        description = validated_data.get('description', '')
        transaction = Transaction.objects.create(
            user=user,
            recipient=recipient,
            amount=amount,
            transaction_type='transfer',
            status='pending',
            description=description,
            recipient_email=recipient.email
        )
        return transaction 