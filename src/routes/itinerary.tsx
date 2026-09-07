import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import {
  generateItinerary,
  regenerateDay,
  type Itinerary,
  type ItineraryDay,
} from "@/lib/itinerary.functions";

type Search = {
  region: string;
  days: number;
  interests: string;
  month: string;
};

export const Route = createFileRoute("/itinerary")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    region: typeof search.region === "string" ? search.region : "Hunza",
    days: Math.min(14, Math.max(3, Number(search.days) || 6)),
    interests: typeof search.interests === "string" ? search.interests : "nature",
    month: typeof search.month === "string" ? search.month : "June",
  }),
  head: () => ({
    meta: [
      { title: "Your Northern Pakistan Itinerary — Day-by-Day Plan" },
      {
        name: "description",
        content:
          "Your personalised day-by-day Northern Pakistan route with stops, timings, difficulty ratings and seasonal warnings.",
      },
      { property: "og:title", content: "Your Northern Pakistan Itinerary" },
      {
        property: "og:description",
        content: "A day-by-day mountain route with stops, timings and difficulty ratings.",
      },
    ],
  }),
  component: ItineraryPage;
});

function ItineraryPage() {
  const search = Route.useSearch();
  const generate = useServerFn(generateItinerary);
  const rebuildDay = useServerFn(regenerateDay);

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyDay, setBusyDay] = useState<number | null>(null);

  const interests = search.interests.split(",").filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    generate({
      data: {
        region: search.region as never,
        days: search.days,
        interests,
        month: search.month as never,
      },
    })
      .then((result) => {
        if (!cancelled) setItinerary(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.region, search.days, search.interests, search.month]);

  const onRegenerate = async (day: ItineraryDay) => {
    setBusyDay(day.day);
    try {
      const fresh = await rebuildDay({
        data: {
          region: search.region as never,
          days: search.days,
          interests,
          month: search.month as never,
          day: day.day,
        },
      });
      setItinerary((prev) =>
        prev ? { ...prev, days: prev.days.map((d) => (d.day === day.day ? fresh : d)) } : prev,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyDay(null);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/70 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
            ← Plan another trip
          </Link>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-full"
            disabled={!itinerary}
          >
            Print / Share
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pt-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">Your {search.days}-day route</h1>
        <p className="mt-2 text-muted-foreground">
          {search.region} · travelling in {search.month} ·{" "}
          {interests.length} interest{interests.length === 1 ? "" : "s"}
        </p>

        {loading && (
          <div className="mt-10 space-y-4">
            <p className="font-display text-xl text-primary">Shaping your mountain route…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="font-semibold text-foreground">We couldn't build that itinerary.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {itinerary && !loading && (
          <>
            <section className="mt-8 rounded-3xl border border-border bg-card p-7 shadow-lifted">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total days
                  </p>
                  <p className="font-display mt-1 text-3xl">{itinerary.days.length}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Overall difficulty
                  </p>
                  <div className="mt-2">
                    <DifficultyBadge level={itinerary.difficulty} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Regions covered
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {[...new Set(itinerary.days.map((d) => d.region))].join(", ")}
                  </p>
                </div>
              </div>

              {itinerary.season_warning && (
                <div className="mt-6 rounded-2xl border border-moderate/40 bg-moderate/15 p-4">
                  <p className="text-sm font-semibold text-foreground">Seasonal note</p>
                  <p className="mt-1 text-sm text-foreground/80">{itinerary.season_warning}</p>
                </div>
              )}
            </section>

            <div className="mt-8 space-y-5">
              {itinerary.days.map((day) => (
                <article
                  key={day.day}
                  className="rounded-3xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold">Day {day.day}</h2>
                      <p className="text-sm text-muted-foreground">{day.region}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRegenerate(day)}
                      disabled={busyDay !== null}
                      className="rounded-full text-primary print:hidden"
                    >
                      {busyDay === day.day ? "Rebuilding…" : "Regenerate this day"}
                    </Button>
                  </div>

                  <ul className="mt-5 space-y-4">
                    {day.stops?.map((stop, idx) => (
                      <li
                        key={`${stop.name}-${idx}`}
                        className="rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                            {stop.time}
                          </span>
                          <h3 className="text-lg font-semibold">{stop.name}</h3>
                          <DifficultyBadge level={stop.difficulty} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{stop.why}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
