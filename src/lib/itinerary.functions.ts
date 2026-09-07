import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type Destination = {
  id: string;
  name: string;
  region: string;
  description: string;
  tags: string[];
  difficulty: string;
  best_months: string[];
  latitude: number | null;
  longitude: number | null;
};

export type Stop = {
  name: string;
  time: "Morning" | "Afternoon" | "Evening";
  why: string;
  difficulty: "easy" | "moderate" | "hard";
};

export type ItineraryDay = {
  day: number;
  region: string;
  stops: Stop[];
};

export type Itinerary = {
  difficulty: "easy" | "moderate" | "hard";
  season_warning: string | null;
  days: ItineraryDay[];
};

const planInput = z.object({
  region: z.enum(["Hunza", "Skardu", "Naran/Kaghan", "Swat", "Mix of Everything"]),
  days: z.number().int().min(3).max(14),
  interests: z.array(z.string()).min(1),
  month: z.enum(MONTHS),
});

const dayInput = planInput.extend({ day: z.number().int().min(1) });

const REGION_MAP: Record<string, string[]> = {
  Hunza: ["Hunza"],
  Skardu: ["Skardu", "Deosai"],
  "Naran/Kaghan": ["Naran/Kaghan"],
  Swat: ["Swat"],
};

function getSupabase() {
  return createClient(
    process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"]!,
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function fetchDestinations(region: string, interests: string[]) {
  const supabase = getSupabase();
  let query = supabase.from("destinations").select("*");
  const regions = REGION_MAP[region];
  if (regions) query = query.in("region", regions);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const all = (data ?? []) as Destination[];
  const matched = all.filter((d) => d.tags.some((t) => interests.includes(t)));
  return matched.length > 0 ? matched : all;
}

const SYSTEM_PROMPT =
  "You are a Northern Pakistan travel planner. You will be given a list of real destinations (with region, tags, difficulty, and best months) and a trip length in days. Organize a logical day-by-day itinerary using ONLY the destinations provided — do not invent new places. Group 2-3 nearby stops per day. Write a short 'why' for each stop. If a destination's best_months do not include the user's travel month, still include it if needed but note the seasonal mismatch. Return ONLY valid JSON matching this schema, no other text.";

const SCHEMA_TEXT = `{
  "difficulty": "easy | moderate | hard",
  "season_warning": "string or null",
  "days": [
    { "day": 1, "region": "string", "stops": [ { "name": "string", "time": "Morning | Afternoon | Evening", "why": "string", "difficulty": "easy | moderate | hard" } ] }
  ]
}`;

async function callAI(userPrompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nSchema:\n${SCHEMA_TEXT}` },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("The planner returned an empty response.");
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

function describeDestinations(list: Destination[]) {
  return list
    .map(
      (d) =>
        `- ${d.name} | region: ${d.region} | tags: ${d.tags.join(", ")} | difficulty: ${d.difficulty} | best months: ${d.best_months.join(", ")} | ${d.description}`,
    )
    .join("\n");
}

export const generateItinerary = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => planInput.parse(data))
  .handler(async ({ data }): Promise<Itinerary> => {
    const destinations = await fetchDestinations(data.region, data.interests);
    const prompt = `Trip length: ${data.days} days
Travel month: ${data.month}
Selected region: ${data.region}
Traveller interests: ${data.interests.join(", ")}

Available destinations:
${describeDestinations(destinations)}

Create a ${data.days}-day itinerary. Every day must have 2-3 stops. Destinations may repeat across days only if unavoidable.`;

    const result = (await callAI(prompt)) as Itinerary;
    return result;
  });

export const regenerateDay = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => dayInput.parse(data))
  .handler(async ({ data }): Promise<ItineraryDay> => {
    const destinations = await fetchDestinations(data.region, data.interests);
    const prompt = `Travel month: ${data.month}
Traveller interests: ${data.interests.join(", ")}

Available destinations:
${describeDestinations(destinations)}

Plan ONLY day ${data.day} of a ${data.days}-day trip, with 2-3 stops. Return the same JSON schema but with a "days" array containing exactly one entry whose "day" is ${data.day}.`;

    const result = (await callAI(prompt)) as Itinerary;
    const day = result.days?.[0];
    if (!day) throw new Error("The planner could not rebuild that day.");
    return { ...day, day: data.day };
  });

export const MONTH_LIST = MONTHS;
