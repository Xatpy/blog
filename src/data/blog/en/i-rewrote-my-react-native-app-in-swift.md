---
title: "I rewrote my React Native app in Swift and benchmarked both"
description: "Same app, same 21,000-photo library, same automated test driving both. The Swift version uses up to 7× less CPU and shows the first photo almost 4× faster."
pubDatetime: 2026-11-04T09:00:00Z
tags: ["ios", "swift", "react native", "performance", "testing", "ai"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/ayer-native-swift/og.jpg"
locale: "en"
translationKey: "ayer-react-native-to-native-swift"
---

**tl;dr:** I ported my app [Ayer](https://chapiware.com/ayer) from React Native to native Swift and
ran both versions through the same automated test on a library of 21,000 photos. The Swift one shows
the first photo in **0.58 s instead of 2.17 s**, loads days with **7× less CPU** and uses **half the
memory** at launch. scrolling was a tie.

<video src="/images/ayer-native-swift/ayer-rn-vs-native.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" controls muted playsinline preload="metadata" width="540"></video>

*React Native on the left, Swift on the right. Same test, same photos.*

## The app

Ayer shows you the photos you took on this day in previous years. It also has a home screen widget,
collages to put two years side by side, and little memory cards to share. It has always been free and
private: no account, no ads, and your photos never leave your phone. That didn't change. It just got
a lot faster. You can [get it on the App Store](https://apps.apple.com/app/id6755725357).

until now it was an Expo app. It's basically a thin layer over Apple's Photos framework, and in React
Native every one of those calls goes through JavaScript and a bridge. I wanted to know how much that
was costing.

To be fair to React Native: this is the app **as I shipped it**. Expo 53, React Native 0.79, Hermes,
FlashList, expo-image, and the old architecture (`newArchEnabled: false`). It's not the best React
Native app you could write, it's the one I had.

## How the port was done

I didn't write the Swift by hand. I asked Claude Code to analyse the React Native app and write a
plan, then gave it the whole port as one long task with "done" criteria it could check itself: it
builds, the tests pass, every translation exists in the 7 languages, and every screen is
screenshotted next to the React Native one.

the port itself was the fast part. The slow part was everything after it: using the app on my own
phone, a few rounds of code review, and fixing what I found. Things it got wrong:

- A benchmark-only bundle ID ended up in the App Store project. Twice. I caught it both times by
  opening Xcode.
- a freeze on first launch that only happened on a real iPhone, never on the simulator.
- Two performance bugs that only show up with a big library. More on those below.

For "same app" to mean something, it had to be checkable. So translations are generated from the
React Native source instead of retyped, and the bits that pick a "random" photo for the widget and
notifications are tested against fixtures produced by running the original TypeScript.

## How I measured it

The rule was: same steps, same checks, same photos. If you measure each app with a different tool,
you're comparing tools.

- **One test for both.** An XCUITest target with no host app launches whichever app you give it by
  bundle ID. The Swift build gets its own bundle ID so both can be installed side by side.
- **Release builds on both sides.** A debug React Native build would make native look better than it
  is.
- **A realistic library.** I wrote a small Swift script that generates 20,920 JPEGs with real EXIF
  dates from 2014 to 2026, weighted towards weekends and summers, with a few busy days of 300+ photos.
  8 GB in total.
- **Apple's own metrics.** `XCTCPUMetric` and `XCTMemoryMetric` measure the app's process, not the
  test runner's, and setup stays out of the timed part.
- **Fair order.** Warm-up passes first, the apps take turns going first, and every number is a median
  of 10 runs.

## Results

iPhone 17 Pro simulator, 20,926 photos and 120 videos.

| | React Native | Swift | |
|---|---|---|---|
| First launch: allow Photos → first photo | 2.17 s | **0.58 s** | 3.7× faster |
| Launch until responsive | 1.48 s | **0.82 s** | 1.8× faster |
| Launch, peak memory | 167 MB | **81 MB** | 2.1× less |
| "Next day" ×10, CPU time | 35.8 s | **5.2 s** | 6.9× less |
| Tap "Next day" → photos on screen | 0.8–1.0 s | **0.35 s** | ~2.5× faster |
| Photo viewer, 15 photos, CPU time | 13.7 s | **4.9 s** | 2.8× less |
| Scrolling a busy day, CPU time | 12.4 s | 13.2 s | same |

The CPU column is the one that surprised me. On a phone, CPU time is battery and heat, and that's
where the port paid off the most.

the tie surprised me too. Scrolling through 349 photos is mostly decoding thumbnails, and that happens
inside Apple's Photos framework in both apps. Native doesn't make everything faster. It removes the
app's own overhead.

### So where does React Native spend all that CPU?

I didn't profile it, so this comes from reading the code. To load a day, the React Native app pages
through `expo-media-library` once per year, and every page crosses the bridge as JSON. Then, on iOS, it
calls `getAssetInfoAsync` **once per photo** just to know whether it's a favourite. The Swift version
does a single Photos query per day and gets the favourite flag for free.

So part of the gap is React Native and part of it is how my code used it. That's probably true of most
rewrites.

## Putting a clock inside the video

<video src="/images/ayer-native-swift/scene-3-next-day.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" autoplay loop muted playsinline width="540"></video>

Numbers convince engineers, everyone else wants to see it. So I recorded both apps with
`simctl io recordVideo` and put them side by side with a timer each. I thought it'd take an afternoon.
the first version was off by more than two seconds.

simctl only writes a frame when the screen changes, recordings can start a second late, and under load
the timestamps jitter or even go backwards. So the timers and the picture didn't agree.

The fix: while recording, a script flips the simulator's status bar clock between "1:11" and "8:88" at
random intervals and logs when it did it. Every flip is a new frame in the video, so I get a sync point
roughly every second. No OCR needed: an 8 simply lights up more pixels than a 1. The random gaps mean
only one alignment fits, even after a stall, and then every frame gets retimed to the real clock with
an ffmpeg `setpts` expression.

after that, the timers and the picture match to within a frame or two.

## The benchmark found bugs in my port

The best part. The big library found problems in the *Swift* version that my demo library of a few
dozen photos never would have:

1. **The first load could get stuck forever.** Every Photos change notification restarted it, and
   during an iCloud sync they never stop. Now changes are batched and the current load gets to finish.
2. **The viewer kept every photo in memory.** Swiping through 15 photos peaked at 404 MB, more than
   the React Native app. Now only the pages next to the visible one keep their image: 177 MB.

Both would have reached users. And both are the kind of bug an agent won't find on its own: the code
was correct, it just didn't scale.

## Caveats

- These are simulator numbers. A Mac is much faster than a phone, so look at the ratios, not the
  times.
- Scroll smoothness and iCloud-only libraries need a real device. That's the next post.

## What I'm taking away

- **Measure before you believe.** I'd have bet on bigger scroll gains and smaller CPU gains. It was
  the other way round.
- **A benchmark is also a test suite.** It found two real bugs in my "finished" port.
- **An agent can port an app, but "done" has to be something you can check.**
- **If you can't trust the clock, put one in the picture.**

If you want to see what "this day, every year" looks like with your own photos, Ayer is on the
[App Store](https://apps.apple.com/app/id6755725357). Still free, still private, now a lot faster.
More about it at [chapiware.com/ayer](https://chapiware.com/ayer).
