<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/46116c09-7268-4640-821e-ee98be0b1dde

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Apps in this repository

The admin console, parent app and teacher app are separate apps. Each has its own entry folder, build and output, and none of them ships another app's screens.

| App | Dev command | Dev URL | Build output |
| --- | --- | --- | --- |
| Admin console (staff) | `npm run dev` | http://localhost:3000/ | `dist/admin` |
| Parent app | `npm run dev:parent` | http://localhost:3001/ | `dist/parent` |
| Teacher app | `npm run dev:teacher` | http://localhost:3002/ | `dist/teacher` |
| Parent + teacher together (demo) | `npm run dev:apps` | http://localhost:3003/parent/ and /teacher/ | – |

`npm run build` builds all three; `npm run build:admin`, `build:parent` and `build:teacher` build one. Set `VITE_PARENT_APP_URL` and `VITE_TEACHER_APP_URL` (see `.env.example`) so the staff sign-in page links to where the other apps are deployed.

### Demo sign-in

- **Admin console**: pick a staff account on the sign-in page. The password is `Lumen@2024`, and the authenticator code is `529148` for every account except the Admissions Officer.
- **Parent app**: any demo mobile on the sign-in screen (for example `+91 90030 45521`, a parent of twins) with OTP `412890`.
- **Teacher app**: `malini.iyer@lumenacademy.edu.in`, `natarajan@lumenacademy.edu.in` or `clara@lumenacademy.edu.in`, with password `Lumen@2024`.

### Who can do what

Access is defined per feature in `src/data/permissions.ts`. Each role gets a row with verbs, a scope and a condition. The console shows the table under **Administration → Access Grants**. Each row answers four questions:

| Question | Grants |
| --- | --- |
| Who is accountable for the outcome being produced? | C, U, D (exactly one role) |
| Who needs to see it to do their own job? | R |
| Who answers if it's wrong or contested? | A |
| Who needs the data outside the system? | E |

Module policies set the default rows, and `FEATURE_OVERRIDES` pins individual features. For example:

- **FEE-003 fee structure**: the accountant creates, reads and updates it, and it locks once invoicing starts. After that, any revision needs the Principal's approval.
- **FEE-011 concession approval**: the accountant proposes, and the Principal must approve anything above 10%.
- **FEE-028 outstanding ledger**: the accountant's export is logged, and the class teacher sees their own section's amounts but not concession reasons.

The rest of the app is derived from the same table:

- **Sidebar, search and quick actions**: a staff member sees only screens where their role has a grant.
- **Read-only screens**: a screen where the role holds no C, U or D opens read-only. Reading, tabs, printing and exports still work, and a role that holds A can still approve or reject.
- **Fees desk and approvals queue**: every action is checked against its own feature grant.

| Staff role | Signs in to | Can change |
| --- | --- | --- |
| Principal | Dashboard | Platform, communication, approvals, compliance; approves fees, admissions and attendance |
| Accountant | Fees | Fees, accounting, payroll |
| Admissions Officer | Admissions | Admissions, student records, documents, certificates and ID cards |
| Auditor | Audit log | Nothing; reads and exports finance, audit, reports and compliance |

Class teachers mark attendance and enter marks in the teacher app. The console attendance desk is the Principal's read-and-approve view.

### Demo data

There is no backend yet.

- **Parent and teacher apps**: they share a demo store in the browser's local storage (`src/shared/demoBackend.ts`). A leave request, homework or notice sent from one app appears in the other only when both run on the same origin, so use `npm run dev:apps` for that. On 3001 and 3002 each app works on its own. "Reset demo data" in either app restores the seed data.
- **Teacher app offline mode**: the teacher app keeps its own on-device cache and outbox (`src/apps/teacher/teacherDevice.ts`) and works offline. Use the Wi-Fi button in its header to simulate losing the connection.
- **Admin console**: records created on the fees desk last until the page is reloaded. So an accountant can raise a request, sign out, and the Principal can sign in and decide it.
