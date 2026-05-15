# Organization content: Home, About, Contact, Team

Copy **User Panel** organization data (footer contact, About owner/parent company, home hero text, gallery, team photos) from an old database into a fresh one.

## Your setup

| Database | Role |
|----------|------|
| `fundamental_db2` | **Source** — has your real content |
| `edukify_db` | **Target** — new empty DB (`global-config.properties` points here now) |

Admin and User backends both use the same DB URL from `global-config.properties`.

Media files (logos, team photos, banners) live on disk under:

`FilesData/OrgData/...` (see `file.base.path` in `global-config.properties`)

Database rows only store **paths** like `OrgData/Home_Page/...`. After importing SQL/API data, keep the same `FilesData` folder (or copy `OrgData` from the machine that had `fundamental_db2`).

---

## Method A — API export/import (recommended, no MySQL CLI)

### 1. Export from `fundamental_db2`

1. In `global-config.properties`, point **both** DB URLs to the source:

   ```properties
   ADMIN_DB_URL=jdbc:mysql://localhost:3306/fundamental_db2?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   USER_DB_URL=jdbc:mysql://localhost:3306/fundamental_db2?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   ```

2. Restart **admin backend** (port `8114`).

3. From repo root:

   ```powershell
   .\scripts\org-content\export-org-content-api.ps1
   ```

   Output: `scripts/org-content/exported/org-content.json`

### 2. Import into `edukify_db`

1. Change `global-config.properties` back to the **new** DB:

   ```properties
   ADMIN_DB_URL=jdbc:mysql://localhost:3306/edukify_db?...
   USER_DB_URL=jdbc:mysql://localhost:3306/edukify_db?...
   ```

2. Restart admin backend.

3. Import:

   ```powershell
   .\scripts\org-content\import-org-content-api.ps1
   ```

4. Refresh Admin → User Panel (Home / About / My Team) and the public site.

If import fails with “organization already exists”, the target DB already has a row — use Admin UI **Update** once, or delete organization rows in `edukify_db` and run import again (see SQL method for table list).

---

## Method B — MySQL dump (full copy, needs `mysql` / `mysqldump` in PATH)

```powershell
.\scripts\org-content\export-org-content-mysql.ps1 -SourceDb fundamental_db2
.\scripts\org-content\import-org-content-mysql.ps1 -TargetDb edukify_db
```

Edit `-MySqlBin` if MySQL is not on PATH (e.g. `C:\Program Files\MySQL\MySQL Server 8.0\bin`).

---

## What gets copied

- Organization name, phone, email, addresses (Contact / footer)
- Home page CRM text (hero, trust strip, offerings intro)
- About: owner, parent company, mission/vision/values
- Gallery & achievement metadata and image paths
- Team gallery image paths

Does **not** copy: admins, clients, careers, invoices, SMTP settings, signup auth mode (configure those separately or use your other seeds).
