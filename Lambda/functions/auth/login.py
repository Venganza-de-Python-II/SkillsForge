"""
Lambda function para login de administradores y estudiantes
POST /auth/login o /auth/estudiantes/login
"""
import json
import os
from datetime import datetime, timedelta
import boto3
import base64

cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

USER_POOL_ID = os.environ.get('USER_POOL_ID')
CLIENT_ID = os.environ.get('CLIENT_ID')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-me')

def decode_jwt_payload(token):
    """Decode del JWT"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception as e:
        print(f'Error decoding JWT: {str(e)}')
        return {}

def handler(event, context):
    """
    Autentica usuarios (admin o estudiante) usando Cognito
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Determinar si es login de admin o estudiante
        path = event.get('path', '')
        is_student = 'estudiantes' in path
        
        if is_student:
            email = body.get('email', '').strip().lower()
            password = body.get('contrasena', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'mensaje': 'Email y contraseña son requeridos'})
                }
            
            username = email
        else:
            # Login de admin
            username = body.get('usuario', '')
            password = body.get('contrasena', '')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'mensaje': 'Usuario y contraseña son requeridos'})
                }
        
        # Autenticar con Cognito
        try:
            response = cognito.admin_initiate_auth(
                UserPoolId=USER_POOL_ID,
                ClientId=CLIENT_ID,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
        except cognito.exceptions.NotAuthorizedException:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Credenciales inválidas'})
            }
        except cognito.exceptions.UserNotFoundException:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Usuario no encontrado'})
            }
        except Exception as e:
            print(f'Error en Cognito: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Error de autenticación'})
            }
        
        # Obtener tokens
        id_token = response['AuthenticationResult']['IdToken']
        access_token = response['AuthenticationResult']['AccessToken']
        refresh_token = response['AuthenticationResult']['RefreshToken']
        
        # Decodificar ID token para obtener información del usuario
        decoded = decode_jwt_payload(id_token)
        
        # Usar id_token para el Cognito Authorizer de API Gateway
        result = {
            'token': id_token,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'tipo': 'Bearer',
            'expira_en': int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        }
        
        # Si es estudiante, agregar información adicional
        if is_student:
            user_id = decoded.get('sub')
            result['estudiante'] = {
                '_id': user_id,
                'nombre': decoded.get('name', ''),
                'email': decoded.get('email', ''),
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }