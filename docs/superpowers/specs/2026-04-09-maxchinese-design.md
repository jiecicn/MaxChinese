# MaxChinese Design Spec

## Overview

MaxChinese is a long-running personal project to curate high-quality Chinese content for an 8-year-old bilingual boy (Max) to read and recite daily. The goal is to accumulate materials that improve Max's expressive ability in Chinese by exposing him to great writing and helping him internalize literary techniques through examples and practice.

## Core Principles

- Content quality over quantity. Every piece must trace back to a verified, reputable source.
- Chinese and English are never mixed in the same field. Max is a native speaker of both, and each language is presented cleanly.
- English translations of content must come from published human translators, never LLM-generated. When a verified English translation cannot be found, a reference pointer to the likely published source is recorded instead.
- The system runs entirely locally. Max only sees the published PWA. There are no servers, scheduled jobs, or automated runs.
- You (the parent) trigger every action and approve every piece before it reaches Max.

## Content Preferences

File: `config.yaml`

```yaml
content_preferences:
  target_sentences: 3    # soft target — discovery agent prefers content close to this length
```

The `target_sentences` is a preference, not a hard cutoff. The discovery agent favors passages near the target but will not reject a great passage that's slightly longer or shorter. The further a passage is from the target, the stronger the reason needs to be to include it. Quality and completeness always win over length.

You adjust over time as Max progresses:

> "Set target length to 6"

This updates `config.yaml` and all future discovery sessions follow the new preference.

## System Architecture

```
+------------------------- Local Machine --------------------------+
|                                                                   |
|  +---------------+    +--------------+    +-------------------+   |
|  | Content       |--->| Verification |--->| Approved Content  |   |
|  | Discovery     |    | Subagent     |    | Store (YAML)      |   |
|  | (Claude)      |    |              |    |                   |   |
|  +---------------+    +--------------+    +---------+---------+   |
|        ^                                            |             |
|        | Manual trigger                             | git push    |
|                                                     v             |
|  +---------------+                     +---------------------+    |
|  | Source        |                     | Static Site Builder |    |
|  | Discovery     |                     | (PWA generator)     |    |
|  | Subagent      |                     +----------+----------+    |
|  +---------------+                                |               |
|                                                   |               |
|  +---------------+                                |               |
|  | Source        |                                |               |
|  | Registry      |                                |               |
|  +---------------+                                |               |
+---------------------------------------------------+---------------+
                                                    |
                                       +------------v-------------+
                                       | GitHub Pages (PWA)       |
                                       | Max browses here         |
                                       +--------------------------+
                                                    |
                                       +------------v-------------+
                                       | GitHub Gist              |
                                       | Progress tracking        |
                                       +--------------------------+
```

### Components

- **Content Discovery**: The main Claude session. Proposes passages based on your requests. Sources from the registry, open search, or your manual paste.
- **Source Discovery Subagent**: Researches and proposes new sources for the registry. Analyzes existing sources to find similar ones, identifies gaps, verifies publisher/translator reputation.
- **Verification Subagent**: Independently verifies every proposed piece before approval. Never trusts the discovery agent's claims.
- **Approved Content Store**: Local YAML files, one per piece, in `content/`.
- **Static Site Builder**: Reads content files and generates PWA assets.
- **GitHub Pages**: Hosts the PWA. Max accesses it from his iPad.
- **GitHub Gist**: Stores Max's progress (finished, skipped, usage day count).

## Three Subagents

| Subagent | Trigger | Job |
|----------|---------|-----|
| Source Discovery | "Find new sources" or similar | Research and propose new registry entries. Analyzes existing registry, searches for similar/complementary sources, verifies publisher reputation, confirms age-appropriateness. |
| Content Discovery | "Generate 3 passages for today" or similar | Find passages from registry or open sources. Checks deduplication index. Extracts expression patterns. |
| Verification | Automatic after content discovery | Verifies text authenticity, attribution, technique analysis, and English translation lookup. Deletes any technique it has doubt about. |

## Content Data Model

Each piece is a YAML file in `content/`:

