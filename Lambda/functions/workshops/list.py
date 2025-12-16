"""
Lambda function para listar talleres
GET /workshops
# Force rebuild: 2024-12-14T19:00:00Z
"""
import json
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
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
    Lista talleres con filtros opcionales
    Query params: q, categoria, fechaDesde, fechaHasta, limit
    """
    try:
        # Extraer parámetros de query
        params = event.get('queryStringParameters') or {}
        q = params.get('q', '').strip()
        categoria = params.get('categoria', '').strip()
        fecha_desde = params.get('fechaDesde', '').strip()
        fecha_hasta = params.get('fechaHasta', '').strip()
        limit = int(params.get('limit', 50))
        
        # Consulta base: todos los talleres
        # Usando GSI1 para obtener todos los talleres ordenados por fecha
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression=Key('GSI1PK').eq('WORKSHOP#ALL'),
            Limit=limit
        )
        
        items = response.get('Items', [])
        
        # Filtros adicionales (en memoria)
        if categoria:
            items = [item for item in items if item.get('categoria') == categoria]
        
        if fecha_desde:
            items = [item for item in items if item.get('fecha', '') >= fecha_desde]
        
        if fecha_hasta:
            items = [item for item in items if item.get('fecha', '') <= fecha_hasta]
        
        if q:
            q_lower = q.lower()
            items = [
                item for item in items
                if q_lower in item.get('nombre', '').lower()
                or q_lower in item.get('descripcion', '').lower()
                or q_lower in item.get('lugar', '').lower()
            ]
        
        # Serializar talleres
        talleres = []
        for item in items:
            inscripciones = item.get('inscripciones', [])
            cupo = int(item.get('cupo', 0))
            cupos_disponibles = max(cupo - len(inscripciones), 0)
            
            taller = {
                '_id': item['PK'].replace('WORKSHOP#', ''),
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
            talleres.append(taller)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(talleres, cls=DecimalEncoder)
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
