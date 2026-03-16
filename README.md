# dog-breed-api

The project now has two generated data layers:

- `data/generated/breeds.normalized.json`: normalized breed records extracted from the Ninja Tables export
- `data/generated/breeds.index.json`: a lookup-focused breed index that merges canonical ids, aka names, manual aliases, Petrage tag slugs, and shared content metadata

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
```

## Scripts

```bash
npm run build
npm run build:index
npm run dev:server
npm run start
npm run test
npm run normalize
```

## Alias And Content Mapping

Aliases and tag slugs solve different problems:

- `aka_names`: names parsed from the source dataset itself
- `aliases`: conservative manual resolver inputs for user-facing search, such as `Frenchie`, `Aussie`, or `Blue Heeler`
- `tag_slugs`: Petrage content tags used for later content retrieval

A breed can have multiple aliases and multiple tag slugs. Distinct breeds can also share a `shared_content_key` when Petrage content is clustered together. In this PR, `akita-inu` and `american-akita` remain separate breeds while both point at the shared content key `akita`.

## Adding Mappings

Add or update entries in `data/manual/breed-aliases.json` when you need to:

- add a conservative new alias for resolver matching
- attach additional Petrage tag slugs
- set a `preferred_tag_slug`
- define a `shared_content_key` for breeds that intentionally share content

After editing the manual mapping file, regenerate the lookup index with:

```bash
npm run build:index
```

## Normalized Dataset

Each normalized breed record contains:

- `id`: canonical slug derived from the primary display name
- `display_name`: breed name before any `aka` aliases
- `aka_names`: aliases extracted from `aka` patterns in the breed heading
- `alpha`: alphabetical grouping from the source table
- `traits`: structured values parsed from the `dog_breeds` HTML list
- `stats`: structured values parsed from the `details` HTML list
- `media`: image URL, first article URL, and tag URL extracted from source HTML
- `description_text`: plain-text conversion of the source description HTML
- `source`: source row metadata for traceability

## Breed Index

Each generated index entry contains:

- `id`: canonical breed id
- `display_name`: canonical display name
- `aka_names`: aka values from the normalized dataset
- `aliases`: manual resolver aliases
- `tag_slugs`: merged Petrage tag slugs from manual mappings and source tag URLs
- `preferred_tag_slug`: the preferred Petrage tag to use for future content lookup
- `shared_content_key`: optional shared content cluster key
- `lookup_keys`: normalized resolver keys generated from id, names, aliases, and tag slugs

## Breed Content Lookup

The local content service resolves a breed input first, then enriches Petrage content using both tags and a small configured category set:

1. resolve the input against `breeds.index.json`
2. derive ordered query tags from `preferred_tag_slug` and `tag_slugs`
3. fetch matching WordPress tags from `https://petrage.net/wp-json/wp/v2/tags`
4. optionally fetch configured categories such as `dog-breed-facts`
5. fetch posts for each matched tag id and matched category id
6. merge and dedupe posts while preserving matched tags and categories
7. filter category-only posts by breed relevance before ranking
8. rank content deterministically
9. split the results into canonical, direct-match, related, and supplemental buckets

Aliases and tag slugs still serve different purposes:

- aliases help resolve user input such as `acd`, `aussie`, or `akita`
- tag slugs define which Petrage content tags should actually be queried

Multiple tag slugs can be queried for one breed because Petrage content may exist under more than one tag convention. `shared_content_key` is preserved in the resolved breed payload so future PRs can expand shared-content retrieval without collapsing distinct breed identities.

### Relevance Filtering

Category enrichment is intentionally narrower than tag enrichment:

- tag-matched posts are retained
- category-only posts must pass a breed relevance check before they are kept
- relevance uses deterministic signals such as exact `article_url`, breed name or alias in the title, slug, or excerpt, and explicit breed tag matches

This prevents generic `dog-breed-facts` spillover from unrelated breeds while keeping legitimate breed-specific category articles in the result set.

### Ranking Behavior

Ranking is deterministic and explainable. It prefers likely canonical breed articles using simple additive signals such as:

