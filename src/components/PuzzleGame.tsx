import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { PuzzleLevel } from "@/lib/puzzle-levels";
import { computeScore } from "@/lib/puzzle-levels";
import { submitScore } from "@/lib/scores.functions";
import { Button } from "@/components/ui/button";
import { RotateCw, Trophy, Clock, Sparkles } from "lucide-react";

interface Piece {
  id: number; // correct slot index 0..n-1
  rotation: 0 | 90 | 180 | 270;
}

type Selection =
  | { from: "tray"; index: number }
  | { from: "board"; index: number }
  | null;

const ROTATIONS: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PuzzleGame({ level }: { level: PuzzleLevel }) {
  const n = level.grid;
  const total = n * n;
  const navigate = useNavigate();
  const submitFn = useServerFn(submitScore);
  const submitRef = useRef(submitFn);
  submitRef.current = submitFn;

  const [board, setBoard] = useState<Array<Piece | null>>(() => Array(total).fill(null));
  const [tray, setTray] = useState<Piece[]>(() => {
    const pieces: Piece[] = Array.from({ length: total }, (_, id) => ({
      id,
      rotation: ROTATIONS[Math.floor(Math.random() * 4)],
    }));
    if (pieces.every((p) => p.rotation === 0)) pieces[0].rotation = 90;
    return shuffle(pieces);
  });

  const [selected, setSelected] = useState<Selection>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [solved, setSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (solved) return;
    if (!board.every((p) => p !== null)) return;
    const correct = board.every((p, i) => p && p.id === i && p.rotation === 0);
    if (!correct) return;
    setSolved(true);
    setRunning(false);
    setSelected(null);
    const points = computeScore(level, seconds);
    setSubmitting(true);
    submitRef.current({ data: { level: level.level, points, timeSeconds: seconds } })
      .then(() => toast.success(`Solved! +${points} points saved.`))
      .catch((e) => toast.error(e?.message ?? "Could not save score"))
      .finally(() => setSubmitting(false));
  }, [board, solved, level, seconds]);

  // ---------- Drag (desktop) ----------
  const dragRef = useRef<Selection>(null);
  const onDragStart = (sel: NonNullable<Selection>) => (e: React.DragEvent) => {
    dragRef.current = sel;
    e.dataTransfer.effectAllowed = "move";
  };
  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // Keep refs in sync so move handlers always see current values without stale closure issues
  const boardRef = useRef(board);
  boardRef.current = board;
  const trayRef = useRef(tray);
  trayRef.current = tray;

  // ---------- Core move logic (used by both drag and tap) ----------
  const movePieceToSlot = (src: NonNullable<Selection>, slotIdx: number) => {
    const currentBoard = boardRef.current;
    const currentTray = trayRef.current;
    const nextBoard = [...currentBoard];
    const existing = nextBoard[slotIdx];

    if (src.from === "board") {
      if (src.index === slotIdx) return;
      const piece = nextBoard[src.index];
      if (!piece) return;
      nextBoard[slotIdx] = piece;
      nextBoard[src.index] = existing ?? null;
      setBoard(nextBoard);
    } else {
      // from tray
      const piece = currentTray[src.index];
      if (!piece) return;
      nextBoard[slotIdx] = piece;
      const nextTray = currentTray.filter((_, i) => i !== src.index);
      if (existing) nextTray.push(existing);
      setBoard(nextBoard);
      setTray(nextTray);
    }
    setSelected(null);
  };

  const movePieceToTray = (src: NonNullable<Selection>) => {
    if (src.from !== "board") return;
    const currentBoard = boardRef.current;
    const piece = currentBoard[src.index];
    if (!piece) return;
    const nextBoard = [...currentBoard];
    nextBoard[src.index] = null;
    setBoard(nextBoard);
    setTray((t) => [...t, piece]);
    setSelected(null);
  };

  // ---------- Tap interactions ----------
  const onTapPiece = (loc: NonNullable<Selection>) => {
    if (!selected) {
      setSelected(loc);
      return;
    }
    if (selected.from === loc.from && selected.index === loc.index) {
      // tap same piece → rotate
      rotatePiece(loc);
      return;
    }
    // selected somewhere else, tapped a piece on board → swap/place
    if (loc.from === "board") {
      movePieceToSlot(selected, loc.index);
    } else {
      // selected is on board, tapped tray piece → send selected back to tray
      if (selected.from === "board") {
        movePieceToTray(selected);
      } else {
        setSelected(loc);
      }
    }
  };

  const onTapEmptySlot = (slotIdx: number) => {
    if (!selected) return;
    movePieceToSlot(selected, slotIdx);
  };

  const onTapTrayZone = () => {
    if (!selected) return;
    if (selected.from === "board") {
      movePieceToTray(selected);
    } else {
      // tray piece selected, tapped tray background → deselect
      setSelected(null);
    }
  };

  // ---------- Drop handlers ----------
  const onDropOnSlot = (slotIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragRef.current;
    dragRef.current = null;
    if (!src) return;
    movePieceToSlot(src, slotIdx);
  };
  const onDropOnTray = (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragRef.current;
    dragRef.current = null;
    if (src?.from === "board") movePieceToTray(src);
  };

  const rotatePiece = (loc: NonNullable<Selection>) => {
    if (loc.from === "tray") {
      setTray((prev) => prev.map((p, i) => (i === loc.index ? { ...p, rotation: nextRot(p.rotation) } : p)));
    } else {
      setBoard((prev) => prev.map((p, i) => (i === loc.index && p ? { ...p, rotation: nextRot(p.rotation) } : p)));
    }
  };

  const rotateSelected = () => {
    if (selected) rotatePiece(selected);
  };

  const isSelected = (loc: NonNullable<Selection>) =>
    selected?.from === loc.from && selected.index === loc.index;

  const previewPoints = useMemo(() => computeScore(level, seconds), [level, seconds]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-tile">
            <Clock className="h-4 w-4 text-secondary" />
            <span className="font-mono tabular-nums">{formatTime(seconds)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-tile">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono tabular-nums">{previewPoints} pts</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-tile">
            <Trophy className="h-4 w-4 text-accent" />
            <span>Level {level.level} · {n}×{n}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={rotateSelected}
            disabled={!selected}
            className="ml-auto"
          >
            <RotateCw className="mr-1 h-4 w-4" /> Rotate
          </Button>
        </div>

        <div
          className="relative aspect-square w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-muted/50 shadow-card touch-manipulation"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, var(--color-border) 0, var(--color-border) 1px, transparent 1px, transparent calc(100% / ${n})), repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 1px, transparent 1px, transparent calc(100% / ${n}))`,
          }}
        >
          <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {board.map((piece, slotIdx) => {
              const slotSel: NonNullable<Selection> = { from: "board", index: slotIdx };
              const sel = piece && isSelected(slotSel);
              return (
                <div
                  key={slotIdx}
                  onDragOver={allowDrop}
                  onDrop={onDropOnSlot(slotIdx)}
                  className="relative"
                >
                  {piece ? (
                    <button
                      type="button"
                      draggable
                      onDragStart={onDragStart(slotSel)}
                      onClick={() => onTapPiece(slotSel)}
                      className={`block h-full w-full cursor-grab active:cursor-grabbing ${sel ? "outline outline-2 outline-primary outline-offset-[-2px]" : ""}`}
                      aria-label="Placed piece. Tap to select, tap again to rotate."
                    >
                      <PieceTile piece={piece} grid={n} image={level.image} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTapEmptySlot(slotIdx)}
                      className="block h-full w-full"
                      aria-label="Empty slot. Tap to place selected piece."
                    />
                  )}
                </div>
              );
            })}
          </div>
          {solved && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm p-4 text-center">
              <Trophy className="h-12 w-12 text-primary" />
              <h2 className="text-3xl font-bold text-gradient">Solved!</h2>
              <p className="text-muted-foreground">{previewPoints} points in {formatTime(seconds)}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => navigate({ to: "/play" })} disabled={submitting}>
                  Choose another level
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: "/leaderboard" })}>
                  See leaderboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl bg-gradient-card p-4 shadow-card">
          <h3 className="font-semibold">{level.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a piece to select it, then tap a slot to place it. Tap a selected piece again to rotate, or use the Rotate button. You can also drag on desktop.
          </p>
        </div>
        <div
          onDragOver={allowDrop}
          onDrop={onDropOnTray}
          onClick={onTapTrayZone}
          className="rounded-xl border border-dashed border-border bg-card/60 p-3 shadow-tile"
        >
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Pieces · {tray.length}</span>
            <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> tap to select</span>
          </div>
          <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-auto sm:grid-cols-5 lg:grid-cols-4">
            {tray.map((piece, i) => {
              const sel = isSelected({ from: "tray", index: i });
              return (
                <button
                  key={`${piece.id}-${i}`}
                  type="button"
                  draggable
                  onDragStart={onDragStart({ from: "tray", index: i })}
                  onClick={(e) => { e.stopPropagation(); onTapPiece({ from: "tray", index: i }); }}
                  className={`aspect-square overflow-hidden rounded-md ring-1 transition ${sel ? "ring-2 ring-primary" : "ring-border hover:ring-primary"}`}
                  aria-label="Puzzle piece. Tap to select, tap again to rotate."
                >
                  <PieceTile piece={piece} grid={n} image={level.image} />
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function nextRot(r: 0 | 90 | 180 | 270): 0 | 90 | 180 | 270 {
  return ((r + 90) % 360) as 0 | 90 | 180 | 270;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function PieceTile({ piece, grid, image }: { piece: Piece; grid: number; image: string }) {
  const row = Math.floor(piece.id / grid);
  const col = piece.id % grid;
  const size = grid * 100;
  const posX = grid === 1 ? 0 : (col / (grid - 1)) * 100;
  const posY = grid === 1 ? 0 : (row / (grid - 1)) * 100;
  return (
    <div
      className="h-full w-full transition-transform duration-200"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: `${size}% ${size}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        transform: `rotate(${piece.rotation}deg)`,
      }}
    />
  );
}
