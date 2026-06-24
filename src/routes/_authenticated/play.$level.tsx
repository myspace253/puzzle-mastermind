import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { PuzzleGame } from "@/components/PuzzleGame";
import { getLevel } from "@/lib/puzzle-levels";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/play/$level")({
  head: ({ params }) => ({ meta: [{ title: `Level ${params.level} · Piecewise` }] }),
  component: PlayLevel,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p>Level not found.</p>
      <Link to="/play"><Button className="mt-4">Back to levels</Button></Link>
    </div>
  ),
});

function PlayLevel() {
  const { level } = Route.useParams();
  const lvl = getLevel(Number(level));
  if (!lvl) throw notFound();
  return (
    <div className="min-h-screen">
      <GameHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/play" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to levels
        </Link>
        {/* Remount on level change so timer/board reset */}
        <PuzzleGame key={lvl.level} level={lvl} />
      </main>
    </div>
  );
}
