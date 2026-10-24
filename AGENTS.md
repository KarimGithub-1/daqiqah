# Daqiqah project guidance

This is a local-first Arabic React/Vite learning game for young adults and adults.
Preserve the current framework and local-only architecture. Do not add paid APIs,
authentication, a database, publishing, or GitHub integration unless the user asks.

Use the installed frontend-design, ui-ux-pro-max, motion, and web-design-guidelines
skills when applicable. ENVIRONMENT.md records their official sources and the
limits of the connected tools. Do not claim Mobbin or MotionScore access.

Keep ten genuinely distinct game interactions. Branching communication scenarios
must use contextual, plausible consequences, acknowledge tradeoffs, and avoid
claiming to know another person's intentions. Never turn the whole experience
into a reskinned multiple-choice quiz. All activity types start available; deeper
content unlocks within each type. No hearts, lost XP, or forced timers.

Use the existing Noto Sans Arabic font and local assets. Support RTL, visible
keyboard focus, keyboard alternatives, 44px touch controls, mobile safe areas,
and reduced motion. Motion owns game feedback; GSAP owns only the optional
artwork scroll enhancement. Clean up animation effects on navigation.

Run npm test and npm run build after meaningful changes. Test changed behavior
in a real browser, review phone and desktop layouts, and document actual limits
in TESTING.md. Add content in src/gameData.js with stable unique IDs.
