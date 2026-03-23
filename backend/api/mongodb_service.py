"""
MongoDB Service for storing call logs and AI interactions
"""
from pymongo import MongoClient
from django.conf import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MongoDBService:
    """Service class for MongoDB operations"""
    
    _client = None
    _db = None
    
    @classmethod
    def get_client(cls):
        """Get MongoDB client instance"""
        if cls._client is None:
            try:
                cls._client = MongoClient(settings.MONGODB_URI)
                logger.info("MongoDB connection established")
            except Exception as e:
                logger.error(f"MongoDB connection error: {str(e)}")
                raise
        return cls._client
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[settings.MONGODB_DB_NAME]
        return cls._db
    
    @classmethod
    def save_call_log(cls, caller_number, intent, response, duration=None, status='completed'):
        """Save call log to MongoDB"""
        try:
            db = cls.get_database()
            collection = db['call_logs']
            
            log_entry = {
                'caller_number': caller_number,
                'intent': intent,
                'response': response,
                'duration': duration,
                'status': status,
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            
            result = collection.insert_one(log_entry)
            logger.info(f"Call log saved: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving call log: {str(e)}")
            raise
    
    @classmethod
    def save_ai_interaction(cls, user_id, interaction_type, input_data, output_data, metadata=None):
        """Save AI interaction log to MongoDB"""
        try:
            db = cls.get_database()
            collection = db['ai_interactions']
            
            interaction = {
                'user_id': str(user_id) if user_id else None,
                'interaction_type': interaction_type,
                'input_data': input_data,
                'output_data': output_data,
                'metadata': metadata or {},
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            
            result = collection.insert_one(interaction)
            logger.info(f"AI interaction saved: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving AI interaction: {str(e)}")
            raise
    
    @classmethod
    def save_notification(cls, user_id, notification_type, title, message, metadata=None):
        """Save notification to MongoDB"""
        try:
            db = cls.get_database()
            collection = db['notifications']
            
            notification = {
                'user_id': str(user_id),
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'metadata': metadata or {},
                'read': False,
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            
            result = collection.insert_one(notification)
            logger.info(f"Notification saved: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving notification: {str(e)}")
            raise
    
    @classmethod
    def get_call_logs(cls, limit=100, skip=0, filters=None):
        """Get call logs from MongoDB"""
        try:
            db = cls.get_database()
            collection = db['call_logs']
            
            query = filters or {}
            cursor = collection.find(query).sort('timestamp', -1).skip(skip).limit(limit)
            
            logs = list(cursor)
            # Convert ObjectId to string
            for log in logs:
                log['_id'] = str(log['_id'])
            
            return logs
        except Exception as e:
            logger.error(f"Error getting call logs: {str(e)}")
            raise
    
    @classmethod
    def get_notifications(cls, user_id, limit=50, skip=0, unread_only=False):
        """Get notifications for a user"""
        try:
            db = cls.get_database()
            collection = db['notifications']
            
            query = {'user_id': str(user_id)}
            if unread_only:
                query['read'] = False
            
            cursor = collection.find(query).sort('timestamp', -1).skip(skip).limit(limit)
            
            notifications = list(cursor)
            for notif in notifications:
                notif['_id'] = str(notif['_id'])
            
            return notifications
        except Exception as e:
            logger.error(f"Error getting notifications: {str(e)}")
            raise
    
    @classmethod
    def mark_notification_read(cls, notification_id, user_id):
        """Mark notification as read"""
        try:
            db = cls.get_database()
            collection = db['notifications']
            
            result = collection.update_one(
                {'_id': notification_id, 'user_id': str(user_id)},
                {'$set': {'read': True, 'read_at': datetime.utcnow()}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            raise
