"""
Lambda function para obtener categorías de talleres
GET /categories
"""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

# Categorías predefinidas con sus metadatos
CATEGORIES = [
    {
        'id': 'programming',
        'nombre': 'Programación',
        'descripcion': 'Cursos de lenguajes de programación y desarrollo de software',
        'icono': 'code'
    },
    {
        'id': 'frontend',
        'nombre': 'Frontend',
        'descripcion': 'Desarrollo web frontend con React, Vue, Angular',
        'icono': 'layout'
    },
    {
        'id': 'backend',
        'nombre': 'Backend',
        'descripcion': 'Desarrollo de APIs y servicios backend',
        'icono': 'server'
    },
    {
        'id': 'cloud',
        'nombre': 'Cloud Computing',
        'descripcion': 'AWS, Azure, GCP y servicios en la nube',
        'icono': 'cloud'
    },
    {
        'id': 'data',
        'nombre': 'Data Science',
        'descripcion': 'Análisis de datos, Machine Learning, IA',
        'icono': 'database'
    },
    {
        'id': 'devops',
        'nombre': 'DevOps',
        'descripcion': 'CI/CD, contenedores, infraestructura como código',
        'icono': 'git-branch'
    },
    {
        'id': 'mobile',
        'nombre': 'Mobile',
        'descripcion': 'Desarrollo de aplicaciones móviles',
        'icono': 'smartphone'
    },
    {
        'id': 'softskills',
        'nombre': 'Habilidades Blandas',
        'descripcion': 'Liderazgo, comunicación, trabajo en equipo',
        'icono': 'users'
    }
]


def handler(event, context):
    """
    Devuelve la lista de categorías disponibles
    """
    try:
        # Obtener conteo de talleres por categoría
        workshops_response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk',
            ExpressionAttributeValues={':pk': 'WORKSHOP#ALL'}
        )
        
        workshops = workshops_response.get('Items', [])
        
        # Contar talleres por categoría
        category_counts = {}
        for workshop in workshops:
            cat = workshop.get('categoria', 'other')
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Agregar conteo a las categorías
        categories_with_count = []
        for cat in CATEGORIES:
            cat_copy = cat.copy()
            cat_copy['cantidad'] = category_counts.get(cat['id'], 0)
            categories_with_count.append(cat_copy)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps(categories_with_count)
        }

    except Exception as e:
        print(f"Error getting categories: {str(e)}")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps(CATEGORIES)
        }
