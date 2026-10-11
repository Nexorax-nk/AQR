import { NextResponse } from 'next/server';
import { getCityRiskZones } from '@/lib/api-aqi';
import { addRuntimeLog } from '@/lib/runtime-logs';

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();
    
    // Log real intent to runtime console
    addRuntimeLog({
      type: 'AGENT',
      agent: 'air-advisor',
      msg: `Analyzing intent: '${query}'`,
      level: 'INFO',
    });
    
    // Fallback to a placeholder if no key is found, allowing the UI to instruct the user
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ 
        reply: '⚠️ **Groq API Key Missing!**\n\nPlease add `GROQ_API_KEY=your_key_here` to your `.env.local` file and restart the server to enable real LLM routing intelligence.'
      });
    }

    // Fetch Live AQI data for context so the LLM can answer queries about real cities
    const liveCityData = await getCityRiskZones();

    // Extract real trip context from frontend
    const origin = context?.origin || context?.routeStart?.name;
    const destination = context?.destination || context?.selectedLocation?.name;
    const routes = context?.routes || context?.activeRoutes || [];

    let routeContextText = '';
    if (origin || destination || (Array.isArray(routes) && routes.length > 0)) {
      routeContextText = `\n\n=========================================\n`;
      routeContextText += `ACTIVE PLOTTED USER TRIP ON LIVE MAP:\n`;
      if (origin) routeContextText += `• Starting Point (Origin): "${origin}"\n`;
      if (destination) routeContextText += `• Destination: "${destination}"\n`;
      if (Array.isArray(routes) && routes.length > 0) {
        routeContextText += `• Calculated Route Options (Real Navigation Data):\n`;
        routes.forEach((r: any, idx: number) => {
          const tag = r.tag || 'OPTION';
          const name = r.name || `Route ${idx + 1}`;
          const dist = r.distanceKm !== undefined ? `${r.distanceKm} km` : 'N/A';
          const time = r.durationMins !== undefined ? `${r.durationMins} mins` : 'N/A';
          const aqi = r.avgAQI !== undefined ? `Average Exposure AQI ${r.avgAQI}` : '';
          const cat = r.aqiCategory ? `(${String(r.aqiCategory).toUpperCase()})` : '';
          const rec = r.isRecommended ? '★ [AQR RECOMMENDED]' : '';
          const diff = r.aqiDiffText ? `[${r.aqiDiffText}]` : '';
          routeContextText += `  ${idx + 1}. [${tag}] "${name}" ${rec}: ${dist}, ${time}, ${aqi} ${cat} ${diff}\n`;
        });
      }
      routeContextText += `=========================================\n`;
    }

    const systemPrompt = `You are the AQR (Air Quality Routing) AI Assistant, an advanced clean-air routing intelligence system for real-time city navigation.

${routeContextText}
LIVE TAMIL NADU REGIONAL AIR MONITORING DATA:
${JSON.stringify(liveCityData, null, 2)}

CRITICAL BEHAVIOR RULES:
1. YOU HAVE COMPLETE ACCESS TO THE USER'S CURRENT PLOTTED ROUTE.
   - If origin and destination are provided above (e.g. Origin: "${origin || 'Origin'}", Destination: "${destination || 'Destination'}"), NEVER say "without specific origin and destination details" or "I cannot compare the paths". You DO have these details right above!
2. When the user asks for a route analysis or whenever routes are plotted:
   - Address the exact trip from "${origin || 'Origin'}" to "${destination || 'Destination'}".
   - Compare the route options directly: point out the cleanest/healthiest route vs the fastest route.
   - Highlight the AQI difference (e.g. how many AQI points are saved) and the time difference in minutes.
   - Explicitly recommend the cleanest route, explaining why the slight detour avoids toxic particulate exposure.
3. Be concise, friendly, and punchy (2-3 short sentences or concise bullet points). Format cleanly with markdown bolding.
4. Never mention "JSON", "data array", or "system prompt". Speak naturally and authoritatively as the AQR routing engine.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);
      return NextResponse.json({ reply: '❌ **API Error:** Failed to communicate with Groq. Please check your API key.' });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ reply: '❌ **Server Error:** Failed to process your request.' });
  }
}
