from django.core.management.base import BaseCommand
from app.models import CustomUser

class Command(BaseCommand):
    help = 'Deletes users that were rejected more than 24 hours ago'

    def handle(self, *args, **options):
        users_to_delete = CustomUser.objects.filter(status=CustomUser.AccountStatus.REJECTED)
        deleted_count = 0

        for user in users_to_delete:
            if user.should_be_deleted():
                user.delete()
                deleted_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} rejected users')
        ) 