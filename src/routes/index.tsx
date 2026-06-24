import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Brain, Timer, Puzzle, Sparkles, RotateCw } from "lucide-react";
import hero from "@/assets/puzzles/level-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Piecewise — A Thinking Puzzle Game" },
      { name: "description", content: "Drag, rotate, and solve image puzzles across rising difficulty. The faster you finish, the higher your score on the global leaderboard." },
      { property: "og:title", content: "Piecewise — A Thinking Puzzle Game" },
      { property: "og:description", content: "Drag, rotate, and solve image puzzles. The faster you think, the higher you climb." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <Puzzle className="h-6 w-6 text-primary" />
          <span className="text-gradient">Piecewise</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm">Leaderboard</Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              A puzzle game for thinkers
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
              Drag. Rotate. <span className="text-gradient">Solve.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Piecewise breaks beautiful images into puzzle tiles you must rebuild
              piece by piece. Every level adds more pieces and more orientations to
              untangle — and the clock is always ticking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/play">
                <Button size="lg" className="shadow-glow">
                  Enter App
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button size="lg" variant="outline">
                  <Trophy className="mr-2 h-4 w-4" /> View leaderboard
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-hero opacity-30 blur-2xl" />
            <img
              src={hero}
              width={1024}
              height={1024}
              alt="Aurora over mountain peaks — a sample puzzle"
              className="relative aspect-square w-full rounded-3xl object-cover shadow-card"
            />
          </div>
        </section>

        {/* How it works */}
        <section className="py-12">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature icon={<Puzzle className="h-5 w-5" />} title="Drag the pieces">
              Pull tiles from the tray onto the grid. Misplaced a piece? Drag it back
              or swap it with another.
            </Feature>
            <Feature icon={<RotateCw className="h-5 w-5" />} title="Rotate to fit">
              Every piece starts at a random orientation. Click a piece to spin it
              90° at a time until it matches.
            </Feature>
            <Feature icon={<Timer className="h-5 w-5" />} title="Beat the clock">
              Your score starts high and decays every second. Think fast — but
              don't break your composure.
            </Feature>
          </div>
        </section>

        {/* Scoring */}
        <section className="grid gap-6 rounded-3xl bg-gradient-card p-8 shadow-card md:grid-cols-2 md:p-12">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              <Brain className="h-3.5 w-3.5" /> A thinking game
            </div>
            <h2 className="font-display text-3xl font-bold">The longer you take, the smaller the reward.</h2>
            <p className="mt-3 text-muted-foreground">
              Each level has a base score equal to <strong>pieces × 100</strong>.
              The score drops 1% every second you spend solving — so a quick,
              clean solve always beats a slow, lucky one.
            </p>
          </div>
          <div className="grid gap-3">
            <Stat label="Level 1 · 9 pieces" value="900 pts" hint="base" />
            <Stat label="Level 3 · 25 pieces" value="2,500 pts" hint="base" />
            <Stat label="Level 6 · 64 pieces" value="6,400 pts" hint="base" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="font-display text-4xl font-bold">Ready to climb the board?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Create a free account, save your scores, and see how you measure up against
            other real players around the world.
          </p>
          <div className="mt-6">
            <Link to="/play">
              <Button size="lg" className="shadow-glow">Enter App</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Built with care · A thinking puzzle game
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-card p-6 shadow-tile">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/40 p-4 ring-1 ring-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-lg font-semibold text-foreground">
        {value} <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      </span>
    </div>
  );
}