- exact `article_url` match from normalized breed metadata
- full breed display name in the title
- alias or aka match in the title
- preferred tag match
- multiple matched breed tags
- matched breed-content category
- breed-like slugs

It also classifies each post into a simple content type and adds a quality weight that reflects owner usefulness:

- `facts` are strongest after canonical matching
- `health`, `care`, `behavior`, and `training` outrank quizzes because they are more useful to real owners
- `gallery` outranks quizzes and stays prominent when it is breed-specific
- strong `list` content outranks quizzes when it is breed-relevant
- `survey` remains useful supporting content
- `vs`, `showdown`, and `battle of` posts are treated as `quiz`-style engagement content rather than high-value comparison resources
- `video`, `meme`, and `misc` are demoted relative to stronger informational content

Newer posts are only used as a minor tie-breaker. The service stays deterministic on purpose so filtering and ranking remain easy to inspect and maintain.

### Content Types

Posts are classified with readable title, slug, and excerpt rules into:

- `facts`
- `health`
- `care`
- `behavior`
- `training`
- `quiz`
- `gallery`
- `survey`
- `list`
- `video`
- `meme`
- `misc`

The classifier prefers owner-useful informational types when the wording clearly supports them, but still keeps obvious quizzes, `vs`/`showdown`/`battle of` engagement posts, memes, and videos in their lower-value classes.

### Content Buckets

The enriched content response now includes:

- `content.canonical`: the single best canonical candidate when it clears the canonical threshold
- `content.direct_matches`: the strongest breed-specific and owner-useful content such as facts, health, care, behavior, training, and galleries
- `content.related`: strong supporting content such as breed-relevant lists, surveys, and quiz-style engagement content after the more useful owner-focused resources
- `content.supplemental`: lower-value but still relevant content such as videos, memes, or miscellaneous posts

The existing flattened `posts` array is still returned for backward compatibility, and it now reflects the ranked order with `content_type` included on each post.

### Local Usage

Future code can call the local service directly:

```ts
import { getBreedContent } from "./src/api/getBreedContent.js";

const acdContent = await getBreedContent("acd");
const aussieContent = await getBreedContent("aussie");
const akitaInuContent = await getBreedContent("akita-inu");
```

`getBreedContent()` returns `null` when the input cannot be resolved. Otherwise it returns the resolved breed metadata, tag and category query metadata, structured content buckets, and the flattened ranked posts list.

Example response shape:

```json
{
  "resolved_input": "acd",
  "breed": {
    "id": "australian-cattle-dog",
    "display_name": "AUSTRALIAN CATTLE DOG",
    "aka_names": [],
    "aliases": ["ACD", "Blue Heeler", "Red Heeler"],
    "tag_slugs": ["acd", "australiancattledog"],
    "preferred_tag_slug": "acd",
    "shared_content_key": null
  },
  "content_query": {
    "base_url": "https://petrage.net",
    "tag_slugs_queried": ["acd", "australiancattledog"],
    "matched_tag_ids": [11, 12],
    "matched_tag_slugs": ["acd", "australiancattledog"],
    "category_slugs_queried": ["dog-breed-facts"],
    "matched_category_ids": [31],
    "matched_category_slugs": ["dog-breed-facts"]
  },
  "content": {
    "canonical": {
      "post": null,
      "score": null,
      "reasons": []
    },
    "direct_matches": [],
    "related": [],
    "supplemental": []
  },
  "posts": []
}
```

## Breed Card Endpoint

The project now also exposes a compact presentation-layer payload for frontend use. It is built on top of the richer breed and content services, but it selects and reshapes only the most useful pieces instead of returning the full ranking and query metadata.

`GET /breed/:input/card` returns:

- `breed`: compact breed identity, summary traits, and image
- `featured.main_article`: the canonical breed article when available
- `featured.owner_help`: top owner-useful informational reads
- `featured.gallery`: the best gallery item when available
- `featured.related_reads`: broader supporting informational content
- `featured.fun_extras`: quizzes and lighter engagement items
- `meta`: lightweight content lookup metadata such as `preferred_tag_slug`

