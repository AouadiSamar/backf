from ..models import Notification  # Assurez-vous que le modèle Notification est bien importé

def send_product_notification(message):
#  Author Aouadi samar
    notification = Notification(message=message)
    notification.save()
