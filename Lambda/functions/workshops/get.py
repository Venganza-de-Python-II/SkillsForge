"""
Lambda function para obtener un taller específico
GET /workshops/{id}
"""
import json
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Obtiene los detalles de un taller específico
    """
    try:
        # Extraer ID del path
        workshop_id = event.get('pathParameters', {}).get('id')
        
        if not workshop_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'mensaje': 'ID de taller requerido'})
            }
        
        # Consultar DynamoDB
        response = table.get_item(
            Key={
                'PK': f'WORKSHOP#{workshop_id}',
                'SK': 'METADATA'
            }
        )
        
        item = response.get('Item')
        
        if not item:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'mensaje': 'Taller no encontrado'})
            }
        
        # Serializar taller
        inscripciones = item.get('inscripciones', [])
        cupo = int(item.get('cupo', 0))
        cupos_disponibles = max(cupo - len(inscripciones), 0)
        
        taller = {
            '_id': workshop_id,
            'nombre': item.get('nombre'),
            'descripcion': item.get('descripcion'),
            'fecha': item.get('fecha'),
            'hora': item.get('hora'),
            'lugar': item.get('lugar'),
            'categoria': item.get('categoria'),
            'tipo': item.get('tipo'),
            'instructor': item.get('instructor', ''),
            'rating': float(item.get('rating', 0)),
            'cupo': cupo,
            'cupos_disponibles': cupos_disponibles,
            'creado_en': item.get('creado_en'),
            'actualizado_en': item.get('actualizado_en'),
            'inscripciones': inscripciones,
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(taller, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'mensaje': 'Error interno del servidor',
                'error': str(e)
            })
        }
