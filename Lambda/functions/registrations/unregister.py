"""
Lambda function para desinscribirse de un taller
DELETE /workshops/{id}/register (requiere auth estudiante)
"""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Desinscribe a un estudiante de un taller
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
        
        # Buscar inscripción del estudiante
        index_to_remove = None
        for i, insc in enumerate(inscripciones):
            if insc.get('estudiante_id') == student_id:
                index_to_remove = i
                break
        
        if index_to_remove is None:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'No estás inscrito en este taller'})
            }
        
        # Eliminar inscripción
        table.update_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'},
            UpdateExpression=f'REMOVE inscripciones[{index_to_remove}]'
        )
        
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
            'statusCode': 200,
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
