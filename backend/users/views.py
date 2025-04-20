from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import UserSerializer, UserCreateSerializer, LoginSerializer

# Create your views here.


class UserListView(generics.ListAPIView):
    """
    Lista todos os usuários.
    Requer permissão de administrador.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserCreateView(generics.CreateAPIView):
    """
    Cria um novo usuário.
    """

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Recupera e atualiza um usuário específico.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LoginView(APIView):
    """
    Autentica um usuário e retorna tokens JWT.
    """

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout do usuário.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Em uma implementação JWT simples, o logout é gerenciado pelo cliente
        # simplesmente removendo o token JWT
        return Response(
            {"detail": "Logout realizado com sucesso."}, status=status.HTTP_200_OK
        )
