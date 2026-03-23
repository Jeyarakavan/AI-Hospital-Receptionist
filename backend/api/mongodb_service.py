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
        """Get MongoDB client instance. Returns None if unavailable."""
        if cls._client is None:
            try:
                uri = getattr(settings, 'MONGODB_URI', None)
                if not uri:
                    logger.warning("MongoDB: MONGODB_URI is not configured")
                    return None
                cls._client = MongoClient(uri, serverSelectionTimeoutMS=3000)
                cls._client.server_info()  # force connection check
                logger.info("MongoDB connection established")
            except Exception as e:
                logger.warning(f"MongoDB unavailable: {e}")
                return None
        return cls._client
    
    @classmethod
    def get_database(cls):
        """Get database instance. Returns None if MongoDB is unavailable."""
        if cls._db is None:
            client = cls.get_client()
            if client is None:
                return None
            cls._db = client[settings.MONGODB_DB_NAME]
        return cls._db
    
    @classmethod
    def save_call_log(cls, caller_number, intent, response, duration=None, status='completed'):
        """Save call log to MongoDB."""
        try:
            db = cls.get_database()
            if db is None:
                return None
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
            logger.error(f"Error saving call log: {e}")
            return None

    @classmethod
    def store_call_log(cls, call_data):
        """Store a full structured call log (transcript + metadata)."""
        try:
            db = cls.get_database()
            collection = db['call_logs']

            payload = {
                'call_sid': call_data.get('call_sid'),
                'caller_number': call_data.get('caller_number'),
                'intent': call_data.get('intent', 'unknown'),
                'status': call_data.get('status', 'completed'),
                'duration': call_data.get('duration'),
                'started_at': call_data.get('started_at'),
                'ended_at': call_data.get('ended_at'),
                'transcript': call_data.get('transcript', []),
                'metadata': call_data.get('metadata', {}),
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow(),
            }

            result = collection.insert_one(payload)
            logger.info(f"Structured call log saved: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error storing structured call log: {e}")
            return None

    @classmethod
    def save_misunderstanding(cls, payload):
        """Log clarifications/escalations for NLP quality analysis."""
        try:
            db = cls.get_database()
            if db is None:
                return None
            collection = db['ai_misunderstandings']
            entry = {
                **(payload or {}),
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow(),
            }
            result = collection.insert_one(entry)
            logger.info(f"Misunderstanding log saved: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving misunderstanding log: {e}")
            return None
    
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
            logger.error(f"Error saving AI interaction: {e}")
            return None
    
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
            logger.error(f"Error saving notification: {e}")
            return None
    
    @classmethod
    def get_call_logs(cls, limit=100, skip=0, filters=None):
        """Get call logs from MongoDB"""
        try:
            db = cls.get_database()
            if db is None:
                return []
            collection = db['call_logs']
            query = filters or {}
            cursor = collection.find(query).sort('timestamp', -1).skip(skip).limit(limit)
            logs = list(cursor)
            for log in logs:
                log['_id'] = str(log['_id'])
            return logs
        except Exception as e:
            logger.warning(f"get_call_logs error: {e}")
            return []
    
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
            logger.warning(f"get_notifications error: {e}")
            return []
    
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
            logger.warning(f"mark_notification_read error: {e}")
            return False
