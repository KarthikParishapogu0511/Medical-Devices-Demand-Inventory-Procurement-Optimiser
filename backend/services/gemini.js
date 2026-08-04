import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API, using fallback simulator:', err.message);
  }
} else {
  console.log('No GEMINI_API_KEY found. Running in simulation mode.');
}

/**
 * Run demand forecast simulation or call Gemini API.
 */
export async function runForecastAI(item, history) {
  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a medical device inventory forecaster. 
Input Item: ${JSON.stringify(item)}
Historical Demand: ${JSON.stringify(history)}
Generate a forecast for next month. Output a JSON object with:
{
  "forecasted_quantity": number,
  "confidence_score": number (0 to 1),
  "explanation": "concise explanation of seasonality/defect/uptime drivers"
}`;
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      const resultText = response.response.text();
      return JSON.parse(resultText);
    } catch (err) {
      console.warn('Gemini API call failed, falling back to simulator:', err.message);
    }
  }

  // Fallback simulator logic
  const avgHistory = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.quantity_demanded, 0) / history.length)
    : 15;
  const recentDefectRate = history.length > 0 ? history[history.length - 1].defect_rate : 1.0;
  const forecastQty = Math.round(avgHistory * (1 + (recentDefectRate > 2 ? 0.1 : 0.05)));

  return {
    forecasted_quantity: forecastQty,
    confidence_score: 0.85,
    explanation: `Simulated AI forecast based on 12-month demand moving average (${avgHistory} units) adjusted for recent defect rate of ${recentDefectRate}%.`
  };
}

/**
 * Evaluate supplier risk using Gemini or Simulator.
 */
export async function runSupplierRiskAI(supplier, inspections, complaints) {
  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze risk for supplier: ${JSON.stringify(supplier)}.
Recent Inspections: ${JSON.stringify(inspections)}
Recent Complaints: ${JSON.stringify(complaints)}
Evaluate risk level. Output JSON:
{
  "risk_score": number (0 to 100),
  "explanation": "concise risk reasoning based on reliability/defect metrics"
}`;
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.response.text());
    } catch (err) {
      console.warn('Gemini API call failed, falling back to simulator:', err.message);
    }
  }

  // Fallback simulation
  let riskScore = 15;
  let reasons = [];
  if (supplier.quality_score < 90) {
    riskScore += 25;
    reasons.push('Low quality score');
  }
  if (supplier.delivery_reliability < 90) {
    riskScore += 25;
    reasons.push('Unreliable delivery history');
  }
  if (complaints.length > 0) {
    riskScore += 15 * complaints.length;
    reasons.push(`${complaints.length} customer complaints open`);
  }
  riskScore = Math.min(riskScore, 100);

  return {
    risk_score: riskScore,
    explanation: reasons.length > 0 
      ? `Risk evaluation triggered: ${reasons.join(', ')}.` 
      : 'Supplier demonstrates stable quality metrics and high delivery reliability.'
  };
}

/**
 * Screen Purchase Orders for Anomaly Detection.
 */
export async function runPOAnomalyAI(item, qty, supplier, cost) {
  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Screen purchase order proposal.
Item: ${JSON.stringify(item)}
Proposed Quantity: ${qty}
Supplier: ${JSON.stringify(supplier)}
Proposed Cost: ${cost}
Evaluate if this matches historical averages. Output JSON:
{
  "is_anomaly": boolean,
  "confidence_score": number (0 to 1),
  "explanation": "concise rationale regarding pricing, lead times, or volume anomalies"
}`;
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.response.text());
    } catch (err) {
      console.warn('Gemini API call failed, falling back to simulator:', err.message);
    }
  }

  // Fallback simulation
  const isQtyAnomaly = qty > (item.safety_stock * 3);
  const expectedCost = item.unit_cost * qty;
  const isCostAnomaly = cost > (expectedCost * 1.5) || cost < (expectedCost * 0.5);

  let explanation = 'Order parameters (volume, pricing structure) are consistent with historical patterns.';
  if (isQtyAnomaly && isCostAnomaly) {
    explanation = 'Anomaly detected: Order volume is unusually high (exceeds triple the safety stock level) and the total cost deviates substantially from baseline pricing.';
  } else if (isQtyAnomaly) {
    explanation = 'Anomaly flagged: Order volume exceeds triple the safety stock level.';
  } else if (isCostAnomaly) {
    explanation = `Anomaly flagged: Unit cost deviates significantly from normal contract baseline of $${item.unit_cost}/unit.`;
  }

  return {
    is_anomaly: isQtyAnomaly || isCostAnomaly,
    confidence_score: 0.88,
    explanation
  };
}