```yaml
id: "2026-04-09-zhu-ziqing-spring-01"
title: "春 (节选)"
author: "朱自清"
source:
  book: "朱自清散文集"
  publisher: "人民文学出版社"
  edition: "2005年版"
  page: "12-13"
  source_type: registry       # registry | open_discovery
  registry_entry_id: "src-001"

content_zh: |
  小草偷偷地从土里钻出来，嫩嫩的，绿绿的。
  园子里，田野里，瞧去，一大片一大片满是的。

content_en:
  text: null
  translator: null
  publisher: null
  reference_pointer: "See 'Selected Essays of Zhu Ziqing', Panda Books edition, Chapter 2"

expression_patterns:
  - technique_id: "personification"
    example: "小草偷偷地从土里钻出来"
    explanation_zh: "把小草当作人来写，好像它会偷偷做事——让大自然变得活泼有趣"
    explanation_en: "Giving grass human behavior (sneaking out) — makes nature feel alive and playful"
    practice_prompt_zh: "用拟人的手法描述一种你喜欢的动物或植物"
    practice_prompt_en: "Use personification to describe an animal or plant you like"
  - technique_id: "reduplication"
    example: "嫩嫩的，绿绿的"
    explanation_zh: "把字重复一遍，感觉更柔和、更生动，比单独说'嫩'或'绿'好听"
    explanation_en: "Repeating the character intensifies the feeling — softer and more vivid than just saying it once"
    practice_prompt_zh: "用叠词描述你今天看到的一样东西"
    practice_prompt_en: "Use reduplication to describe something you saw today"

tags:
  difficulty: 2              # 1-5 scale
  themes: ["春天", "自然"]
  length: short              # short | medium
  genre: prose

verification:
  status: verified           # verified | partially_verified | rejected
  verified_date: "2026-04-09"
  method: "web_search + source_match"
  notes: "Exact text confirmed against 人民文学出版社 2005 edition"
  technique_verification:
    - technique_id: "personification"
      verdict: kept
      note: "Correct — 偷偷地 clearly personifies the grass"
    - technique_id: "reduplication"
      verdict: kept
      note: "Correct — 嫩嫩的，绿绿的 is textbook reduplication"

assignment:
  date: "2026-04-10"        # specific date, or null
  queue_position: null       # position in next-up queue, or null
```

### Rules

- Chinese and English are never mixed in the same field.
- `expression_patterns` reference techniques by ID from the technique registry.
- `content_en` is only populated for translated works, and only with verified published translations.
- `verification` block records the full audit trail including per-technique verdicts.

## Source Registry

File: `sources/registry.yaml`

```yaml
sources:
  - id: "src-001"
    title_zh: "朱自清散文集"
    title_en: "Selected Essays of Zhu Ziqing"
    author: "朱自清"
    publisher: "人民文学出版社"
    type: original
    notes: "Classic prose, many passages suitable for children"

  - id: "src-002"
    title_zh: "小王子"
    title_en: "The Little Prince"
    author: "Antoine de Saint-Exupery"
    translator_zh: "周克希"
    publisher_zh: "上海译文出版社"
    publisher_en: "Mariner Books (Katherine Woods translation)"
    type: translated
    notes: "周克希 translation is highly regarded; Woods English translation is the classic"
```

### Cold Start Seed Sources

The registry ships with a pre-populated starter list:

| Category | Examples |
|----------|----------|
| Classic prose | 朱自清, 老舍, 冰心, 丰子恺, 汪曾祺 |
| Modern children's lit | 曹文轩, 林清玄, 金波 |
| Poetry | 小学生必背古诗词, 金子美铃 (translated) |
| Translated classics | 小王子 (周克希译), 夏洛的网 (任溶溶译), 安徒生童话 (叶君健译) |
| Essay collections | 《读者》精选, 《意林》少年版 |

### Source Discovery Subagent

Triggered by requests like "Find new sources" or "Find translated children's books with well-regarded Chinese translations." The subagent:

1. Analyzes the existing registry to understand the current pattern.
2. Researches new sources via web search — recommended reading lists, award winners, reputable translation series.
3. Proposes candidates with reasoning for why each fits.
4. Self-verifies: publisher is real, translator is well-regarded, edition is findable, content is age-appropriate.
5. You approve or reject. Approved entries are added to the registry.

## Technique Registry

File: `techniques/registry.yaml`

```yaml
techniques:
  - id: "personification"
    name_zh: "拟人"
    name_en: "personification"
    description_zh: "把事物当作人来描写，赋予它人的动作或感情"
    description_en: "Describing things as if they were human, giving them human actions or feelings"

  - id: "reduplication"
    name_zh: "叠词"
    name_en: "reduplication"
    description_zh: "把字重复使用，加强语气或使描述更生动"
    description_en: "Repeating characters to intensify feeling or make descriptions more vivid"

  - id: "simile"
    name_zh: "比喻"
    name_en: "simile"
    description_zh: "用一个事物来比另一个事物，使描写更形象"
    description_en: "Comparing one thing to another to make descriptions more vivid"
```

### Cold Start

Ships with ~20-30 common techniques pre-populated. New techniques can be proposed by the verification subagent when it encounters one not in the registry. You approve before it is added.

### Normalization

All content files reference techniques by ID, not free text. This ensures the technique browser in the PWA aggregates correctly.

## Deduplication

File: `content/index.yaml` (auto-generated)

```yaml
entries:
  - id: "2026-04-09-zhu-ziqing-spring-01"
    author: "朱自清"
    source: "朱自清散文集"
    content_hash: "a3f2c8..."    # hash of content_zh field
    first_line: "小草偷偷地从土里钻出来"
```

Before proposing any candidate, the content discovery step checks this index for:
- Exact duplicates (same passage from same source, matched by content hash).
- Overlapping excerpts (substantial overlap with an existing piece from the same chapter/section).

Duplicates are silently skipped. The index is auto-maintained when content is approved or removed.

## Verification Subagent

Spawned as a separate Claude agent for each batch of candidates. Scope:

