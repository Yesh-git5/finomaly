import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class GSTAnomalyDetector:
    """
    Unsupervised GST Anomaly Detection using Isolation Forest
    trained on context-aware engineered features.
    """
    def __init__(self, contamination=0.15, random_state=42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=120,
            contamination=contamination,
            random_state=random_state,
            bootstrap=False
        )
        self.feature_names = [
            'vendor_relative_ratio',      # Amount / Vendor Historical Median
            'vendor_iqr_zscore',          # (Amount - Median) / IQR
            'tax_rate_discrepancy',       # |Effective Tax - Declared Tax Rate|
            'log_total_amount',           # Absolute transaction magnitude
            'round_number_index',         # Round sum billing penalty
            'threshold_evasion_proximity' # Proximity just below 50k / 1.5L e-Way brackets
        ]
        self.is_fitted = False

    def extract_features(self, df_invoices, df_vendors):
        """
        Merge invoice data with vendor baselines to engineer relative context features.
        """
        df = df_invoices.copy()
        
        # Merge vendor historical baselines
        v_map = df_vendors.set_index('gstin')[['historical_median', 'historical_iqr', 'typical_gst_rate']].to_dict('index')
        
        rel_ratios = []
        iqr_zscores = []
        tax_diffs = []
        log_amts = []
        round_flags = []
        threshold_flags = []
        
        for _, row in df.iterrows():
            amt = float(row.get('total_amount', 0))
            taxable = max(float(row.get('taxable_value', amt * 0.84)), 1.0)
            gst_rate = float(row.get('gst_rate', 18)) / 100.0
            declared_tax = float(row.get('cgst', 0)) + float(row.get('sgst', 0)) + float(row.get('igst', 0))
            
            s_gstin = str(row.get('supplier_gstin', '')).strip()
            v_info = v_map.get(s_gstin, {'historical_median': 50000, 'historical_iqr': 15000, 'typical_gst_rate': 18})
            
            v_median = max(float(v_info['historical_median']), 1.0)
            v_iqr = max(float(v_info['historical_iqr']), 1.0)
            
            # Feature 1: Ratio to vendor normal
            ratio = amt / v_median
            rel_ratios.append(min(ratio, 100.0))
            
            # Feature 2: IQR deviation
            z_iqr = (amt - v_median) / v_iqr
            iqr_zscores.append(max(z_iqr, 0.0))
            
            # Feature 3: Tax discrepancy
            effective_tax_rate = declared_tax / taxable
            tax_diff = abs(effective_tax_rate - gst_rate)
            tax_diffs.append(tax_diff)
            
            # Feature 4: Log total amount
            log_amts.append(np.log1p(amt))
            
            # Feature 5: Round number index
            is_round = 1.0 if (amt >= 50000 and amt % 5000 == 0) else 0.0
            round_flags.append(is_round)
            
            # Feature 6: Threshold evasion proximity (48k - 49.9k or 145k - 149.9k)
            is_near_threshold = 1.0 if (48000 <= amt < 50000 or 145000 <= amt < 150000) else 0.0
            threshold_flags.append(is_near_threshold)
            
        feature_df = pd.DataFrame({
            'vendor_relative_ratio': rel_ratios,
            'vendor_iqr_zscore': iqr_zscores,
            'tax_rate_discrepancy': tax_diffs,
            'log_total_amount': log_amts,
            'round_number_index': round_flags,
            'threshold_evasion_proximity': threshold_flags
        })
        return feature_df

    def fit_predict(self, df_invoices, df_vendors):
        """
        Train Isolation Forest and generate explainable 0-100 anomaly scores.
        """
        X = self.extract_features(df_invoices, df_vendors)
        self.model.fit(X)
        self.is_fitted = True
        
        # Raw anomaly score: lower means more abnormal
        raw_scores = self.model.decision_function(X)
        
        # Convert to 0-100 risk score where 100 is most anomalous
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            normalized_scores = 100.0 * (1.0 - (raw_scores - min_s) / (max_s - min_s))
        else:
            normalized_scores = np.full_like(raw_scores, 20.0)
            
        # Feature contributions
        contributions = []
        for idx, row in X.iterrows():
            contrib = {}
            if row['vendor_relative_ratio'] > 3.0:
                contrib['Vendor Amount Spike'] = round(min(row['vendor_relative_ratio'] * 2.5, 40.0), 1)
            if row['tax_rate_discrepancy'] > 0.03:
                contrib['Tax Math Mismatch'] = round(row['tax_rate_discrepancy'] * 200.0, 1)
            if row['threshold_evasion_proximity'] > 0.5:
                contrib['Threshold Evasion Proximity'] = 25.0
            if row['round_number_index'] > 0.5:
                contrib['Round Number Pattern'] = 15.0
            contributions.append(contrib)
            
        return normalized_scores, contributions

    def score_single_invoice(self, invoice_dict, df_vendors):
        """
        Score an individual uploaded invoice using the trained baseline.
        """
        temp_df = pd.DataFrame([invoice_dict])
        X = self.extract_features(temp_df, df_vendors)
        
        if not self.is_fitted:
            # Fallback heuristic if not fitted yet
            amt = float(invoice_dict.get('total_amount', 0))
            s_gstin = str(invoice_dict.get('supplier_gstin', '')).strip()
            v_match = df_vendors[df_vendors['gstin'] == s_gstin]
            median = float(v_match['historical_median'].iloc[0]) if len(v_match) > 0 else 50000
            ratio = amt / max(median, 1.0)
            score = min(ratio * 15.0, 95.0) if ratio > 1.5 else 12.0
            return score, {}
            
        raw_score = self.model.decision_function(X)[0]
        # Approximate mapping based on standard range
        score = np.clip(100.0 * (0.15 - raw_score) / 0.35, 10.0, 98.0)
        return float(score)
