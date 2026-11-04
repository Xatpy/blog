---
title: "i rewrote my React Native app in Swift and benchmarked both"
description: "same app, same 21,000-photo library, same automated test driving both. the Swift version uses up to 7× less CPU and shows the first photo almost 4× faster."
pubDatetime: 2026-11-04T09:00:00Z
tags: ["ios", "swift", "react native", "performance", "testing", "ai"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/ayer-native-swift/og.jpg"
locale: "en"
translationKey: "ayer-react-native-to-native-swift"
---

**tl;dr:** i ported my app [Ayer](https://chapiware.com/ayer) from React Native to native Swift and
ran both versions through the same automated test on a library of 21,000 photos. the Swift one shows
the first photo in **0.58 s instead of 2.17 s**, loads days with **7× less CPU** and uses **half the
memory** at launch. scrolling was a tie. the new version is
[free on the App Store](https://apps.apple.com/app/id6755725357).

<video src="/images/ayer-native-swift/ayer-rn-vs-native.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" controls muted playsinline preload="metadata" width="540"></video>

*React Native on the left, Swift on the right. same test, same photos.*

## the app

Ayer shows you the photos you took on this day in previous years. no account, no server, nothing
leaves your phone. it also has a home screen widget, collages to put two years side by side, and
little memory cards to share.

until this week it was an Expo app. it's basically a thin layer over Apple's Photos framework, and in
React Native every one of those calls goes through JavaScript and a bridge. i wanted to know how much
that was costing.

to be fair to React Native: this is the app **as i shipped it**. Expo 53, RN 0.79, Hermes, FlashList,
expo-image, and the old architecture (`newArchEnabled: false`). it's not the best RN app you could
write, it's the one i had.

## how the port was done

i didn't write the Swift by hand. i asked [Claude Code](https://claude.com/claude-code) to analyse the
RN app and write a plan, then gave it the whole port as one long task with "done" criteria it could
check itself: it builds, the tests pass, every translation exists in the 7 languages, and every screen
is screenshotted next to the RN one.

the plan was written on 22 October. the next afternoon i was benchmarking a finished port. then came
a week of the part that isn't automatic: using it on my own phone, a few rounds of code review, and
fixing what i found. things it got wrong:

- a benchmark-only bundle ID ended up in the App Store project. twice. i caught it both times by
  opening Xcode.
- a freeze on first launch that only happened on a real iPhone, never on the simulator.
- two performance bugs that only show up with a big library. more on those below.

for "same app" to mean something, it had to be checkable. so translations are generated from the RN
source instead of retyped, and the bits that pick a "random" photo for the widget and notifications
are tested against fixtures produced by running the original TypeScript.

## how i measured it

the rule was: same steps, same checks, same photos. if you measure each app with a different tool,
you're comparing tools.

- **one test for both.** an XCUITest target with no host app launches whichever app you give it by
  bundle ID. the Swift build gets its own bundle ID so both can be installed side by side.
- **Release builds on both sides.** a debug RN build would make native look better than it is.
- **a realistic library.** i wrote a small Swift script that generates 20,920 JPEGs with real EXIF
  dates from 2014 to 2026, weighted towards weekends and summers, with a few busy days of 300+ photos.
  8 GB in total.
- **Apple's own metrics.** `XCTCPUMetric` and `XCTMemoryMetric` measure the app's process, not the
  test runner's, and setup stays out of the timed part.
- **fair order.** warm-up passes first, the apps take turns going first, and every number is a median
  of 10 runs.

## results

iPhone 17 Pro simulator, 20,926 photos and 120 videos.

| | React Native | Swift | |
|---|---|---|---|
| first launch: allow Photos → first photo | 2.17 s | **0.58 s** | 3.7× faster |
| launch until responsive | 1.48 s | **0.82 s** | 1.8× faster |
| launch, peak memory | 167 MB | **81 MB** | 2.1× less |
| "next day" ×10, CPU time | 35.8 s | **5.2 s** | 6.9× less |
| tap "next day" → photos on screen | 0.8–1.0 s | **0.35 s** | ~2.5× faster |
| photo viewer, 15 photos, CPU time | 13.7 s | **4.9 s** | 2.8× less |
| scrolling a busy day, CPU time | 12.4 s | 13.2 s | same |

the CPU column is the one that surprised me. on a phone, CPU time is battery and heat, and that's
where the port paid off the most.

the tie surprised me too. scrolling through 349 photos is mostly decoding thumbnails, and that happens
inside Apple's Photos framework in both apps. native doesn't make everything faster. it removes the
app's own overhead.

### so where does React Native spend all that CPU?

i didn't profile it, so this comes from reading the code. to load a day, the RN app pages through
`expo-media-library` once per year, and every page crosses the bridge as JSON. then, on iOS, it calls
`getAssetInfoAsync` **once per photo** just to know whether it's a favourite. the Swift version does a
single Photos query per day and gets the favourite flag for free.

so part of the gap is React Native and part of it is how my RN code used it. that's probably true of
most rewrites.

## putting a clock inside the video

<video src="/images/ayer-native-swift/scene-3-next-day.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" autoplay loop muted playsinline width="540"></video>

numbers convince engineers, everyone else wants to see it. so i recorded both apps with
`simctl io recordVideo` and put them side by side with a timer each. i thought it'd take an afternoon.
the first version was off by more than two seconds.

simctl only writes a frame when the screen changes, recordings can start a second late, and under
load the timestamps jitter or even go backwards. so the timers and the picture didn't agree.

the fix: while recording, a script flips the simulator's status bar clock between "1:11" and "8:88" at
random intervals and logs when it did it. every flip is a new frame in the video, so i get a sync point
roughly every second. no OCR needed: an 8 simply lights up more pixels than a 1. the random gaps mean
only one alignment fits, even after a stall, and then every frame gets retimed to the real clock with
an ffmpeg `setpts` expression.

after that, the timers and the picture match to within a frame or two.

## the benchmark found bugs in my port

the best part. the big library found problems in the *Swift* version that my demo library of a few
dozen photos never would have:

1. **the first load could get stuck forever.** every Photos change notification restarted it, and
   during an iCloud sync they never stop. now changes are batched and the current load gets to
   finish.
2. **the viewer kept every photo in memory.** swiping through 15 photos peaked at 404 MB, more than
   the RN app. now only the pages next to the visible one keep their image: 177 MB.

both would have reached users. and both are the kind of bug an agent won't find on its own: the code
was correct, it just didn't scale.

## caveats

- these are simulator numbers. a Mac is much faster than a phone, so look at the ratios, not the
  times.
- scroll smoothness and iCloud-only libraries need a real device. that's the next post.

## what i'm taking away

- **measure before you believe.** i'd have bet on bigger scroll gains and smaller CPU gains. it was
  the other way round.
- **a benchmark is also a test suite.** it found two real bugs in my "finished" port.
- **an agent can port an app, but "done" has to be something you can check.**
- **if you can't trust the clock, put one in the picture.**

if you want to see how it feels with your own photos, Ayer is
[free on the App Store](https://apps.apple.com/app/id6755725357), and there's more about it at
[chapiware.com/ayer](https://chapiware.com/ayer).
