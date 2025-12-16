"""
Lambda function para listar mis inscripciones
GET /registrations/me (requiere auth estudiante)
"""
import json
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Attr
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
    Lista todos los talleres en los que está inscrito el estudiante
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
        
        # Escanear talleres donde el estudiante está inscrito
        response = table.scan(
            FilterExpression=Attr('inscripciones').exists() & Attr('SK').eq('METADATA')
        )
        
        items = response.get('Items', [])
        
        # Filtrar talleres donde el estudiante está inscrito
        my_workshops = []
        for item in items:
            inscripciones = item.get('inscripciones', [])
            for insc in inscripciones:
                if insc.get('estudiante_id') == student_id:
                    # Este taller tiene al estudiante inscrito
                    workshop_id = item['PK'].replace('WORKSHOP#', '')
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
                        'mi_inscripcion': insc
                    }
                    my_workshops.append(taller)
                    break
        
        # Ordenar por fecha de inscripción (más reciente primero)
        my_workshops.sort(key=lambda x: x.get('mi_inscripcion', {}).get('registrado_en', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(my_workshops, cls=DecimalEncoder)
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
