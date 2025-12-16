"""
Lambda function para procesar eventos de EventBridge
Triggered by: EventBridge rules
"""
import json
import os
import boto3

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
TABLE_NAME = os.environ.get('TABLE_NAME')

def handler(event, context):
    """
    Procesa eventos de EventBridge y envía notificaciones
    """
    try:
        # Extraer información del evento
        detail_type = event.get('detail-type', '')
        detail = event.get('detail', {})
        
        print(f'Procesando evento: {detail_type}')
        print(f'Detalle: {json.dumps(detail)}')
        
        # Procesar según el tipo de evento
        if detail_type == 'WORKSHOP_CREATED':
            return handle_workshop_created(detail)
        elif detail_type == 'STUDENT_REGISTERED':
            return handle_student_registered(detail)
        else:
            print(f'Tipo de evento no manejado: {detail_type}')
            return {'statusCode': 200, 'body': 'Evento ignorado'}
        
    except Exception as e:
        print(f'Error procesando evento: {str(e)}')
        # No lanzar excepción para evitar reintentos innecesarios
        return {'statusCode': 500, 'body': f'Error: {str(e)}'}

def handle_workshop_created(detail):
    """
    Maneja el evento de taller creado
    """
    workshop_id = detail.get('workshopId')
    workshop_name = detail.get('nombre')
    workshop_date = detail.get('fecha')
    category = detail.get('categoria')
    
    # Enviar notificación a administradores
    message = f"""
Nuevo taller creado en SkillsForge

Nombre: {workshop_name}
Fecha: {workshop_date}
Categoría: {category}
ID: {workshop_id}

Accede al panel de administración para más detalles.
    """.strip()
    
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='Nuevo taller creado - SkillsForge',
            Message=message
        )
        print(f'Notificación enviada para taller {workshop_id}')
    except Exception as e:
        print(f'Error enviando notificación SNS: {str(e)}')
    
    return {'statusCode': 200, 'body': 'Evento procesado'}

def handle_student_registered(detail):
    """
    Maneja el evento de estudiante inscrito
    """
    workshop_id = detail.get('workshopId')
    workshop_name = detail.get('workshopName')
    student_name = detail.get('studentName')
    student_email = detail.get('studentEmail')
    registered_at = detail.get('registeredAt')
    
    # Enviar notificación al estudiante
    message = f"""
¡Inscripción confirmada!

Hola {student_name},

Te has inscrito exitosamente al taller:
{workshop_name}

Recibirás un recordatorio 24 horas antes del taller.

¡Nos vemos pronto!
Equipo SkillsForge
    """.strip()
    
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Inscripción confirmada - {workshop_name}',
            Message=message
        )
        print(f'Notificación enviada a {student_email}')
    except Exception as e:
        print(f'Error enviando notificación SNS: {str(e)}')
    
    return {'statusCode': 200, 'body': 'Evento procesado'}
