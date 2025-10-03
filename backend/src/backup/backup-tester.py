"""
AquaFarm Pro - Backup Testing System
Automated backup restoration testing
"""

import os
import subprocess
import tempfile
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging
import json
import psycopg2
from pathlib import Path

logger = logging.getLogger(__name__)

class BackupTester:
    """
    Automated backup restoration testing system
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.test_results = []
        
    def test_database_backup(self, backup_file: str) -> Dict:
        """
        Test database backup restoration
        """
        try:
            # Create temporary database for testing
            test_db_name = f"aquafarm_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Create test database
            self._create_test_database(test_db_name)
            
            # Restore backup to test database
            restore_success = self._restore_database_backup(backup_file, test_db_name)
            
            if restore_success:
                # Verify data integrity
                integrity_check = self._verify_database_integrity(test_db_name)
                
                # Clean up test database
                self._cleanup_test_database(test_db_name)
                
                return {
                    'success': True,
                    'test_db': test_db_name,
                    'integrity_check': integrity_check,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to restore backup',
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Database backup test failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def test_file_backup(self, backup_file: str) -> Dict:
        """
        Test file backup restoration
        """
        try:
            # Create temporary directory for testing
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract backup
                extract_success = self._extract_file_backup(backup_file, temp_dir)
                
                if extract_success:
                    # Verify file integrity
                    integrity_check = self._verify_file_integrity(temp_dir)
                    
                    return {
                        'success': True,
                        'temp_dir': temp_dir,
                        'integrity_check': integrity_check,
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Failed to extract backup',
                        'timestamp': datetime.now().isoformat()
                    }
                    
        except Exception as e:
            logger.error(f"File backup test failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def test_full_system_backup(self, backup_file: str) -> Dict:
        """
        Test full system backup restoration
        """
        try:
            # Create temporary environment for testing
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract system backup
                extract_success = self._extract_system_backup(backup_file, temp_dir)
                
                if extract_success:
                    # Test database restoration
                    db_test = self._test_database_from_system_backup(temp_dir)
                    
                    # Test file restoration
                    file_test = self._test_files_from_system_backup(temp_dir)
                    
                    # Test configuration restoration
                    config_test = self._test_config_from_system_backup(temp_dir)
                    
                    return {
                        'success': True,
                        'temp_dir': temp_dir,
                        'database_test': db_test,
                        'file_test': file_test,
                        'config_test': config_test,
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Failed to extract system backup',
                        'timestamp': datetime.now().isoformat()
                    }
                    
        except Exception as e:
            logger.error(f"Full system backup test failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _create_test_database(self, db_name: str) -> bool:
        """
        Create test database
        """
        try:
            conn = psycopg2.connect(
                host=self.config['db_host'],
                port=self.config['db_port'],
                user=self.config['db_user'],
                password=self.config['db_password'],
                database='postgres'
            )
            
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Drop database if exists
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
            
            # Create new database
            cursor.execute(f"CREATE DATABASE {db_name}")
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create test database: {e}")
            return False
    
    def _restore_database_backup(self, backup_file: str, db_name: str) -> bool:
        """
        Restore database backup to test database
        """
        try:
            # Use pg_restore for custom format or psql for plain format
            if backup_file.endswith('.dump'):
                cmd = [
                    'pg_restore',
                    '--host', self.config['db_host'],
                    '--port', str(self.config['db_port']),
                    '--username', self.config['db_user'],
                    '--dbname', db_name,
                    '--verbose',
                    backup_file
                ]
            else:
                cmd = [
                    'psql',
                    '--host', self.config['db_host'],
                    '--port', str(self.config['db_port']),
                    '--username', self.config['db_user'],
                    '--dbname', db_name,
                    '--file', backup_file
                ]
            
            # Set password environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = self.config['db_password']
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Failed to restore database backup: {e}")
            return False
    
    def _verify_database_integrity(self, db_name: str) -> Dict:
        """
        Verify database integrity after restoration
        """
        try:
            conn = psycopg2.connect(
                host=self.config['db_host'],
                port=self.config['db_port'],
                user=self.config['db_user'],
                password=self.config['db_password'],
                database=db_name
            )
            
            cursor = conn.cursor()
            
            # Check table counts
            cursor.execute("""
                SELECT table_name, 
                       (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
                FROM (
                    SELECT table_name, 
                           query_to_xml(format('select count(*) as cnt from %I.%I', 
                                             table_schema, table_name), false, true, '') as xml_count
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                ) t
                ORDER BY table_name;
            """)
            
            table_counts = cursor.fetchall()
            
            # Check for data consistency
            cursor.execute("SELECT COUNT(*) FROM farms")
            farms_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM ponds")
            ponds_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM water_quality_readings")
            readings_count = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'table_counts': dict(table_counts),
                'farms_count': farms_count,
                'ponds_count': ponds_count,
                'readings_count': readings_count
            }
            
        except Exception as e:
            logger.error(f"Database integrity check failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _extract_file_backup(self, backup_file: str, extract_dir: str) -> bool:
        """
        Extract file backup to temporary directory
        """
        try:
            if backup_file.endswith('.tar.gz'):
                cmd = ['tar', '-xzf', backup_file, '-C', extract_dir]
            elif backup_file.endswith('.zip'):
                cmd = ['unzip', backup_file, '-d', extract_dir]
            else:
                return False
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Failed to extract file backup: {e}")
            return False
    
    def _verify_file_integrity(self, extract_dir: str) -> Dict:
        """
        Verify file integrity after extraction
        """
        try:
            # Check for expected files
            expected_files = [
                'uploads/',
                'logs/',
                'config/',
                'static/'
            ]
            
            missing_files = []
            for file_path in expected_files:
                full_path = os.path.join(extract_dir, file_path)
                if not os.path.exists(full_path):
                    missing_files.append(file_path)
            
            # Check file permissions
            permission_issues = []
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    if not os.access(file_path, os.R_OK):
                        permission_issues.append(file_path)
            
            return {
                'success': len(missing_files) == 0 and len(permission_issues) == 0,
                'missing_files': missing_files,
                'permission_issues': permission_issues,
                'total_files': sum(len(files) for _, _, files in os.walk(extract_dir))
            }
            
        except Exception as e:
            logger.error(f"File integrity check failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _extract_system_backup(self, backup_file: str, extract_dir: str) -> bool:
        """
        Extract system backup
        """
        try:
            if backup_file.endswith('.tar.gz'):
                cmd = ['tar', '-xzf', backup_file, '-C', extract_dir]
            else:
                return False
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Failed to extract system backup: {e}")
            return False
    
    def _test_database_from_system_backup(self, extract_dir: str) -> Dict:
        """
        Test database from system backup
        """
        try:
            # Look for database dump in extracted files
            db_dump_files = []
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    if file.endswith(('.sql', '.dump')):
                        db_dump_files.append(os.path.join(root, file))
            
            if not db_dump_files:
                return {
                    'success': False,
                    'error': 'No database dump found in backup'
                }
            
            # Test database restoration
            test_db_name = f"aquafarm_system_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self._create_test_database(test_db_name)
            
            restore_success = self._restore_database_backup(db_dump_files[0], test_db_name)
            
            if restore_success:
                integrity_check = self._verify_database_integrity(test_db_name)
                self._cleanup_test_database(test_db_name)
                
                return {
                    'success': True,
                    'integrity_check': integrity_check
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to restore database from system backup'
                }
                
        except Exception as e:
            logger.error(f"Database test from system backup failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_files_from_system_backup(self, extract_dir: str) -> Dict:
        """
        Test files from system backup
        """
        try:
            # Check for expected directory structure
            expected_dirs = ['uploads', 'logs', 'config', 'static']
            found_dirs = []
            missing_dirs = []
            
            for dir_name in expected_dirs:
                dir_path = os.path.join(extract_dir, dir_name)
                if os.path.exists(dir_path):
                    found_dirs.append(dir_name)
                else:
                    missing_dirs.append(dir_name)
            
            return {
                'success': len(missing_dirs) == 0,
                'found_dirs': found_dirs,
                'missing_dirs': missing_dirs
            }
            
        except Exception as e:
            logger.error(f"File test from system backup failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _test_config_from_system_backup(self, extract_dir: str) -> Dict:
        """
        Test configuration from system backup
        """
        try:
            # Look for configuration files
            config_files = []
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    if file.endswith(('.json', '.yaml', '.yml', '.env')):
                        config_files.append(os.path.join(root, file))
            
            # Test JSON configuration files
            json_configs = [f for f in config_files if f.endswith('.json')]
            valid_configs = []
            invalid_configs = []
            
            for config_file in json_configs:
                try:
                    with open(config_file, 'r') as f:
                        json.load(f)
                    valid_configs.append(config_file)
                except json.JSONDecodeError:
                    invalid_configs.append(config_file)
            
            return {
                'success': len(invalid_configs) == 0,
                'config_files': config_files,
                'valid_configs': valid_configs,
                'invalid_configs': invalid_configs
            }
            
        except Exception as e:
            logger.error(f"Config test from system backup failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _cleanup_test_database(self, db_name: str):
        """
        Clean up test database
        """
        try:
            conn = psycopg2.connect(
                host=self.config['db_host'],
                port=self.config['db_port'],
                user=self.config['db_user'],
                password=self.config['db_password'],
                database='postgres'
            )
            
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Drop test database
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to cleanup test database: {e}")
    
    def run_all_tests(self, backup_files: List[str]) -> Dict:
        """
        Run all backup tests
        """
        results = {
            'database_tests': [],
            'file_tests': [],
            'system_tests': [],
            'overall_success': True,
            'timestamp': datetime.now().isoformat()
        }
        
        for backup_file in backup_files:
            if backup_file.endswith('.sql') or backup_file.endswith('.dump'):
                # Database backup test
                result = self.test_database_backup(backup_file)
                results['database_tests'].append({
                    'file': backup_file,
                    'result': result
                })
                
                if not result['success']:
                    results['overall_success'] = False
            
            elif backup_file.endswith('.tar.gz') or backup_file.endswith('.zip'):
                # File backup test
                result = self.test_file_backup(backup_file)
                results['file_tests'].append({
                    'file': backup_file,
                    'result': result
                })
                
                if not result['success']:
                    results['overall_success'] = False
                
                # System backup test
                result = self.test_full_system_backup(backup_file)
                results['system_tests'].append({
                    'file': backup_file,
                    'result': result
                })
                
                if not result['success']:
                    results['overall_success'] = False
        
        return results

# Example usage
if __name__ == "__main__":
    # Configuration
    config = {
        'db_host': 'localhost',
        'db_port': 5432,
        'db_user': 'aquafarm',
        'db_password': 'password'
    }
    
    # Create backup tester
    tester = BackupTester(config)
    
    # Test backup files
    backup_files = [
        'backups/database_20241201.sql',
        'backups/files_20241201.tar.gz',
        'backups/system_20241201.tar.gz'
    ]
    
    # Run tests
    results = tester.run_all_tests(backup_files)
    
    # Print results
    print("Backup Test Results:")
    print(json.dumps(results, indent=2))
