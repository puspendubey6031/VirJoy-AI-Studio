import { GoogleGenAI, Type } from '@google/genai';
import type { ProductMetadata } from '../types.js';

export async function extractProductFromUrl(url: string, apiKey?: string): Promise<ProductMetadata> {
  // If API key is provided, use Gemini to intelligently parse product details from URL pattern or mock page
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `Analyze this product URL: "${url}". 
Extract realistic, high-quality product details suitable for an AI video ad.
Return a JSON object with:
- title: clear, concise product title
- vendor: brand or store name
- price: e.g. "₹1,499" or "$19.99"
- rating: e.g. "4.8 ★ (1,200+ reviews)"
- features: array of 3 to 4 compelling selling points or features
- description: a catchy 1-2 sentence tagline for video advertising`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              vendor: { type: Type.STRING },
              price: { type: Type.STRING },
              rating: { type: Type.STRING },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: { type: Type.STRING }
            },
            required: ['title', 'vendor', 'price', 'features', 'description']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          title: parsed.title || 'Featured Commercial Product',
          vendor: parsed.vendor || 'Amazon Store',
          price: parsed.price || '₹1,299',
          rating: parsed.rating || '4.8 ★',
          features: parsed.features || ['High Quality Material', 'Fast Delivery', 'Top-Rated Performance'],
          description: parsed.description || 'Premium product designed for modern convenience.'
        };
      }
    } catch (err) {
      console.warn('Gemini product extraction fallback:', err);
    }
  }

  // Fallback pattern parser for product URLs
  const isAmazon = url.toLowerCase().includes('amazon');
  const pathParts = url.split('/').filter(Boolean);
  const potentialName = pathParts.find(p => p.length > 5 && !p.includes('.') && !p.includes('dp')) || 'Smart Product';
  const cleanName = potentialName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: isAmazon ? `${cleanName} (Amazon Choice)` : cleanName,
    vendor: isAmazon ? 'Amazon Store' : 'E-Commerce Store',
    price: '₹1,499',
    rating: '4.7 ★ (850+ ratings)',
    features: [
      'Ergonomic, modern design',
      'Ultra-durable build with premium finish',
      'Instant 1-click order & fast delivery',
      '100% Satisfaction Guaranteed'
    ],
    description: `Experience the power of ${cleanName}. Designed to elevate your daily routine.`
  };
}
