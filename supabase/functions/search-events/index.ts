import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const SearchEventsSchema = z.object({
  spotName: z.string().trim().min(1).max(200).optional(),
  spotCategory: z.string().trim().min(1).max(100).optional(),
  timeframe: z.enum(["today", "week", "month"]),
  city: z.string().trim().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMiles: z.number().min(1).max(100).optional(),
  mode: z.enum(["spot", "discover"]).optional(), // "spot" = old behavior, "discover" = broad local events
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Event {
  name: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  sourceUrl?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parsed = SearchEventsSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ events: [], error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { spotName, spotCategory, timeframe, city = 'Richmond, VA', latitude, longitude, radiusMiles = 25, mode = spotName ? 'spot' : 'discover' } = parsed.data;

    console.log(`Event search mode=${mode}, timeframe=${timeframe}, city=${city}, radius=${radiusMiles}mi`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentDay = now.getDate();
    const currentDateStr = `${currentMonth} ${currentDay}, ${currentYear}`;
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });

    let timeDescription = '';
    switch (timeframe) {
      case 'today':
        timeDescription = `happening today (${dayOfWeek}, ${currentDateStr})`;
        break;
      case 'week':
        timeDescription = `happening this week (starting ${currentDateStr})`;
        break;
      case 'month':
        timeDescription = `happening this month (${currentMonth} ${currentYear})`;
        break;
    }

    const locationContext = latitude && longitude
      ? `within ${radiusMiles} miles of coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (near ${city})`
      : `in or near ${city}`;

    let searchQuery: string;

    if (mode === 'spot' && spotName) {
      // Legacy spot-specific mode
      searchQuery = `Find events ${timeDescription} related to "${spotName}" (${spotCategory || 'general'}) ${locationContext}. List up to 5 events.`;
    } else {
      // Discovery mode — broad local events
      searchQuery = `Find ALL types of local events ${timeDescription} ${locationContext}.

Search comprehensively across ALL these categories:
1. **Arts & Culture**: Paint & sip nights, pottery classes, art walks, gallery openings, museum exhibits, craft workshops
2. **Music & Nightlife**: Live music, concerts, DJ sets, open mic nights, karaoke, jazz nights
3. **Food & Drink**: Food truck rallies, wine tastings, brewery events, cooking classes, supper clubs, farmers markets
4. **Community & Social**: Book clubs, meetup groups, networking events, community cleanups, volunteer events, swap meets
5. **Sports & Fitness**: Yoga in the park, run clubs, pickup games, boxing classes, dance fitness, cycling groups
6. **Comedy & Theater**: Stand-up shows, improv nights, theater performances, spoken word, poetry slams
7. **Family & Kids**: Story time, family festivals, kids workshops, outdoor movie nights
8. **Wellness & Spiritual**: Sound baths, meditation circles, breathwork sessions, wellness workshops
9. **Markets & Shopping**: Pop-up shops, artisan markets, vintage fairs, craft fairs
10. **Festivals & Special Events**: Seasonal festivals, block parties, parades, charity galas, fundraisers

Include events from sources like:
- Eventbrite, Meetup.com, Facebook Events
- Ticketmaster, StubHub
- Local venue websites and calendars
- Community boards and local newspapers

Return at least 10-15 events if possible, up to 20.`;
    }

    const fullPrompt = `${searchQuery}

Format your response as a JSON array with this structure:
[
  {
    "name": "Event Name",
    "date": "Date (e.g. February 16, 2026)",
    "time": "Time (e.g. 7:00 PM)",
    "venue": "Real Venue Name",
    "description": "Brief 1-2 sentence description",
    "type": "music|sports|festival|comedy|food|art|community|wellness|family|market|other",
    "category": "Subcategory (e.g. Paint & Sip, Book Club, Live Music, Yoga, etc.)",
    "latitude": approximate_latitude_number,
    "longitude": approximate_longitude_number,
    "address": "Full street address",
    "sourceUrl": "URL to event page, venue site, or ticket link"
  }
]

CRITICAL RULES:
- Use REAL business names, REAL venue names, REAL event types that actually exist in ${city}.
- Include approximate GPS coordinates using real venue locations.
- All dates must be ${currentYear} or later.
- Include a sourceUrl for each event (event page, venue website, or Google search URL).
- Prioritize variety — mix different categories, don't just list concerts.
- Include small community events like book clubs and paint nights, not just big headliners.

Return ONLY the JSON array.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ events: [], error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a local events expert for ${city}. Today is ${dayOfWeek}, ${currentDateStr}. The current year is ${currentYear}.

You know the real venues, businesses, and community spaces in this city. You return realistic, plausible events that match the types of events these venues actually host.

CRITICAL:
- Only return events from ${currentYear} onwards
- Use REAL venue names that exist in ${city}
- Include a diverse mix of event types — from big concerts to small book clubs
- Always respond with valid JSON arrays only
- If you know of actual scheduled events, include those. Otherwise, create realistic events based on what these venues typically host.`,
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      return new Response(
        JSON.stringify({ events: [], error: 'Failed to search events' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('AI Response length:', content.length);

    let events: Event[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
        events = events.map(e => ({
          ...e,
          sourceUrl: e.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent((e.name || '') + ' ' + (e.venue || '') + ' ' + city + ' event')}`,
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse events:', parseError);
      events = [];
    }

    return new Response(
      JSON.stringify({ events, timeframe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error searching events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ events: [], error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
