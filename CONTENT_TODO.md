# Content TODO

Until resolved, the site hides or omits these items rather than inventing values.

## Needs attention
- [ ] **Your phone number is in `public/resume.pdf`.** The site itself doesn't show it, but anyone who downloads the résumé will see it. If you don't want it public, export a version without the phone number and replace the file.
- [ ] **Stream2Peer's live site (stream2peer.mov) is down**: the domain no longer resolves. The board links to the GitHub repo and your merged PRs only. If a new live URL exists, add it to `content/projects.ts`.
- [ ] Approve or edit the intro and bio in `content/profile.ts`.

## Optional
- [ ] Project screenshots. DevSpot: any you can share. FCMB: only with client permission. Otherwise boards stay typographic.
- [ ] Domain: set `NEXT_PUBLIC_SITE_URL` at build time (see README).
- [ ] Résumé PDF: the visible GitHub text reads `chubuike-19` (the clickable link is correct), and its titles and dates differ from LinkedIn, which the site follows.

## Resolved
- Stream2Peer and roadmap.sh added as boards.
- JudgeBot and builder matching are AI features built in Python.
- No "open to roles" banner. Phone number not shown on the site. Email is `emmanuelobiechina8@gmail.com`.
- LinkedIn is the source of truth where it conflicts with the résumé.
- Education omitted from the site.
- KAM Holding is listed with title and dates only.
- Rova tech tags limited to what the sources state (no TypeScript or Jest claimed for Rova).
