"""
AquaFarm Pro - Centralized Logging System
Centralized logging for all application components
"""

import logging
import logging.handlers
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import sys
from pathlib import Path

class CentralizedLogger:
    """
    Centralized logging system for AquaFarm Pro
    """
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Configure loggers
        self._setup_loggers()
        
    def _setup_loggers(self):
        """
        Setup all application loggers
        """
        # Main application logger
        self.app_logger = self._create_logger(
            'aquafarm',
            'aquafarm.log',
            level=logging.INFO
        )
        
        # API logger
        self.api_logger = self._create_logger(
            'aquafarm.api',
            'api.log',
            level=logging.INFO
        )
        
        # Database logger
        self.db_logger = self._create_logger(
            'aquafarm.db',
            'database.log',
            level=logging.INFO
        )
        
        # AI/ML logger
        self.ai_logger = self._create_logger(
            'aquafarm.ai',
            'ai.log',
            level=logging.INFO
        )
        
        # IoT logger
        self.iot_logger = self._create_logger(
            'aquafarm.iot',
            'iot.log',
            level=logging.INFO
        )
        
        # Security logger
        self.security_logger = self._create_logger(
            'aquafarm.security',
            'security.log',
            level=logging.WARNING
        )
        
        # Error logger
        self.error_logger = self._create_logger(
            'aquafarm.error',
            'error.log',
            level=logging.ERROR
        )
        
        # Audit logger
        self.audit_logger = self._create_logger(
            'aquafarm.audit',
            'audit.log',
            level=logging.INFO
        )
    
    def _create_logger(self, name: str, filename: str, level: int = logging.INFO) -> logging.Logger:
        """
        Create a logger with file and console handlers
        """
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Clear existing handlers
        logger.handlers.clear()
        
        # File handler with rotation
        file_path = self.log_dir / filename
        file_handler = logging.handlers.RotatingFileHandler(
            file_path,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        # Prevent duplicate logs
        logger.propagate = False
        
        return logger
    
    def log_application_event(self, event: str, data: Dict[str, Any] = None, level: str = 'info'):
        """
        Log application events
        """
        log_data = {
            'event': event,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        }
        
        if level == 'error':
            self.app_logger.error(json.dumps(log_data))
        elif level == 'warning':
            self.app_logger.warning(json.dumps(log_data))
        else:
            self.app_logger.info(json.dumps(log_data))
    
    def log_api_request(self, method: str, endpoint: str, user_id: str = None, 
                       response_time: float = None, status_code: int = None):
        """
        Log API requests
        """
        log_data = {
            'method': method,
            'endpoint': endpoint,
            'user_id': user_id,
            'response_time': response_time,
            'status_code': status_code,
            'timestamp': datetime.now().isoformat()
        }
        
        self.api_logger.info(json.dumps(log_data))
    
    def log_database_operation(self, operation: str, table: str, user_id: str = None, 
                              query_time: float = None, rows_affected: int = None):
        """
        Log database operations
        """
        log_data = {
            'operation': operation,
            'table': table,
            'user_id': user_id,
            'query_time': query_time,
            'rows_affected': rows_affected,
            'timestamp': datetime.now().isoformat()
        }
        
        self.db_logger.info(json.dumps(log_data))
    
    def log_ai_prediction(self, model_name: str, input_data: Dict, prediction: Dict, 
                         accuracy: float = None, processing_time: float = None):
        """
        Log AI/ML predictions
        """
        log_data = {
            'model_name': model_name,
            'input_data': input_data,
            'prediction': prediction,
            'accuracy': accuracy,
            'processing_time': processing_time,
            'timestamp': datetime.now().isoformat()
        }
        
        self.ai_logger.info(json.dumps(log_data))
    
    def log_iot_sensor(self, sensor_id: str, sensor_type: str, value: float, 
                      unit: str, farm_id: str = None, pond_id: str = None):
        """
        Log IoT sensor readings
        """
        log_data = {
            'sensor_id': sensor_id,
            'sensor_type': sensor_type,
            'value': value,
            'unit': unit,
            'farm_id': farm_id,
            'pond_id': pond_id,
            'timestamp': datetime.now().isoformat()
        }
        
        self.iot_logger.info(json.dumps(log_data))
    
    def log_security_event(self, event_type: str, user_id: str = None, 
                          ip_address: str = None, details: Dict = None):
        """
        Log security events
        """
        log_data = {
            'event_type': event_type,
            'user_id': user_id,
            'ip_address': ip_address,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        
        self.security_logger.warning(json.dumps(log_data))
    
    def log_error(self, error: Exception, context: Dict = None):
        """
        Log errors with context
        """
        log_data = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        
        self.error_logger.error(json.dumps(log_data))
    
    def log_audit_event(self, action: str, resource: str, user_id: str, 
                       old_value: Any = None, new_value: Any = None):
        """
        Log audit events for compliance
        """
        log_data = {
            'action': action,
            'resource': resource,
            'user_id': user_id,
            'old_value': old_value,
            'new_value': new_value,
            'timestamp': datetime.now().isoformat()
        }
        
        self.audit_logger.info(json.dumps(log_data))
    
    def get_log_stats(self) -> Dict[str, Any]:
        """
        Get logging statistics
        """
        stats = {}
        
        for logger_name in ['aquafarm', 'aquafarm.api', 'aquafarm.db', 
                           'aquafarm.ai', 'aquafarm.iot', 'aquafarm.security', 
                           'aquafarm.error', 'aquafarm.audit']:
            logger = logging.getLogger(logger_name)
            stats[logger_name] = {
                'level': logging.getLevelName(logger.level),
                'handlers': len(logger.handlers),
                'enabled': logger.isEnabledFor(logging.INFO)
            }
        
        return stats

# Global logger instance
centralized_logger = CentralizedLogger()

# Convenience functions
def log_app_event(event: str, data: Dict[str, Any] = None, level: str = 'info'):
    """Log application event"""
    centralized_logger.log_application_event(event, data, level)

def log_api_request(method: str, endpoint: str, user_id: str = None, 
                   response_time: float = None, status_code: int = None):
    """Log API request"""
    centralized_logger.log_api_request(method, endpoint, user_id, response_time, status_code)

def log_db_operation(operation: str, table: str, user_id: str = None, 
                    query_time: float = None, rows_affected: int = None):
    """Log database operation"""
    centralized_logger.log_database_operation(operation, table, user_id, query_time, rows_affected)

def log_ai_prediction(model_name: str, input_data: Dict, prediction: Dict, 
                      accuracy: float = None, processing_time: float = None):
    """Log AI prediction"""
    centralized_logger.log_ai_prediction(model_name, input_data, prediction, accuracy, processing_time)

def log_iot_sensor(sensor_id: str, sensor_type: str, value: float, 
                  unit: str, farm_id: str = None, pond_id: str = None):
    """Log IoT sensor reading"""
    centralized_logger.log_iot_sensor(sensor_id, sensor_type, value, unit, farm_id, pond_id)

def log_security_event(event_type: str, user_id: str = None, 
                      ip_address: str = None, details: Dict = None):
    """Log security event"""
    centralized_logger.log_security_event(event_type, user_id, ip_address, details)

def log_error(error: Exception, context: Dict = None):
    """Log error"""
    centralized_logger.log_error(error, context)

def log_audit_event(action: str, resource: str, user_id: str, 
                   old_value: Any = None, new_value: Any = None):
    """Log audit event"""
    centralized_logger.log_audit_event(action, resource, user_id, old_value, new_value)

# Example usage
if __name__ == "__main__":
    # Test logging
    log_app_event("application_started", {"version": "1.0.0"})
    log_api_request("GET", "/api/farms", "user123", 0.5, 200)
    log_db_operation("SELECT", "farms", "user123", 0.1, 5)
    log_ai_prediction("water_quality_model", {"temp": 25}, {"ph": 7.2}, 0.95, 0.2)
    log_iot_sensor("sensor001", "temperature", 25.5, "°C", "farm001", "pond001")
    log_security_event("failed_login", "user123", "192.168.1.1", {"attempts": 3})
    log_audit_event("update", "farm", "user123", {"name": "Old Farm"}, {"name": "New Farm"})
    
    # Get stats
    stats = centralized_logger.get_log_stats()
    print("Logging Statistics:")
    print(json.dumps(stats, indent=2))
