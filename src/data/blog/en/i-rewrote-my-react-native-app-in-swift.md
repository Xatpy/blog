---
title: "I rewrote my React Native app in Swift, then built a benchmark to check it was worth it"
description: "Porting Ayer from React Native to native iOS, and how I measured both apps side by side on a 21,000-photo library: XCUITest metrics, a synthetic photo library and a status-bar clock to sync the videos."
pubDatetime: 2026-11-04T09:00:00Z
tags: ["ios", "swift", "react native", "performance", "testing", "ai"]
draft: false
ogImage: "https://blog.jaimechapinal.com/images/ayer-native-swift/og.jpg"
locale: "en"
translationKey: "ayer-react-native-to-native-swift"
---

"Native will be faster" is one of those things everybody says and nobody measures. I just rewrote
[Ayer](https://chapiware.com/ayer) from React Native to native Swift, and version 2.0 is now
[on the App Store](https://apps.apple.com/app/id6755725357). Before shipping it, I had the rare
chance to measure the claim: two builds of the same app, with the same screens and the same
features, on the same photo library.

This post is mostly about the measuring. How do you compare two apps fairly when one is React
Native and the other is SwiftUI? How do you get a realistic 21,000-photo library onto a simulator?
And how do you make side-by-side videos whose timers you can trust?

<video src="/images/ayer-native-swift/ayer-rn-vs-native.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" controls muted playsinline preload="metadata" width="540"></video>

*React Native on the left, native Swift on the right, both driven by the same automated test.*

## The app, and why I ported it

Ayer shows you the photos you took on this day in previous years. It works entirely on the device:
no account, no server, no tracking. Until this release, the App Store version was an Expo/React
Native app for iOS and Android.

The app is basically a thin layer over Apple's Photos framework: for each day of every past year it
queries the photo library, lays out a feed, opens a zoomable viewer and feeds a widget. In React
Native every one of those calls goes through native modules and JavaScript, and the thumbnails go
through an extra image-loading layer on top of Photos. I wanted to know how much of the app's time
was going into that.

### What exactly is being compared

This is the React Native app **as it shipped**, not the best React Native app I could have written:

- **React Native side:** Expo SDK 53, React Native 0.79.6, Hermes, `@shopify/flash-list` 1.7 for the
  feed, `expo-image` 2.4 for thumbnails and `expo-media-library` 17 for Photos. It runs on the
  **old architecture** (`newArchEnabled: false`). The New Architecture might narrow some of the gap; I
  didn't test that.
- **Native side:** Swift, SwiftUI with UIKit where SwiftUI falls short, PhotoKit and WidgetKit, no
  third-party dependencies.

Both are Release builds. More on that below.

## How the port was done (yes, with an AI agent)

I didn't write the Swift by hand. I asked [Claude Code](https://claude.com/claude-code) to analyse
the RN app and write a port plan, then gave it the whole port as a single long task with explicit
"done" criteria. My job was deciding, checking and testing.

**The plan came first.** `PORT_PLAN.md` inventoried every screen, service and setting, mapped each
RN library to its iOS equivalent, listed the data formats the new app had to stay compatible with,
and split the work into ten phases. It also fixed the decisions up front, so the agent didn't have to
guess:

- **iOS 17 minimum.** SwiftUI, with UIKit where SwiftUI falls short: the paging photo viewer,
  pinch-to-zoom and the inline calendar.
- **A local Swift package** (`AyerKit`) shared by the app and the WidgetKit extension.
- **Zero third-party runtime dependencies.** Even the Ionicons font is bundled, so the icons match
  pixel for pixel.
- **Same bundle ID and app group,** so it installs as an update. On first launch it reads the old
  AsyncStorage settings and deletes the RN caches.
- **What not to port:** dead code, an unused onboarding, analytics and everything Android-only.

**The "done" criteria were checkable.** The project generates and builds with zero errors; unit tests
pass for the date maths, layout maths and hashing; every translation key exists in all 7 languages;
every screen is captured in light and dark and compared with the RN app; and a status file lists
every deviation from parity and everything that needs a real device.

**The timeline.** The plan was written on the evening of 22 October. The benchmark in this post
ran on the finished port the next afternoon. Then came a week of the part that isn't automatic:
testing on my own iPhone, asking a second model (Codex) to review the code five times and fixing what
it found, a security and performance review, and polishing the UI. I submitted on 30 October.

**What it got wrong, or missed:**

- **A benchmark-only bundle ID ended up in the App Store project. Twice.** I found it both times by
  opening the project in Xcode. That's why the benchmark now lives in a separate project (below).
- **A first-launch freeze on a real device.** After granting notifications, the reminder prompt stayed
  on screen with a spinner and ignored taps for several seconds. The simulator never showed it.
- **A cramped viewer toolbar** with large text sizes. It was technically "the same as RN", but it
  looked wrong on my phone.
- **Two performance bugs that only a big library shows.** The benchmark found these, and they're
  described at the end.

The result is 48 Swift files: about 8,700 lines of app, widget and package code, plus about 1,100
lines of tests. The RN repo's `src` and `app` folders hold about 21,000 lines of TypeScript, though
that includes Android-only and unused code that wasn't ported.

## Parity by construction, not by eye

"Exactly the same app" is easy to say and hard to check, for an agent or for me. Most of the parity
work was making sameness something a test can verify:

- **Translations are generated, not retyped.** A script reads the RN `translations.ts` and writes
  the Xcode string catalog: 7 languages, 328 keys.
- **The same "random" picks.** Ayer uses a string hash to choose the daily notification message,
  the notification photo and the widget photo. The Swift unit tests check against fixtures produced
  by running the original TypeScript, so both apps pick the same photo on the same day.
- **Layout maths is unit-tested:** collage and memory-card layouts, pan/zoom clamping, WCAG
  contrast, and the day windows. Day windows are where the edge cases live: DST changes, 29 February,
  and photos from before 2000.
- **Screenshots of both apps.** Every screen was captured from the RN app itself and from the
  native one, in light and dark mode, and compared.

![Home screen, React Native vs native Swift](/images/ayer-native-swift/parity-home-light.webp)

*The date format differs only because the two simulators had different region settings.*

Then came the real question: is it actually faster?

## Rule one: same steps, same checks, same library

The benchmark had to treat both apps as black boxes. If the RN app is measured with one tool and
the native app with another, you're comparing tools, not apps.

### Both apps on one device

A separate XcodeGen spec adds a `Bench` build configuration: a Release build with its own bundle
ID and app group. It installs next to the RN app on the simulator, or next to the App Store app on my
phone, without touching its data. It lives in its own project (`AyerBench.xcodeproj`), so the project
I archive for the App Store has no `.bench` identifiers at all:

```yaml
# bench.yml (XcodeGen), on top of project.yml
include: [project.yml]
name: AyerBench
configs:
  Bench: release
settings:
  configs:
    Bench:
      AYER_APP_GROUP: group.com.chapiware.ayer.bench
      AYER_DISPLAY_NAME: Ayer Bench
targets:
  Ayer:
    settings:
      configs:
        Bench:
          PRODUCT_BUNDLE_IDENTIFIER: com.chapiware.ayer.bench
```

The RN side is a real **Release** build: Hermes bytecode, no Metro, no dev menu. That's what ships
to the App Store. Benchmarking a debug RN build would make native look better than it really is.

### One test target that drives any app

`BenchUITests` is an XCUITest target **with no host app**. It launches whatever bundle ID it's
given, so the exact same test code drives both apps:

```swift
private var bundleId: String { env["BENCH_BUNDLE_ID"] ?? "com.chapiware.ayer.bench" }
private lazy var app = XCUIApplication(bundleIdentifier: bundleId)
```

Environment variables reach the test runner through xcodebuild with a `TEST_RUNNER_` prefix:

```sh
TEST_RUNNER_BENCH_BUNDLE_ID=com.chapiware.ayer \
  xcodebuild test-without-building -project build/AyerBench.xcodeproj -scheme Bench -destination "id=$UDID" \
  -only-testing:BenchUITests/BenchmarkTests/test3_nextDayTimesTen
```

### Making two different apps look the same to a test

The trickiest part was defining "this day has loaded" so that it means the same thing in both
apps. Both label their thumbnails with the same translation key: `"Photo from 10/23/2024"`. So "the
day has loaded" means "a thumbnail with that day's date is on screen". But React Native's
accessibility tree is not UIKit's:

- **RN's `Pressable` has no button trait,** so `app.buttons["Next day"]` finds nothing. Controls
  are matched by label on any element type.
- **RN containers expose the concatenated labels of all their children.** A plain `CONTAINS`
  match therefore hits a parent view first. Thumbnails are matched with an exact pattern instead:

```swift
private func thumbnail(_ token: String) -> XCUIElement {
  app.descendants(matching: .any).matching(NSPredicate(
    // Exact pattern: RN containers expose the concatenated labels of all their children.
    format: "label MATCHES '^(Photo|Video) from [0-9]+/[0-9]+/[0-9]+$' AND label CONTAINS %@", token
  )).firstMatch
}
```

## A library worth measuring

My demo library has a few dozen photos, and every app is fast with a few dozen photos. Real
libraries have tens of thousands, with a few days (birthdays, Christmas, holidays) holding hundreds.

So I wrote a small generator in Swift. It draws 20,920 JPEGs with Core Graphics and stamps each one
with an EXIF capture date. The dates are spread over 2014–2026 and weighted towards weekends,
summers and recent years, like a real family library. A few heavy days get 300–480 photos each, and
the ten days after "today" get a steady load for the "next day" scenario.

```swift
let stamp = exifDate(item.date) // "2019:10:23 14:07:51"
let props: [CFString: Any] = [
  kCGImageDestinationLossyCompressionQuality: 0.82,
  kCGImagePropertyExifDictionary: [kCGImagePropertyExifDateTimeOriginal: stamp,
                                   kCGImagePropertyExifDateTimeDigitized: stamp],
]
CGImageDestinationAddImage(dest, render(item), props as CFDictionary)
```

Each image also gets thousands of small random squares of "grain", so the JPEGs compress like
photos rather than flat graphics. The 8 GB library went into the simulator in batches with
`xcrun simctl addmedia`.

**A gotcha with videos:** Photos ignores `com.apple.quicktime.creationdate` on import, and all 120
test videos showed up as taken "today". Photos reads the QuickTime `CreateDate` atom instead, which
I wrote with `exiftool -api QuickTimeUTC`.

## What gets measured

Every scenario uses XCTest's own performance metrics. `XCTCPUMetric` and `XCTMemoryMetric` take the
*app's* process (not the test runner's), so they measure Ayer, not XCUITest:

```swift
func test3_nextDayTimesTen() {
  let o = options
  o.invocationOptions = [.manuallyStart]
  measure(metrics: [XCTClockMetric(), XCTCPUMetric(application: app), XCTMemoryMetric(application: app)],
          options: o) {
    launchAndWaitForToday()           // not timed
    let next = control("Next day")
    startMeasuring()
    for offset in 1...10 {
      next.tap()
      XCTAssertTrue(waitForDay(offset: offset), "day +\(offset)")
    }
  }
}
```

`manuallyStart` and `manuallyStop` keep the setup out of the timed section. The scenarios:

| Scenario | What it does |
|---|---|
| First launch after install | Reinstall (resets the Photos permission), tap "Allow Full Access" in the real system prompt, time until the first photo appears |
| Cold launch → first photo | Terminate, launch, wait for today's first thumbnail |
| Launch (system metric) | `XCTApplicationLaunchMetric(waitUntilResponsive: true)`: from process start until the app responds to input |
| Next day ×10 | Tap "Next day" ten times, waiting each time for that day's photos |
| Scroll a busy day | 12 fast flicks through 349 photos, with the scroll signpost metrics |
| Viewer | Open the first photo and swipe through 15 |

### Being fair

A benchmark like this rewards whoever runs second, or whoever runs while the Mac is idle. The
runner script (`run.sh`) tries to remove that:

1. **Warm-up passes first.** After an import, Photos builds thumbnails lazily, so whichever app
   ran first would pay for it.
2. **Alternating order:** RN first in round 1, native first in round 2, and so on.
3. **One xcodebuild invocation per scenario,** so a failing scenario can't leave the app in a
   state that breaks the next one.
4. **Prompts are dismissed outside the timed sections.** The RN app's "Enjoying Ayer?" review
   sheet kept reappearing on the simulator, where StoreKit doesn't rate-limit it.
5. **Medians,** with standard deviations, over 2 rounds × 5 iterations.

Each run produces an `.xcresult` bundle per app, scenario and round. `xcresulttool` exports the metrics
as JSON, and a short Python script pools them per app and writes the report:

```sh
xcrun xcresulttool get test-results metrics --path native-r1-test3.xcresult --compact
```

## Results

iPhone 17 Pro simulator (iOS 26.5), 20,926 photos and 120 videos, measured on 23 October on the
finished port. The 2.0 that shipped has had review fixes and UI polish since then; I haven't rerun the
benchmark on that exact build.

| | React Native | Native Swift | |
|---|---|---|---|
| First launch: allow Photos → first photo | 2.17 s | **0.58 s** | 3.7× faster |
| Launch until responsive (system metric) | 1.48 s | **0.82 s** | 1.8× faster |
| Cold launch, CPU time | 4.37 s | **1.91 s** | 2.3× less |
| Cold launch, peak memory | 167 MB | **81 MB** | 2.1× less |
| Next day ×10, wall clock | 22.2 s | **13.6 s** | 1.6× faster |
| Next day ×10, CPU time | 35.8 s | **5.2 s** | 6.9× less |
| Tap "Next day" → photos on screen | 0.8–1.0 s | **0.34–0.37 s** | ~2.5× faster |
| Viewer, 15 photos, CPU time | 13.7 s | **4.9 s** | 2.8× less |
| Viewer, peak memory | 262 MB | **177 MB** | 1.5× less |
| Scroll a busy day, CPU time | 12.4 s | 13.2 s | same |
| Scroll, peak memory | 315 MB | **216 MB** | 1.5× less |

On size: the simulator `.app` bundles are 56 MB (RN) and 17 MB (native), but simulator builds aren't
what users download. The App Store download of 2.0 is 10.2 MB.

Two things stood out to me.

**First, the CPU column.** Moving ten days forward costs the RN app 35.8 s of CPU and the native
app 5.2 s. The wall-clock difference is much smaller (22.2 s vs 13.6 s), because most of the native
app's 13.6 s is XCUITest polling the screen. On a phone, CPU time is battery and heat, and that's
where the port pays off most.

**Second, the tie.** Scrolling through 349 photos costs the same CPU in both apps. That work is
thumbnail decoding inside Apple's Photos framework, and both apps call the same framework. So
native doesn't make *everything* faster. It removes the app's own overhead: launching,
loading a day, laying out the feed and running the viewer.

### Where does React Native's CPU go?

I didn't profile the RN app, so this is an explanation from reading the code, not a measurement.
To load a day, the RN app asks `expo-media-library` for that day's assets in every past year, page by
page, and each page's metadata crosses the old-architecture bridge as JSON. Then, on iOS, it calls
`getAssetInfoAsync` **once per photo** (five at a time) just to learn whether it's a favourite,
because the list call doesn't return that. A year with no photos on that day also triggers a fallback
scan of a page of recent assets, which exists for simulator imports. Finally every thumbnail URI goes to
`expo-image`, which goes back to Photos.

The native app makes a single `PHAsset.fetchAssets` call per day, with one date window per year
OR-ed together in the predicate. `isFavorite` comes with each `PHAsset`, and thumbnails come straight
from `PHCachingImageManager`. Some of that gap is React Native itself and some of it
is how my RN code used it. Instruments could say how much is which; I haven't done that.

## Videos you can trust

Numbers in a table are convincing to engineers. Everyone else wants to *see* it. So I recorded both
apps running a scripted walkthrough and put them side by side, each with its own timer:

<video src="/images/ayer-native-swift/scene-1-first-launch.mp4" poster="/images/ayer-native-swift/poster-first-launch.jpg" autoplay loop muted playsinline width="540"></video>

*First launch: tap "Allow Full Access", wait for the first photo.*

<video src="/images/ayer-native-swift/scene-3-next-day.mp4" poster="/images/ayer-native-swift/poster-next-day.jpg" autoplay loop muted playsinline width="540"></video>

*"Next day" five times, waiting for each day's photos.*

The recording is `xcrun simctl io <udid> recordVideo`. The test writes a Mac-clock timestamp at the
start and end of each scene (the simulator shares the Mac's clock), and ffmpeg cuts each scene out,
stacks the two phones and adds a header. It sounded like an afternoon. The first version was off by
more than two seconds.

### Problem 1: simctl only writes a frame when the screen changes

If nothing moves for five seconds, there's no frame for five seconds. Cutting at a timestamp and
resetting to zero (`setpts=PTS-STARTPTS`) treats the *next change* as time zero, so every clip
whose screen was still at the cut started late. The fix is to fill the gaps with ffmpeg's `fps`
filter (it repeats the last frame) *before* cutting.

### Problem 2: the recording's clock isn't the Mac's clock

Even with constant frames, the timers and the pictures disagreed. When I lined the recordings up
against known events, I found three problems:

- **Late starts:** a recording can start more than a second after simctl prints "Recording started".
- **Stalls:** while the RN app was busy launching, one recording stalled and lost 2.2 s.
- **Jittery timestamps:** frame timestamps jitter by up to a second under load, and some even go backwards.

The trick that fixed it was putting a clock inside the video. While recording, the script switches
the simulator's status-bar time with `simctl status_bar override`, and logs the Mac time of each
switch:

```python
def tick(self):
    i, gaps = 0, random.Random(7)
    while not self.done.wait(gaps.uniform(0.6, 1.6)):
        value = CLOCKS[i % 2]  # "1:11" or "8:88"
        subprocess.run(["xcrun", "simctl", "status_bar", self.udid, "override", "--time", value])
        self.ticks.append((time.time(), value))
        i += 1
```

Each switch is a screen change, so simctl writes a frame about 0.03 s later. That gives a sync
point roughly every second: this Mac time is that video time. Three details make it work:

- **No OCR.** "1:11" and "8:88" are told apart by counting the pixels in the clock region that
  differ strongly from its median colour: about 1,050 for "1:11" and 1,820 for "8:88". This works on
  the home screen, on the app's cream background and on dark screens.
- **Irregular gaps.** My first version switched exactly every second and alternated two values,
  so a lag of −1.1 s and a lag of +1.1 s matched equally well. With random 0.6–1.6 s gaps, only one
  alignment fits the sequence. The matcher finds the lag that best fits each switch and the next
  five, so it follows a stall of a couple of seconds without losing track.
- **Retiming every frame.** The sync points become a piecewise-linear ffmpeg `setpts`
  expression, which retimes every frame to Mac time. It looks something like
  `if(lt(T,12.31),(3.2+(T-11.5)*1.02),if(lt(T,…),…))`.
  Then each app's timer and its picture agree to within a frame or two.

The flickering clock is blurred in the final videos. The header (scene title, app names, timers)
is drawn frame by frame by a small Swift/AppKit tool, because my Homebrew ffmpeg has no text filter.

The videos show the difference; they don't measure it. Each is a single run with the screen
recorder using Mac CPU. The table above has the real numbers.

## The benchmark found bugs in my port

The best part: the 21,000-photo library found problems in the *native* app that the demo library
never would have.

**1. The first load could stall indefinitely.** Every Photos change notification restarted the
load. During an import, or while iCloud syncs a big library after install, notifications never stop,
so the app showed "Loading memories…" forever. Now changes are coalesced and an in-flight load is
allowed to finish:

```swift
private func libraryDidChange() {
  changeTask?.cancel()
  changeTask = Task {
    try? await Task.sleep(for: .milliseconds(800))
    guard !Task.isCancelled else { return }
    await loadTask?.value
    guard !Task.isCancelled else { return }
    clearCache()
    load(silent: true)
  }
}
```

**2. The viewer kept every page's full-screen image in memory.** Swiping through 15 photos peaked
at 404 MB, *more* than the RN app. Pages more than one step from the visible one now release their
image, and the peak dropped to 177 MB at the same speed:

```swift
ForEach(Array(assets.enumerated()), id: \.element.id) { index, asset in
  page(asset, isNear: abs(index - activeIndex) <= 1)
}
```

**3. On a fresh install, the reminder prompt covered the Photos permission screen.** The first-launch
scenario caught it: the test couldn't reach the permission screen's "Continue" button. RN shows that prompt
only after access is granted; native now does the same.

**4. A simulator-only helper for App Store screenshots ran in Release builds.** It made one Photos
call per photo, for up to 500 photos, on every load. It's now Debug-only.

Without the benchmark, numbers 1 and 2 would have reached users. They're also exactly the kind of
bug an agent won't find on its own with a demo library: the code was correct, it just didn't scale.

## What a simulator can't tell you

- **Absolute times aren't iPhone times.** My Mac's CPU is much faster than a phone's, so use the
  ratios.
- **Scroll smoothness can't be measured.** The simulator renders on the Mac's GPU, so hitches and
  dropped frames need a real device.
- **iCloud "Optimize Storage" libraries can't be tested.** The simulator has no iCloud photo
  library, and on a real phone, cloud-only thumbnails change everything.
- **The RN app sometimes stopped responding.** In 4 of 10 runs of "Next day ×10", the RN app
  ignored the first tap for more than 90 seconds after launch. It didn't reproduce reliably, so for
  now it's a lead, not a result.

The same runner works on a device: install "Ayer Bench" next to the App Store app, then run
`tools/bench/run.sh <iphone-id> 2 5` and leave the phone charging for an hour and a half. That's
the next post.

## What I'm taking away

- **Measure before you believe.** The CPU gains were bigger than I expected and the scrolling gains
  were zero. I'd have guessed it the other way around.
- **A benchmark is also a test suite.** It found two real bugs in my "finished" port, both of which
  only appear with a big library.
- **An agent can port an app, but "done" has to be something you can check.** Generated
  translations, fixtures from the original code, screenshots of both apps and a benchmark did more
  for parity than reading the diff ever could. The rest came from using it on my own phone.
- **Make the comparison fair before you make it fast.** That means a Release RN build, alternating
  order, warm-up passes and timers that exclude setup. Otherwise you're measuring the order your
  tests ran in.
- **When you can't trust a clock, put one in the picture.**

Next stop: running it all on my iPhone with my real library, and seeing whether the simulator told
the truth.
