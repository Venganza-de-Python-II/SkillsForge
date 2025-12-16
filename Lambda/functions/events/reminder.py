"""
Lambda function to send workshop reminders
Checks for workshops coming up in the next 24-48 hours and sends reminders
"""
import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ.get('TABLE_NAME')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

table = dynamodb.Table(table_name)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal to JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Scheduled Lambda to send workshop reminders
    """
    try:
        # Calculate time windows for reminders (24-48 hours from now)
        now = datetime.utcnow()
        reminder_start = now + timedelta(hours=24)
        reminder_end = now + timedelta(hours=48)
        
        # Query workshops with GSI1 (by date)
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
            ExpressionAttributeValues={
                ':pk': 'WORKSHOP#ALL',
                ':start': reminder_start.isoformat(),
                ':end': reminder_end.isoformat()
            }
        )
        
        workshops_to_remind = response.get('Items', [])
        
        # Process each workshop
        for workshop in workshops_to_remind:
            workshop_id = workshop['PK'].replace('WORKSHOP#', '')
            
            # Check if we've already sent a reminder
            if workshop.get('reminder_sent'):
                continue
            
            # Get registered students
            registrations = workshop.get('inscripciones', [])
            
            if registrations:
                # Send reminder via SNS
                message = {
                    'tipo': 'WORKSHOP_REMINDER',
                    'workshop_id': workshop_id,
                    'nombre': workshop.get('nombre'),
                    'fecha': workshop.get('fecha'),
                    'hora': workshop.get('hora'),
                    'lugar': workshop.get('lugar'),
                    'estudiantes': registrations
                }
                
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'Recordatorio: {workshop.get("nombre")} mañana',
                    Message=json.dumps(message, cls=DecimalEncoder)
                )
                
                # Mark as reminder sent
                table.update_item(
                    Key={
                        'PK': workshop['PK'],
                        'SK': workshop['SK']
                    },
                    UpdateExpression='SET reminder_sent = :true',
                    ExpressionAttributeValues={
                        ':true': True
                    }
                )
                
                print(f"Reminder sent for workshop {workshop_id} to {len(registrations)} students")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'mensaje': f'Processed {len(workshops_to_remind)} workshops',
                'workshops_reminded': len([w for w in workshops_to_remind if w.get('inscripciones')])
            })
        }
        
    except Exception as e:
        print(f"Error sending reminders: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
