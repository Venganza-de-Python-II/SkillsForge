"""
Lambda function para refrescar tokens JWT
POST /auth/refresh
"""
import json
import os
from datetime import datetime, timedelta
import boto3

cognito = boto3.client('cognito-idp')

USER_POOL_ID = os.environ.get('USER_POOL_ID')
CLIENT_ID = os.environ.get('CLIENT_ID')

def handler(event, context):
    """
    Refresca un token JWT usando el refresh token
    """
    try:
        body = json.loads(event.get('body', '{}'))
        refresh_token = body.get('refresh_token', '')
        
        if not refresh_token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Refresh token requerido'})
            }
        
        # Refrescar token con Cognito
        try:
            response = cognito.admin_initiate_auth(
                UserPoolId=USER_POOL_ID,
                ClientId=CLIENT_ID,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters={
                    'REFRESH_TOKEN': refresh_token
                }
            )
        except cognito.exceptions.NotAuthorizedException:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Refresh token inválido o expirado'})
            }
        except Exception as e:
            print(f'Error en Cognito: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'mensaje': 'Error al refrescar token'})
            }
        
        # Obtener nuevos tokens
        access_token = response['AuthenticationResult']['AccessToken']
        id_token = response['AuthenticationResult']['IdToken']
        
        # El refresh token puede o no ser renovado
        new_refresh_token = response['AuthenticationResult'].get('RefreshToken', refresh_token)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': access_token,
                'refresh_token': new_refresh_token,
                'tipo': 'Bearer',
                'expira_en': int((datetime.utcnow() + timedelta(hours=1)).timestamp())
            })
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'mensaje': 'Error interno del servidor', 'error': str(e)})
        }
