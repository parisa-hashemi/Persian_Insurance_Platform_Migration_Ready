# AI Studio Continuation Instructions

You are continuing an existing Persian RTL insurance management application.

IMPORTANT:
This is an existing application, not a blank project.

1. Inspect the entire source tree before changing code.
2. Treat the existing source code as the source of truth.
3. Do not rebuild or replace the application with a simplified demo.
4. Preserve all existing functionality, data models, role logic, and UI unless explicitly instructed otherwise.
5. Preserve Customer, Insurer, and Assessor/Expert portals.
6. Preserve existing claim creation, claim tracking, storage, and document handling.
7. Preserve Persian RTL and Vazirmatn typography.
8. Preserve the existing blue/white insurance visual language.
9. Do not expose or hard-code API keys or secrets.

Current product direction:
- A claim is one shared case identified by one Claim ID.
- Party One creates the claim and supplies the initial required information/documents.
- Party Two can access the same claim and add additional evidence where permitted.
- An assigned expert can request additional documents from Party One OR Party Two.
- The expert selects the recipient and the requested document type.
- Requests and responses happen inside the claim context.
- Party One and Party Two have isolated communication channels with the expert.
- The expert can review all relevant claim documents and both party channels.
- Customer replies may contain text, images, videos, and documents.
- A generic "message the expert" area must not appear immediately after claim creation; communication should appear when an expert is assigned or a real request/conversation exists.

Before implementing anything, inspect:
- package.json
- src/App.tsx
- src/types.ts
- src/data/mockData.ts
- src/lib/storage.ts
- all Customer/Insurer/Assessor portal components
- claim/case detail components

Then run/verify the existing project and continue only from the current implementation.