1. **Text verification** — search the web for the exact passage, confirm it exists in the claimed source.
2. **Attribution check** — confirm author, translator, publisher are correct.
3. **Technique verification** — for each extracted expression pattern:
   - Is the technique label correct for this example?
   - Is the explanation accurate?
   - If any doubt, delete that technique entirely. Never risk teaching Max something wrong.
   - Record verdict (kept/deleted) with reasoning.
4. **English translation lookup** (for translated works) — search for the published English version from the registry's English publisher. If found, include it. If not, record a reference_pointer.
5. **Final verdict** — `verified`, `partially_verified`, or `rejected`.

### Verification Output Log

Stored in `verification/logs/<content-id>.yaml` for audit trail.

## PWA for Max

### Tech

- Progressive Web App hosted on GitHub Pages.
- Max adds it to his iPad home screen — launches fullscreen, has its own icon, works offline.
- Progress stored in a GitHub Gist (single `progress.json` file) via GitHub API with a scoped `gist`-only token.

### Views

#### 1. Today's Reading

- Shows today's date prominently at the top.
- Shows today's assigned piece(s).
- Large, readable Chinese text.
- Expression patterns below with explanations and practice prompts.
- Language toggle button — switches explanations between Chinese and English. For translated works, also toggles the content text.
- **"Finish" button** — marks the piece as completed.
- **"Skip" button** — marks the piece as too difficult, saves for later.

#### 2. History

- Calendar or list view of completed pieces.
- Streak counter (consecutive usage days) for motivation.

#### 3. Technique Browser

- Lists all techniques encountered in the collection.
- Tap a technique to see:
  - The technique explanation (zh and en).
  - All examples from the collection that use this technique, each linking back to its source piece.
  - The practice prompts for each example.
- Grows richer over time as more content is added.

### Assignment Mechanism

Each content file has an optional `assignment` block:

```yaml
assignment:
  date: "2026-04-10"        # show on this date
  queue_position: 3          # or show as next-up in queue
```

The PWA checks today's date and shows assigned pieces. If nothing is assigned for today, it shows the next item in the queue.

### Skip and Resurface

When Max taps "Skip":

```yaml
- id: "2026-04-09-zhu-ziqing-spring-01"
  status: skipped
  skipped_date: "2026-04-10"
  resurface_after_days: 60
  usage_days_at_skip: 12
  resurface_at_usage_day: 72
```

- **Usage days, not calendar days.** A usage day is any day Max taps Finish or Skip on at least one piece. If Max uses the app 3 times a week, 60 usage days is roughly 5 months.
- When his usage day count reaches `resurface_at_usage_day`, the skipped piece re-enters the queue with no special label — a fresh encounter.
- If skipped again, the interval doubles (60 -> 120 usage days). Spaced repetition — if still too hard, wait longer.
- If finished on resurface, marked completed like any other piece.

## Project Directory Layout

```
MaxChinese/
├── content/
│   ├── index.yaml                        # auto-generated dedup index
│   ├── 2026-04-09-zhu-ziqing-spring-01.yaml
│   └── ...
├── sources/
│   └── registry.yaml                     # trusted source registry
├── techniques/
│   └── registry.yaml                     # normalized technique list
├── site/                                 # PWA source
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── css/
│   ├── js/
│   └── assets/
├── scripts/
│   ├── build.py                          # content -> PWA assets
│   ├── discover.py                       # content discovery helpers
│   └── publish.sh                        # build + push to GitHub Pages
├── verification/
│   └── logs/                             # verification audit trail
├── progress/
│   └── gist-config.yaml                  # Gist ID + token reference
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-09-maxchinese-design.md
└── CLAUDE.md
```

## CLAUDE.md Project Instructions

The CLAUDE.md file ensures every future Claude session working in this repo follows the rules:

- Always spawn a verification subagent before approving content.
- Never mix Chinese and English in the same field.
- English translations must come from published sources, never LLM-generated.
- Techniques must reference the technique registry by ID.
- Check deduplication index before proposing content.
- Source discovery subagent must self-verify publisher/translator reputation.
- Respect `target_sentences` in `config.yaml` as a soft preference for content length. Never hard-cutoff good content for being slightly over.
- Skipped content resurfaces by usage days, not calendar days.

## Typical Workflow

```
1. Start a Claude Code session in MaxChinese/
2. "Generate 3 passages for today"
   - Content discovery agent selects candidates
   - Checks dedup index to avoid repeats
   - Mixes sources from registry, varies themes and techniques
3. Verification subagent runs automatically on all candidates:
   - Text authenticity
   - Attribution
   - Technique analysis (delete if doubtful)
   - English translation lookup (translated works)
4. You review verified results, approve or reject
5. Approved content saved to content/, index updated
6. Assign pieces (date or queue position)
7. Run publish.sh -> build PWA, push to GitHub Pages
8. Max opens app on iPad, reads, taps Finish or Skip
```

Other commands:
- "Find new sources" -> Source discovery subagent expands registry
- "Show me what's in the registry from [source]" -> Browse existing sources
- Paste content manually -> Goes through same verification pipeline
