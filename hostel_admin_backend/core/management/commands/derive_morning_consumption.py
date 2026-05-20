"""
Management command: derive_morning_consumption
Run at 5:00 AM daily (cron: 0 5 * * *)

Generates inventory consumption transactions for BREAKFAST and LUNCH
based on resident availability.
"""

import logging
from datetime import date

from django.core.management.base import BaseCommand

from core.kitchen_utils import generate_consumption_for_meal
from core.models import Branch

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Derive breakfast and lunch consumption transactions (run at 5 AM daily)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date', type=str, default=None,
            help='Target date in YYYY-MM-DD format (defaults to today)',
        )
        parser.add_argument(
            '--branch-id', type=int, default=None,
            help='Process only this branch ID (defaults to all active branches)',
        )

    def handle(self, *args, **options):
        target_date = date.today()
        if options['date']:
            from datetime import datetime
            target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()

        branches = Branch.objects.all()
        if options['branch_id']:
            branches = branches.filter(id=options['branch_id'])

        self.stdout.write(f'Deriving morning consumption for {target_date} ...')

        for branch in branches:
            for meal_type in ('breakfast', 'lunch'):
                try:
                    result = generate_consumption_for_meal(
                        date=target_date,
                        meal_type=meal_type,
                        branch=branch,
                        triggered_by=None,
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [{branch.name}] {meal_type}: status={result["status"]}, '
                            f'meal_count={result["meal_count"]}, '
                            f'transactions={result["transactions"]}'
                        )
                    )
                except Exception as exc:
                    logger.exception('Error deriving %s consumption for branch %s', meal_type, branch.id)
                    self.stderr.write(
                        self.style.ERROR(f'  [{branch.name}] {meal_type}: ERROR – {exc}')
                    )

        self.stdout.write(self.style.SUCCESS('Morning consumption derivation complete.'))
