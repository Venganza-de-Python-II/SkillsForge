"""
SkillsForge AI Assistant powered by Amazon Bedrock
Usa Amazon Nova Micro (free tier disponible)
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

# Cliente de DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'SkillsForge-Dev-Workshops'))

# Cliente de Bedrock Runtime
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Modelo a usar (Free Tier) - Amazon Nova Micro
MODEL_ID = 'amazon.nova-micro-v1:0'

# Límites para controlar costos
MAX_INPUT_TOKENS = 500  # Limitar input para ahorrar tokens
MAX_OUTPUT_TOKENS = 200  # Limitar output para ahorrar tokens


class DecimalEncoder(json.JSONEncoder):
    """Encoder para manejar Decimals de DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def get_workshops_data():
    """Obtiene datos reales de talleres desde DynamoDB"""
    try:
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'WORKSHOP#ALL'},
            Limit=20  # Limitar para no exceder tokens
        )
        
        workshops = []
        for item in response.get('Items', []):
            workshops.append({
                'id': item.get('_id', ''),
                'nombre': item.get('nombre', ''),
                'descripcion': item.get('descripcion', '')[:100],  # Truncar descripción
                'categoria': item.get('categoria', ''),
                'tipo': item.get('tipo', ''),
                'fecha': item.get('fecha', ''),
                'hora': item.get('hora', ''),
                'lugar': item.get('lugar', ''),
                'instructor': item.get('instructor', ''),
                'cupos_disponibles': int(item.get('cupos_disponibles', 0)),
                'cupo': int(item.get('cupo', 0)),
                'rating': float(item.get('rating', 0)),
                'inscritos': len(item.get('inscripciones', []))
            })
        
        return workshops
    except Exception as e:
        print(f"Error obteniendo talleres: {e}")
        return []


def get_student_registrations(student_email: str):
    """Obtiene las inscripciones de un estudiante"""
    try:
        response = table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': f'USER#{student_email}',
                ':sk': 'REGISTRATION#'
            }
        )
        
        registrations = []
        for item in response.get('Items', []):
            registrations.append({
                'workshop_id': item.get('workshop_id', ''),
                'workshop_nombre': item.get('workshop_nombre', ''),
                'fecha_inscripcion': item.get('fecha_inscripcion', '')
            })
        
        return registrations
    except Exception as e:
        print(f"Error obteniendo inscripciones: {e}")
        return []


def get_platform_stats():
    """Obtiene estadísticas de la plataforma"""
    try:
        # Contar talleres
        workshops_response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'WORKSHOP#ALL'},
            Select='COUNT'
        )
        total_workshops = workshops_response.get('Count', 0)
        
        # Contar estudiantes
        students_response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'USER#STUDENTS'},
            Select='COUNT'
        )
        total_students = students_response.get('Count', 0)
        
        return {
            'total_talleres': total_workshops,
            'total_estudiantes': total_students
        }
    except Exception as e:
        print(f"Error obteniendo stats: {e}")
        return {'total_talleres': 0, 'total_estudiantes': 0}


def build_student_prompt(user_message: str, workshops: list, registrations: list, stats: dict):
    """Construye el prompt para asistir a estudiantes"""
    
    # Construir contexto de talleres disponibles
    workshops_info = "\n".join([
        f"- {w['nombre']} ({w['categoria']}, {w['tipo']}): {w['fecha']} {w['hora']}, {w['cupos_disponibles']}/{w['cupo']} cupos, instructor: {w['instructor']}"
        for w in workshops[:10]  # Máximo 10 para no exceder tokens
    ])
    
    # Contexto de inscripciones del estudiante
    if registrations:
        reg_info = "\n".join([f"- {r['workshop_nombre']}" for r in registrations])
    else:
        reg_info = "Sin inscripciones aún"
    
    prompt = f"""Eres el asistente IA de SkillsForge, una plataforma de talleres profesionales. Ayuda a los estudiantes a encontrar talleres ideales.

DATOS DE LA PLATAFORMA:
- Total talleres: {stats['total_talleres']}
- Total estudiantes: {stats['total_estudiantes']}

TALLERES DISPONIBLES:
{workshops_info}

INSCRIPCIONES DEL ESTUDIANTE:
{reg_info}

CONSULTA DEL ESTUDIANTE: {user_message[:200]}

Responde de forma breve (máx 3 oraciones), amigable y útil. Si preguntan por recomendaciones, sugiere talleres específicos de la lista. Responde en español."""

    return prompt


