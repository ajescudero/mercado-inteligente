# Third-party notices

| Material | Origin / notice | Scope |
| --- | --- | --- |
| Visual reference and exported grocery icons | [Grocery App by Omar Yassir](https://www.figma.com/community/file/1117545712205927220), attributed in the existing design integration under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Adapted colors, typography, icons, layout and states; flows and domain logic remain project-specific |
| DM Sans font files | [Bundled SIL Open Font License](public/fonts/OFL-DM-Sans.txt) | Four locally served font weights; retain the license with these files |
| Lucide icons | Installed `lucide-react` package and its license | Icons used for functions not covered by the design reference |
| JavaScript dependencies | `package-lock.json` and package license files | Each dependency keeps its own license |
| SEPA / INDEC data | [Data documentation](docs/data.md), [reference sources](docs/market-references.md) | Attribution and methodological limits; no blanket redistribution grant |

The app retains visible attribution in `components/Layout/DesignCredit.tsx`.
The design license does not authorize use of every retailer logo, product photo
or image embedded in an unrelated source.

Retailer image files from the local working installation are deliberately absent
from this review repository because redistribution permission was not established
during preparation. The component falls back to the readable retailer name.
The original installation and its files remain preserved.

Product photos are not bundled here. Runtime lookups depend on external services
and their applicable conditions. Review the original terms before redistributing
or commercially using any material; this inventory records provenance and does
not certify rights beyond the cited notices.
