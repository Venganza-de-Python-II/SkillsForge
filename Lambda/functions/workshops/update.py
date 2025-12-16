"""
Lambda function para actualizar un taller
PUT /workshops/{id} (requiere auth admin)
"""
import json
import os
from datetime import datetime
from decimal import Decimal
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Actualiza un taller existente (solo administradores)
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
        
        # Parsear body
        body = json.loads(event.get('body', '{}'))
        
        # Obtener taller actual
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
        
        # Construir expresión de actualización
        update_expr = 'SET actualizado_en = :updated'
        expr_values = {':updated': datetime.utcnow().isoformat()}
        expr_names = {}
        
        # Campos permitidos
        allowed_fields = ['nombre', 'descripcion', 'fecha', 'hora', 'lugar', 'categoria', 'tipo', 'instructor', 'rating', 'cupo']
        
        # Primero, procesar campos normales
        for field in allowed_fields:
            if field in body:
                if field == 'cupo':
                    new_cupo = int(body[field])
                    inscripciones_count = len(item.get('inscripciones', []))
                    if new_cupo < inscripciones_count:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'mensaje': f'El cupo no puede ser menor a los inscritos actuales ({inscripciones_count})'
                            })
                        }
                    expr_values[f':{field}'] = new_cupo
                elif field == 'rating':
                    expr_values[f':{field}'] = Decimal(str(body[field]))
                else:
                    expr_values[f':{field}'] = body[field]
                
                update_expr += f', #{field} = :{field}'
                expr_names[f'#{field}'] = field
        
        # Después, actualizar GSIs si es necesario (una sola vez para evitar duplicados)
        needs_gsi_update = 'fecha' in body or 'hora' in body
        needs_gsi2pk_update = 'categoria' in body
        
        if needs_gsi_update:
            fecha = body.get('fecha', item.get('fecha'))
            hora = body.get('hora', item.get('hora'))
            expr_values[':gsi1sk'] = f'{fecha}#{hora}'
            expr_values[':gsi2sk'] = f'{fecha}#{hora}'
            update_expr += ', GSI1SK = :gsi1sk, GSI2SK = :gsi2sk'
        
        if needs_gsi2pk_update:
            expr_values[':gsi2pk'] = f'CATEGORY#{body["categoria"]}'
            update_expr += ', GSI2PK = :gsi2pk'
        
        # Actualizar en DynamoDB
        table.update_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names if expr_names else None
        )
        
        # Obtener taller actualizado
        response = table.get_item(
            Key={'PK': f'WORKSHOP#{workshop_id}', 'SK': 'METADATA'}
        )
        
        updated_item = response['Item']
        inscripciones = updated_item.get('inscripciones', [])
        cupo = int(updated_item.get('cupo', 0))
        
        taller = {
            '_id': workshop_id,
            **{k: v for k, v in updated_item.items() if k not in ['PK', 'SK', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK']},
            'cupos_disponibles': max(cupo - len(inscripciones), 0),
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
