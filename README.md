# Task Manager — Full-Stack DevOps Practice Project

A small React + Vite frontend, Node.js + Express API, and MongoDB database project for practising manual AWS EC2 deployment with Nginx and PM2. SonarQube is intentionally excluded for now.

## Features
- Create, list, complete/uncomplete, and delete tasks
- Express REST API
- MongoDB persistence via Mongoose
- Health endpoint: `GET /api/health`
- Nginx configuration example
- PM2 ecosystem configuration example

## Project layout
```text
task-manager-devops/
├── frontend/                 # React + Vite
├── backend/                  # Express + Mongoose
│   ├── src/
│   ├── .env.example
│   └── ecosystem.config.cjs
├── deploy/nginx-task-manager.conf
├── .gitignore
└── README.md
```

## Requirements
- Node.js 20+ and npm
- A MongoDB database, for example MongoDB Atlas
- For deployment: an Ubuntu EC2 instance with Nginx and PM2

## 1. Configure MongoDB
Create a database in MongoDB Atlas (or use another reachable MongoDB instance). Create a database user and allow network access from your EC2 public egress IP. Avoid `0.0.0.0/0` for production. Copy the connection URI.

## 2. Run the backend locally
```bash
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI and a strong PORT if desired
npm install
npm run dev
```
The API runs at `http://localhost:5000`. Test:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/tasks
```

## 3. Run the frontend locally
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal. By default, Vite proxies `/api` requests to `http://localhost:5000`.

## API endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health and database status |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task: `{ "title": "Learn PM2" }` |
| PATCH | `/api/tasks/:id` | Update task: `{ "completed": true }` |
| DELETE | `/api/tasks/:id` | Delete task |

## 4. Build the frontend
```bash
cd frontend
npm install
npm run build
```
The production build is created in `frontend/dist/`.

For production, build with the API path left as `/api` (the default). Nginx will serve the frontend and proxy `/api/` to the backend on localhost port 5000.

## 5. Deploy on Ubuntu EC2 (manual practice)
These are example commands. Adjust usernames and paths for your instance.

Install Node.js 20+ using your preferred trusted installation method, then:
```bash
sudo apt update
sudo apt install -y nginx
sudo npm install -g pm2
```

Create application directories:
```bash
sudo mkdir -p /var/www/task-manager/frontend
sudo mkdir -p /opt/task-manager/backend
sudo chown -R "$USER":"$USER" /var/www/task-manager /opt/task-manager
```

Copy the **contents** of `frontend/dist/` to `/var/www/task-manager/frontend/` and the backend source (excluding `node_modules`) to `/opt/task-manager/backend/`.

On EC2, create `/opt/task-manager/backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/task_manager?retryWrites=true&w=majority
NODE_ENV=production
```
Do not commit `.env` to Git or expose it in frontend code.

Install backend dependencies and start with PM2:
```bash
cd /opt/task-manager/backend
npm ci --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
`pm2 startup` prints a command. Run the exact command it prints to enable startup after reboot.

Install Nginx configuration:
```bash
sudo cp deploy/nginx-task-manager.conf /etc/nginx/sites-available/task-manager
```
If `deploy/` is not on EC2, copy the config there first, or create the file manually. Then update `root` if you chose a different frontend path:
```bash
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/task-manager
sudo nginx -t
sudo systemctl reload nginx
```
If the default Nginx site conflicts, disable it with:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Check:
```bash
pm2 status
pm2 logs task-manager-api
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1/api/health
```
Visit `http://YOUR_EC2_PUBLIC_IP/`. In the EC2 security group, allow inbound TCP 80 from your intended audience. Do not open port 5000 publicly; Nginx proxies requests locally.

## Notes / troubleshooting
- If health returns `database: "disconnected"`, check `MONGODB_URI`, Atlas network access, database username/password, and outbound network connectivity.
- If browser requests fail, check Nginx config and `pm2 logs`.
- For a production system, add authentication, validation/rate limiting, HTTPS, backups, monitoring, and stronger deployment controls before exposing it to real users.
