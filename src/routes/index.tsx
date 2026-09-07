import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import heroImage from "@/assets/hero-mountains.jpg";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northern Pakistan Trip Planner — AI Itineraries for Hunza & Skardu" },
      {
        name: "description",
        content:
          "Build a day-by-day Northern Pakistan itinerary for Hunza, Skardu, Naran, Swat, Fairy Meadows and Deosai, matched to your interests and travel month.",
      },
      { property: "og:title", content: "Northern Pakistan Trip Planner" },
      {
        property: "og:description",
        content:
          "AI-built day-by-day itineraries through Hunza, Skardu, Naran, Swat, Fairy Meadows and Deosai.",
      },
    ],
  }),
  component: Index,
});

const REGIONS = ["Hunza", "Skardu", "Naran/Kaghan", "Swat", "Mix of Everything"] as const;

const INTERESTS = [
  { label: "Nature & Scenery", value: "nature" },
  { label: "Adventure & Trekking", value: "adventure" },
  { label: "History & Forts", value: "history" },
  { label: "Photography", value: "photography" },
  { label: "Relaxation", value: "relaxation" },
] as const;

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

function Index() {
  const navigate = useNavigate();
  const [region, setRegion] = useState<string>("Hunza");
  const [days, setDays] = useState(6);
  const [interests, setInterests] = useState<string[]>(["nature", "photography"]);
  const [month, setMonth] = useState<string>("June");

  const toggleInterest = (value: string) =>
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );

  const submit = () => {
    navigate({
      to: "/itinerary",
      search: { region, days, interests: interests.join(","), month },
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate">
        <img
          src={heroImage}
          alt="Golden-hour view over snow-capped Karakoram peaks and a river valley in Northern Pakistan"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Hunza · Skardu · Naran · Swat · Deosai
          </p>
          <h1 className="mt-5 text-4xl leading-tight font-semibold text-accent sm:text-6xl">
            Northern Pakistan Trip Planner
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-accent/90">
            Tell us where you're headed, how long you have, and what you love. We'll shape a
            day-by-day route through the mountains — built only from real places.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-14 max-w-2xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-lifted sm:p-9">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Where to?</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold text-foreground">Trip length</label>
                <span className="font-display text-2xl text-primary">{days} days</span>
              </div>
              <Slider
                value={[days]}
                min={3}
                max={14}
                step={1}
                onValueChange={(v) => setDays(v[0] ?? 3)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3</span>
                <span>14</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">What do you enjoy?</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const active = interests.includes(i.value);
                  return (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => toggleInterest(i.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Month of travel</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              onClick={submit}
              disabled={interests.length === 0}
              className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-soft"
            >
              Generate My Itinerary
            </Button>
            {interests.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Pick at least one interest to continue.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
