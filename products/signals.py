
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Product

@receiver(post_save, sender=Product)
def send_email_on_product_add(sender, instance, created, **kwargs):
    if created:  
    
        send_mail(
            'New Product Added',
            f'Product "{instance.name}" has been added with price {instance.price}.',
            'samaraouadi7@gmail.com', 
            ['recipient@example.com'],  #  Author Aouadi samar

            fail_silently=False,
        )
