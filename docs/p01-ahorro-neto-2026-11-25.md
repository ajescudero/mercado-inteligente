# P01 — Net savings with travel estimates and visit limits

Implemented locally on 25 November 2026. P01 extends the existing basket
comparison; it does not replace product identity or the user's requested
quantities.

## Objective and assumptions

For a feasible assignment:

```text
total = SEPA product subtotals
      + number of branches actually used × estimated cost per visit
      + saved online product subtotals
      + estimated total online delivery

net savings = current-list total under the same rules − alternative total
```

Every requested SEPA item must be covered. Online lines and their delivery estimate
stay fixed. Delivery does not count as a physical visit. The maximum is one, two
or three branches; it is not an instruction to use all allowed branches.

Costs are evaluated in centavos. The visit cost is uniform and entered by the
user. There is no route, distance, opening-hours or stock model. A zero estimate
does not mean the system verified free travel/delivery.

## Search and correctness

The implementation enumerates branch subsets up to the limit and evaluates
coverage and the cheapest eligible assignment within each. Only branches actually
used are charged. Every feasible assignment uses an enumerated subset under the
bounded model; no fuzzy-name substitutions are introduced.

Ties prefer fewer visits and fewer changes from the current list. The UI displays
complete single-branch options and the best multi-branch option per allowed
visit count. It initially shows three results with an expansion control.

Work grows with products and the sum of branch combinations up to K. K is capped
at three; this is not an unbounded scalable routing solver. Assignment-dependent
promotions, minimum spends or route costs would require revisiting the model.

## User behavior

The comparison separates products, travel and delivery, and shows source age.
Invalid or empty cost inputs block application. Estimates stay while the screen
is mounted but are not persisted after reload. The cart total remains the product
amount; its text explains the difference.

No complete feasible combination yields a clear empty state and keeps the list.
Applying a combination preserves quantities and all online items.

A hypothetical example: products cost ARS 9,000 across two branches or ARS 10,000
at one. At ARS 1,500 per visit, totals become ARS 12,000 and ARS 11,500, so one
branch wins. This is an illustrative calculation, not measured customer savings.

## Evidence and implementation

- [Calculation](../lib/net-savings.ts)
- [Comparison interface](../components/Cart/OptimizationModal.tsx)
- [List integration](../components/Cart/CartDrawer.tsx)
- [Tests](../tests/net-savings.test.ts)

Tests include costs reversing the recommendation, full coverage and visit limits,
quantities and online items, centavo rounding and ties, three necessary branches,
invalid input and empty lists. An independent oracle enumerates assignments
rather than copying the production subset algorithm across 54 small cases.

The original delivery recorded browser checks on desktop and 390/320-pixel widths,
including keyboard focus and preserved test quantities. The later Figma integration
kept the calculation and tests while applying the shared typography and colors.
Current reproducible check results belong in [validation](validation.md), not
in an undated claim that all future versions pass.
