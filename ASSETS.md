# Asset credits

## Skill Icons

`assets/skills.svg` is a static image generated using [tandpfun/skill-icons](https://github.com/tandpfun/skill-icons), distributed under the MIT license.

- Source reference: `7f7e691e71aec64e8354bf697835e009d1ad80f8`
- Retrieved: 2026-11-16
- Image endpoint: `https://skillicons.dev/icons?i=ts,nextjs,react,nodejs,firebase,python,java,git&theme=dark&perline=8`
- License: [third-party/skill-icons-LICENSE.txt](third-party/skill-icons-LICENSE.txt)

The hosted service does not expose its deployed commit. The source reference records the upstream revision inspected on the retrieval date; it does not assert that the service ran that exact revision.

## Profile headers and motion

`assets/header-light.svg` and `assets/header-dark.svg` combine custom layout with two open-source references from Pepper161's starred repositories. Both SVGs contain their own images and CSS animations, without scripts or remote font/image requests. The README's `picture` element selects `header-still-light.svg` or `header-still-dark.svg` when `prefers-reduced-motion: reduce` is set. These variants contain no animations and display the complete title with one ripple frame. The animated SVGs also include a reduced-motion media rule as a secondary fallback.

### pixelfx

- Source: [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx), revision `5294518ce7c72e48b6100a744596e0acf57f2826`.
- Effect: `water/ripples`, rendered at its original 136 × 52 resolution, 30 fps and 2-second cycle. The palette was changed to green, frames were packed into an embedded PNG strip and displayed at a larger scale.
- [MIT license](third-party/pixelfx-LICENSE.txt) and [upstream notices](third-party/pixelfx-NOTICE.md). Copyright (c) 2026 Patch and Hugo Duprez. No Patch Pixel font is included.

### Motion Prompt

- Source: [showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt), revision `683ecca0548a1754ada141d10dc3a009d4c59bef`.
- Element: [#005 Mask reveal](https://showheyohtaki.github.io/motion-prompt/#005). The title slides from opposite sides of a divider, with the original entrance timings, distances and quintic easing sampled into CSS keyframes. The layout is scaled; the words, fonts and palette are adapted for this profile. The entrance plays once and holds at the 1.4-second pose, following the project's porting guide. The looping exit is intentionally not used.
- [MIT license](third-party/motion-prompt-LICENSE.txt). Copyright (c) 2026 Shohei Ohtaki.

## GitHub activity

The live contribution chart is provided by the open-source [GitHub Profile Summary Cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) service, using its `github` and `github_dark` themes. These are live external images; availability and data freshness depend on that service and GitHub's image cache. The header's water animation is decorative and does not represent contribution data.
