"""
AquaFarm Pro - Rate Limiting Middleware
Per-tenant rate limiting for API protection
"""

import time
import redis
from typing import Dict, Optional, Tuple
from functools import wraps
from flask import request, jsonify, g
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Rate limiter with per-tenant support
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_limits = {
            'api': {'requests': 1000, 'window': 3600},  # 1000 requests per hour
            'auth': {'requests': 10, 'window': 300},     # 10 requests per 5 minutes
            'upload': {'requests': 50, 'window': 3600}, # 50 uploads per hour
            'ai': {'requests': 100, 'window': 3600},    # 100 AI requests per hour
            'iot': {'requests': 10000, 'window': 3600}  # 10000 IoT requests per hour
        }
    
    def get_tenant_limits(self, tenant_id: str) -> Dict[str, Dict]:
        """
        Get rate limits for a specific tenant
        """
        # In production, this would fetch from database
        # For now, return default limits with tenant-specific adjustments
        limits = self.default_limits.copy()
        
        # Premium tenants get higher limits
        if tenant_id.startswith('premium_'):
            limits['api']['requests'] = 5000
            limits['ai']['requests'] = 500
            limits['upload']['requests'] = 200
        
        # Enterprise tenants get even higher limits
        elif tenant_id.startswith('enterprise_'):
            limits['api']['requests'] = 20000
            limits['ai']['requests'] = 2000
            limits['upload']['requests'] = 1000
        
        return limits
    
    def is_allowed(self, tenant_id: str, endpoint_type: str, 
                   user_id: str = None) -> Tuple[bool, Dict]:
        """
        Check if request is allowed based on rate limits
        """
        try:
            # Get tenant limits
            limits = self.get_tenant_limits(tenant_id)
            
            if endpoint_type not in limits:
                return True, {}
            
            limit_config = limits[endpoint_type]
            window = limit_config['window']
            max_requests = limit_config['requests']
            
            # Create unique key for this tenant/endpoint/user combination
            key_parts = [tenant_id, endpoint_type]
            if user_id:
                key_parts.append(user_id)
            
            key = f"rate_limit:{':'.join(key_parts)}"
            
            # Get current count
            current_count = self.redis.get(key)
            if current_count is None:
                current_count = 0
            else:
                current_count = int(current_count)
            
            # Check if limit exceeded
            if current_count >= max_requests:
                return False, {
                    'limit_exceeded': True,
                    'current_count': current_count,
                    'max_requests': max_requests,
                    'window': window,
                    'reset_time': self.redis.ttl(key)
                }
            
            # Increment counter
            if current_count == 0:
                # First request in window, set expiration
                self.redis.setex(key, window, 1)
            else:
                # Increment existing counter
                self.redis.incr(key)
            
            return True, {
                'current_count': current_count + 1,
                'max_requests': max_requests,
                'window': window,
                'remaining': max_requests - (current_count + 1)
            }
            
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            # Allow request on error to avoid blocking legitimate users
            return True, {'error': str(e)}
    
    def get_usage_stats(self, tenant_id: str) -> Dict:
        """
        Get usage statistics for a tenant
        """
        try:
            stats = {}
            limits = self.get_tenant_limits(tenant_id)
            
            for endpoint_type, limit_config in limits.items():
                key = f"rate_limit:{tenant_id}:{endpoint_type}"
                current_count = self.redis.get(key)
                
                if current_count is not None:
                    stats[endpoint_type] = {
                        'current_usage': int(current_count),
                        'limit': limit_config['requests'],
                        'window': limit_config['window'],
                        'percentage': (int(current_count) / limit_config['requests']) * 100
                    }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting usage stats: {e}")
            return {}
    
    def reset_limits(self, tenant_id: str, endpoint_type: str = None):
        """
        Reset rate limits for a tenant
        """
        try:
            if endpoint_type:
                # Reset specific endpoint
                key = f"rate_limit:{tenant_id}:{endpoint_type}"
                self.redis.delete(key)
            else:
                # Reset all endpoints for tenant
                pattern = f"rate_limit:{tenant_id}:*"
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
            
            return True
            
        except Exception as e:
            logger.error(f"Error resetting limits: {e}")
            return False

def rate_limit(endpoint_type: str, per_user: bool = False):
    """
    Decorator for rate limiting endpoints
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get tenant and user info
            tenant_id = getattr(g, 'tenant_id', 'default')
            user_id = getattr(g, 'user_id', None) if per_user else None
            
            # Check rate limit
            allowed, info = rate_limiter.is_allowed(tenant_id, endpoint_type, user_id)
            
            if not allowed:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests for {endpoint_type}',
                    'details': info
                }), 429
            
            # Add rate limit info to response headers
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(info.get('max_requests', ''))
                response.headers['X-RateLimit-Remaining'] = str(info.get('remaining', ''))
                response.headers['X-RateLimit-Reset'] = str(info.get('reset_time', ''))
            
            return response
        
        return decorated_function
    return decorator

# Global rate limiter instance
rate_limiter = None

def init_rate_limiter(redis_client: redis.Redis):
    """
    Initialize the rate limiter
    """
    global rate_limiter
    rate_limiter = RateLimiter(redis_client)

# Flask middleware for automatic rate limiting
class RateLimitMiddleware:
    """
    Flask middleware for automatic rate limiting
    """
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """
        Initialize the middleware with Flask app
        """
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """
        Check rate limits before processing request
        """
        if not rate_limiter:
            return
        
        # Determine endpoint type based on request path
        endpoint_type = self.get_endpoint_type(request.path)
        
        # Get tenant and user info
        tenant_id = getattr(g, 'tenant_id', 'default')
        user_id = getattr(g, 'user_id', None)
        
        # Check rate limit
        allowed, info = rate_limiter.is_allowed(tenant_id, endpoint_type, user_id)
        
        if not allowed:
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': f'Too many requests for {endpoint_type}',
                'details': info
            }), 429
        
        # Store rate limit info for response headers
        g.rate_limit_info = info
    
    def after_request(self, response):
        """
        Add rate limit headers to response
        """
        if hasattr(g, 'rate_limit_info'):
            info = g.rate_limit_info
            response.headers['X-RateLimit-Limit'] = str(info.get('max_requests', ''))
            response.headers['X-RateLimit-Remaining'] = str(info.get('remaining', ''))
            response.headers['X-RateLimit-Reset'] = str(info.get('reset_time', ''))
        
        return response
    
    def get_endpoint_type(self, path: str) -> str:
        """
        Determine endpoint type from request path
        """
        if path.startswith('/api/auth'):
            return 'auth'
        elif path.startswith('/api/upload'):
            return 'upload'
        elif path.startswith('/api/ai'):
            return 'ai'
        elif path.startswith('/api/iot'):
            return 'iot'
        else:
            return 'api'

# Example usage
if __name__ == "__main__":
    import redis
    
    # Initialize Redis client
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    
    # Initialize rate limiter
    init_rate_limiter(redis_client)
    
    # Test rate limiting
    tenant_id = "tenant_123"
    user_id = "user_456"
    
    # Test API requests
    for i in range(15):
        allowed, info = rate_limiter.is_allowed(tenant_id, 'auth', user_id)
        print(f"Request {i+1}: Allowed={allowed}, Info={info}")
        
        if not allowed:
            break
    
    # Get usage stats
    stats = rate_limiter.get_usage_stats(tenant_id)
    print(f"Usage stats: {stats}")
