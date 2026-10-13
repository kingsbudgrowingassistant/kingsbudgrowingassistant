# Netlify deployment

The application source and public assets must be present at the repository root.
Netlify does not unpack uploaded ZIP archives before installing dependencies.
The source files in this repository were restored from the supplied application
archive; its environment file and prebuilt static export were not extracted.

This project uses Next.js, not a plain static HTML deployment. The root
`netlify.toml` installs locked dependencies with `npm ci --include=dev` before
running `npm run build`, and configures the `.next` publish directory and the
Next.js adapter. This also supports CLI deployments where dependencies have not
already been installed. Development dependencies are included because the
Next.js adapter, TypeScript, and CSS tooling are required during deployment.
Keep the repository base directory at the root and deploy the `main` branch.

Install dependencies with `npm ci` when working locally. Commit the application
source, public assets, `package.json`, `package-lock.json`, and `netlify.toml` so
Netlify can install and build the application on a fresh checkout.

Configure any required application environment variables in Netlify rather than
committing an `.env` file. The recovered application currently uses
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for its existing
backend integration. The deployment configuration does not override those
settings with empty strings. Restoring the project does not provision or migrate
its existing backend.

The initial deployment log stopped at dependency installation. The subsequent
CLI deployment reached the build script but failed with `next: not found`
because local dependencies were absent. The explicit installation step ensures
the Next.js executable is available before the build script runs. A successful
deployment still needs to be confirmed by Netlify's next build. If it fails
again, inspect the complete dependency-install and build output for the actual
error.
