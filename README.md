# GoalConnect

A goal tracking application built with React (Vite) frontend and Node.js/Express backend.

## 🚀 Running Locally

Follow these step-by-step instructions to set up and run GoalConnect on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (to clone the repository)

#### Installing Prerequisites

**Node.js and npm:**
```bash
# Visit https://nodejs.org and download the latest LTS version
# Or use a package manager:

# macOS (using Homebrew):
brew install node

# Ubuntu/Debian:
sudo apt update
sudo apt install nodejs npm

# Windows: Download from https://nodejs.org
```

### Database Setup

You have two options for the database:

#### Option 1: MongoDB Atlas (Recommended for beginners)

1. **Create a free MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Click "Try Free" and create an account
   - Create a new project

2. **Create a free cluster:**
   - Click "Create a Cluster"
   - Choose the free tier (M0 Sandbox)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Set up database access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set privileges to "Read and write to any database"

4. **Set up network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Add Current IP Address"
        - (if switching IP addresses constantly, click "Allow Access from Anywhere" making it ip:0.0.0.0/0 which would be technically insecure so try to avoid) 
   - Click "Confirm"

5. **Get your connection string:**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

#### Option 2: Local MongoDB Installation

**Install MongoDB locally:**
```bash
# macOS (using Homebrew):
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install mongodb-org

# Windows: Download from https://www.mongodb.com/try/download/community
```

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd GoalConnect
```

#### 2. Start MongoDB (Only if using local MongoDB)
If you chose local MongoDB installation, start the service:

```bash
# macOS/Linux:
sudo mongod

# Or if installed via Homebrew on macOS:
brew services start mongodb-community

# Windows: 
# MongoDB should start automatically as a service, or run:
# net start MongoDB
```

#### 3. Backend Setup

Navigate to the backend directory and install dependencies:
```bash
cd GoalConnect/goalconnect-backend
npm install
```

Create a `.env` file in the backend directory:
```bash
touch .env
```

Add the following environment variables to the `.env` file:

**If using MongoDB Atlas:**
```env
PORT=3001
MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/goalconnect?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

**If using local MongoDB:**
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/goalconnect
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

**Important:** 
- Replace the MongoDB URI with your actual connection string from Atlas (if using cloud)
- Replace `yourusername` and `yourpassword` with your actual Atlas credentials
- Replace `your_super_secret_jwt_key_here_make_it_long_and_random` with a secure, random string

#### 4. Frontend Setup

Open a new terminal window/tab and navigate to the frontend directory:
```bash
cd GoalConnect
npm install
```

### Running the Application

You'll need to run both the backend and frontend simultaneously. Use two separate terminal windows/tabs:

#### Terminal 1: Start the Backend Server
```bash
cd GoalConnect/goalconnect-backend
node server.js
```

You should see:
```
Connected to MongoDB
Server is running on port 3001
```

#### Terminal 2: Start the Frontend Development Server
```bash
cd GoalConnect
npm run dev
```

You should see output similar to:
```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 🎉 Access the Application

Open your web browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Development Scripts

**Frontend (React + Vite):**
```bash
cd GoalConnect
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend (Node.js + Express):**
```bash
cd GoalConnect/goalconnect-backend
node server.js       # Start the server
```

### Troubleshooting

**Common Issues:**

1. **Port already in use:**
   ```bash
   # Kill process on port 3001 (backend)
   lsof -ti:3001 | xargs kill -9
   
   # Kill process on port 5173 (frontend)
   lsof -ti:5173 | xargs kill -9
   ```

2. **MongoDB connection error:**
   - Ensure MongoDB is running: `brew services list | grep mongodb` (macOS)
   - Check if the MongoDB URI in `.env` is correct
   - Try connecting manually: `mongosh mongodb://localhost:27017/goalconnect`

3. **MongoDB Atlas IP Address Not Whitelisted (Common Issue):**
   If you're using MongoDB Atlas and getting connection timeout or authentication errors, your current IP address might not be whitelisted:
   
   **Symptoms:**
   - Connection timeout errors
   - "MongoNetworkError: failed to connect to server"
   - Authentication failures when credentials are correct
   
   **Solution:**
   1. Go to your [MongoDB Atlas dashboard](https://cloud.mongodb.com)
   2. Navigate to your project
   3. Click on "Network Access" in the left sidebar
   4. Check if your current IP address is listed
   5. If not, click "Add IP Address"
   6. Choose one of these options:
      - **Add Current IP Address** (recommended for security)
      - **Allow Access from Anywhere** (0.0.0.0/0) - ⚠️ **only for development**
   7. Click "Confirm"
   8. Wait 1-2 minutes for changes to propagate
   
   **Note:** Your IP address may change if you're on a dynamic network (home WiFi, mobile hotspot, etc.). You may need to repeat this process if you change networks.

4. **Module not found errors:**
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Permission errors (Linux/macOS):**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   ```

### Project Structure
```
GoalConnect/
├── src/                    # React frontend source code
├── public/                 # Static assets
├── goalconnect-backend/    # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── package.json           # Frontend dependencies
└── README.md              # This file
```

### Technologies Used
- **Frontend:** React 19, Vite, React Calendar
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Development:** ESLint, Vite Hot Module Replacement

---

Happy coding! 🎯
