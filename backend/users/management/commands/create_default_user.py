from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Cria um usuário padrão para desenvolvimento"

    def handle(self, *args, **kwargs):
        username = "Andreteste"
        email = "andre@engparente.com"
        password = "teste1234"

        if not User.objects.filter(username=username).exists():
            User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name="André",
                last_name="Teste",
            )
            self.stdout.write(
                self.style.SUCCESS(f'Usuário "{username}" criado com sucesso!')
            )
        else:
            self.stdout.write(self.style.WARNING(f'Usuário "{username}" já existe.'))
