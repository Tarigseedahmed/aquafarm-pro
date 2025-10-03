"""
AquaFarm Pro - Water Quality Prediction Model
AI model for predicting water quality parameters
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WaterQualityPredictor:
    """
    AI model for predicting water quality parameters
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_columns = [
            'temperature', 'ph', 'dissolved_oxygen', 'turbidity',
            'ammonia', 'nitrite', 'nitrate', 'time_of_day',
            'day_of_week', 'season', 'weather_temp', 'humidity'
        ]
        self.target_columns = ['ph', 'dissolved_oxygen', 'turbidity']
        
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for training/prediction
        """
        df = data.copy()
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Extract time features
        df['time_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['season'] = df['timestamp'].dt.month % 12 // 3
        
        # Add weather features (mock data for now)
        df['weather_temp'] = df['temperature'] + np.random.normal(0, 2, len(df))
        df['humidity'] = np.random.uniform(40, 80, len(df))
        
        # Fill missing values
        df = df.fillna(method='ffill').fillna(method='bfill')
        
        return df
    
    def train_models(self, training_data: pd.DataFrame) -> Dict[str, float]:
        """
        Train prediction models for each water quality parameter
        """
        logger.info("Starting model training...")
        
        # Prepare features
        df = self.prepare_features(training_data)
        
        # Split data
        X = df[self.feature_columns]
        y = df[self.target_columns]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        self.scalers['main'] = scaler
        
        # Train models for each target
        scores = {}
        
        for target in self.target_columns:
            logger.info(f"Training model for {target}...")
            
            # Create and train model
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(X_train_scaled, y_train[target])
            
            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            mse = mean_squared_error(y_test[target], y_pred)
            r2 = r2_score(y_test[target], y_pred)
            
            self.models[target] = model
            scores[target] = {'mse': mse, 'r2': r2}
            
            logger.info(f"{target} - MSE: {mse:.4f}, R2: {r2:.4f}")
        
        return scores
    
    def predict(self, input_data: Dict) -> Dict[str, float]:
        """
        Predict water quality parameters
        """
        try:
            # Prepare input data
            df = pd.DataFrame([input_data])
            df = self.prepare_features(df)
            
            # Scale features
            X = df[self.feature_columns]
            X_scaled = self.scalers['main'].transform(X)
            
            # Make predictions
            predictions = {}
            for target in self.target_columns:
                if target in self.models:
                    pred = self.models[target].predict(X_scaled)[0]
                    predictions[target] = float(pred)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {}
    
    def predict_future(self, current_data: Dict, hours_ahead: int = 24) -> List[Dict]:
        """
        Predict water quality for future time points
        """
        predictions = []
        current_time = datetime.now()
        
        for i in range(hours_ahead):
            future_time = current_time + timedelta(hours=i)
            
            # Update time features
            future_data = current_data.copy()
            future_data['timestamp'] = future_time.isoformat()
            future_data['time_of_day'] = future_time.hour
            future_data['day_of_week'] = future_time.weekday()
            future_data['season'] = future_time.month % 12 // 3
            
            # Make prediction
            pred = self.predict(future_data)
            pred['timestamp'] = future_time.isoformat()
            pred['hours_ahead'] = i
            
            predictions.append(pred)
        
        return predictions
    
    def get_feature_importance(self) -> Dict[str, Dict[str, float]]:
        """
        Get feature importance for each model
        """
        importance = {}
        
        for target, model in self.models.items():
            if hasattr(model, 'feature_importances_'):
                importance[target] = dict(zip(
                    self.feature_columns,
                    model.feature_importances_
                ))
        
        return importance
    
    def save_models(self, filepath: str):
        """
        Save trained models to disk
        """
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'feature_columns': self.feature_columns,
            'target_columns': self.target_columns
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Models saved to {filepath}")
    
    def load_models(self, filepath: str):
        """
        Load trained models from disk
        """
        model_data = joblib.load(filepath)
        
        self.models = model_data['models']
        self.scalers = model_data['scalers']
        self.feature_columns = model_data['feature_columns']
        self.target_columns = model_data['target_columns']
        
        logger.info(f"Models loaded from {filepath}")

# Example usage and training
def create_sample_data() -> pd.DataFrame:
    """
    Create sample training data
    """
    np.random.seed(42)
    n_samples = 1000
    
    # Generate sample data
    data = {
        'timestamp': pd.date_range('2024-01-01', periods=n_samples, freq='H'),
        'temperature': np.random.normal(24, 3, n_samples),
        'ph': np.random.normal(7.0, 0.5, n_samples),
        'dissolved_oxygen': np.random.normal(8.0, 1.0, n_samples),
        'turbidity': np.random.normal(2.0, 0.5, n_samples),
        'ammonia': np.random.normal(0.3, 0.1, n_samples),
        'nitrite': np.random.normal(0.1, 0.05, n_samples),
        'nitrate': np.random.normal(5.0, 1.0, n_samples)
    }
    
    return pd.DataFrame(data)

def main():
    """
    Main function to train and test the model
    """
    # Create predictor
    predictor = WaterQualityPredictor()
    
    # Generate sample data
    training_data = create_sample_data()
    
    # Train models
    scores = predictor.train_models(training_data)
    print("Training scores:", scores)
    
    # Test prediction
    test_input = {
        'timestamp': datetime.now().isoformat(),
        'temperature': 25.0,
        'ph': 7.2,
        'dissolved_oxygen': 8.5,
        'turbidity': 2.1,
        'ammonia': 0.3,
        'nitrite': 0.1,
        'nitrate': 5.2
    }
    
    prediction = predictor.predict(test_input)
    print("Prediction:", prediction)
    
    # Future predictions
    future_predictions = predictor.predict_future(test_input, hours_ahead=24)
    print(f"Future predictions (24h): {len(future_predictions)} points")
    
    # Feature importance
    importance = predictor.get_feature_importance()
    print("Feature importance:", importance)
    
    # Save models
    predictor.save_models('water_quality_models.pkl')
    
    return predictor

if __name__ == "__main__":
    predictor = main()
