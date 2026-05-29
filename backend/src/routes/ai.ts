import express, { Response } from 'express';
import OpenAI from 'openai';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Lazy-initialize OpenAI so a missing key doesn't crash the server on startup
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('AI features are not configured. Please set OPENAI_API_KEY.');
  }
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// AI Document Writer - Generate professional description
router.post('/write-description', [
  body('prompt').notEmpty().trim(),
  body('type').optional().isIn(['quotation', 'invoice', 'email'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, type = 'quotation' } = req.body;

    const systemPrompt = type === 'email' 
      ? 'You are a professional business communication assistant. Write clear, friendly, and professional email messages for business documents.'
      : 'You are a professional business document writer. Write clear, concise, and professional descriptions for business quotations and invoices.';

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const generatedText = completion.choices[0].message.content;

    res.json({ text: generatedText });
  } catch (error: any) {
    console.error('AI write error:', error);
    res.status(500).json({ error: error.message || 'AI service error' });
  }
});

// AI Price Estimator
router.post('/estimate-price', [
  body('itemName').notEmpty(),
  body('cost').optional().isNumeric(),
  body('industry').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemName, cost, industry } = req.body;

    // Get historical pricing data
    const historyResult = await pool.query(
      `SELECT AVG(unit_price) as avg_price, MIN(unit_price) as min_price, MAX(unit_price) as max_price
       FROM document_items di
       JOIN documents d ON di.document_id = d.id
       WHERE d.company_id = $1 AND LOWER(di.name) LIKE LOWER($2)
       LIMIT 100`,
      [req.companyId, `%${itemName}%`]
    );

    const history = historyResult.rows[0];
    
    // Use AI to suggest price
    const prompt = `Based on the following information, suggest a competitive selling price:
- Item/Service: ${itemName}
- Cost: ${cost ? `$${cost}` : 'Not provided'}
- Industry: ${industry || 'General'}
${history?.avg_price ? `- Historical average price: $${parseFloat(history.avg_price).toFixed(2)}` : ''}

Provide a suggested selling price with a brief explanation.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a pricing expert. Provide competitive pricing suggestions based on market data and cost analysis.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.5
    });

    const aiSuggestion = completion.choices[0].message.content;

    // Calculate suggested price (simple markup if cost provided)
    let suggestedPrice = null;
    if (cost) {
      // 30% markup as default, or use historical average if available
      suggestedPrice = history?.avg_price 
        ? parseFloat(history.avg_price) 
        : parseFloat(cost) * 1.3;
    } else if (history?.avg_price) {
      suggestedPrice = parseFloat(history.avg_price);
    }

    res.json({
      suggestedPrice,
      aiExplanation: aiSuggestion,
      historicalData: history ? {
        average: parseFloat(history.avg_price),
        min: parseFloat(history.min_price),
        max: parseFloat(history.max_price)
      } : null
    });
  } catch (error: any) {
    console.error('AI price estimate error:', error);
    res.status(500).json({ error: error.message || 'AI service error' });
  }
});

// AI Auto-Fill - Extract items from uploaded document/text
router.post('/auto-fill', [
  body('text').notEmpty()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;

    const prompt = `Extract items from the following purchase request or document. Return a JSON array of items with: name, description (optional), quantity, and unit_price (if mentioned). If price is not mentioned, set it to null.

Text:
${text}

Return only valid JSON array, no other text.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a data extraction assistant. Extract structured data from business documents and return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('AI returned empty response');
    }
    
    let items;
    
    try {
      const parsed = JSON.parse(response);
      items = parsed.items || parsed;
      if (!Array.isArray(items)) {
        items = [items];
      }
    } catch (e) {
      // Fallback: try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    res.json({ items });
  } catch (error: any) {
    console.error('AI auto-fill error:', error);
    res.status(500).json({ error: error.message || 'AI service error' });
  }
});

// AI Smart Insights
router.get('/insights', async (req: AuthRequest, res: Response) => {
  try {
    // Get client acceptance rates
    const acceptanceResult = await pool.query(
      `SELECT 
        c.id,
        c.name,
        COUNT(d.id) as total_quotes,
        COUNT(CASE WHEN d.status = 'accepted' THEN 1 END) as accepted,
        AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at))/86400) as avg_response_days
       FROM clients c
       LEFT JOIN documents d ON d.client_id = c.id AND d.type = 'quotation'
       WHERE c.company_id = $1
       GROUP BY c.id, c.name
       HAVING COUNT(d.id) > 0
       ORDER BY (COUNT(CASE WHEN d.status = 'accepted' THEN 1 END)::float / NULLIF(COUNT(d.id), 0)) DESC
       LIMIT 10`,
      [req.companyId]
    );

    // Get win percentage
    const winRateResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid
       FROM documents
       WHERE company_id = $1 AND type = 'quotation'`,
      [req.companyId]
    );

    const winRate = winRateResult.rows[0];
    const winPercentage = winRate.total > 0 
      ? ((winRate.accepted / winRate.total) * 100).toFixed(1)
      : '0';

    // Get best follow-up times (analyze when clients respond)
    const followUpResult = await pool.query(
      `SELECT 
        EXTRACT(HOUR FROM updated_at) as hour,
        COUNT(*) as responses
       FROM documents
       WHERE company_id = $1 AND status IN ('accepted', 'paid')
       GROUP BY EXTRACT(HOUR FROM updated_at)
       ORDER BY responses DESC
       LIMIT 5`,
      [req.companyId]
    );

    // Use AI to generate recommendations
    let aiRecommendations = null;
    if (acceptanceResult.rows.length > 0) {
      const topClient = acceptanceResult.rows[0];
      const prompt = `Based on this business data, provide 3 actionable recommendations:
- Total quotations: ${winRate.total}
- Win rate: ${winPercentage}%
- Top client: ${topClient.name} (${topClient.accepted}/${topClient.total_quotes} accepted)
- Average response time: ${parseFloat(topClient.avg_response_days || 0).toFixed(1)} days

Provide brief, actionable recommendations.`;

      try {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a business analytics advisor. Provide concise, actionable recommendations.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        });
        aiRecommendations = completion.choices[0].message.content;
      } catch (e) {
        console.error('AI recommendations error:', e);
      }
    }

    res.json({
      topClients: acceptanceResult.rows.map((row: any) => ({
        clientId: row.id,
        clientName: row.name,
        totalQuotes: parseInt(row.total_quotes),
        accepted: parseInt(row.accepted),
        acceptanceRate: ((row.accepted / row.total_quotes) * 100).toFixed(1),
        avgResponseDays: parseFloat(row.avg_response_days || 0).toFixed(1)
      })),
      winPercentage: parseFloat(winPercentage.toString()),
      bestFollowUpTimes: followUpResult.rows.map((row: any) => ({
        hour: parseInt(row.hour),
        responses: parseInt(row.responses)
      })),
      aiRecommendations
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

