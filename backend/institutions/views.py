from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Institution
from .serializers import InstitutionSerializer

# Create your views here.

class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]
