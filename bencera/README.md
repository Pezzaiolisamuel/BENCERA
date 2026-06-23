# Bencera

Bencera is a Next.js catalog experience with a zoomable desktop gallery, mobile feed/map layouts, item detail views, and an authenticated catalog administration interface. Catalog records are stored in PostgreSQL through Prisma, while uploaded item images are stored in Cloudinary.

## Architecture

The App Router server page loads stored catalog records, normalizes legacy JSON-backed image fields into the public `Item` shape, and delegates viewport selection to a responsive client component.

- Desktop uses `GalleryViewport`, a GSAP-driven virtual canvas, zoom controls, and a details panel.
- Mobile uses `MobileHomeViewport`, feature-specific feed/map components, and a draggable detail sheet.
- Admin uses focused authentication, catalog, create-form, and edit-form hooks. Presentational form components remain separate from state and network behavior.
- `/api/items` is a thin authenticated HTTP adapter. Private `_lib` modules parse multipart data, enforce upload policy, orchestrate Cloudinary, build validated item data, clean up deleted images, and perform database operations.
- Shared client-safe modules contain normalized item/image helpers and upload limits. Prisma and Cloudinary modules remain server-only.

## Directory structure

```text
prisma/
  schema.prisma                 PostgreSQL Item model
public/                         Static brand and site assets
src/
  app/
    admin/                      Admin page, components, and domain hooks
    api/admin/                  Login and session endpoints
    api/items/                  Catalog HTTP adapter and private server modules
    mobilehome/                 Mobile route and CSS modules
    page.tsx                    Public catalog server entry point
  components/
    canvas/                     Desktop canvas layout, zoom, viewport, and views
    mobile/                     Mobile feed, map, tiles, detail sheet, and hook
    GalleryViewport.tsx         Desktop gallery coordinator
    MobileHomeViewport.tsx      Mobile variant and selection coordinator
    ResponsiveHomeViewport.tsx  Desktop/mobile viewport selection
  lib/                          Catalog, item, session, Cloudinary, and Prisma helpers
  types/                        Shared item types
  validators/                   Zod item validation schemas
```

## Local setup

Requirements: a current Node.js release supported by Next.js 16, npm, PostgreSQL, and a Cloudinary account.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` and provide the environment variables listed below. Next.js also supports local overrides in `.env.local`.

3. Generate the Prisma client and synchronize a local database when needed:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`. The admin interface is at `http://localhost:3000/admin`.

## Environment variables

Do not commit real credentials or secret values.

```dotenv
DATABASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `CLOUDINARY_*`: Cloudinary account credentials used only by server upload/deletion modules.
- `ADMIN_USERNAME`: Admin login username.
- `ADMIN_PASSWORD_HASH`: bcrypt hash of the admin password, not the plaintext password.
- `ADMIN_SESSION_SECRET`: secret used to sign the admin session cookie.

## Main user flows

### Public catalog

The home server page reads catalog records, supports the legacy stored JSON representation, and normalizes them before rendering. Desktop visitors receive the pannable/zoomable canvas and details panel. Narrow viewports receive the mobile map; mobile feed support remains available as a component variant.

### Item details and shopping

Selecting a catalog tile opens the corresponding desktop panel or mobile sheet. Item imagery and descriptive metadata come from the normalized item model, and shopping links retain their stored Shopify URLs.

### Admin authentication and catalog management

The admin page checks the signed session cookie before loading catalog data. After login, an administrator can refresh or delete items, create items with categorized image uploads, and edit existing Above/Detailed images. Client and server validation share upload limits; the server remains authoritative and performs Cloudinary and database operations in their established order.

## Refactoring decisions

Domain-specific hooks were preferred over generic form, drag, or CRUD abstractions. Canvas gestures, mobile sheet dragging, authentication, catalog loading, create uploads, and edit uploads have different thresholds, lifecycle rules, errors, and side effects. Keeping those rules in named feature hooks makes behavior reviewable and prevents a shared abstraction from silently coupling unrelated interactions.

Pure deterministic work is separated where reuse is safe: canvas layout/zoom calculations, item image normalization, upload policy, multipart parsing, and item data construction. Browser animation state stays close to its domain, while Prisma and Cloudinary access stays behind server-only boundaries.

## Interview talking points

- The app is split by feature boundary first: `components/canvas`, `components/mobile`, `app/admin`, and `app/api/items/_lib`.
- Coordinators stay thin: viewport/page/route entry files choose the flow, while hooks and helpers own domain rules.
- Pure logic moved out before UI churn: item image parsing, upload policy, canvas math, multipart parsing, and validated item payload construction are all isolated from rendering.
- Server-only concerns stay explicit. Prisma, Cloudinary, and route HTTP helpers are kept behind the API boundary so shared client-safe utilities stay easy to reuse safely.

## Verification

```bash
npm run lint
npm run build
```

The lint command may report raw `<img>` optimization warnings. These elements intentionally remain unchanged until dynamic and legacy remote-image behavior can be verified with an equivalent `next/image` configuration.

## Manual regression checklist

- Desktop catalog loads, tiles retain their positions, and initial reveal/zoom behavior is unchanged.
- Canvas drag, inertia, wrapping, wheel zoom, buttons, magnetic proximity, and click suppression work.
- Desktop item details open and close with the same content, imagery, and Shopify link.
- Mobile map/feed scrolling, momentum, looping, zoom controls, and visible-item reveals work on iOS/Safari and other target browsers.
- Mobile detail sheet opens, scrolls, drags vertically, closes, and retains its timing and imagery.
- Admin session check, login errors, successful login, and Escape blocking behave as before.
- Admin refresh, create, validation messages, previews, preview removal, and object-URL cleanup work.
- Admin edit retains/removes/uploads images, preserves confirmation behavior, and sends unchanged fields.
- Admin delete removes the database item and reports Cloudinary cleanup failures without changing the response shape.
- Unauthorized item API requests, upload-limit failures, missing IDs, missing items, and schema failures retain their status codes and messages.
