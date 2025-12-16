"""
Lambda function para inscribirse a un taller
POST /workshops/{id}/register (requiere auth estudiante)
"""
import json
import os
from datetime import datetime
import boto3

dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Inscribe a un estudiante en un taller
    """
    try:
        # Verificar autorización
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        role = claims.get('custom:role', '')
        
        if role != 'student':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Permisos de estudiante requeridos'})
            }
        
        # Extraer información del estudiante
        student_id = claims.get('sub')
        student_name = claims.get('name', '')
        student_email = claims.get('email', '')
        
        # Extraer ID del taller
        workshop_id = event.get('pathParameters', {}).get('id')
        if not workshop_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'ID de taller requerido'})
            }
        
        # Obtener taller
        response = table.get_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Taller no encontrado'})
            }
        
        item = response['Item']
        inscripciones = item.get('inscripciones', [])
        cupo = int(item.get('cupo', 0))
        
        # Verificar cupo
        if cupo >= 0 and len(inscripciones) >= cupo:
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Cupo lleno'})
            }
        
        # Verificar si ya está inscrito
        for insc in inscripciones:
            if insc.get('estudiante_id') == student_id:
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'mensaje': 'Ya estás inscrito en este taller'})
                }
        
        # Crear inscripción
        inscripcion = {
            'estudiante_id': student_id,
            'nombre': student_name,
            'email': student_email,
            'registrado_en': datetime.utcnow().isoformat()
        }
        
        # Actualizar en DynamoDB
        table.update_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'},
            UpdateExpression='SET inscripciones = list_append(if_not_exists(inscripciones, :empty_list), :i)',
            ExpressionAttributeValues={
                ':i': [inscripcion],
                ':empty_list': []
            }
        )
        
        # Emitir evento a EventBridge
        try:
            events.put_events(
                Entries=[{
                    'Source': 'skillsforge.registrations',
                    'DetailType': 'STUDENT_REGISTERED',
                    'Detail': json.dumps({
                        'workshopId': workshop_id,
                        'workshopName': item.get('nombre'),
                        'studentId': student_id,
                        'studentName': student_name,
                        'studentEmail': student_email,
                        'registeredAt': inscripcion['registrado_en']
                    })
                }]
            )
        except Exception as e:
            print(f'Error emitiendo evento: {e}')
        
        # Obtener taller actualizado
        response = table.get_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'}
        )
        
        updated_item = response['Item']
        inscripciones_updated = updated_item.get('inscripciones', [])
        cupo_updated = int(updated_item.get('cupo', 0))
        
        taller = {
            '_id': workshop_id,
            **{k: v for k, v in updated_item.items() if k not in ['PK', 'SK', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK']},
            'cupos_disponibles': max(cupo_updated - len(inscripciones_updated), 0),
        }
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(taller, default=str)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }
