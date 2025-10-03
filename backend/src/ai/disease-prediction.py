"""
AquaFarm Pro - Disease Prediction Model
AI model for predicting fish diseases based on water quality and fish behavior
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class DiseasePredictionModel:
    """
    AI model for predicting fish diseases
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = [
            'temperature', 'ph', 'dissolved_oxygen', 'turbidity',
            'ammonia', 'nitrite', 'nitrate', 'salinity', 'conductivity',
            'fish_weight', 'fish_age', 'stocking_density', 'feeding_rate',
            'water_change_frequency', 'stress_level', 'swimming_behavior',
            'feeding_behavior', 'mortality_rate', 'growth_rate'
        ]
        
        # Disease categories and their symptoms
        self.disease_categories = {
            'bacterial': {
                'diseases': ['columnaris', 'aeromonas', 'pseudomonas', 'vibrio'],
                'symptoms': ['white_patches', 'red_sores', 'fin_rot', 'ulcers'],
                'risk_factors': ['high_ammonia', 'low_oxygen', 'poor_water_quality']
            },
            'fungal': {
                'diseases': ['saprolegnia', 'ichthyophonus', 'branchiomyces'],
                'symptoms': ['cotton_wool_growth', 'gill_damage', 'skin_lesions'],
                'risk_factors': ['low_temperature', 'high_organic_matter', 'stress']
            },
            'parasitic': {
                'diseases': ['ich', 'flukes', 'anchor_worms', 'gill_parasites'],
                'symptoms': ['white_spots', 'scratching', 'rapid_gill_movement', 'lethargy'],
                'risk_factors': ['poor_hygiene', 'overcrowding', 'stress']
            },
            'viral': {
                'diseases': ['koi_herpes', 'spring_viremia', 'lymphocystis'],
                'symptoms': ['cauliflower_growths', 'hemorrhaging', 'swollen_organs'],
                'risk_factors': ['stress', 'poor_water_quality', 'temperature_stress']
            }
        }
        
        # Risk thresholds for different parameters
        self.risk_thresholds = {
            'temperature': {'min': 20, 'max': 30, 'optimal': 25},
            'ph': {'min': 6.5, 'max': 8.5, 'optimal': 7.0},
            'dissolved_oxygen': {'min': 5.0, 'max': 10.0, 'optimal': 8.0},
            'ammonia': {'max': 0.5, 'critical': 1.0},
            'nitrite': {'max': 0.1, 'critical': 0.3},
            'nitrate': {'max': 50, 'critical': 100}
        }
    
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for disease prediction
        """
        df = data.copy()
        
        # Calculate derived features
        df['temperature_stress'] = np.abs(df['temperature'] - 25) / 5
        df['ph_stress'] = np.abs(df['ph'] - 7.0) / 0.5
        df['oxygen_stress'] = np.maximum(0, 8.0 - df['dissolved_oxygen']) / 3.0
        df['ammonia_stress'] = np.maximum(0, df['ammonia'] - 0.3) / 0.7
        df['nitrite_stress'] = np.maximum(0, df['nitrite'] - 0.1) / 0.2
        
        # Calculate overall stress level
        df['overall_stress'] = (
            df['temperature_stress'] + df['ph_stress'] + 
            df['oxygen_stress'] + df['ammonia_stress'] + df['nitrite_stress']
        ) / 5
        
        # Calculate disease risk factors
        df['bacterial_risk'] = self._calculate_bacterial_risk(df)
        df['fungal_risk'] = self._calculate_fungal_risk(df)
        df['parasitic_risk'] = self._calculate_parasitic_risk(df)
        df['viral_risk'] = self._calculate_viral_risk(df)
        
        return df
    
    def _calculate_bacterial_risk(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate bacterial disease risk
        """
        risk = np.zeros(len(df))
        
        # High ammonia risk
        risk += np.where(df['ammonia'] > 0.5, 0.3, 0)
        
        # Low oxygen risk
        risk += np.where(df['dissolved_oxygen'] < 6.0, 0.3, 0)
        
        # Poor water quality
        risk += np.where(df['turbidity'] > 5.0, 0.2, 0)
        
        # Stress factor
        risk += df['overall_stress'] * 0.2
        
        return pd.Series(risk)
    
    def _calculate_fungal_risk(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate fungal disease risk
        """
        risk = np.zeros(len(df))
        
        # Low temperature risk
        risk += np.where(df['temperature'] < 20, 0.4, 0)
        
        # High organic matter (turbidity)
        risk += np.where(df['turbidity'] > 3.0, 0.3, 0)
        
        # Stress factor
        risk += df['overall_stress'] * 0.3
        
        return pd.Series(risk)
    
    def _calculate_parasitic_risk(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate parasitic disease risk
        """
        risk = np.zeros(len(df))
        
        # Overcrowding risk
        risk += np.where(df['stocking_density'] > 10, 0.3, 0)
        
        # Poor hygiene (high organic matter)
        risk += np.where(df['turbidity'] > 4.0, 0.2, 0)
        
        # Stress factor
        risk += df['overall_stress'] * 0.5
        
        return pd.Series(risk)
    
    def _calculate_viral_risk(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate viral disease risk
        """
        risk = np.zeros(len(df))
        
        # Temperature stress
        risk += df['temperature_stress'] * 0.4
        
        # Poor water quality
        risk += np.where(df['ammonia'] > 0.3, 0.3, 0)
        risk += np.where(df['nitrite'] > 0.05, 0.3, 0)
        
        # Stress factor
        risk += df['overall_stress'] * 0.3
        
        return pd.Series(risk)
    
    def train_model(self, training_data: pd.DataFrame) -> Dict:
        """
        Train the disease prediction model
        """
        try:
            # Prepare features
            df = self.prepare_features(training_data)
            
            # Separate features and target
            X = df[self.feature_columns + [
                'temperature_stress', 'ph_stress', 'oxygen_stress',
                'ammonia_stress', 'nitrite_stress', 'overall_stress',
                'bacterial_risk', 'fungal_risk', 'parasitic_risk', 'viral_risk'
            ]]
            y = df['disease_category']
            
            # Encode target labels
            y_encoded = self.label_encoder.fit_transform(y)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train ensemble model
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(
                self.model, X_train_scaled, y_train, cv=5, scoring='accuracy'
            )
            
            # Feature importance
            feature_importance = dict(zip(
                X.columns, self.model.feature_importances_
            ))
            
            results = {
                'accuracy': accuracy,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'feature_importance': feature_importance,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
            
            logger.info(f"Model trained - Accuracy: {accuracy:.4f}")
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return {'error': str(e)}
    
    def predict_disease(self, input_data: Dict) -> Dict:
        """
        Predict disease risk for given conditions
        """
        try:
            # Prepare input data
            df = pd.DataFrame([input_data])
            df = self.prepare_features(df)
            
            # Select features
            X = df[self.feature_columns + [
                'temperature_stress', 'ph_stress', 'oxygen_stress',
                'ammonia_stress', 'nitrite_stress', 'overall_stress',
                'bacterial_risk', 'fungal_risk', 'parasitic_risk', 'viral_risk'
            ]]
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make prediction
            prediction = self.model.predict(X_scaled)[0]
            probabilities = self.model.predict_proba(X_scaled)[0]
            
            # Get disease category
            disease_category = self.label_encoder.inverse_transform([prediction])[0]
            
            # Get risk levels
            risk_levels = {
                'bacterial': float(df['bacterial_risk'].iloc[0]),
                'fungal': float(df['fungal_risk'].iloc[0]),
                'parasitic': float(df['parasitic_risk'].iloc[0]),
                'viral': float(df['viral_risk'].iloc[0])
            }
            
            # Generate recommendations
            recommendations = self._generate_recommendations(input_data, risk_levels)
            
            return {
                'disease_category': disease_category,
                'confidence': float(max(probabilities)),
                'risk_levels': risk_levels,
                'overall_risk': float(df['overall_stress'].iloc[0]),
                'recommendations': recommendations,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {'error': str(e)}
    
    def _generate_recommendations(self, input_data: Dict, risk_levels: Dict) -> List[str]:
        """
        Generate recommendations based on risk levels
        """
        recommendations = []
        
        # Temperature recommendations
        temp = input_data.get('temperature', 25)
        if temp < 20:
            recommendations.append("رفع درجة حرارة الماء إلى 22-25°C")
        elif temp > 30:
            recommendations.append("تبريد الماء إلى 25-28°C")
        
        # pH recommendations
        ph = input_data.get('ph', 7.0)
        if ph < 6.5:
            recommendations.append("رفع الأس الهيدروجيني إلى 7.0-7.5")
        elif ph > 8.5:
            recommendations.append("خفض الأس الهيدروجيني إلى 7.0-7.5")
        
        # Oxygen recommendations
        do = input_data.get('dissolved_oxygen', 8.0)
        if do < 6.0:
            recommendations.append("تحسين التهوية وزيادة الأكسجين المذاب")
        
        # Ammonia recommendations
        ammonia = input_data.get('ammonia', 0.3)
        if ammonia > 0.5:
            recommendations.append("تقليل الأمونيا فوراً - تغيير جزئي للماء")
        
        # Risk-specific recommendations
        if risk_levels['bacterial'] > 0.5:
            recommendations.append("مراقبة علامات الأمراض البكتيرية - تنظيف الحوض")
        
        if risk_levels['fungal'] > 0.5:
            recommendations.append("تحسين جودة الماء - تقليل المواد العضوية")
        
        if risk_levels['parasitic'] > 0.5:
            recommendations.append("تقليل الكثافة - تحسين النظافة")
        
        if risk_levels['viral'] > 0.5:
            recommendations.append("تقليل الإجهاد - تحسين ظروف البيئة")
        
        return recommendations
    
    def get_disease_symptoms(self, disease_category: str) -> Dict:
        """
        Get symptoms and information for a disease category
        """
        if disease_category in self.disease_categories:
            return self.disease_categories[disease_category]
        else:
            return {}
    
    def save_model(self, filepath: str):
        """
        Save the trained model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_columns': self.feature_columns,
            'disease_categories': self.disease_categories,
            'risk_thresholds': self.risk_thresholds
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
        self.label_encoder = model_data['label_encoder']
        self.feature_columns = model_data['feature_columns']
        self.disease_categories = model_data['disease_categories']
        self.risk_thresholds = model_data['risk_thresholds']
        
        logger.info(f"Model loaded from {filepath}")

# Example usage and training
def create_sample_training_data() -> pd.DataFrame:
    """
    Create sample training data for disease prediction
    """
    np.random.seed(42)
    n_samples = 2000
    
    # Generate sample data
    data = {
        'temperature': np.random.normal(25, 3, n_samples),
        'ph': np.random.normal(7.0, 0.5, n_samples),
        'dissolved_oxygen': np.random.normal(8.0, 1.0, n_samples),
        'turbidity': np.random.normal(2.0, 1.0, n_samples),
        'ammonia': np.random.normal(0.3, 0.2, n_samples),
        'nitrite': np.random.normal(0.1, 0.05, n_samples),
        'nitrate': np.random.normal(5.0, 2.0, n_samples),
        'salinity': np.random.normal(0.5, 0.1, n_samples),
        'conductivity': np.random.normal(500, 100, n_samples),
        'fish_weight': np.random.normal(100, 20, n_samples),
        'fish_age': np.random.randint(30, 365, n_samples),
        'stocking_density': np.random.uniform(5, 15, n_samples),
        'feeding_rate': np.random.normal(3.0, 0.5, n_samples),
        'water_change_frequency': np.random.randint(1, 7, n_samples),
        'stress_level': np.random.uniform(0, 1, n_samples),
        'swimming_behavior': np.random.uniform(0, 1, n_samples),
        'feeding_behavior': np.random.uniform(0, 1, n_samples),
        'mortality_rate': np.random.uniform(0, 0.1, n_samples),
        'growth_rate': np.random.uniform(0.5, 2.0, n_samples),
        'disease_category': np.random.choice(
            ['bacterial', 'fungal', 'parasitic', 'viral', 'healthy'],
            n_samples,
            p=[0.2, 0.15, 0.15, 0.1, 0.4]
        )
    }
    
    return pd.DataFrame(data)

def main():
    """
    Main function to train and test the disease prediction model
    """
    # Create model
    model = DiseasePredictionModel()
    
    # Generate sample data
    training_data = create_sample_training_data()
    
    # Train model
    results = model.train_model(training_data)
    print("Training results:", results)
    
    # Test prediction
    test_input = {
        'temperature': 22,
        'ph': 6.8,
        'dissolved_oxygen': 6.5,
        'turbidity': 3.5,
        'ammonia': 0.8,
        'nitrite': 0.2,
        'nitrate': 8.0,
        'salinity': 0.5,
        'conductivity': 600,
        'fish_weight': 120,
        'fish_age': 90,
        'stocking_density': 12,
        'feeding_rate': 3.5,
        'water_change_frequency': 3,
        'stress_level': 0.7,
        'swimming_behavior': 0.3,
        'feeding_behavior': 0.4,
        'mortality_rate': 0.05,
        'growth_rate': 1.2
    }
    
    prediction = model.predict_disease(test_input)
    print("Disease prediction:", prediction)
    
    # Save model
    model.save_model('disease_prediction_model.pkl')
    
    return model

if __name__ == "__main__":
    model = main()
