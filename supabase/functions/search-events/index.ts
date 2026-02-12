import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const SearchEventsSchema = z.object({
  spotName: z.string().trim().min(1).max(200),
  spotCategory: z.string().trim().min(1).max(100),
  timeframe: z.enum(["today", "week", "month"]),
  city: z.string().trim().max(200).optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EventSearchRequest {
  spotName: string;
  spotCategory: string;
  timeframe: 'today' | 'week' | 'month';
  city?: string;
}

interface Event {
  name: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  type?: 'music' | 'sports' | 'festival' | 'comedy' | 'food' | 'art' | 'other';
  latitude?: number;
  longitude?: number;
  address?: string;
  sourceUrl?: string;
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

    const { spotName, spotCategory, timeframe, city = 'your area' } = parsed.data;

    console.log(`Searching for events: ${spotName} (${spotCategory}) - ${timeframe} in ${city}`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentDay = now.getDate();
    const currentDateStr = `${currentMonth} ${currentDay}, ${currentYear}`;

    const eventCategories = ['nightlife', 'bar', 'activity', 'wellness', 'cafe'];
    const isEventCategory = eventCategories.includes(spotCategory);

    let timeDescription = '';
    switch (timeframe) {
      case 'today':
        timeDescription = `happening today (${currentDateStr})`;
        break;
      case 'week':
        timeDescription = `happening this week (starting ${currentDateStr})`;
        break;
      case 'month':
        timeDescription = `happening this month (${currentMonth} ${currentYear})`;
        break;
    }

    let searchQuery = '';
    
    const isMusicVenue = spotName.toLowerCase().includes('club') || 
                         spotName.toLowerCase().includes('lounge') || 
                         spotName.toLowerCase().includes('venue') ||
                         spotCategory === 'nightlife';
    
    const isSportsVenue = spotName.toLowerCase().includes('stadium') || 
                          spotName.toLowerCase().includes('arena') || 
                          spotName.toLowerCase().includes('field') ||
                          spotName.toLowerCase().includes('court');

    const isArtVenue = spotName.toLowerCase().includes('gallery') || 
                       spotName.toLowerCase().includes('museum') || 
                       spotName.toLowerCase().includes('art') ||
                       spotName.toLowerCase().includes('studio');

    if (isMusicVenue) {
      searchQuery = `Find live music events, concerts, or DJ performances ${timeDescription} at music venues or clubs in ${city}. List up to 3 events with the event name, date, time, and venue. If no specific events found, suggest general music nights.`;
    } else if (isSportsVenue) {
      searchQuery = `Find upcoming sporting events ${timeDescription} in ${city}. Include professional and local sports games, matches, or tournaments. List up to 3 events with team names, sport type, date, time, and venue.`;
    } else if (isArtVenue) {
      searchQuery = `Find art exhibitions, gallery openings, and art shows ${timeDescription} in ${city}. List up to 3 events with exhibition name, artist (if applicable), date, time, and venue.`;
    } else if (isEventCategory) {
      searchQuery = `Find fun events or activities ${timeDescription} related to ${spotCategory} in ${city}. List up to 3 events with name, date, time, and location.`;
    } else {
      searchQuery = `Find popular local events ${timeDescription} in ${city}. Include concerts, sports, art shows, festivals, and community events.`;
    }

    const generalSearchQuery = `${searchQuery}

Also include any notable local events ${timeDescription}:
- Concerts and live music performances
- Sporting events (NBA, NFL, MLB, NHL, college sports, local leagues)
- Art gallery openings and exhibitions
- Art festivals and cultural events
- Museum special exhibits
- Festivals or special community events
- Comedy shows and theater performances
- Food and drink events

Format your response as a JSON array with this structure:
[
  {
    "name": "Event Name",
    "date": "Date",
    "time": "Time (if known)",
    "venue": "Real Venue Name",
    "description": "Brief description",
    "type": "music|sports|festival|comedy|food|art|other",
    "latitude": approximate_latitude_number,
    "longitude": approximate_longitude_number,
    "address": "Full address if known",
    "sourceUrl": "URL to the event page, venue website, or ticketing page (e.g. eventbrite, ticketmaster, venue site)"
  }
]

IMPORTANT:
- Include approximate GPS coordinates (latitude and longitude) for each venue if possible. Use real venue locations.
- Use REAL business names, real venue names, real event titles — no placeholders.
- Include a sourceUrl for each event: the event listing page, venue website, or ticket purchase link. If unknown, use a Google search URL for the event.
- All dates must be ${currentYear} or later.

Return only the JSON array, no other text.`;

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
            content: `You are a helpful assistant that finds local events. Today's date is ${currentDateStr}. The current year is ${currentYear}. 

CRITICAL REQUIREMENTS:
- Only return FUTURE events from ${currentYear} onwards
- All dates must be in ${currentYear} or later
- Never return past events or events from previous years
- Use REAL event names, REAL venue names, REAL business names — never use placeholder or generic text
- If you cannot find specific future events, create realistic upcoming events for the requested timeframe
- Always include a sourceUrl — use the event listing page, venue website, or a Google search URL

Always respond with valid JSON arrays only.`,
          },
          {
            role: 'user',
            content: generalSearchQuery,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
    
    console.log('AI Response:', content);

    let events: Event[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
        // Ensure sourceUrl fallback
        events = events.map(e => ({
          ...e,
          sourceUrl: e.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent((e.name || '') + ' ' + (e.venue || '') + ' event')}`,
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
