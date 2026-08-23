# PomodoroAI

> Paste a big task, get it split into 25-minute pomodoros, and run the timer on the same page.

**[Live demo](https://su-pomodoroai.vercel.app)**

The hard part of the pomodoro technique is deciding what a single pomodoro should actually contain. PomodoroAI sends your task description to Groq's Llama 3.3 70B, which breaks it into chunks sized for roughly 25 minutes of focused work — each with a title, a concrete deliverable, and a handful of micro-steps. The timer lives in the same view, so a vague task becomes a running session without switching apps.

## Features

- Any task description split into between 2 and 12 pomodoro-sized chunks
- Every chunk carries a one-sentence deliverable and two to four micro-steps
- Built-in 25-minute countdown drawn as an SVG progress ring
- Pause, resume, and skip controls with a live completed-count readout
- Click any chunk to start its pomodoro; active and finished chunks are styled distinctly
- Cmd/Ctrl+Enter submits the task without reaching for the button

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Groq API — `llama-3.3-70b-versatile`

## Running locally

```bash
npm install
npm run dev
```

Set `GROQ_API_KEY` in `.env.local`.

---

Part of a series of 91 small web apps. [Browse them all](https://su-slopmachine.vercel.app).
