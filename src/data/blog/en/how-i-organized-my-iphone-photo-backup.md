---
title: "How I organized a huge iPhone photo backup by year and month"
description: "A small script that turns a chaotic Image Capture export into a chronological archive without touching the originals."
pubDatetime: 2026-07-13T10:00:00Z
tags: ["scripts", "photography", "backup"]
draft: false
locale: "en"
translationKey: "iphone-photo-backup"
---

I had a fairly ordinary problem, only on a less-than-ordinary scale: many, many gigabytes of photos and videos on my iPhone.

I wanted a local copy on an external drive. Getting them off the phone with macOS Image Capture was easy, but the resulting folder was full of names such as `IMG_4829.HEIC` and `IMG_4830.MOV`. That is a backup, but it is not a photo library you actually want to browse.

So I made a small Bash script that walks through that export recursively and creates a second, organized copy.

## The result

By default, every file ends up in a year-and-month structure with a sortable name:

```text
Organized/
└── 2024/
    └── 08/
        └── 2024-08-17__14-32-09.jpg
```

The format is intentionally boring: year, month, day and time. Browsing folders or sorting by filename therefore means sorting chronologically, in Finder and on any future drive or computer.

## Which date it uses

The creation date of a file does not always tell you when a photo was taken: it may have been copied, exported or restored years later. The script therefore gives priority to the image or video’s capture metadata.

If that is unavailable, it falls back to the date embedded in the filename and, finally, to the filesystem modification date. That ordering gives a useful result without pretending that every old or edited file has perfect metadata.

## Safety first

The script never changes the originals. It creates a new tree, copies each file into it and leaves the Image Capture export alone. I wanted the operation to be easy to repeat and safe to interrupt.

It also handles name collisions rather than silently overwriting files. Two photos taken in the same second should not cause either photo to disappear.

## Why a script instead of an app

There are excellent photo-library applications, but this was a very narrow job: make a durable, browsable archive from a pile of files. A small script is transparent, portable and does not lock the archive into a particular product.

The point is not to replace Apple Photos. It is to have a second copy whose structure still makes sense years from now, even if there is no database or app around it.

For the shell script and the original, more detailed explanation, see the [Spanish version](/posts/como-organice-mi-copia-de-fotos-del-iphone/).
