import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { GameHeader } from "@/components/GameHeader";
import { getGlobalLeaderboard, getLevelLeaderboards } from "@/lib/scores.functions";
import { LEVELS } from "@/lib/puzzle-levels";
import { Trophy, Medal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const globalQO = queryOptions({
  queryKey: ["leaderboard", "global"],
  queryFn: () => getGlobalLeaderboard(),
});

const levelsQO = queryOptions({
  queryKey: ["leaderboard", "levels"],
  queryFn: () => getLevelLeaderboards(),
});

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard · Piecewise" },
      { name: "description", content: "Top puzzle solvers ranked by total points and per-level best scores." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(globalQO),
      context.queryClient.ensureQueryData(levelsQO),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Not found.</div>,
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data: global } = useSuspenseQuery(globalQO);
  const { data: perLevel } = useSuspenseQuery(levelsQO);
  const [activeLevel, setActiveLevel] = useState(String(LEVELS[0].level));

  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Real players, ranked by points.</p>
          </div>
        </header>

        <Tabs defaultValue="global">
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="levels">By level</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <div className="overflow-hidden rounded-2xl bg-gradient-card shadow-card">
              {global.length === 0 ? (
                <Empty />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3 text-right">Points</th>
                      <th className="px-4 py-3 text-right">Plays</th>
                      <th className="px-4 py-3 text-right">Top level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {global.map((row, i) => (
                      <tr key={row.user_id} className="border-t border-border/60">
                        <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                        <td className="px-4 py-3 font-medium">{row.username}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{(row.total_points ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{row.plays ?? 0}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{row.highest_level ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="mt-4">
            <Tabs value={activeLevel} onValueChange={setActiveLevel}>
              <TabsList className="flex flex-wrap">
                {LEVELS.map((l) => (
                  <TabsTrigger key={l.level} value={String(l.level)}>
                    L{l.level}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LEVELS.map((l) => {
                const rows = perLevel
                  .filter((r) => r.level === l.level)
                  .sort((a, b) => (b.best_points ?? 0) - (a.best_points ?? 0))
                  .slice(0, 25);
                return (
                  <TabsContent key={l.level} value={String(l.level)} className="mt-4">
                    <div className="overflow-hidden rounded-2xl bg-gradient-card shadow-card">
                      {rows.length === 0 ? (
                        <Empty />
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="bg-background/30 text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">#</th>
                              <th className="px-4 py-3">Player</th>
                              <th className="px-4 py-3 text-right">Best score</th>
                              <th className="px-4 py-3 text-right">Best time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => (
                              <tr key={row.user_id} className="border-t border-border/60">
                                <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                                <td className="px-4 py-3 font-medium">{row.username}</td>
                                <td className="px-4 py-3 text-right font-mono tabular-nums">{(row.best_points ?? 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">{formatTime(row.best_time ?? 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link to="/play" className="text-sm text-primary hover:underline">Play to climb →</Link>
        </div>
      </main>
    </div>
  );
}

function Empty() {
  return (
    <div className="p-12 text-center text-muted-foreground">
      No scores yet — be the first to solve a puzzle!
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color =
    rank === 1 ? "text-primary" : rank === 2 ? "text-secondary" : rank === 3 ? "text-accent" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 font-mono ${color}`}>
      {rank <= 3 ? <Medal className="h-4 w-4" /> : null}
      {rank}
    </span>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
