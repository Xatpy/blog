---
title: "How I automated the marketing for my mobile app with Wikipedia, Playwright and a €0 budget"
description: "How I built a small content machine around Ayer to generate images, videos and a public website without paying for ads."
pubDatetime: 2026-09-07T10:00:00Z
tags: ["indie hacking", "engineering as marketing", "automation", "playwright", "mobile apps"]
draft: false
locale: "en"
translationKey: "automated-marketing-ayer-app"
---

Creating an app is relatively easy. The difficult part comes afterwards: getting anyone to discover it.

A while ago I published [Ayer](https://www.chapiware.com/ayer/), an iOS and Android app that shows you the photos you took on this day one, five or ten years ago.

The idea is very simple. You open the app and see what you were doing on the same date in previous years. Birthdays, trips, moves, children who are suddenly much older, or photos you had completely forgotten about.

Ayer works entirely on-device. It does not upload photos to a server, it does not need an account and there is no tracking system behind it.

The problem appeared when I had to promote it.

I could post a screenshot on social media every now and then, but I knew exactly how that would end: I would prepare two or three posts, forget about the app for a few weeks and remember it again when someone asked me about it.

So I did what I usually do when something feels like a chore: I tried to program it.

The result is [OnThisAyer](https://xatpy.github.io/OnThisAyer/), a website that retrieves historical events from Wikipedia, prepares social media content and acts as a public showcase for Ayer.

## The idea

Ayer is about your memories.

OnThisAyer is about everyone else's memories.

In the app, you can look at what you were doing on September 7 five years ago. On the website, you can discover what happened on September 7 in 1966, 1988 or 2001.

The connection felt quite natural to me. In both cases, you are looking at a date and asking what happened then.

The website had two jobs:

1. Create visual content without designing every post from scratch.
2. Provide a public page that could be discovered through search and link back to the app.

The idea fits into what is usually called *Engineering as Marketing*: building something useful or interesting that also helps distribute the main product.

In my case, I could also reuse Ayer's visual design. The website, screenshots and videos all share the app's identity.

## The workflow

The system works roughly like this:

```text
Wikipedia
    ↓
Extract events and images
    ↓
Filter and rank
    ↓
Choose the three best ones
    ↓
Generate copy, screenshots and videos
    ↓
Publish a static website
```

Everything is built with Node.js and runs locally. The data is stored in JSON files and the website is published on GitHub Pages.

There is no database, dedicated server or custom API to maintain.

## Getting something useful out of Wikipedia

Wikipedia has an API for looking up historical events for any day of the year.

The problem is that the response can contain a lot of events, and not all of them make an interesting social post. Some historical facts are important but difficult to explain in an image. Others have no photographs. Some are too local or simply not very interesting to someone scrolling through Instagram.

That is why the extractor does a few things before keeping an event:

- finds related images;
- discards events without suitable visual material;
- removes duplicate years;
- filters sensitive content;
- checks that images are not maps, flags, logos or diagrams;
- assigns a score to every candidate.

The score uses fairly simple signals. Recent events are more likely to be recognisable. Topics such as technology, film, music, sport and popular culture also receive more weight.

A new Apple product, a space mission or a World Cup final will probably work better on social media than a local decree from 1742 with no available image.

It is not AI and it does not try to predict what will go viral. It is just a way of reducing a very long list to ten reasonable candidates.

## The curation panel

At first I could simply select the three events with the highest score and move on.

The problem was that the result was not always the best one. Sometimes the three events were too similar. Sometimes I did not like the selected image. There were also events with a lower score that were much easier to explain.

So I added a small local curation panel.

From there I can browse the days of the year, see the events that were found, open their Wikipedia pages and choose the three I want to use.

The system makes an initial automatic selection, but I can change it before saving.

This part matters to me. I did not want a formula to decide completely what was worth publishing. I wanted to remove the repetitive work and keep the final decision for myself.

The automation searches and ranks. I act as the editor.

## Screenshots with Playwright

Once the events are selected, the system generates a screenshot using Ayer's visual interface.

The screen is built with HTML and CSS. Playwright opens it as a browser would and captures only the element that represents the phone screen.

```js
const context = await browser.newContext({
  viewport: {
    width: 440,
    height: 956
  },
  deviceScaleFactor: 2.5
});
```

The result is a 1100 × 2390 pixel image, large enough to publish on social media.

To generate an image for a specific day:

```bash
npm run render -- --day=08-29
```

The file appears at:

```text
output/08-29.png
```

The advantage is that the piece is not a separate design that I have to maintain by hand. It is generated from Ayer's interface.

If I change the app's colours or structure, I can update the screenshots from the same code.

## Copy for social media

The system also prepares the copy.

It generates different versions for X, Instagram and Threads. For X, it tries to stay within the character limit and avoids cutting sentences in awkward places. For Instagram, it adds more context, hashtags and a question related to personal memories.

The part that connects everything usually looks something like this:

```text
What were you doing on this day five or ten years ago?
Check your camera roll 👀
```

The idea is for the historical event to be only the beginning. After reading that something happened in 1987, the person should think about what they were doing on that date.

I do not automatically publish to every social network. The system prepares the content and I decide what I want to post. That works well for me: it saves a lot of work without turning my profiles into a machine that publishes anything without review.

## I added videos too

After getting the images working, I added vertical videos for TikTok, Reels and YouTube Shorts.

The videos are generated with Remotion and combine the day's events with images and visual elements from Ayer.

To generate videos for several days:

```bash
npm run video:batch -- --days=7
```

I can also generate just one:

```bash
npm run video -- --day=09-07
```

The useful part is that the same information can end up in several formats:

- a web page;
- a screenshot;
- a thread;
- an Instagram caption;
- a short video.

I do not have to think of five different ideas for every day. I have one idea and several ways to present it.

## The public website

The visible part of the project is [OnThisAyer](https://xatpy.github.io/OnThisAyer/).

It has a calendar and lets you browse previous days. Each date shows the selected events, images, videos and links related to Ayer.

Future dates stay locked until the day arrives. That means I can leave the website published throughout the year without showing content for days that have not happened yet.

The data is organised in JSON files:

```text
data/
├── curated.json
└── events/
    ├── 01-01.json
    ├── 01-02.json
    └── ...
```

When I push to the repository, GitHub Actions runs the tests, copies the data and videos to the website, and deploys everything to GitHub Pages.

The monthly infrastructure cost is €0.

Well, the project still uses my computer, my time and my electricity. But I do not have to pay for a server, a database or ad campaigns to keep it running.

## Why I did not build a backend

I could have built a traditional web application with a database and an API.

But I did not need one.

The content can be prepared in advance, the data is not private and the website only has to display files that have already been generated.

The final architecture is quite boring:

```text
Local scripts
    ↓
JSON files and videos
    ↓
GitHub Actions
    ↓
GitHub Pages
```

And that is exactly what I wanted. The fewer pieces there are, the fewer things I have to maintain.

The website can also query Wikipedia's API directly if it cannot find precomputed data, although the main content I publish comes from files that I have reviewed and saved beforehand.

The images and historical data link back to their original pages, and the website includes the relevant Wikimedia attribution.

## What I am taking away from the project

The interesting part is that I ended up building a marketing tool that looks a lot like the app itself.

Ayer answers this question:

> What was I doing on this day?

OnThisAyer answers this one:

> What was happening in the world on this day?

Both are about memories associated with a date. One looks at your camera roll and the other looks at history.

It has also confirmed something I had already seen in other projects: automation does not mean that everything has to be completely automatic.

The machine can download data, find images, rank events, generate screenshots and prepare the copy. But it is still useful to have a person look at the result before publishing it.

In this case, automation does not replace judgement. It simply means that the judgement is applied to ten reasonable options instead of hundreds of search results.

The code is available on [GitHub](https://github.com/Xatpy/OnThisAyer). You can see how the events are extracted, how they are scored, how the Playwright screenshots are generated and how the static website is deployed.

And if you ever come across an OnThisAyer post, my computer probably prepared it while I was doing something else.
