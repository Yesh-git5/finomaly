import re

class GSTRuleEngine:
    """
    Deterministic Indian GST Rulebook & Compliance Engine.
    Evaluates statutory tax rules, filing reconciliation, and threshold patterns.
    """
    GSTIN_REGEX = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
    STATE_CODES = {
        "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
        "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
        "10": "Bihar", "24": "Gujarat", "27": "Maharashtra", "29": "Karnataka", "33": "Tamil Nadu",
        "36": "Telangana", "37": "Andhra Pradesh", "19": "West Bengal"
    }

    @staticmethod
    def validate_gstin(gstin):
        """
        Validates 15-character GSTIN structure, valid state code, and PAN format.
        """
        if not gstin or not isinstance(gstin, str):
            return False, "GSTIN missing or non-string format"
        gstin = gstin.strip().upper()
        if len(gstin) != 15:
            return False, f"Invalid length ({len(gstin)} chars; expected 15)"
        if not GSTRuleEngine.GSTIN_REGEX.match(gstin):
            return False, "Checksum or format pattern validation failed"
        state_code = gstin[:2]
        if state_code not in GSTRuleEngine.STATE_CODES:
            return False, f"Unknown State Code '{state_code}' in GSTIN prefix"
        return True, "Valid GSTIN"

    def evaluate_invoice(self, row, all_invoices_df=None):
        """
        Run deterministic rule checks on an invoice row.
        Returns (rule_score, reasons_list).
        """
        reasons = []
        rule_score = 0
        
        s_gstin = str(row.get('supplier_gstin', '')).strip().upper()
        b_gstin = str(row.get('buyer_gstin', '')).strip().upper()
        total_amt = float(row.get('total_amount', 0))
        taxable = float(row.get('taxable_value', 0))
        gst_rate = float(row.get('gst_rate', 18))
        cgst = float(row.get('cgst', 0))
        sgst = float(row.get('sgst', 0))
        igst = float(row.get('igst', 0))
        total_tax = cgst + sgst + igst
        pos = str(row.get('place_of_supply', '')).strip()
        
        # 1. Supplier GSTIN Check
        valid_s, msg_s = self.validate_gstin(s_gstin)
        if not valid_s:
            rule_score += 45
            reasons.append({
                'code': 'RULE_INVALID_SUPPLIER_GSTIN',
                'message': f"Supplier GSTIN validation failed: {msg_s}",
                'severity': 'Critical',
                'weight': 45
            })
            
        # 2. Buyer GSTIN Check
        valid_b, msg_b = self.validate_gstin(b_gstin)
        if not valid_b:
            rule_score += 30
            reasons.append({
                'code': 'RULE_INVALID_BUYER_GSTIN',
                'message': f"Buyer GSTIN validation failed: {msg_b}",
                'severity': 'High',
                'weight': 30
            })
            
        # 3. Tax Rate & Computation Math Check
        expected_tax = round((taxable * gst_rate) / 100.0, 2)
        if taxable > 0 and total_tax > 0:
            diff = abs(total_tax - expected_tax)
            if diff > 50.0:
                eff_rate = round((total_tax / taxable) * 100.0, 1)
                rule_score += 35
                reasons.append({
                    'code': 'RULE_TAX_MATH_MISMATCH',
                    'message': f"Tax computation mismatch: effective billed tax is {eff_rate}% vs declared {gst_rate}% (diff: ₹{round(diff,2)})",
                    'severity': 'High',
                    'weight': 35
                })
                
        # 4. Inter-state vs Intra-state Place of Supply Check
        s_state = s_gstin[:2] if len(s_gstin) >= 2 else ""
        b_state = b_gstin[:2] if len(b_gstin) >= 2 else ""
        is_interstate = (s_state != b_state) and (s_state != "") and (b_state != "")
        
        if is_interstate and (cgst > 0 or sgst > 0):
            rule_score += 20
            reasons.append({
                'code': 'RULE_POS_TAX_MISMATCH',
                'message': "Inter-state transaction billed with intra-state CGST/SGST instead of IGST",
                'severity': 'Medium',
                'weight': 20
            })
        elif not is_interstate and igst > 0 and (s_state != ""):
            rule_score += 20
            reasons.append({
                'code': 'RULE_POS_TAX_MISMATCH',
                'message': "Intra-state transaction billed with IGST instead of CGST/SGST",
                'severity': 'Medium',
                'weight': 20
            })
            
        # 5. Threshold Evasion (e-Way Bill Smurfing)
        # In India, e-Way bill is mandatory for consignment value > ₹50,000 (or ₹1,00,000 in some states)
        if 48000 <= total_amt < 50000:
            rule_score += 25
            reasons.append({
                'code': 'RULE_EWAY_THRESHOLD_PROXIMITY',
                'message': f"Amount ₹{total_amt:,.0f} sits immediately below the mandatory ₹50,000 e-Way bill threshold",
                'severity': 'Medium',
                'weight': 25
            })
            
        # Check split invoicing on same date
        if all_invoices_df is not None and not all_invoices_df.empty:
            inv_date = str(row.get('invoice_date', ''))
            inv_no = str(row.get('invoice_number', ''))
            matching_splits = all_invoices_df[
                (all_invoices_df['supplier_gstin'] == s_gstin) &
                (all_invoices_df['buyer_gstin'] == b_gstin) &
                (all_invoices_df['invoice_date'] == inv_date) &
                (all_invoices_df['invoice_number'] != inv_no)
            ]
            if len(matching_splits) > 0:
                rule_score += 30
                reasons.append({
                    'code': 'RULE_SPLIT_INVOICE_PATTERN',
                    'message': f"Multiple invoices ({len(matching_splits)+1}) issued to same buyer on {inv_date} indicating order splitting",
                    'severity': 'High',
                    'weight': 30
                })
                
        # 6. High Value Round Number Anomaly
        if total_amt >= 200000 and (total_amt % 10000 == 0):
            rule_score += 15
            reasons.append({
                'code': 'RULE_ROUND_SUM_INVOICE',
                'message': f"Exact round number billing (₹{total_amt:,.0f}) without fractional commercial components",
                'severity': 'Low',
                'weight': 15
            })
            
        return min(rule_score, 100), reasons
