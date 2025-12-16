"""
Lambda function para listar estudiantes
GET /students (requiere auth admin)
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Lista todos los estudiantes registrados (solo administradores)
    """
    try:
        # Verificar autorización
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        role = claims.get('custom:role', '')
        
        if role != 'admin':
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'mensaje': 'Permisos de administrador requeridos'})
            }
        
        # Query para obtener todos los estudiantes
        # Los estudiantes tienen PK=USER#{id} y SK=METADATA
        response = table.scan(
            FilterExpression='begins_with(PK, :pk) AND SK = :sk AND #role = :role',
            ExpressionAttributeNames={
                '#role': 'role'
            },
            ExpressionAttributeValues={
                ':pk': 'USER#',
                ':sk': 'METADATA',
                ':role': 'student'
            }
        )
        
        students = []
        for item in response.get('Items', []):
            # Usar el UUID del PK como _id para evitar problemas con @ en URLs
            user_id = item['PK'].replace('USER#', '')
            student = {
                '_id': user_id,
                'email': item.get('email', ''),
                'nombre': item.get('nombre', ''),
                'apellido': item.get('apellido', ''),
                'carnet': item.get('carnet', ''),
                'carrera': item.get('carrera', ''),
                'fecha_registro': item.get('creado_en', ''),
                'talleres_inscritos': len(item.get('talleres', [])),
                'estado': item.get('estado', 'activo')
            }
            students.append(student)
        
        # Paginar si hay más resultados
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='begins_with(PK, :pk) AND SK = :sk AND #role = :role',
                ExpressionAttributeNames={
                    '#role': 'role'
                },
                ExpressionAttributeValues={
                    ':pk': 'USER#',
                    ':sk': 'METADATA',
                    ':role': 'student'
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            for item in response.get('Items', []):
                user_id = item['PK'].replace('USER#', '')
                student = {
                    '_id': user_id,
                    'email': item.get('email', ''),
                    'nombre': item.get('nombre', ''),
                    'apellido': item.get('apellido', ''),
                    'carnet': item.get('carnet', ''),
                    'carrera': item.get('carrera', ''),
                    'fecha_registro': item.get('creado_en', ''),
                    'talleres_inscritos': len(item.get('talleres', [])),
                    'estado': item.get('estado', 'activo')
                }
                students.append(student)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'students': students,
                'total': len(students)
            }, default=str)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }
