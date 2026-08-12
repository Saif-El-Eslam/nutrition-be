# Hostinger VPS deployment — nutrition backend

This guide deploys this Express/Mongoose repository as the backend half of the two-repository production system. Replace every `example.com`, IP, GitHub owner, and repository placeholder before use.

## 1. Final architecture

```text
Cloudflare
    |
    v
Nginx :80/:443
    |-- example.com      -> Next.js on 127.0.0.1:3000
    `-- api.example.com  -> backend on 127.0.0.1:5000
```

PM2 manages both Node.js processes; Nginx is the only public HTTP/HTTPS endpoint. This repository supplies `backend` on port 5000.

## 2. Values the user must replace

| Placeholder                       | Production value                                         |
| --------------------------------- | -------------------------------------------------------- |
| `example.com` / `api.example.com` | Final frontend/API domains                               |
| `VPS_IP`                          | VPS public IPv4 address                                  |
| `GITHUB_OWNER`                    | GitHub user or organization                              |
| `nutrition-be`                    | Actual backend repository name                           |
| `Diet-Wellness`                   | Actual frontend repository name                          |
| Backend / frontend ports          | `5000` / `3000`                                          |
| Backend / frontend directories    | `/var/www/backend` / `/var/www/frontend` |
| Node version                      | `24.18.0` (from `.nvmrc`)                                |

## 3. Initial root login

```bash
ssh root@VPS_IP
```

Keep this session open until deploy-user key login has been tested.

## 4. Update Ubuntu and install base packages

```bash
apt update
apt upgrade -y
apt install -y git curl nginx ufw build-essential ca-certificates
```

The API's scheduled backup calls `mongodump`. Install the current MongoDB Database Tools from MongoDB's official Ubuntu instructions; it is not installed from an unverified convenience script. If omitted, the app continues running but the 02:00 backup logs an error.

## 5. Create the non-root deploy user

```bash
adduser deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

If root has no key in `authorized_keys`, paste the administrator's public key there instead—never the private key. From a second terminal, verify `ssh deploy@VPS_IP` before proceeding.

## 6. SSH hardening

Only after deploy key login works, keep the root session open and add a drop-in:

```bash
cat >/etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
EOF
sshd -t
systemctl reload ssh || systemctl reload sshd
```

Test a new deploy login again before closing root. The service is usually `ssh` on Ubuntu but may be `sshd`. A custom SSH port must be allowed in UFW first.

## 7. Configure UFW

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status verbose
```

Never allow ports 3000 or 5000; both applications bind to loopback.

## 8. Install the repository's required Node.js version

Run as `deploy`:

```bash
su - deploy
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 24.18.0
nvm alias default 24.18.0
node --version
```

Verify the NVM installer URL/version before running it. `scripts/deploy.sh` sources `$HOME/.nvm/nvm.sh` explicitly because GitHub Actions opens a non-interactive SSH session.

## 9. Install PM2

As `deploy` with NVM loaded:

```bash
npm install -g pm2
pm2 --version
pm2 startup
```

Copy and run exactly the sudo command printed by `pm2 startup`, then return to `deploy`. Later use `pm2 start ecosystem.config.cjs`, `pm2 status`, `pm2 logs`, and `pm2 save`; saving persists the process list across reboots.

## 10. Create application directories

As root:

```bash
mkdir -p /var/www/backend /var/www/frontend
chown -R deploy:deploy /var/www/backend /var/www/frontend
```

## 11. Give the VPS read access to GitHub

Use one read-only deploy key per private repository. As `deploy`:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_backend -C 'example-backend-vps' -N ''
ssh-keygen -t ed25519 -f ~/.ssh/github_frontend -C 'example-frontend-vps' -N ''
cat ~/.ssh/github_backend.pub
cat ~/.ssh/github_frontend.pub
```

Add each public key at its repository's **Settings → Deploy keys**, without write access. Configure aliases:

```sshconfig
Host github-backend
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_backend
  IdentitiesOnly yes

Host github-frontend
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_frontend
  IdentitiesOnly yes
```

Set `chmod 600 ~/.ssh/config`. Obtain GitHub's published SSH host-key fingerprints through a trusted channel, compare them with `ssh-keyscan github.com`, then append the verified output to `~/.ssh/known_hosts`. Test `ssh -T github-backend` and `ssh -T github-frontend` (GitHub's successful authentication message may still exit 1). These VPS→GitHub keys differ from the Actions→VPS key in section 18.

## 12. Clone the repository

```bash
git clone git@github-backend:GITHUB_OWNER/nutrition-be.git /var/www/backend
git clone git@github-frontend:GITHUB_OWNER/Diet-Wellness.git /var/www/frontend
```

## 13. Create production environment files

Backend uses `/var/www/backend/.env`:

```bash
cd /var/www/backend
cp .env.example .env
chmod 600 .env
```

Edit it as `deploy`. Required production names are `NODE_ENV`, `ENVIRONMENT`, `HOST`, `PORT`, `MONGO_URI`, `DB_NAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_IDS`, `FRONTEND_URL`, `BACKEND_URL`, `BUSINESS_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and all six `PAYMOB_*` values in `.env.example`. Set `FRONTEND_URL=https://example.com`, `BACKEND_URL=https://api.example.com`, `HOST=127.0.0.1`, and `PORT=5000`. `RESEND_FROM` must use a domain verified in Resend. Production values stay on the VPS and `.env` is ignored.

The frontend separately uses `/var/www/frontend/.env.production` containing `NEXT_PUBLIC_API_URL=https://api.example.com/api`. It is public and embedded at build time, so changes require rebuilding.

## 14. First manual build and launch

```bash
cd /var/www/backend
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use
npm ci --omit=dev
npm run build
mkdir -p logs backups
pm2 start ecosystem.config.cjs
pm2 save
curl --fail http://127.0.0.1:5000/api/health
pm2 logs backend --lines 100 --nostream
```

Run `npm test` before deployment. Do not run development seeds in production. Prove this manual deployment before enabling Actions.

## 15. Nginx configuration

Create `/etc/nginx/sites-available/example-backend` as root:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

The 10 MB limit matches the API's 5 MB in-memory upload limit with overhead; uploads go directly to Cloudinary and are not persistent local files. WebSockets are not currently used, but upgrade headers are harmless. The matching frontend block proxies `example.com` and `www.example.com` to `127.0.0.1:3000`, with `proxy_buffering off` for App Router streaming.

```bash
ln -s /etc/nginx/sites-available/example-backend /etc/nginx/sites-enabled/example-backend
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 16. Cloudflare DNS setup

Create an A record `@ → VPS_IP`, CNAME `www → example.com`, and A record `api → VPS_IP`. DNS-only mode simplifies initial DNS/certificate troubleshooting. After origin HTTPS works, proxying may be enabled so web traffic passes through Cloudflare. Cloudflare proxying does not automatically install an origin certificate.

## 17. HTTPS setup

After both Nginx HTTP sites exist and DNS resolves:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.example.com
certbot --nginx -d example.com -d www.example.com
nginx -t
systemctl status certbot.timer
certbot renew --dry-run
```

Complete Certbot's prompts. Use Cloudflare SSL/TLS **Full (strict)** after valid origin certificates exist; never Flexible.

## 18. Create the GitHub Actions deployment SSH key

This dedicated key direction is **GitHub Actions runner → VPS**. Generate it on a trusted administrator machine:

```bash
ssh-keygen -t ed25519 -f github_actions_example_backend -C 'github-actions-backend' -N ''
```

Append only `github_actions_example_backend.pub` to `/home/deploy/.ssh/authorized_keys`, fix ownership and mode 600, and test with the private key. Store only the private key in GitHub. Do not reuse a personal key. An advanced setup can restrict this key to a deployment command after confirming the workflow and script requirements.

## 19. Configure GitHub repository secrets

In each repository, open **Settings → Secrets and variables → Actions** and add `VPS_HOST` (`VPS_IP`), `VPS_PORT` (`22` unless changed), `VPS_USER` (`deploy`), `VPS_SSH_PRIVATE_KEY`, and `VPS_KNOWN_HOSTS`. For known hosts, obtain `ssh-keyscan -p 22 VPS_IP` output and verify the resulting key fingerprint against the Hostinger console or another trusted channel before storing it. Never blindly trust an unauthenticated scan.

## 20. GitHub Actions behavior

A direct push to `main` deploys. Merging a PR also produces a push to `main` and deploys; an unmerged PR does not. `workflow_dispatch` permits a manual run. Repository-scoped concurrency queues deployments so they cannot overlap.

## 21. First automated deployment

Commit these files on a feature branch, push it, review the PR, and merge to `main`. Inspect Actions logs, then on the VPS run `pm2 status`, `pm2 logs backend`, `nginx -t`, and the local/public curl checks. Finally open both domains and exercise a frontend API request.

## 22. Deployment flow

```text
push/merge to main
  -> GitHub Actions
  -> SSH into VPS as deploy
  -> run scripts/deploy.sh
  -> fetch/reset to origin/main
  -> npm ci --omit=dev
  -> source validation (no compile step)
  -> no automatic data migrations
  -> PM2 startOrReload
  -> GET /api/health
```

## 23. Rollback procedure

This is a simple in-place deployment, not an atomic release-directory deployment. Find a previous healthy SHA in GitHub, then as `deploy` run:

```bash
cd /var/www/backend
git fetch origin
git reset --hard HEALTHY_COMMIT_SHA
npm ci --omit=dev
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env
curl --fail http://127.0.0.1:5000/api/health
```

This intentionally does not clean ignored `.env` or backups. Later pushes return the server to `origin/main`. Database changes are not automatically reversible; back up data before schema-affecting releases and never run a destructive rollback without a verified backup.

## 24. Logs and troubleshooting

```bash
pm2 status
pm2 logs backend --lines 200
pm2 describe backend
journalctl -u pm2-deploy --since today
nginx -t
systemctl status nginx
tail -f /var/log/nginx/access.log /var/log/nginx/error.log
curl -v http://127.0.0.1:5000/api/health
curl -v https://api.example.com/api/health
dig +short example.com api.example.com
git -C /var/www/backend remote -v
ssh -T github-backend
ss -ltnp | grep ':5000'
```

For Actions SSH errors, check secret newlines, username, port, authorized key, and pinned host key. For startup failures, compare `.env` names with `.env.example`; never print values. CORS requires the exact `FRONTEND_URL` origin (no path/trailing slash). Check MongoDB connectivity and Cloudinary/Paymob/email credentials. Never substitute seeds for schema management. `EADDRINUSE` identifies a port collision. Permission errors usually mean files are not owned by `deploy`. Frontend public URL changes require a frontend rebuild.

## 25. Security checklist

- Application runs as non-root `deploy`; root/password SSH are disabled only after key verification.
- Actions key is dedicated; GitHub repository deploy keys are read-only.
- App ports bind to localhost; only SSH and Nginx HTTP/HTTPS pass UFW.
- Secrets live only in mode-600 VPS environment files and are not logged.
- OS packages are updated regularly; verified backups precede risky data changes.
- Cloudflare uses Full (strict); Actions host-key verification remains enabled.

## 26. Final verification checklist

- [ ] Frontend opens at `https://example.com`
- [ ] `www` redirects correctly
- [ ] Backend responds at `https://api.example.com/api/health`
- [ ] Frontend calls the backend successfully
- [ ] Certificates are valid and renewal is active
- [ ] PM2 survives a reboot
- [ ] UFW is active; ports 3000/5000 are not public
- [ ] Push/merge to `main` deploys automatically
- [ ] Failed builds do not restart the working process
- [ ] PM2 and Nginx logs are available
- [ ] Production environment files are not committed

## 27. Remaining manual actions

## Manual actions still required

1. Select final domain names, IP, GitHub owner/repository names, and replace placeholders in both repositories and VPS paths if desired.
2. Run the documented VPS package, user, SSH-hardening, UFW, NVM, PM2, directory, and clone commands.
3. Verify SSH and GitHub fingerprints through trusted channels.
4. Add one read-only GitHub deploy key per repository.
5. Write the backend `.env` and frontend `.env.production` on the VPS with real secrets/URLs.
6. Install MongoDB Database Tools if scheduled backups are required and verify a backup/restore procedure.
7. Create Nginx sites and make Cloudflare DNS changes.
8. Complete Certbot interaction and select Cloudflare Full (strict).
9. Create the dedicated Actions→VPS keys and GitHub secrets in both repositories.
10. Prove both apps manually, enable Actions, deploy, reboot-test PM2, and complete the verification checklist.
