"""
AquaFarm Pro - Smart Feeding Recommendation System
AI-powered feeding recommendations based on fish weight, temperature, and water quality
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeedingRecommendationSystem:
    """
    AI system for smart feeding recommendations
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'fish_weight_avg', 'fish_count', 'water_temperature',
            'ph', 'dissolved_oxygen', 'turbidity', 'ammonia',
            'nitrite', 'nitrate', 'pond_volume', 'fish_age_days',
            'feeding_frequency', 'last_feeding_hours', 'season',
            'time_of_day', 'weather_condition'
        ]
        
        # Fish species feeding coefficients
        self.species_coefficients = {
            'tilapia': {
                'base_rate': 0.03,  # 3% of body weight
                'temp_optimal': 28,
                'temp_min': 20,
                'temp_max': 35,
                'oxygen_min': 5.0,
                'ph_optimal': 7.0,
                'ph_range': (6.5, 8.5)
            },
            'salmon': {
                'base_rate': 0.025,
                'temp_optimal': 15,
                'temp_min': 8,
                'temp_max': 20,
                'oxygen_min': 6.0,
                'ph_optimal': 7.2,
                'ph_range': (6.8, 8.0)
            },
            'trout': {
                'base_rate': 0.02,
                'temp_optimal': 12,
                'temp_min': 5,
                'temp_max': 18,
                'oxygen_min': 6.5,
                'ph_optimal': 7.0,
                'ph_range': (6.5, 8.0)
            }
        }
    
    def prepare_features(self, data: Dict) -> np.ndarray:
        """
        Prepare features for feeding recommendation
        """
        features = []
        
        for col in self.feature_columns:
            if col in data:
                features.append(data[col])
            else:
                # Default values for missing features
                defaults = {
                    'fish_weight_avg': 100,  # grams
                    'fish_count': 1000,
                    'water_temperature': 25,
                    'ph': 7.0,
                    'dissolved_oxygen': 8.0,
                    'turbidity': 2.0,
                    'ammonia': 0.3,
                    'nitrite': 0.1,
                    'nitrate': 5.0,
                    'pond_volume': 10000,  # liters
                    'fish_age_days': 90,
                    'feeding_frequency': 2,  # times per day
                    'last_feeding_hours': 12,
                    'season': 2,  # summer
                    'time_of_day': 8,  # morning
                    'weather_condition': 1  # sunny
                }
                features.append(defaults.get(col, 0))
        
        return np.array(features).reshape(1, -1)
    
    def calculate_base_feeding_rate(self, fish_weight: float, fish_count: int, 
                                  species: str = 'tilapia') -> float:
        """
        Calculate base feeding rate based on fish weight and species
        """
        if species not in self.species_coefficients:
            species = 'tilapia'  # Default to tilapia
        
        coeffs = self.species_coefficients[species]
        total_weight = fish_weight * fish_count
        base_rate = total_weight * coeffs['base_rate']
        
        return base_rate
    
    def adjust_for_water_quality(self, base_rate: float, water_quality: Dict, 
                                species: str = 'tilapia') -> float:
        """
        Adjust feeding rate based on water quality parameters
        """
        if species not in self.species_coefficients:
            species = 'tilapia'
        
        coeffs = self.species_coefficients[species]
        adjusted_rate = base_rate
        
        # Temperature adjustment
        temp = water_quality.get('temperature', 25)
        temp_optimal = coeffs['temp_optimal']
        temp_min = coeffs['temp_min']
        temp_max = coeffs['temp_max']
        
        if temp < temp_min or temp > temp_max:
            # Reduce feeding in extreme temperatures
            adjusted_rate *= 0.5
        elif abs(temp - temp_optimal) > 5:
            # Moderate reduction for suboptimal temperatures
            adjusted_rate *= 0.8
        
        # Dissolved oxygen adjustment
        do = water_quality.get('dissolved_oxygen', 8.0)
        if do < coeffs['oxygen_min']:
            # Reduce feeding when oxygen is low
            adjusted_rate *= 0.6
        
        # pH adjustment
        ph = water_quality.get('ph', 7.0)
        ph_min, ph_max = coeffs['ph_range']
        if ph < ph_min or ph > ph_max:
            # Reduce feeding when pH is outside optimal range
            adjusted_rate *= 0.7
        
        # Ammonia adjustment
        ammonia = water_quality.get('ammonia', 0.3)
        if ammonia > 0.5:
            # Reduce feeding when ammonia is high
            adjusted_rate *= 0.5
        
        return max(adjusted_rate, 0.1)  # Minimum 10% of base rate
    
    def adjust_for_fish_condition(self, adjusted_rate: float, fish_data: Dict) -> float:
        """
        Adjust feeding rate based on fish condition and behavior
        """
        # Age adjustment
        fish_age = fish_data.get('age_days', 90)
        if fish_age < 30:
            # Young fish need more frequent, smaller meals
            adjusted_rate *= 1.2
        elif fish_age > 365:
            # Older fish may need less food
            adjusted_rate *= 0.9
        
        # Feeding frequency adjustment
        feeding_freq = fish_data.get('feeding_frequency', 2)
        if feeding_freq > 3:
            # More frequent feeding means smaller portions
            adjusted_rate *= 0.8
        elif feeding_freq < 2:
            # Less frequent feeding means larger portions
            adjusted_rate *= 1.1
        
        # Time since last feeding
        last_feeding = fish_data.get('last_feeding_hours', 12)
        if last_feeding > 24:
            # Increase feeding if it's been too long
            adjusted_rate *= 1.3
        elif last_feeding < 6:
            # Reduce feeding if fed recently
            adjusted_rate *= 0.7
        
        return adjusted_rate
    
    def recommend_feeding(self, pond_data: Dict) -> Dict:
        """
        Generate comprehensive feeding recommendation
        """
        try:
            # Extract data
            fish_weight = pond_data.get('fish_weight_avg', 100)
            fish_count = pond_data.get('fish_count', 1000)
            species = pond_data.get('fish_species', 'tilapia')
            water_quality = pond_data.get('water_quality', {})
            fish_data = pond_data.get('fish_data', {})
            
            # Calculate base feeding rate
            base_rate = self.calculate_base_feeding_rate(
                fish_weight, fish_count, species
            )
            
            # Adjust for water quality
            water_adjusted_rate = self.adjust_for_water_quality(
                base_rate, water_quality, species
            )
            
            # Adjust for fish condition
            final_rate = self.adjust_for_fish_condition(
                water_adjusted_rate, fish_data
            )
            
            # Calculate feeding amount per fish
            amount_per_fish = final_rate / fish_count
            
            # Determine feeding frequency
            feeding_frequency = self.determine_feeding_frequency(
                water_quality, fish_data
            )
            
            # Calculate total daily feeding
            daily_total = final_rate * feeding_frequency
            
            # Generate recommendation
            recommendation = {
                'total_daily_amount': round(daily_total, 2),
                'amount_per_fish': round(amount_per_fish, 4),
                'feeding_frequency': feeding_frequency,
                'amount_per_feeding': round(final_rate, 2),
                'base_rate': round(base_rate, 2),
                'adjustment_factors': {
                    'water_quality_impact': round(water_adjusted_rate / base_rate, 2),
                    'fish_condition_impact': round(final_rate / water_adjusted_rate, 2),
                    'overall_adjustment': round(final_rate / base_rate, 2)
                },
                'recommendations': self.generate_feeding_advice(
                    water_quality, fish_data, final_rate
                ),
                'timestamp': datetime.now().isoformat()
            }
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error generating feeding recommendation: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def determine_feeding_frequency(self, water_quality: Dict, fish_data: Dict) -> int:
        """
        Determine optimal feeding frequency
        """
        temp = water_quality.get('temperature', 25)
        fish_age = fish_data.get('age_days', 90)
        
        # Base frequency
        if fish_age < 30:
            frequency = 4  # Young fish need more frequent feeding
        elif fish_age < 90:
            frequency = 3
        else:
            frequency = 2
        
        # Adjust for temperature
        if temp < 20:
            frequency = max(1, frequency - 1)  # Reduce in cold water
        elif temp > 30:
            frequency = min(4, frequency + 1)  # Increase in warm water
        
        return frequency
    
    def generate_feeding_advice(self, water_quality: Dict, fish_data: Dict, 
                              feeding_rate: float) -> List[str]:
        """
        Generate feeding advice and warnings
        """
        advice = []
        
        # Water quality warnings
        temp = water_quality.get('temperature', 25)
        do = water_quality.get('dissolved_oxygen', 8.0)
        ammonia = water_quality.get('ammonia', 0.3)
        
        if temp < 20:
            advice.append("تحذير: درجة حرارة الماء منخفضة، قلل من كمية التغذية")
        elif temp > 30:
            advice.append("تحذير: درجة حرارة الماء مرتفعة، زد من كمية التغذية")
        
        if do < 5:
            advice.append("تحذير: مستوى الأكسجين منخفض، قلل من التغذية")
        
        if ammonia > 0.5:
            advice.append("تحذير: مستوى الأمونيا مرتفع، قلل من التغذية فوراً")
        
        # Fish condition advice
        fish_age = fish_data.get('age_days', 90)
        if fish_age < 30:
            advice.append("نصيحة: الأسماك صغيرة السن، استخدم غذاء عالي البروتين")
        elif fish_age > 365:
            advice.append("نصيحة: الأسماك كبيرة السن، قلل من كمية التغذية")
        
        # General advice
        if feeding_rate < 50:
            advice.append("نصيحة: كمية التغذية منخفضة، تأكد من صحة الأسماك")
        elif feeding_rate > 200:
            advice.append("نصيحة: كمية التغذية عالية، راقب جودة المياه")
        
        return advice
    
    def train_model(self, training_data: pd.DataFrame):
        """
        Train the feeding recommendation model
        """
        try:
            # Prepare features and target
            X = training_data[self.feature_columns]
            y = training_data['optimal_feeding_rate']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"Model trained - MSE: {mse:.4f}, R2: {r2:.4f}")
            
            return {'mse': mse, 'r2': r2}
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return None
    
    def save_model(self, filepath: str):
        """
        Save the trained model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'species_coefficients': self.species_coefficients
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """
        Load the trained model
        """
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.species_coefficients = model_data['species_coefficients']
        
        logger.info(f"Model loaded from {filepath}")

# Example usage
def create_sample_training_data() -> pd.DataFrame:
    """
    Create sample training data for the feeding model
    """
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'fish_weight_avg': np.random.normal(100, 20, n_samples),
        'fish_count': np.random.randint(500, 2000, n_samples),
        'water_temperature': np.random.normal(25, 5, n_samples),
        'ph': np.random.normal(7.0, 0.5, n_samples),
        'dissolved_oxygen': np.random.normal(8.0, 1.5, n_samples),
        'turbidity': np.random.normal(2.0, 0.8, n_samples),
        'ammonia': np.random.normal(0.3, 0.2, n_samples),
        'nitrite': np.random.normal(0.1, 0.05, n_samples),
        'nitrate': np.random.normal(5.0, 2.0, n_samples),
        'pond_volume': np.random.normal(10000, 2000, n_samples),
        'fish_age_days': np.random.randint(30, 365, n_samples),
        'feeding_frequency': np.random.randint(1, 4, n_samples),
        'last_feeding_hours': np.random.uniform(6, 24, n_samples),
        'season': np.random.randint(0, 4, n_samples),
        'time_of_day': np.random.randint(6, 18, n_samples),
        'weather_condition': np.random.randint(0, 3, n_samples),
        'optimal_feeding_rate': np.random.normal(150, 50, n_samples)
    }
    
    return pd.DataFrame(data)

def main():
    """
    Main function to test the feeding recommendation system
    """
    # Create recommendation system
    system = FeedingRecommendationSystem()
    
    # Test recommendation
    test_data = {
        'fish_weight_avg': 120,
        'fish_count': 1000,
        'fish_species': 'tilapia',
        'water_quality': {
            'temperature': 26,
            'ph': 7.2,
            'dissolved_oxygen': 8.5,
            'turbidity': 2.1,
            'ammonia': 0.3,
            'nitrite': 0.1,
            'nitrate': 5.2
        },
        'fish_data': {
            'age_days': 90,
            'feeding_frequency': 2,
            'last_feeding_hours': 12
        }
    }
    
    recommendation = system.recommend_feeding(test_data)
    print("Feeding Recommendation:")
    print(json.dumps(recommendation, indent=2, ensure_ascii=False))
    
    return system

if __name__ == "__main__":
    system = main()
