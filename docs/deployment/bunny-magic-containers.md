# Bunny Magic Containers Deployment

This project deploys cleanly to Bunny Magic Containers as a single Dockerized Express service.

## Prerequisites

- The Docker image builds successfully from the project root.
- A Bunny Magic Containers app exists or you have access to create one.
- The image is available in a registry Bunny can read.

Recommended image build for Bunny:

```bash
docker buildx build --platform linux/amd64 -t ghcr.io/YOUR_ORG/dog-breed-api:latest .
```

This `linux/amd64` target is recommended because Bunny Magic Containers documentation currently states that only `linux/amd64` images are supported.

## Recommended Deployment Flow

1. Build the production image locally.

```bash
docker buildx build --platform linux/amd64 -t ghcr.io/YOUR_ORG/dog-breed-api:latest .
```

2. Push the image to your registry.

```bash
docker push ghcr.io/YOUR_ORG/dog-breed-api:latest
```

3. In the Bunny dashboard, open Magic Containers and create a new app.

4. Add a container and point it at the published image.

Suggested values:

- Registry: `GitHub` or `Docker`
- Image: your published repository path
- Tag: `latest` or a pinned release tag

5. Add an endpoint.

Suggested values:

- Endpoint type: `CDN` for HTTP(S) API traffic
- Container port: `3000`
- SSL for origin: `off`, unless you are terminating TLS inside the container

6. Set environment variables in Bunny container settings.

Recommended values:

- `PORT=3000`
- `WORDPRESS_BASE_URL=https://petrage.net`

7. Deploy the app and wait for the container to become healthy.

## Verification

After deployment, verify:

```text
GET /health
GET /breed/doberman/card
```

Expected checks:

- `/health` returns `200` and `{ "ok": true }`
- `/breed/doberman/card` returns a JSON card payload

## Project-Specific Notes

- No database is required.
- No persistent volume is required.
- Generated breed JSON files are bundled into the container image.
- Breed content is enriched dynamically from WordPress at runtime.
- The application expects the container to listen on `PORT`, which defaults to `3000`.

## Optional Registry Automation

This repository includes an optional GitHub Actions workflow scaffold at `.github/workflows/docker-publish.yml`.

It can:

- build the production image
- push it to GitHub Container Registry (`ghcr.io`)

It does not:

- call Bunny APIs
- change Bunny app configuration
- trigger Bunny deployments directly

If you use the workflow, Bunny should be configured to pull the published image tag.

Workflow requirements:

- Registry target: GitHub Container Registry (`ghcr.io`)
- Auth: the built-in `GITHUB_TOKEN` with package write permission
- Optional secret changes: none by default for GHCR, though a private Bunny-connected registry still needs read access configured in Bunny

## Troubleshooting

- If the app works locally in Docker but not on Bunny, confirm the endpoint container port is `3000`.
- If content endpoints fail, confirm `WORDPRESS_BASE_URL` is set correctly or omitted to use the default.
- If Bunny keeps serving an older image, confirm the app is pointing at the expected tag and redeploy.
- If using a private registry, connect the registry in Bunny before deployment.
