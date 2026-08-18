---
title: "I released AI Soundbite Extractor: from a long video to reviewable audio clips"
description: "A local tool for transcribing videos, proposing short excerpts and exporting only the soundbites you approve."
pubDatetime: 2026-07-17T10:00:00Z
tags: ["ai", "audio", "python", "open-source"]
draft: true
locale: "en"
translationKey: "ai-soundbite-extractor"
---

When you want sounds from a long video for a soundboard, exporting an MP3 is rarely the hard part. The work comes first: listening to the whole video, spotting worthwhile lines, finding their beginning and end, and doing it over and over.

I released [AI Soundbite Extractor](https://github.com/Xatpy/ai-sounds-extractor) to remove much of that repetitive work without pretending that a machine knows better than you which line is worth keeping.

Give it a local video or a URL. It transcribes the audio, proposes short clips, lays them out in a local review page, and you decide which ones survive. You can listen, trim, combine and export them as MP3s.

The important point is this: it is not a “find me something viral” button. It is a tool for discovery and human review.

## The complete flow

The simplest use, with a local video, is:

```bash
.venv/bin/ai-soundbite-extractor --file "input/video.mp4" --language en
```

It also accepts URLs supported by `yt-dlp`:

```bash
.venv/bin/ai-soundbite-extractor --url "https://www.youtube.com/watch?v=..." --language en
```

When it finishes, it opens `review.html` in your browser. There is no local server to run and no account to create.

In that page you can listen to candidate lines, sort and filter clips, see their original position in the video, adjust their start and end on a waveform, download an individual clip, join multiple clips, and mark each one approved, rejected or pending.

Once you have made the decisions, the page downloads a small JSON file. Apply it to the same run like this:

```bash
.venv/bin/ai-soundbite-extractor \
  --run-dir ai-soundbite-extractor/runs/<run_id> \
  --apply-decisions ~/Downloads/ai-soundbite-extractor-decisions.json
```

This creates an `approved/` folder containing only the accepted clips and updates a local manifest. Nothing is published to any platform automatically.

## What happens inside

The project is written in Python and runs locally. The first version is prepared and tested especially for macOS on Apple Silicon, Python 3.11 and `ffmpeg`.

The pipeline is intentionally straightforward:

1. Download a video with `yt-dlp`, or import a local file.
2. Extract a 16 kHz mono WAV track with `ffmpeg`.
3. Transcribe and align words with WhisperX.
4. Group words into sentences using silences and natural transcript boundaries.
5. Discard candidates that are too short, too long, or only configured filler words.
6. Refine boundaries using the real audio energy to reduce silence at either end.
7. Export candidates as MP3s and build the static review interface.

The part I cared most about was segmentation. A correctly transcribed video is still awkward if it becomes one enormous block of text, or if every clip cuts through a word.

For that reason the program keeps all intermediate artifacts: video, audio, transcript, segments, clips and review data. Changing one step does not require downloading or transcribing everything again, and regenerating only the review interface is possible too.

## What is AI, and what is not

Speech models handle transcription and word alignment. That makes it possible to work with precise start and end times instead of approximate paragraphs.

Emotion labels, titles, repeated-line detection and priority signals, on the other hand, are deterministic local heuristics. They help sort a long list; they do not make editorial choices. The final approval is always human.

## Local first, with clear limits

I did not want this to become another service where you upload a video, wait for someone else to process it, and agree to terms you have not read. The extractor has no server of its own, requires no account and uses no paid API in its usual flow.

Downloads, dependency installation and model weights may need a network connection, but processing and output files remain on your machine. Background music, noise, overlapping voices, accents and poor transcripts can still produce bad boundaries; URL downloads may fail as platforms change; and the tool does not decide copyright, consent or platform compliance.

The repository is [open source under Apache-2.0](https://github.com/Xatpy/ai-sounds-extractor/blob/main/LICENSE). If you try it, I would especially like to know whether its proposed lines resemble the ones you would have extracted manually, and where the workflow still makes you do repetitive work.
