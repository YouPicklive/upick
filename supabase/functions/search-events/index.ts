import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { spotName, spotCategory, timeframe, city = 'your area' }: EventSearchRequest = await req.json();

    console.log(`Searching for events: ${spotName} (${spotCategory}) - ${timeframe} in ${city}`);

    // Determine if this is an event-worthy category
    const eventCategories = ['nightlife', 'bar', 'activity', 'wellness', 'cafe'];
    const isEventCategory = eventCategories.includes(spotCategory);

    // Build the search prompt based on category and timeframe
    let timeDescription = '';
    switch (timeframe) {
      case 'today':
        timeDescription = 'happening today';
        break;
      case 'week':
        timeDescription = 'happening this week';
        break;
      case 'month':
        timeDescription = 'happening this month';
        break;
    }

    let searchQuery = '';
    
    // Check venue type for targeted searches
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
      // Still search for general events even if not a specific event category
      searchQuery = `Find popular local events ${timeDescription} in ${city}. Include concerts, sports, art shows, festivals, and community events.`;
    }

    // Add comprehensive local events search
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
    "venue": "Venue Name",
    "description": "Brief description",
    "type": "music|sports|festival|comedy|food|art|other"
  }
]

Return only the JSON array, no other text.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ events: [], error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway
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
            content: 'You are a helpful assistant that finds local events. Always respond with valid JSON arrays only. If you cannot find specific events, provide realistic example events for the requested timeframe and location.',
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

    // Parse the JSON response
    let events: Event[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
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