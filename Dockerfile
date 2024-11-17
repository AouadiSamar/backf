# Utiliser l'image officielle Python
FROM python:3.10

# Définir le répertoire de travail à l'intérieur du conteneur
WORKDIR /app

# Copier le fichier des dépendances
COPY requirements.txt /app/

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste des fichiers de l'application
COPY . /app

# Exposer le port sur lequel Django écoutera
EXPOSE 8000

# Collecte des fichiers statiques
RUN python manage.py collectstatic --noinput

# Appliquer les migrations de la base de données
RUN python manage.py migrate

# Commande pour démarrer le serveur Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
