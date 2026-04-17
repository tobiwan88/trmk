---
title: "Station Updates — Four Weeks of Debugging"
date: "2026-04-17"
---

# Station Updates — Four Weeks of Debugging

## Back from Taiwan

After two weeks in Taiwan eating my way through every night market I could find, I came back with a renewed sense of focus. The weather station project had been sitting at a "works well enough locally" stage, and I finally got annoyed enough by the tight coupling in the HTTP dashboard to do something about it.

The original design already had ZBUS for decoupling, but somehow the dashboard code had gotten tangled up with the sensor logic anyway. One clear prompt to Claude and we were refactoring.

## The Decoupling That Actually Stuck

The first step was splitting the HTML and CSS out of the C code. It felt embarrassing having presentation logic mixed into embedded C — not exactly how you'd want to show the code to anyone. Independent files meant the LVGL widget approach for the display also got cleaner. Adding new sensors meant adding widgets, and now both the web dashboard and the physical display pulled from the same clean data layer.

Turns out having separate files also made the redesign of the UI much less painful. Who knew.


![High level idea of the Display](../img/26_04_web1.png)

![High level idea of the Display](../img/26_04_web2.png)

![High level idea of the Display](../img/26_04_ui.png)

## Documentation First, Questions Later

One thing I've learned the hard way: maintenance starts the day you write the code, not six months later when you've forgotten everything. So before adding more features, we sorted out the architecture docs and updated the ADRs. Mermaid diagrams render nicely in the generated HTML, which made the whole thing more navigable than a wall of text.

Next up: CI. GitHub Actions, PR checks, and full integration tests with pytest. I'll write a separate post about the test setup — there's enough there to deserve its own writeup.

(https://github.com/tobiwan88/weather-station/actions/runs/24583292255)

## Then Security Happened

The API had zero authentication. Not great for something that lives on the internet, even if it's just my personal weather station. A quick token-based auth implementation seemed straightforward. Manual testing passed. I asked Claude to add integration tests.

That's when things fell apart.

## The Painful Path to Debuggable Firmware

Here's the thing they don't tell you about remote coding: sometimes the agent runs in circles because it can't actually see what's failing. My tests were failing, and Claude kept suggesting the wrong fixes — increase connection limits, change timeouts, add retries. Keep repeating from the start.

What actually happened: the HTTP server had a header length limit that was too short for the token in the Authorization header. `#HTTP_SERVER_MAX_HEADER_LEN` — short enough to truncate the token, long enough to make debugging painful.

The fix path:
1. Added better output in the test harness itself --> The harness and pytest did not have any debug prints in the begging
2. Turned up log levels
3. Found the actual root cause in the server config

Still not all error are fixed but at least tests are starting to be executable, slowly we have useful error logs and we get enough input about what is not yet running.


## Next Steps

Ensure all tests are green, 4 are still failing but the tokens did run out. Port to actual hardware. The different dev kits are sitting on my desk looking impatient. Let's see if it runs immediately or if we're in for another round of debugging.

Spoiler: probably the latter.