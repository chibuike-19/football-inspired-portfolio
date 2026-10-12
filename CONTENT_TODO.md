# Content TODO

Until resolved, the site hides or omits these items rather than inventing values.

## Needs attention
- [ ] **Your phone number is in `public/resume.pdf`.** The site itself doesn't show it, but anyone who downloads the résumé will see it. If you don't want it public, export a version without the phone number and replace the file.
- [ ] **Stream2Peer's live site (stream2peer.mov) is down**: the domain no longer resolves. The board links to the GitHub repo and your merged PRs only. If a new live URL exists, add it to `content/projects.ts`.
- [ ] Approve or edit the intro and bio in `content/profile.ts`.

## Rova / FCMB products (added 2026-10-12)
- [ ] Official names: the mobile app is shown as "FCMB Corporate Mobile" and the admin portal as "Corporate Banking Admin Portal" (working names, `content/projects.ts`).
- [ ] Mobile app store links (App Store / Google Play), if the app is public. Until then the card says "Mobile app for FCMB corporate customers".
- [ ] roadmap.sh: the résumé says 15 merged PRs; GitHub shows 6 merged PRs by `chibuike-19` in `nilbuild/developer-roadmap` (the site links to that list), so the site states no count. Tell me where the other PRs are (another account or repo) to show the number.
- [ ] KAM Holding: confirm what you built on kamholding.net. The card says you built the Next.js site including divisions/subsidiaries, CSR, media, careers, quotation/enquiry forms and newsletter sign-up.
- [ ] Résumé PDF (updated 2026-10-12): still shows the phone number and education (both kept off the site), the visible GitHub text `chubuike-19` (link is correct), and Rova as "Senior Frontend Engineer (contract), Lagos" while the site follows LinkedIn ("Senior Frontend Developer, London · Remote").

## Blog and photo (added 2026-10-12)
- [ ] When the first post is ready: replace `app/blog/page.tsx`, remove its `robots: { index: false }` and add `/blog/` to `app/sitemap.ts`.
- [ ] A larger photo (512 px or more) would make the hero tile sharper on high-density screens; the current one is 200 px (`public/avatar.jpg`, also the favicon source).

## Journey (3D) — open items
- [ ] Phones: Playbook and Career Highlights have portrait framing; step 6 adds it for the remaining chapters.
- [ ] Trophy chapter uses placeholder camera positions until the trophy room (step 5) is built; the move from the tunnel to them is temporary.

## Optional
- [ ] Project screenshots. DevSpot: any you can share. FCMB: only with client permission. Otherwise boards stay typographic.
- [ ] Domain: set `NEXT_PUBLIC_SITE_URL` at build time (see README).
- [ ] Résumé PDF: the visible GitHub text reads `chubuike-19` (the clickable link is correct), and its titles and dates differ from LinkedIn, which the site follows.

## Resolved
- Headline is "Senior Full-Stack Engineer" (owner, 2026-10-12). Hero signals and capabilities use only figures from the résumé and LinkedIn.
- Stream2Peer and roadmap.sh added as boards.
- JudgeBot and builder matching are AI features built in Python.
- No "open to roles" banner. Phone number not shown on the site. Email is `emmanuelobiechina8@gmail.com`.
- LinkedIn is the source of truth where it conflicts with the résumé.
- Education omitted from the site.
- KAM Holding moved from experience to projects (owner, 2026-10-12).
- Stream2Peer: co-founder & developer (owner and updated résumé, 2026-10-12).
- Rova tech tags limited to what the sources state (no TypeScript or Jest claimed for Rova).