Breed card presentation rules:

- `display_name` is normalized to Title Case for UI readability
- `description_text` is truncated at a sentence boundary when possible

Example response shape:

```json
{
  "breed": {
    "id": "australian-cattle-dog",
    "display_name": "Australian Cattle Dog",
    "aliases": ["Blue Heeler", "ACD"],
    "image_url": "https://petrage.net/example.jpg",
    "description_text": "Compact herding breed summary...",
    "origin": ["Australia"],
    "size": ["Medium"],
    "life_span": "12-15 years",
    "temperament": "Alert",
    "exercise_needs": "High",
    "good_with_families": "Yes",
    "owner_type": "Active"
  },
  "featured": {
    "main_article": {
      "title": "Australian Cattle Dog Facts",
      "link": "https://petrage.net/australian-cattle-dog-facts/",
      "content_type": "facts"
    },
    "owner_help": [],
    "gallery": null,
    "related_reads": [],
    "fun_extras": []
  },
  "meta": {
    "preferred_tag_slug": "acd",
    "shared_content_key": null
  }
}
```

## Local API Server

The project now includes a small local Express server for development and testing. It exposes the existing breed resolution, comparison, and Petrage content lookup logic through JSON-only HTTP endpoints.

### Start The Server

Development mode:

```bash
npm run dev:server
```

Run the built server:

```bash
npm run build
npm run start
```

### Docker

Build the production image:

```bash
docker build -t dog-breed-api .
```

Run the container locally:

```bash
docker run --rm -p 3000:3000 dog-breed-api
```

Override the WordPress base URL if needed:

```bash
docker run --rm -p 3000:3000 -e WORDPRESS_BASE_URL=https://petrage.net dog-breed-api
```

Verify the container is healthy:

```bash
curl http://localhost:3000/health
```

## Bunny Magic Containers Deployment

This project is ready to run on Bunny Magic Containers as a standard Dockerized Express app. Bunny runs the container image built from [Dockerfile](/c:/Users/petra/Downloads/breed-comparison/Dockerfile), and the generated breed JSON files are already bundled into that image.

Recommended runtime values:

- `PORT=3000`
- `WORDPRESS_BASE_URL=https://petrage.net`
- rate-limit env vars only if you need to override the defaults

Recommended deployment flow:

1. Build the production image locally and confirm it starts cleanly.
2. Push the image to a registry that Bunny can read, such as GitHub Container Registry or Docker Hub.
3. In Bunny Magic Containers, create a new app and point the container at that image.
4. Configure the endpoint container port as `3000`.
5. Set the environment variables shown above.
6. Deploy, then verify `GET /health` and `GET /breed/doberman/card`.

This project does not require:

- a database
- persistent volumes
- application-side Bunny SDK code

The app reads breed metadata from bundled generated JSON files and enriches content dynamically from WordPress at runtime.

Verification checklist:

- `/health` returns `200` with `{ "ok": true }`
- `/breed/doberman/card` returns a compact card payload
- the Bunny endpoint is configured to forward to container port `3000`
- `WORDPRESS_BASE_URL` is set correctly if you are overriding the default

Troubleshooting:

- If the image works locally but not on Bunny, verify the endpoint container port is `3000`.
- If content endpoints fail remotely, verify `WORDPRESS_BASE_URL`.
- If a newly pushed image does not appear to be running, confirm Bunny is using the updated image tag and redeploy the app.
- If using a private registry, make sure the registry is connected in Bunny before deploying.

For a step-by-step guide, see [docs/deployment/bunny-magic-containers.md](/c:/Users/petra/Downloads/breed-comparison/docs/deployment/bunny-magic-containers.md).

### Configuration

