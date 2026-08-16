# Migration Guide — Persian Insurance Management Platform

This archive contains the existing source code of the Persian RTL insurance management platform.
It is intended to be imported into another development environment (including Google AI Studio).

## Important
- Do NOT rebuild the application from scratch.
- Preserve the existing architecture and business logic.
- Do NOT remove existing functionality.
- Do NOT commit or expose API keys/secrets.
- Configure required secrets/environment variables separately in the new environment.

## Project
- React / TypeScript / Vite-based application (based on the included package configuration).
- Persian RTL interface.
- Vazirmatn typography.
- Insurance workflow with Customer, Insurer, and Assessor/Expert areas.

## Important source areas
- `src/App.tsx` — application entry/routing composition.
- `src/types.ts` — domain/data types.
- `src/data/mockData.ts` — existing sample/mock data.
- `src/lib/storage.ts` — existing persistence/storage logic.
- Customer portal components.
- Insurer portal components.
- Assessor portal components.
- Claim/case detail components.

## Existing insurance workflow context
The application includes the existing claim-management flow and role-based areas. The next development work should build on these existing files rather than replacing them.

The intended shared-claim workflow includes:
- Party One (claimant/damaged or at-fault party) creates the original claim.
- Party Two can access the same Claim ID and add additional evidence where permitted.
- The assigned expert can request additional documents from a specific party.
- Requests should be contextual to the claim and routed to the selected party.
- Customer responses can include text, images, videos, and documents.
- Expert-side communication should remain separated by party while remaining part of the same claim.
- All claim documents remain associated with the same Claim ID.

## Security
Do not put API keys or secrets into source files. Use environment variables/secrets in the destination environment.

## Suggested migration steps
1. Import/extract this project as the source of truth.
2. Install dependencies from `package.json`.
3. Configure required environment variables/secrets in the destination environment.
4. Run the existing application before making changes.
5. Verify the existing Customer, Insurer, and Assessor flows.
6. Continue development from the current implementation.

## Do not change yet
Do not redesign the UI or replace the current implementation merely to make the project easier to migrate. Preserve the existing project first.
