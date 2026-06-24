import { createFileRoute, Link } from "@tanstack/react-router";
import { LEVELS } from "@/lib/puzzle-levels";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/GameHeader";
import { Puzzle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/play/")({
  head: () => ({ meta: [{ title: "Choose a level · Piecewise" }] }),
  component: PlayIndex,
});

function PlayIndex() {
  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Choose your puzzle</h1>
          <p className="mt-2 text-muted-foreground">
            Difficulty climbs with each level — more pieces, more orientations to untangle.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => (
            <Link
              key={lvl.level}
              to="/play/$level"
              params={{ level: String(lvl.level) }}
              className="group block overflow-hidden rounded-2xl bg-gradient-card shadow-card ring-1 ring-border transition hover:ring-primary"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={lvl.image}
                  alt={lvl.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
                  Level {lvl.level}
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {lvl.grid}×{lvl.grid}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{lvl.name}</h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{lvl.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between rounded-2xl bg-gradient-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">See how you stack up</p>
              <p className="text-sm text-muted-foreground">Real players, real scores.</p>
            </div>
          </div>
          <Link to="/leaderboard"><Button variant="outline">Leaderboard</Button></Link>
        </div>
      </main>
    </div>
  );
}
