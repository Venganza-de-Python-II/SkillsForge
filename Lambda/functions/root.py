"""
Lambda function para el endpoint raíz de la API
GET /
"""
import json
from datetime import datetime


def handler(event, context):
    """
    Devuelve información básica de la API
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps({
            'name': 'SkillsForge API',
            'version': '1.0.0',
            'description': 'API REST para la plataforma de gestión de talleres profesionales',
            'status': 'online',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'endpoints': {
                'auth': {
                    'POST /auth/login': 'Iniciar sesión (admin)',
                    'POST /auth/estudiantes/registro': 'Registrar estudiante',
                    'POST /auth/estudiantes/login': 'Iniciar sesión (estudiante)',
                    'POST /auth/refresh': 'Refrescar token'
                },
                'workshops': {
                    'GET /workshops': 'Listar talleres',
                    'GET /workshops/{id}': 'Obtener taller',
                    'POST /workshops': 'Crear taller (admin)',
                    'PUT /workshops/{id}': 'Actualizar taller (admin)',
                    'DELETE /workshops/{id}': 'Eliminar taller (admin)'
                },
                'registrations': {
                    'POST /workshops/{id}/register': 'Inscribirse a taller',
                    'DELETE /workshops/{id}/register': 'Cancelar inscripción',
                    'GET /registrations/me': 'Mis inscripciones'
                },
                'ai': {
                    'POST /ai/assistant': 'Asistente IA (Bedrock Titan) - Requiere autenticación'
                },
                'public': {
                    'GET /stats': 'Estadísticas de la plataforma',
                    'GET /categories': 'Categorías de talleres'
                }
            },
            'documentation': 'https://github.com/skillsforge/api-docs'
        })
    }