# FLUXIONIC website — editing guide

A short guide for updating www.fluxionic.org yourselves. No technical
knowledge needed.

## Logging in

1. Go to **https://www.fluxionic.org/admin/login**
2. Enter the email and password you were given.
3. You land on the **Dashboard** — an overview of everything on the site.

> Forgot your password? Ask the site administrator to reset it.

## How the admin panel maps to the website

The left sidebar mirrors the tabs on the public website:

| Sidebar section | Website tab |
|---|---|
| Pages | Home page text |
| Nodes and Researchers | Nodes and Researchers |
| Fellows | Fellow profiles (linked from Nodes) |
| Events | Events |
| Conferences \| Workshops | Conferences \| Workshops |
| Volunteering \| Outreach | Volunteering \| Outreach |
| News | News (news items and publications) |

## Editing something

1. Click the section in the sidebar (e.g. **News**).
2. Click the item you want to change.
3. Edit the fields — each field has a short explanation underneath it.
4. Click **Save changes**. The website updates immediately.

Two fields to leave alone unless you know why you're changing them:

- **Slug** — the web address of the item (changing it breaks existing links).
- **Publish at** — controls the display order in some lists.

## Adding something new

Open the section and click the blue **+ New …** button in the top-right,
fill in the fields, and press **Create**. Set **Status** to *Published* so it
appears on the site (*Draft* keeps it hidden while you work on it).

## Adding photos

1. Click **Media** in the sidebar and upload your photo there.
2. After uploading, copy the photo's link (URL).
3. Open the entry you want the photo on, and in its **Photos** (or **Body**)
   field paste, on its own line:

   ```
   ![A short description](paste-the-link-here)
   ```

4. Save. The photo now appears on the page.

You can add several photos — one `![...](...)` line per photo.

## Password-protected presentations (Events)

An event can offer its presentation files behind a password:

- **Presentations link (kept private)** — the download link (e.g. Dropbox).
  Visitors never see this link directly.
- **Presentations password** — what visitors must type to get the files.
  Share it with network members. Leave it empty to hide the download box.

The Trondheim 2026 meeting is already set up this way.

## If something goes wrong

Every save keeps a history — the administrator can restore an older version
of any entry. So don't worry about breaking things; just ask if something
looks wrong.
