# components/nara/

Nara's design system components. This is where the product's visual identity lives.

Feature code should import from here — not directly from `components/ui/`.
Raw shadcn primitives in `components/ui/` are unstyled building blocks;
components here wrap and restyle them with Nara's tokens (paper, ink, clay,
sentiment spectrum, Fraunces display type, etc.).

See `DESIGN_SYSTEM.md` at the project root for the full specification.
See `lib/design/tokens.ts` for typed token constants.
