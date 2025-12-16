"""
Lambda function para eliminar un taller
DELETE /workshops/{id} (requiere auth admin)
"""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Elimina un taller (solo administradores)
    """
    try:
        # Verificar autorización
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        role = claims.get('custom:role', '')
        
        if role != 'admin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Permisos de administrador requeridos'})
            }
        
        # Extraer ID
        workshop_id = event.get('pathParameters', {}).get('id')
        if not workshop_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'ID de taller requerido'})
            }
        
        # Verificar que existe
        response = table.get_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Taller no encontrado'})
            }
        
        # Eliminar de DynamoDB
        table.delete_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'}
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Taller eliminado exitosamente'})
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }
