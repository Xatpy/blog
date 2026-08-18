---
title: "How I built 8SecondsHug while out running"
description: "The story of building an app in a couple of hours while I was out for a run."
pubDatetime: 2026-04-03T16:00:00Z
tags: ["writing", "notes"]
draft: false
locale: "en"
translationKey: "8-seconds-hug-development"
---

Today I made a complete app while going for a 40-minute run.

## The idea

I had this idea sitting in my notes for a while: **8 seconds hug** — a reminder of the importance of hugs. The previous night I had read an article saying that prolonged hugs can help in many situations, and it brought the note back to mind.

So I started working on it over breakfast. The goal was deliberately small: an iPhone app that reminds you to give someone an eight-second hug, then counts the seconds with a simple, gentle interface.

## From research to a plan

My first step was to ask ChatGPT to investigate whether similar apps existed and turn that research into a detailed development prompt. With that result, I asked Codex for a one-shot implementation plan: a simple app, a very explicit interface specification, and enough attention to details that it could pass Apple’s review.

The original Spanish post keeps those prompts exactly as I wrote them. I have left them in their original language because they are part of the record of the experiment rather than user-facing app copy.

## The logo

I also asked for a logo: something warm, friendly and recognisable at a small size. The result was a simple visual identity that fit the premise much better than I expected for such a quick project.

## Letting Codex do the implementation

Then I gave Codex the plan and let it work while I went out. That is the slightly surreal part: I was running, checking in from my phone, while the Mac continued with the project in the background.

The generated app included the basic flow, the timer, haptics and the small interaction details that make a tiny app feel finished rather than like a demo.

## The result

By the time I got back, there was a working version of 8SecondsHug. It is not an argument that every product should be built this way; there are still plenty of moments where careful design, review and iteration matter. But for a contained idea, the distance from a note to a usable app has become remarkably short.

## Metrics

The interesting metric was not just the number of lines produced or the elapsed time. It was the amount of momentum preserved: an idea appeared, it was researched, specified, built and tested before it had time to become another forgotten item in a notes app.

For the complete build log, including the original prompts and generated implementation notes, see the [Spanish version](/posts/8-seconds-hug-development/).
