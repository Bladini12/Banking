from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView, 
    UserLoginView, 
    UserProfileView,
    TransactionListView,
    TransactionDetailView,
    DepositView,
    TransferView,
    LoanView,
)

urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
    path('auth/transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('auth/transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('auth/deposit/', DepositView.as_view(), name='deposit'),
    path('auth/loan/', LoanView.as_view(), name='loan'),
    path('auth/transfer/', TransferView.as_view(), name='transfer'),
] 