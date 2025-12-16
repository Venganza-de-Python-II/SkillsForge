"""
Lambda function para eliminar un estudiante
DELETE /students/{id} (requiere auth admin)
"""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
cognito = boto3.client('cognito-idp')
table = dynamodb.Table(os.environ['TABLE_NAME'])

USER_POOL_ID = os.environ.get('USER_POOL_ID')

def handler(event, context):
    """
    Elimina un estudiante de DynamoDB y Cognito
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
        
        # Obtener ID del estudiante desde path parameters
        student_id = event.get('pathParameters', {}).get('id')
        if not student_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'mensaje': 'ID de estudiante requerido'})
            }
        
        # Buscar el estudiante en DynamoDB para obtener su email
        # El ID puede ser el email o el sub de Cognito
        response = table.get_item(
            Key={'PK': f'USER#{student_id}', 'SK': 'METADATA'}
        )
        
        if 'Item' not in response:
            # Intentar buscar por email si no se encontró por ID
            scan_response = table.scan(
                FilterExpression='email = :email AND SK = :sk',
                ExpressionAttributeValues={
                    ':email': student_id,
                    ':sk': 'METADATA'
                }
            )
            items = scan_response.get('Items', [])
            if not items:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'mensaje': 'Estudiante no encontrado'})
                }
            item = items[0]
        else:
            item = response['Item']
        
        email = item.get('email')
        pk = item.get('PK')
        
        # Eliminar de DynamoDB
        table.delete_item(
            Key={'PK': pk, 'SK': 'METADATA'}
        )
        
        # Intentar eliminar de Cognito
        if email and USER_POOL_ID:
            try:
                cognito.admin_delete_user(
                    UserPoolId=USER_POOL_ID,
                    Username=email
                )
            except cognito.exceptions.UserNotFoundException:
                # Si el usuario no existe en Cognito, continuar
                pass
            except Exception as e:
                print(f'Error eliminando de Cognito: {e}')
        
        # También eliminar las inscripciones del estudiante de los talleres
        # Buscar talleres donde el estudiante está inscrito
        student_sub = pk.replace('USER#', '')
        workshops_response = table.scan(
            FilterExpression='begins_with(PK, :pk) AND SK = :sk',
            ExpressionAttributeValues={
                ':pk': 'WORKSHOP#',
                ':sk': 'METADATA'
            }
        )
        
        for workshop in workshops_response.get('Items', []):
            inscripciones = workshop.get('inscripciones', [])
            nuevas_inscripciones = [
                i for i in inscripciones 
                if i.get('estudiante_id') != student_sub and i.get('email') != email
            ]
            
            if len(nuevas_inscripciones) != len(inscripciones):
                # Actualizar el taller sin la inscripción del estudiante
                table.update_item(
                    Key={'PK': workshop['PK'], 'SK': 'METADATA'},
                    UpdateExpression='SET inscripciones = :i',
                    ExpressionAttributeValues={':i': nuevas_inscripciones}
                )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
            },
            'body': json.dumps({
                'mensaje': 'Estudiante eliminado correctamente',
                'email': email
            })
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'mensaje': 'Error interno del servidor'})
        }
