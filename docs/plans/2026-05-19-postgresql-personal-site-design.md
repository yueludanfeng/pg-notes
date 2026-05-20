# PostgreSQL Personal Site Design

## Goal

Build a clean personal technical site for a PostgreSQL-focused database writer. The site should feel close to a serious technical blog: simple navigation, centered personal identity, clear social/contact links, highlighted articles, recent posts, and topic categories.

## Reference Direction

The site references the structure and mood of lastdba.com: minimal header, centered profile block, article cards, compact metadata, and a calm reading-first layout. It should not copy exact content or branding.

## Initial Structure

- Header navigation: Home, Cases, Internals, Optimization, HA, Notes, About
- Hero/profile: avatar mark, name, tagline, social links, short bio, stats
- Featured reading: four article cards around PostgreSQL operations and learning
- Recent posts: chronological article list
- Topic lanes: practical categories for future content expansion
- About/contact: personal introduction and contact entry points

## Implementation

Use a static HTML/CSS/JavaScript site with no build step. Keep assets local and simple. Support dark mode with a persisted user preference.

## Verification

Open the local HTML page in a browser and inspect desktop and mobile layouts for readability, spacing, and overlap.
