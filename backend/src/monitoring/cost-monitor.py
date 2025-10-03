"""
AquaFarm Pro - Cost Monitoring System
Per-tenant cost monitoring and resource usage tracking
"""

import time
import psutil
import redis
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import json
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ResourceType(Enum):
    CPU = "cpu"
    MEMORY = "memory"
    STORAGE = "storage"
    NETWORK = "network"
    DATABASE = "database"
    REDIS = "redis"

@dataclass
class ResourceUsage:
    tenant_id: str
    resource_type: ResourceType
    usage: float
    limit: float
    unit: str
    timestamp: datetime
    cost_per_unit: float = 0.0

@dataclass
class CostBreakdown:
    tenant_id: str
    total_cost: float
    resource_costs: Dict[str, float]
    period_start: datetime
    period_end: datetime
    currency: str = "USD"

class CostMonitor:
    """
    Cost monitoring system for per-tenant resource usage
    """
    
    def __init__(self, redis_client: redis.Redis, db_connection: psycopg2.extensions.connection):
        self.redis = redis_client
        self.db = db_connection
        self.cost_rates = {
            ResourceType.CPU: 0.05,  # $0.05 per CPU hour
            ResourceType.MEMORY: 0.01,  # $0.01 per GB hour
            ResourceType.STORAGE: 0.10,  # $0.10 per GB month
            ResourceType.NETWORK: 0.02,  # $0.02 per GB
            ResourceType.DATABASE: 0.03,  # $0.03 per query
            ResourceType.REDIS: 0.01,  # $0.01 per operation
        }
        
    def get_cpu_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get CPU usage for a tenant
        """
        try:
            # Get system CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Get tenant-specific CPU usage (simplified)
            tenant_cpu_usage = self._get_tenant_cpu_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.CPU,
                usage=tenant_cpu_usage,
                limit=100.0,  # 100% CPU limit
                unit="percent",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.CPU]
            )
            
        except Exception as e:
            logger.error(f"Error getting CPU usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.CPU,
                usage=0.0,
                limit=100.0,
                unit="percent",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.CPU]
            )
    
    def get_memory_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get memory usage for a tenant
        """
        try:
            # Get system memory usage
            memory = psutil.virtual_memory()
            memory_gb = memory.used / (1024**3)
            
            # Get tenant-specific memory usage
            tenant_memory_usage = self._get_tenant_memory_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.MEMORY,
                usage=tenant_memory_usage,
                limit=memory.total / (1024**3),
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.MEMORY]
            )
            
        except Exception as e:
            logger.error(f"Error getting memory usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.MEMORY,
                usage=0.0,
                limit=0.0,
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.MEMORY]
            )
    
    def get_storage_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get storage usage for a tenant
        """
        try:
            # Get tenant storage usage from database
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT 
                    pg_size_pretty(pg_database_size('aquafarm')) as db_size,
                    pg_database_size('aquafarm') as db_size_bytes
            """)
            
            result = cursor.fetchone()
            db_size_bytes = result[1] if result else 0
            db_size_gb = db_size_bytes / (1024**3)
            
            # Get tenant-specific storage usage
            tenant_storage_usage = self._get_tenant_storage_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.STORAGE,
                usage=tenant_storage_usage,
                limit=100.0,  # 100GB limit
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.STORAGE]
            )
            
        except Exception as e:
            logger.error(f"Error getting storage usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.STORAGE,
                usage=0.0,
                limit=100.0,
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.STORAGE]
            )
    
    def get_network_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get network usage for a tenant
        """
        try:
            # Get network statistics
            net_io = psutil.net_io_counters()
            bytes_sent = net_io.bytes_sent
            bytes_recv = net_io.bytes_recv
            total_bytes = bytes_sent + bytes_recv
            total_gb = total_bytes / (1024**3)
            
            # Get tenant-specific network usage
            tenant_network_usage = self._get_tenant_network_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.NETWORK,
                usage=tenant_network_usage,
                limit=1000.0,  # 1000GB limit
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.NETWORK]
            )
            
        except Exception as e:
            logger.error(f"Error getting network usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.NETWORK,
                usage=0.0,
                limit=1000.0,
                unit="GB",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.NETWORK]
            )
    
    def get_database_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get database usage for a tenant
        """
        try:
            # Get database query count
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM pg_stat_activity 
                WHERE state = 'active' AND query_start > NOW() - INTERVAL '1 hour'
            """)
            
            result = cursor.fetchone()
            query_count = result[0] if result else 0
            
            # Get tenant-specific database usage
            tenant_db_usage = self._get_tenant_database_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.DATABASE,
                usage=tenant_db_usage,
                limit=10000.0,  # 10000 queries per hour limit
                unit="queries",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.DATABASE]
            )
            
        except Exception as e:
            logger.error(f"Error getting database usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.DATABASE,
                usage=0.0,
                limit=10000.0,
                unit="queries",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.DATABASE]
            )
    
    def get_redis_usage(self, tenant_id: str) -> ResourceUsage:
        """
        Get Redis usage for a tenant
        """
        try:
            # Get Redis operations count
            redis_info = self.redis.info()
            total_commands = redis_info.get('total_commands_processed', 0)
            
            # Get tenant-specific Redis usage
            tenant_redis_usage = self._get_tenant_redis_usage(tenant_id)
            
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.REDIS,
                usage=tenant_redis_usage,
                limit=100000.0,  # 100000 operations per hour limit
                unit="operations",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.REDIS]
            )
            
        except Exception as e:
            logger.error(f"Error getting Redis usage for tenant {tenant_id}: {e}")
            return ResourceUsage(
                tenant_id=tenant_id,
                resource_type=ResourceType.REDIS,
                usage=0.0,
                limit=100000.0,
                unit="operations",
                timestamp=datetime.now(),
                cost_per_unit=self.cost_rates[ResourceType.REDIS]
            )
    
    def get_tenant_usage(self, tenant_id: str) -> List[ResourceUsage]:
        """
        Get all resource usage for a tenant
        """
        usage = []
        
        try:
            usage.append(self.get_cpu_usage(tenant_id))
            usage.append(self.get_memory_usage(tenant_id))
            usage.append(self.get_storage_usage(tenant_id))
            usage.append(self.get_network_usage(tenant_id))
            usage.append(self.get_database_usage(tenant_id))
            usage.append(self.get_redis_usage(tenant_id))
            
        except Exception as e:
            logger.error(f"Error getting tenant usage for {tenant_id}: {e}")
        
        return usage
    
    def calculate_cost(self, usage: ResourceUsage) -> float:
        """
        Calculate cost for a resource usage
        """
        if usage.resource_type == ResourceType.STORAGE:
            # Storage is billed monthly
            return usage.usage * usage.cost_per_unit
        else:
            # Other resources are billed hourly
            return usage.usage * usage.cost_per_unit
    
    def get_cost_breakdown(self, tenant_id: str, period_hours: int = 24) -> CostBreakdown:
        """
        Get cost breakdown for a tenant over a period
        """
        try:
            usage = self.get_tenant_usage(tenant_id)
            resource_costs = {}
            total_cost = 0.0
            
            for resource_usage in usage:
                cost = self.calculate_cost(resource_usage)
                resource_costs[resource_usage.resource_type.value] = cost
                total_cost += cost
            
            return CostBreakdown(
                tenant_id=tenant_id,
                total_cost=total_cost,
                resource_costs=resource_costs,
                period_start=datetime.now() - timedelta(hours=period_hours),
                period_end=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Error calculating cost breakdown for tenant {tenant_id}: {e}")
            return CostBreakdown(
                tenant_id=tenant_id,
                total_cost=0.0,
                resource_costs={},
                period_start=datetime.now() - timedelta(hours=period_hours),
                period_end=datetime.now()
            )
    
    def _get_tenant_cpu_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific CPU usage (simplified)
        """
        # In a real implementation, this would track actual tenant CPU usage
        # For now, return a simulated value
        return 25.0 + (hash(tenant_id) % 50)
    
    def _get_tenant_memory_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific memory usage (simplified)
        """
        # In a real implementation, this would track actual tenant memory usage
        return 2.0 + (hash(tenant_id) % 8)
    
    def _get_tenant_storage_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific storage usage (simplified)
        """
        # In a real implementation, this would track actual tenant storage usage
        return 10.0 + (hash(tenant_id) % 50)
    
    def _get_tenant_network_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific network usage (simplified)
        """
        # In a real implementation, this would track actual tenant network usage
        return 50.0 + (hash(tenant_id) % 200)
    
    def _get_tenant_database_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific database usage (simplified)
        """
        # In a real implementation, this would track actual tenant database usage
        return 100.0 + (hash(tenant_id) % 1000)
    
    def _get_tenant_redis_usage(self, tenant_id: str) -> float:
        """
        Get tenant-specific Redis usage (simplified)
        """
        # In a real implementation, this would track actual tenant Redis usage
        return 1000.0 + (hash(tenant_id) % 5000)
    
    def save_usage_data(self, usage: List[ResourceUsage]):
        """
        Save usage data to database
        """
        try:
            cursor = self.db.cursor()
            
            for resource_usage in usage:
                cursor.execute("""
                    INSERT INTO resource_usage (
                        tenant_id, resource_type, usage, limit_value, 
                        unit, timestamp, cost_per_unit
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    resource_usage.tenant_id,
                    resource_usage.resource_type.value,
                    resource_usage.usage,
                    resource_usage.limit,
                    resource_usage.unit,
                    resource_usage.timestamp,
                    resource_usage.cost_per_unit
                ))
            
            self.db.commit()
            cursor.close()
            
        except Exception as e:
            logger.error(f"Error saving usage data: {e}")
            self.db.rollback()
    
    def get_usage_history(self, tenant_id: str, hours: int = 24) -> List[Dict]:
        """
        Get usage history for a tenant
        """
        try:
            cursor = self.db.cursor()
            cursor.execute("""
                SELECT resource_type, usage, limit_value, unit, timestamp, cost_per_unit
                FROM resource_usage 
                WHERE tenant_id = %s AND timestamp > NOW() - INTERVAL '%s hours'
                ORDER BY timestamp DESC
            """, (tenant_id, hours))
            
            results = cursor.fetchall()
            cursor.close()
            
            return [
                {
                    'resource_type': row[0],
                    'usage': float(row[1]),
                    'limit': float(row[2]),
                    'unit': row[3],
                    'timestamp': row[4].isoformat(),
                    'cost_per_unit': float(row[5])
                }
                for row in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting usage history for tenant {tenant_id}: {e}")
            return []

# Example usage
if __name__ == "__main__":
    import redis
    import psycopg2
    
    # Initialize connections
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    db_connection = psycopg2.connect(
        host='localhost',
        port=5432,
        database='aquafarm',
        user='aquafarm',
        password='aquafarm_password'
    )
    
    # Create cost monitor
    monitor = CostMonitor(redis_client, db_connection)
    
    # Test cost monitoring
    tenant_id = "tenant_123"
    
    # Get usage
    usage = monitor.get_tenant_usage(tenant_id)
    print(f"Usage for tenant {tenant_id}:")
    for resource_usage in usage:
        print(f"  {resource_usage.resource_type.value}: {resource_usage.usage} {resource_usage.unit}")
    
    # Get cost breakdown
    cost_breakdown = monitor.get_cost_breakdown(tenant_id)
    print(f"\nCost breakdown for tenant {tenant_id}:")
    print(f"  Total cost: ${cost_breakdown.total_cost:.2f}")
    for resource_type, cost in cost_breakdown.resource_costs.items():
        print(f"  {resource_type}: ${cost:.2f}")
    
    # Close connections
    db_connection.close()
