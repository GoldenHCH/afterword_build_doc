# Demo seed content (phase 01)

Fetched 2026-11-03. Plain JSON; the `seedDemo` function turns ISO dates into Firestore Timestamps.

- `notes.json`: 3 notes written by hand (stuck / working_on / question). Keys: `intercoder`, `vla-finetuning`, `mamba-recall`.
- `sources.json`: 10 X handles of well-known AI/ML voices. A curated snapshot, not a placeholder; the live X adapter is off and posts are served from `posts.json`.
- `posts.json`: 7 real posts, text from `https://publish.twitter.com/oembed?url=<post url>` (HTML stripped, entities decoded, trailing `pic.twitter.com` links dropped, `t.co` links kept). Post ids found by viewing each account in the browser; dates decoded from the post id. No invented text.
- `briefing.json`: cached demo briefing. Papers come from OpenAlex (below), abstracts rebuilt from `abstract_inverted_index`, cut at 55 words. `whyThis` and `readingNote` written by hand from the abstracts / post text.
- OpenAlex query per note (filter `from_publication_date:2023-11-03,has_doi:true,has_abstract:true,type:article|conference-paper|preprint|book-chapter|book|review|dissertation|report`, `per-page=30`):
  `intercoder` → `search=intercoder reliability reflexive thematic analysis qualitative coding`
  `vla-finetuning` → `search=vision language action model robot manipulation fine-tuning`
  `mamba-recall` → `search=state space models Mamba long context recall`
- `seedDemo` should still fetch ~15 more papers live from OpenAlex; the briefing papers here are the hand-picked cached ones.
