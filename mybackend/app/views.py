from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    TransactionSerializer,
    TransactionCreateSerializer,
    DepositSerializer,
    TransferSerializer, 
    LoanSerializer,
)
from .models import CustomUser, Transaction

User = get_user_model()

# Create your views here.

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'status': 'success',
                'message': 'Registration successful! Please login with your credentials.',
                'redirect_to': '/login'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'status': 'error',
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': 'Invalid input',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )

        if not user:
            return Response({
                'status': 'error',
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if user.status == CustomUser.AccountStatus.REJECTED:
            return Response({
                'status': 'error',
                'message': 'Your account has been rejected. It will be deleted in 24 hours.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.status == CustomUser.AccountStatus.PENDING:
            return Response({
                'status': 'error',
                'message': 'Your account is pending admin approval. You will be notified once approved.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.status == CustomUser.AccountStatus.APPROVED:
            refresh = RefreshToken.for_user(user)
            return Response({
                'status': 'success',
                'message': 'Login successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'redirect_to': '/dashboard'
            }, status=status.HTTP_200_OK)

        return Response({
            'status': 'error',
            'message': 'Account status is invalid'
        }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class TransactionListView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DepositSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionDetailView(generics.RetrieveAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

class DepositView(generics.CreateAPIView):
    serializer_class = DepositSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({
            'status': 'success',
            'message': 'Deposit request submitted successfully. Waiting for admin approval.',
            'transaction': serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)
class LoanView(generics.CreateAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({
            'status': 'success',
            'message': 'Loan request submitted successfully. Waiting for admin approval.',
            'transaction': serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)

class TransferView(generics.CreateAPIView):
    serializer_class = TransferSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        transaction = serializer.save()
        return Response({
            'message': 'Transfer request submitted and pending admin approval.',
            'transaction': TransactionSerializer(transaction).data
        }, status=status.HTTP_201_CREATED)
