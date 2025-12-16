"""
Lambda function para enviar recordatorios de talleres
Triggered by: EventBridge Scheduler (diariamente)
"""
import json
import os
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key, Attr
import boto3

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def handler(event, context):
    """
    Busca talleres que ocurren en las próximas 24 horas
    y envía recordatorios a los estudiantes inscritos
    """
    try:
        # Calcular fecha de mañana
        tomorrow = (datetime.utcnow() + timedelta(days=1)).date()
        tomorrow_str = tomorrow.isoformat()
        
        print(f'Buscando talleres para: {tomorrow_str}')
        
        # Consultar talleres usando GSI1
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression=Key('GSI1PK').eq('WORKSHOP#ALL'),
            FilterExpression=Attr('fecha').eq(tomorrow_str)
        )
        
        workshops = response.get('Items', [])
        print(f'Encontrados {len(workshops)} talleres para mañana')
        
        reminders_sent = 0
        
        for workshop in workshops:
            workshop_name = workshop.get('nombre')
            workshop_date = workshop.get('fecha')
            workshop_time = workshop.get('hora')
            workshop_location = workshop.get('lugar')
            inscripciones = workshop.get('inscripciones', [])
            
            # Enviar recordatorio a cada estudiante inscrito
            for inscripcion in inscripciones:
                student_name = inscripcion.get('nombre')
                student_email = inscripcion.get('email')
                
                message = f"""
Recordatorio de taller - SkillsForge

Hola {student_name},

Te recordamos que mañana tienes el taller:

📚 {workshop_name}
📅 {workshop_date}
🕐 {workshop_time}
📍 {workshop_location}

¡No faltes!

Equipo SkillsForge
                """.strip()
                
                try:
                    sns.publish(
                        TopicArn=SNS_TOPIC_ARN,
                        Subject=f'Recordatorio: {workshop_name} - Mañana',
                        Message=message
                    )
                    reminders_sent += 1
                    print(f'Recordatorio enviado a {student_email}')
                except Exception as e:
                    print(f'Error enviando recordatorio a {student_email}: {str(e)}')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Recordatorios procesados',
                'workshops_found': len(workshops),
                'reminders_sent': reminders_sent
            })
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
