"""
Lambda function para estadísticas generales
GET /stats
"""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event, context):
    """
    Devuelve estadísticas generales de la plataforma
    """
    try:
        # Contar talleres (usando GSI1)
        workshops_response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'WORKSHOP#ALL'},
            Select='COUNT'
        )
        total_talleres = workshops_response.get('Count', 0)

        # Contar estudiantes - primero intentar con GSI1, luego con scan si no hay resultados
        total_estudiantes = 0
        try:
            students_response = table.query(
                IndexName='GSI1',
                KeyConditionExpression='GSI1PK = :pk',
                ExpressionAttributeValues={':pk': 'USER#STUDENTS'},
                Select='COUNT'
            )
            total_estudiantes = students_response.get('Count', 0)
        except Exception:
            pass
        
        # Si no hay resultados con GSI, hacer scan de usuarios
        if total_estudiantes == 0:
            scan_response = table.scan(
                FilterExpression='begins_with(PK, :pk) AND #r = :role',
                ExpressionAttributeNames={'#r': 'role'},
                ExpressionAttributeValues={
                    ':pk': 'USER#',
                    ':role': 'student'
                },
                Select='COUNT'
            )
            total_estudiantes = scan_response.get('Count', 0)

        # Contar inscripciones totales y cupos totales - sumar de todos los talleres
        total_registros = 0
        total_cupos = 0
        workshops_data = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'WORKSHOP#ALL'},
            ProjectionExpression='inscripciones, cupo'
        )
        
        for workshop in workshops_data.get('Items', []):
            inscripciones = workshop.get('inscripciones', [])
            if isinstance(inscripciones, list):
                total_registros += len(inscripciones)
            cupo = workshop.get('cupo', 0)
            try:
                total_cupos += int(cupo) if cupo else 0
            except (ValueError, TypeError):
                pass
        
        # Calcular ocupación
        ocupacion = round((total_registros / total_cupos * 100)) if total_cupos > 0 else 0

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'talleres': total_talleres,
                'estudiantes': total_estudiantes,
                'registros': total_registros,
                'cupos': total_cupos,
                'ocupacion': ocupacion
            })
        }

    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        # En caso de error, devolver valores por defecto
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'talleres': 0,
                'estudiantes': 0,
                'registros': 0,
                'cupos': 0,
                'ocupacion': 0
            })
        }
