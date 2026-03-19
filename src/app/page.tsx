"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PomodoroChunk {
  title: string;
  deliverable: string;
  steps: string[];
}

const POMODORO_SECONDS = 25 * 60;

export default function Home() {
  const [task, setTask] = useState("");
  const [chunks, setChunks] = useState<PomodoroChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Timer state
  const [activeChunk, setActiveChunk] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS);
  const [running, setRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopInterval();
            setRunning(false);
            setCompletedCount((c) => c + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [running, stopInterval]);

  async function handleSplit() {
    if (!task.trim()) return;
    setLoading(true);
    setError("");
    setChunks([]);
    setActiveChunk(null);
    setRunning(false);
    setSecondsLeft(POMODORO_SECONDS);
    setCompletedCount(0);

    try {
      const res = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setChunks(data.chunks);
      setActiveChunk(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function startChunk(index: number) {
    setActiveChunk(index);
    setSecondsLeft(POMODORO_SECONDS);
    setRunning(true);
  }

  function togglePause() {
    setRunning((r) => !r);
  }

  function skipChunk() {
    setRunning(false);
    setSecondsLeft(POMODORO_SECONDS);
    setCompletedCount((c) => c + 1);
    if (activeChunk !== null && activeChunk < chunks.length - 1) {
      setActiveChunk(activeChunk + 1);
    } else {
      setActiveChunk(null);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / POMODORO_SECONDS;
  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - progress);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-1">
        Pomodoro<span className="text-accent">AI</span>
      </h1>
      <p className="text-muted text-sm mb-8">
        Paste a big task. Get pomodoro-sized chunks.
      </p>

      {/* Input area */}
      <div className="w-full mb-6">
        <textarea
          className="w-full bg-surface border border-border rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-accent transition-colors placeholder:text-muted/60"
          rows={4}
          placeholder={'Describe your task... e.g. "Build a landing page with hero section, feature cards, pricing table, and contact form"'}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSplit();
          }}
        />
        <button
          onClick={handleSplit}
          disabled={loading || !task.trim()}
          className="mt-3 w-full bg-accent hover:bg-accent-dim text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Splitting..." : "Split into Pomodoros"}
        </button>
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>

      {/* Timer + Chunks */}
      {chunks.length > 0 && (
        <div className="w-full">
          {/* Timer */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-52 h-52">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full -rotate-90"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold tabular-nums">
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted mt-1">
                  {completedCount}/{chunks.length} completed
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={togglePause}
                disabled={activeChunk === null || secondsLeft === 0}
                className="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-40"
              >
                {running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={skipChunk}
                disabled={activeChunk === null}
                className="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-40"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Chunk list */}
          <div className="space-y-3">
            {chunks.map((chunk, i) => {
              const isActive = activeChunk === i;
              const isDone = i < completedCount;
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                    isActive
                      ? "border-accent bg-accent/5"
                      : isDone
                      ? "border-border/50 bg-surface/50 opacity-60"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                  onClick={() => {
                    if (!running) startChunk(i);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDone
                          ? "bg-green-600 text-white"
                          : isActive
                          ? "bg-accent text-white"
                          : "bg-border text-muted"
                      }`}
                    >
                      {isDone ? "\u2713" : i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm leading-snug">
                        {chunk.title}
                      </h3>
                      <p className="text-muted text-xs mt-0.5">
                        {chunk.deliverable}
                      </p>
                      {isActive && (
                        <ul className="mt-2 space-y-1">
                          {chunk.steps.map((step, j) => (
                            <li
                              key={j}
                              className="text-xs text-muted/80 flex items-start gap-1.5"
                            >
                              <span className="text-accent mt-0.5">&bull;</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <footer className="mt-auto pt-12 pb-4 text-center text-xs text-muted/50">
        PomodoroAI &mdash; powered by Groq
      </footer>
    </main>
  );
}
