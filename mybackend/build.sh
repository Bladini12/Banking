#!/bin/bash
# Build script for backend

set -e

pip install -r requirements.txt
# python manage.py createsuperuser --no-input
python manage.py makemigrations --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput 
