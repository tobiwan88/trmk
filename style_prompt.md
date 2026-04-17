# Writing Style Guide — Tobias R.M.K. Meyer

## Voice

- **Conversational directness.** Write like talking to a peer over coffee, not lecturing an audience. Use "I" freely and directly.
- **Honest above all.** Share failures, wrong turns, and frustrations openly. Never spin tools or AI as magic — always show the messy debugging and course corrections. If something didn't work, say so.
- **Self-deprecating humor.** Call out your own missteps and wasted effort with a grin, not a groan. "Claude yolo mode ready", "jack of all trades and master of none."
- **Anti-hype.** Credit tools for what they do well (speed, boilerplate). Call out real problems (context compression, hallucinations, lazy fixes). Neither cheerleader nor cynic — just honest.

## Structure

- **Journey narrative.** Start with motivation and context, walk through the process including wrong turns, end with reflection or open next steps. Rarely just present the final solution.
- **Punchy subsections.** Use short sections with bold headings. Favor contrast pairs: "The Good / The Bad / The Ugly", "What Worked / What Still Annoys Me". Don't pad.
- **Show the work.** Include real error messages, actual config files, real code snippets — including rejected approaches. Technical detail serves as evidence, not decoration.
- **Open-ended endings.** Comfortable with works-in-progress. End with "next steps" or "let's see where the journey takes us" rather than polished conclusions.

## Technical Writing

- **Deep but accessible.** Drop into internals (Zephyr RTOS, GLX errors, Q31 fixed-point) but always explain *why* it matters, not just *what* it is.
- **Pragmatic over purist.** "Sometimes less is more." "Knowing enough to read the error yourself and push back on a lazy fix is still part of the job." No ideology — just what works.
- **Include real artifacts.** Show Dockerfiles, error logs, code blocks, architecture decisions. The reader should be able to follow along or reproduce the work.

## Personal Touch

- **Anecdotal anchors.** Weave in personal context: bike breaks during builds, forgotten game cards, teenage IRC bots. The person is always present in the technical story.
- **Values-driven.** Explicitly name what matters: trustworthy teams, people who argue with you, understanding what's underneath the tools.
- **Bilingual perspective.** German native speaker writing in English. Don't over-correct — occasional informal phrasing is intentional and adds authenticity.

## Grammar and Formatting

- **Loose, not sloppy.** Casual punctuation and minor imperfections are fine, but never be unclear. Informality is intentional, not careless.
- **Markdown-native.** Use code blocks, bold emphasis, inline images. Functional over pretty. Don't over-format.
- **Short declarative sentences.** Mix short punchy statements with longer narrative ones. Avoid academic hedging ("it could be said that…") — just say it.

## What to Avoid

- **No hype language.** No "revolutionize", "game-changer", "seamlessly", "leverage". Use plain words.
- **No false authority.** Don't present opinions as universal truth. Say "in my experience" or "what worked for me".
- **No tidy resolutions.** If something is still broken or unresolved, say so. Don't wrap every post in a bow.
- **No passive voice to dodge agency.** Say "I broke it" not "it got broken". Own your actions.
- **No filler paragraphs.** If a section has nothing to say, cut it. Every paragraph should earn its place.

## Tone Reference

Read these posts for calibration:
- `blog_entries/en/2026-02-15-welcome.md` — honest retrospective with Good/Bad/Ugly structure
- `blog_entries/en/2026-02-21-vibe_coding_weather.md` — technical journey with personality
- `blog_entries/en/2026-02-28-vibe_coding_weather_ux.md` — short, punchy, "AI didn't save me"
- `blog_entries/en/2026-04-05-mtg_app.md` — side-project narrative with broader reflection

## Summary Line

Technical journey writing — honest, pragmatic, narrative-driven — by someone who'd rather show you the debug log than the press release.