def build_admin_prompt(user_message: str, workshops: list, stats: dict):
    """Construye el prompt para asistir a administradores"""
    
    # Información detallada de talleres
    workshops_info = "\n".join([
        f"- {w['nombre']}: {w['inscritos']}/{w['cupo']} inscritos, rating: {w['rating']}"
        for w in workshops[:10]
    ])
    
    prompt = f"""Eres el asistente IA de SkillsForge para administradores. Ayudas con análisis de datos y gestión de talleres.

ESTADÍSTICAS:
- Talleres activos: {stats['total_talleres']}
- Estudiantes registrados: {stats['total_estudiantes']}

TALLERES Y SU OCUPACIÓN:
{workshops_info}

CONSULTA DEL ADMIN: {user_message[:200]}

Responde de forma breve (máx 3 oraciones), profesional y con datos concretos. Si piden análisis, usa los datos proporcionados. Responde en español."""

    return prompt


def invoke_bedrock(prompt: str):
    """Invoca Amazon Bedrock con el modelo Amazon Nova Micro"""
    try:
        # Formato para Amazon Nova Micro (usa el formato de mensajes)
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": MAX_OUTPUT_TOKENS,
                "temperature": 0.7,
                "topP": 0.9
            }
        })
        
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        
        # Extraer el texto generado (formato Nova)
        output = response_body.get('output', {})
        message = output.get('message', {})
        content = message.get('content', [])
        if content and len(content) > 0:
            return content[0].get('text', '').strip()
        
        return "Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?"
        
    except Exception as e:
        print(f"Error invocando Bedrock: {e}")
        # Fallback sin IA si hay error
        return "El asistente IA no está disponible en este momento. Por favor, explora los talleres manualmente o contacta soporte."


def handler(event, context):
    """Handler principal del asistente IA"""
    
    # Headers CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # Manejar preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        # Parsear body
        body = json.loads(event.get('body', '{}'))
        # Soportar ambos nombres de campo
        user_message = body.get('mensaje', body.get('message', '')).strip()
        user_type = body.get('tipo_usuario', body.get('type', 'student'))  # 'student' o 'admin'
        user_email = body.get('email', '')
        contexto = body.get('contexto', '')  # Contexto adicional del frontend
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Se requiere un mensaje'})
            }
        
        # Limitar longitud del mensaje para ahorrar tokens
        if len(user_message) > MAX_INPUT_TOKENS:
            user_message = user_message[:MAX_INPUT_TOKENS]
        
        # Obtener datos reales de la plataforma
        workshops = get_workshops_data()
        stats = get_platform_stats()
        
        # Construir prompt según tipo de usuario
        if user_type == 'admin':
            prompt = build_admin_prompt(user_message, workshops, stats)
        else:
            registrations = get_student_registrations(user_email) if user_email else []
            prompt = build_student_prompt(user_message, workshops, registrations, stats)
        
        # Invocar Bedrock
        response_text = invoke_bedrock(prompt)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'respuesta': response_text,  # Nombre en español para el frontend
                'response': response_text,   # Mantener compatibilidad
                'model': MODEL_ID,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }, cls=DecimalEncoder)
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'JSON inválido'})
        }
    except Exception as e:
        print(f"Error en assistant handler: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Error interno del servidor'})
        }
