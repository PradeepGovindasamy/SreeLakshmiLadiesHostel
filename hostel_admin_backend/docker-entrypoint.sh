#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
# Add timeout to prevent infinite loop
TIMEOUT=60
ELAPSED=0
while ! pg_isready -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
  sleep 1
  ELAPSED=$((ELAPSED + 1))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Timeout waiting for PostgreSQL after ${TIMEOUT} seconds"
    exit 1
  fi
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting application..."
exec "$@"