- default port: `3000`
- `PORT`: override the local server port
- `WORDPRESS_BASE_URL`: override the WordPress base URL used by `/breed/:input/content`
- `COMPARE_RATE_LIMIT_WINDOW_MS`: compare limiter window in milliseconds, default `60000`
- `COMPARE_RATE_LIMIT_MAX`: compare limiter max requests per window, default `20`
- `BREED_CONTENT_RATE_LIMIT_WINDOW_MS`: breed content limiter window in milliseconds, default `60000`
- `BREED_CONTENT_RATE_LIMIT_MAX`: breed content limiter max requests per window, default `40`
- `BREEDS_RATE_LIMIT_WINDOW_MS`: breed list limiter window in milliseconds, default `60000`
- `BREEDS_RATE_LIMIT_MAX`: breed list limiter max requests per window, default `60`
- `API_SAFETY_RATE_LIMIT_WINDOW_MS`: safety limiter window in milliseconds, default `60000`
- `API_SAFETY_RATE_LIMIT_MAX`: safety limiter max requests per window, default `120`

The default WordPress base URL is `https://petrage.net`.

Rate-limit values are parsed as positive integers. Missing, empty, zero, negative, or otherwise invalid values fall back safely to the defaults above instead of crashing the app.

The current rate limiting is in-memory and local to a single app instance. If this API is later scaled across multiple instances, the next step would be moving the limiter store to a shared backend.

### Security

Browser CORS access is restricted to:

- `petrage.net`
- `alldogbreeds.net`

Server-to-server requests without an `Origin` header can still succeed, but browser clients from other domains will be blocked.

### Root Route And Caching

The API now includes a friendly root route at `GET /` that returns a small JSON index of the available endpoints.

The WordPress-backed parts of the API also use a lightweight in-memory cache:

- tag and category lookups are cached briefly
- posts-by-tag and posts-by-category lookups are cached briefly
- `getBreedContent()` and `getBreedCard()` reuse recent results for short periods

This cache is intentionally best-effort:

- it resets whenever the container restarts
- it uses short TTLs so WordPress content naturally refreshes
- it does not replace correctness or persistence, it only reduces repeated remote lookups

Bunny can also cache selected API responses when the Pull Zone is configured to respect origin `Cache-Control` headers:

- `GET /breeds` sends `Cache-Control: public, max-age=300, s-maxage=86400`
- `GET /compare/:left/:right` sends `Cache-Control: public, max-age=300, s-maxage=3600`

Here, `max-age` applies to browsers and other private caches, while `s-maxage` applies to shared caches such as Bunny CDN.

### Endpoints

- `GET /health`
- `GET /breed/:input`
- `GET /breed/:input/card`
- `GET /breed/:input/content`
- `GET /compare/:left/:right`

### Example curl Commands

```bash
curl http://localhost:3000/health
curl http://localhost:3000/breed/acd
curl http://localhost:3000/breed/acd/card
curl http://localhost:3000/breed/aussie/content
curl http://localhost:3000/compare/acd/aussie
```

Endpoint behavior:

- `/breed/:input` resolves a breed and returns merged normalized and index metadata
- `/breed/:input/card` is a compact frontend-ready presentation layer over the richer breed and content services
- `/breed/:input/content` resolves the breed, derives all query tag slugs, fetches WordPress tags and posts, and returns deduped content results
- `/breed/:input/content` keeps all breed tag matches, filters category-only spillover by breed relevance, classifies post types, then returns ranked content buckets plus the flattened post list
- `/compare/:left/:right` resolves both breeds and returns a comparison payload containing both resolved breed records
- unresolved breeds return `404`
- unknown routes return `404` JSON
- invalid compare requests with a missing side return `400`

## Notes

- HTML parsing is handled with `cheerio`.
- Alias resolution and content-tag mapping are intentionally separate so future PRs can add content retrieval without weakening breed identity.
- The parser and index builder are intentionally modular so later PRs can extend content lookup and API exposure without rewriting the core extraction logic.
- Content lookup is local service logic only in this PR; there is no public API server, Bunny runtime, or WordPress writeback yet.
- Content enrichment uses a small deterministic scoring system rather than fuzzy matching or ML so ranking stays easy to reason about and maintain.
- The Express app is separated from startup so tests can instantiate it without binding a real port, and the current server shape is intended to be easy to adapt later for Bunny, Express deployment, or route-handler environments.
- Missing or blank HTML fields are handled defensively and normalize to `null` or empty arrays as appropriate.
