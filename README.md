# TEACH Communication

A one-page team site for the TEACH communication team: creative projects, social media calendar, brand and file library, team tasks, accessibility checklists, comms requests, inspiration board, announcements, reports, team access, and **Manager and CEO approvals with automatic email notifications**.

It is plain HTML, CSS and JavaScript. There is nothing to install and no build step.

## Files

| File | What it does |
|---|---|
| `index.html` | The website. Open this file. |
| `styles.css` | All the design. |
| `app.js` | The main code: sign-in, projects, calendar, library, tasks, checklists, approvals, requests, reports, team access. |
| `notify.js` | Automatic email notifications for approvals. |
| `signin-safety.js` | A safety net so sign-in still works if something else fails. |
| `early.js` | Restores a saved sign-in before the page appears. |
| `config.js` | **The only file you need to edit**: your EmailJS codes. |
| `.github/workflows/pages.yml` | Publishes the site on GitHub Pages. |

## Run it on your computer

Download the folder and double-click `index.html` (Chrome or Edge).
Sign in with any valid email and the password `Teach@2026`.

## How the approval emails work

On **Manager & CEO Approvals** there are three boxes next to the **Submit for Approval** button:

1. **Manager's email** is emailed first.
2. **CEO's email** is emailed after the Manager approves.
3. **Also notify** holds any other people (separate them with commas). They get a copy at every step.

Leave a box empty to use the Manager and CEO set on the **Team Access** page. Every email contains a link that opens that item on the receiver's own computer, where they can approve or request changes. Only the named Manager or CEO (or an Admin) can approve their step.

| When | Who is emailed |
|---|---|
| Work is submitted | Manager (and everyone in Also notify) |
| Manager approves | CEO (and everyone in Also notify) |
| Changes are requested | The creator (and everyone in Also notify) |
| CEO gives final approval | The creator (and everyone in Also notify) |

## Turn on automatic sending (5 minutes, free)

Without this step the site still works: it opens your email app with the message ready to send.

1. Create a free account at <https://www.emailjs.com> and add an **Email Service** (Gmail or Outlook). Copy the **Service ID**.
2. Create an **Email Template** with:
   - To email: `{{to_email}}`
   - Subject: `{{subject}}`
   - Content: `{{message}}`
   - Reply-to: `{{reply_to}}`

   Copy the **Template ID**.
3. In **Account > General**, copy the **Public Key**.
4. Open `config.js`, paste the three codes, and save.
5. Sign in, open **Team Access**, and press **Send me a test email**.

## Put it on GitHub (free website link)

1. Create a new repository on <https://github.com/new> (for example `teach-comms`).
2. Upload everything in this folder, including the `.github` folder and `.nojekyll`. Using the command line instead:

   ```bash
   git init
   git add .
   git commit -m "TEACH Communication site"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/teach-comms.git
   git push -u origin main
   ```
3. On GitHub open **Settings > Pages**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish (about a minute).
5. Your site is at `https://YOUR-NAME.github.io/teach-comms/`.

Open and share the site from this web address, not from a file on your computer. Email links only work for other people when the site is on the web.

## Change the password

Search for `Teach@2026` in `app.js` and `signin-safety.js` and change it in both places.

## Important limits

- **This is a demo-level sign-in.** The password and roles are checked in the browser only, and anyone who can open the site can read the code. Do not use it for secrets.
- **Data stays in each person's browser** (localStorage). Approvals, projects and tasks are not shared between computers. The email link carries the approval item so the next person can act on it, but it is not a shared database.
- **The EmailJS Public Key is visible to anyone who opens the site.** That is normal for EmailJS. In the EmailJS dashboard you can restrict which website addresses may use it.
- For real security and a shared list of approvals, the site needs a backend (for example Firebase or Supabase). That can be added later.
