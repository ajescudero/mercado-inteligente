# Roadmap

Implemented: catalog search/filtering, regional vocabulary, canonical basket
comparison, local list persistence, separate online offers, reference explorer,
Figma-derived visual system and P01 net savings. The repository now includes an
empty schema initializer and a provider-independent development check command.

Next work, in proposed priority order:

1. **Reproduce data acquisition externally.** Run an authorized fresh official
   import in an independent environment and document disk/time/failure behavior.
   The synthetic archive test does not prove the current upstream site is unchanged.
2. **Evaluate search quality.** Build a separately reviewed query set with positive
   and negative examples by category; report precision and missed products.
3. **Operational reliability.** Coordinate concurrent updates, test restoration,
   and define monitoring before scheduling automatic publication.
4. **UI verification.** Automate principal journeys and extend manual testing of
   assistive technology, zoom and slower devices.
5. **Reduce legacy surface.** Retire unused screens and historical importers after
   verifying compatibility API consumers.
6. **External validation.** Observe real purchase tasks with consent; distinguish
   modeled savings from amounts actually paid.
7. **Production decision.** Choose hosting, access model, persistent storage and
   security controls only when a public service is intended.

Package combinations, food-label alerts, promotions and stock-aware decisions
remain exploratory. They require additional evidence and are not included merely
because a competitor or visual template offers something similar.
