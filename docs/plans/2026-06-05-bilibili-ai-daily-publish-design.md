# Bilibili AI Daily Publish Design

## Goal

Run the existing Bilibili AI video collector every day at 09:00, generate an easy-to-read daily AI report, publish it into the `pg-notes` Hugo site, and push the site repository so GitHub Pages deploys it automatically.

## Recommended Approach

Keep the collector in `autoCapturePop-AI-Video` and add a small publisher module that writes Hugo Markdown into `pg-notes`.

This keeps scraping, ranking, and LLM summarization in the collector project, while the blog repository only receives normal Hugo content:

- `content/ai/_index.md` for the AI section landing page.
- `content/ai/YYYY-MM-DD-bilibili-ai.md` for each daily report.
- A new `AI 相关` top navigation item.

## Data Flow

1. Search Bilibili for Codex and Claude Code related videos.
2. Filter to recent videos based on the configured date window.
3. Deduplicate by `bvid`.
4. Rank videos by play count for `播放量 TOP5`.
5. Rank videos by a transparent combined score for `综合评价 TOP5`.
6. Ask the configured LLM to explain the selected videos in beginner-friendly language.
7. Write the report to Hugo Markdown.
8. Run `git add`, `git commit`, and `git push` in `pg-notes`.

## Combined Score

The combined score favors videos that are both watched and interacted with:

- Play count is the base signal.
- Danmaku and favorites add interaction weight.
- A small recency bonus helps newer videos compete fairly.

The page explains this score in plain language so readers know it is an automated ranking, not a human editorial judgment.

## Error Handling

- If the LLM key is unavailable, the existing fallback explanation is used.
- If no videos are found, no daily page is published.
- If the generated page is identical or no site files changed, the publisher skips the commit.
- If `git push` fails, the error is logged and the next scheduled run can try again.

## Testing

Unit tests cover:

- Combined-score ordering.
- TOP5 selection without duplicates.
- Hugo Markdown front matter and report sections.
- Git publisher behavior when files changed or when there is nothing to commit.
