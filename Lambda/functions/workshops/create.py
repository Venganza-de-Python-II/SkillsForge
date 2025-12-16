"""
Lambda function para crear talleres
POST /workshops (requiere auth admin)
"""
import json
import os
import uuid
from datetime import datetime
from decimal import Decimal
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
events = boto3.client('events')

def handler(event, context):
    """
    Crea un nuevo taller (solo administradores)
    """
    try:
        # Verificar autorización (Cognito Authorizer ya validó el token)
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        role = claims.get('custom:role', '')
        
        if role != 'admin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Permisos de administrador requeridos'})
            }
        
        # Parsear body
        body = json.loads(event.get('body', '{}'))
        
        # Validar campos requeridos
        required = ['nombre', 'descripcion', 'fecha', 'hora', 'lugar', 'categoria', 'tipo', 'cupo']
        missing = [f for f in required if not body.get(f)]
        if missing:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Campos faltantes', 'campos': missing})
            }
        
        # Generar ID único
        workshop_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Crear item
        item = {
            'PK': f'WORKSHOP#{workshop_id}',
            'SK': 'METADATA',
            'GSI1PK': 'WORKSHOP#ALL',
            'GSI1SK': f"{body['fecha']}#{body['hora']}",
            'GSI2PK': f"CATEGORY#{body['categoria']}",
            'GSI2SK': f"{body['fecha']}#{body['hora']}",
            'nombre': body['nombre'],
            'descripcion': body['descripcion'],
            'fecha': body['fecha'],
            'hora': body['hora'],
            'lugar': body['lugar'],
            'categoria': body['categoria'],
            'tipo': body['tipo'],
            'instructor': body.get('instructor', ''),
            'rating': Decimal(str(body.get('rating', 0))),
            'cupo': int(body['cupo']),
            'creado_en': now,
            'actualizado_en': None,
            'inscripciones': [],
        }
        
        # Guardar en DynamoDB
        table.put_item(Item=item)
        
        # Emitir evento a EventBridge
        try:
            events.put_events(
                Entries=[{
                    'Source': 'skillsforge.workshops',
                    'DetailType': 'WORKSHOP_CREATED',
                    'Detail': json.dumps({
                        'workshopId': workshop_id,
                        'nombre': body['nombre'],
                        'fecha': body['fecha'],
                        'categoria': body['categoria'],
                    })
                }]
            )
        except Exception as e:
            print(f'Error emitiendo evento: {e}')
        
        # Respuesta
        taller = {
            '_id': workshop_id,
            **{k: v for k, v in item.items() if k not in ['PK', 'SK', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK']},
            'cupos_disponibles': int(body['cupo']),
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
