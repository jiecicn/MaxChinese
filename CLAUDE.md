# MaxChinese

A content curation system for high-quality Chinese reading material. An 8-year-old bilingual boy (Max) reads and recites selected passages daily via a PWA on his iPad.

## Project Structure

- `content/` — approved content YAML files, one per piece
- `sources/registry.yaml` — trusted source registry
- `techniques/registry.yaml` — normalized technique list (referenced by ID)
- `config.yaml` — content preferences (target sentence length)
- `site/` — PWA source (vanilla HTML/CSS/JS)
- `scripts/build.py` — reads YAML content → generates JSON for PWA
- `scripts/publish.sh` — builds site data and pushes to GitHub Pages
- `verification/logs/` — verification subagent audit trail
- `progress/gist-config.yaml` — GitHub Gist config for progress tracking

## Rules

### Content Rules
- Never mix Chinese and English in the same field. Every field is purely one language.
- English translations of content must come from published human translators, never LLM-generated.
- When a verified English translation cannot be found, record a `reference_pointer` to the likely published source.
- Expression patterns must reference techniques by ID from `techniques/registry.yaml`. No free-text technique names.
- Respect `target_sentences` in `config.yaml` as a soft preference for content length. Never hard-cutoff good content for being slightly over.

### Discovery Workflow
- When asked to generate passages (e.g., "Generate 3 passages for today"):
  1. Read `config.yaml` for target sentence length preference.
  2. Read `content/index.yaml` to check for duplicates before proposing.
  3. Read `sources/registry.yaml` to select from trusted sources.
  4. Propose candidates with full YAML structure matching the content data model.
  5. Spawn a verification subagent (see below) for each batch of candidates.
  6. Present verified results for user approval.
  7. Save approved content to `content/` and update `content/index.yaml`.
  8. Auto-queue: read the highest `queue_position` from all existing content files, then assign the new piece `queue_position = max + 1`. Never require the user to specify queue position manually.
  9. Build and publish: after saving all approved content files, run `python scripts/build.py` then `bash scripts/publish.sh` to push updates to GitHub Pages. This step is mandatory — never skip it.

### Verification Subagent
Always spawn a separate verification subagent before approving content. The subagent must:
1. **Text verification** — web search for the exact passage, confirm it exists in the claimed source.
2. **Attribution check** — confirm author, translator, publisher.
3. **Technique verification** — for each expression pattern, verify the technique label and explanation are correct. If any doubt, delete that technique entirely. Record verdict (kept/deleted) with reasoning.
4. **English translation lookup** (translated works only) — search for the published English version. If not found, record a reference_pointer.
5. Save verification log to `verification/logs/<content-id>.yaml`.

### Source Discovery Subagent
When asked to find new sources (e.g., "Find new sources"):
1. Read `sources/registry.yaml` to understand current sources.
2. Web search for similar/complementary sources — recommended reading lists, award winners, reputable translation series.
3. Verify each proposed source: publisher is real, translator is well-regarded, edition is findable, content is age-appropriate.
4. Present candidates with reasoning for user approval.
5. Add approved sources to `sources/registry.yaml`.

### Content Data Model
Each content file in `content/` follows this YAML structure:

```yaml
id: "YYYY-MM-DD-author-pinyin-title-pinyin-NN"
title: "标题"
author: "作者"
source:
  book: "书名"
  publisher: "出版社"
  edition: "版本"
  page: "页码"
  source_type: registry    # registry | open_discovery
  registry_entry_id: "src-XXX"  # if from registry
content_zh: |
  中文内容
content_en:
  text: null               # or the English translation text
  translator: null
  publisher: null
  reference_pointer: "..."  # pointer to where English version can be found
expression_patterns:
  - technique_id: "technique-id-from-registry"
    example: "原文例句"
    explanation_zh: "中文解释"
    explanation_en: "English explanation"
    practice_prompt_zh: "中文练习提示"
    practice_prompt_en: "English practice prompt"
tags:
  difficulty: 1-5
  themes: ["主题"]
  length: short | medium
  genre: prose | poetry | essay
verification:
  status: verified | partially_verified | rejected
  verified_date: "YYYY-MM-DD"
  method: "description of verification method"
  notes: "details"
  technique_verification:
    - technique_id: "id"
      verdict: kept | deleted
      note: "reason"
assignment:
  date: "YYYY-MM-DD"       # or null
  queue_position: N          # or null
```
