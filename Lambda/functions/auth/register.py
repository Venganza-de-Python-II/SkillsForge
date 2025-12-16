"""
Lambda function para registro de estudiantes
POST /auth/estudiantes/registro
"""
import json
import os
from datetime import datetime
import boto3

cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

USER_POOL_ID = os.environ.get('USER_POOL_ID')
CLIENT_ID = os.environ.get('CLIENT_ID')

def handler(event, context):
    """
    Registra un nuevo estudiante en Cognito y DynamoDB
    """
    try:
        print(f"Event body: {event.get('body', 'NO BODY')}")
        body = json.loads(event.get('body', '{}'))
        print(f"Parsed body: {body}")
        
        nombre = body.get('nombre', '').strip()
        email = body.get('email', '').strip().lower()
        password = body.get('contrasena', '')
        
        if not nombre or not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Nombre, email y contraseña son requeridos'})
            }
        
        if len(password) < 8:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'La contraseña debe tener al menos 8 caracteres'})
            }
        
        # Validar requisitos de contraseña de Cognito
        import re
        if not re.search(r'[A-Z]', password):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'La contraseña debe contener al menos una letra mayúscula'})
            }
        if not re.search(r'[a-z]', password):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'La contraseña debe contener al menos una letra minúscula'})
            }
        if not re.search(r'[0-9]', password):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'La contraseña debe contener al menos un número'})
            }
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)'})
            }
        
        # Validar formato de email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Formato de email inválido'})
            }
        
        # Verificar si el email ya existe en DynamoDB (doble verificación)
        existing_users = table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        if existing_users.get('Items'):
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'El email ya está registrado'})
            }
        
        # Crear usuario en Cognito
        try:
            response = cognito.sign_up(
                ClientId=CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'name', 'Value': nombre},
                    {'Name': 'custom:role', 'Value': 'student'}
                ]
            )
            
            user_sub = response['UserSub']
            
            # Auto-confirmar usuario para desarrollo
            try:
                cognito.admin_confirm_sign_up(
                    UserPoolId=USER_POOL_ID,
                    Username=email
                )
                print(f'Usuario {email} auto-confirmado')
            except Exception as e:
                print(f'Error auto-confirmando usuario: {str(e)}')
            
        except cognito.exceptions.UsernameExistsException:
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'El email ya está registrado'})
            }
        except cognito.exceptions.InvalidPasswordException as e:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Contraseña inválida. Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'})
            }
        except Exception as e:
            print(f'Error en Cognito: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Error al crear usuario'})
            }
        
        # Guardar en DynamoDB
        now = datetime.utcnow().isoformat()
        item = {
            'PK': f'USER#{user_sub}',
            'SK': 'METADATA',
            'GSI1PK': 'USER#STUDENTS',  # Para estadísticas de conteo
            'GSI1SK': now,
            'nombre': nombre,
            'email': email,
            'role': 'student',
            'creado_en': now
        }
        
        table.put_item(Item=item)
        
        # Agregar usuario al grupo de estudiantes
        try:
            cognito.admin_add_user_to_group(
                UserPoolId=USER_POOL_ID,
                Username=email,
                GroupName='Students'
            )
        except Exception as e:
            print(f'Error agregando a grupo: {str(e)}')
        
        # Autenticar automáticamente
        try:
            auth_response = cognito.admin_initiate_auth(
                UserPoolId=USER_POOL_ID,
                ClientId=CLIENT_ID,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password
                }
            )
            
            # Usar IdToken para API Gateway Cognito Authorizer
            id_token = auth_response['AuthenticationResult']['IdToken']
            refresh_token = auth_response['AuthenticationResult']['RefreshToken']
            
        except Exception as e:
            print(f'Error en auto-login: {str(e)}')
            # Si falla el auto-login, devolver solo la info del usuario
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'mensaje': 'Usuario creado. Por favor inicia sesión.',
                    'estudiante': {
                        '_id': user_sub,
                        'nombre': nombre,
                        'email': email,
                        'creado_en': now
                    }
                })
            }
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': id_token,
                'refresh_token': refresh_token,
                'tipo': 'Bearer',
                'estudiante': {
                    '_id': user_sub,
                    'nombre': nombre,
                    'email': email,
                    'creado_en': now
                }
            })
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }
