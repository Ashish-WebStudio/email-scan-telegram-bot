# 📧 Email Scan Telegram Bot

A high-performance, standalone Node.js service for scanning email lists via Telegram. Built with Telegraf, it seamlessly integrates with your existing Email-Scan ecosystem, sharing the same MongoDB backend for unified user management and VIP features.

## ✨ Features

- **🔑 Secure Authentication**: Link your Telegram to your website account using `/login` or via the interactive Signup wizard.
- **📁 Auto-File Processing**: Simply drag and drop `.txt` files containing email lists for instant scanning.
- **🌟 VIP Exclusive Access**: Integrated plan management to ensure premium features are reserved for VIP members.
- **📊 Real-time Profile**: Monitor your plan status, expiry date, and API access directly from Telegram.
- **🔍 Advanced Scanning**: Automatic results delivery in a downloadable `.txt` format.
- **🌐 Website Integration**: Unified database for consistent cross-platform user experience.

---

## 📂 Project Structure

```text
email-scan-telegram-bot/
├── 🤖 bot/
│   └── scenes.js       # Interactive multi-step wizards (Login, Signup, Upload)
├── ⚙️ config/
│   └── db.js           # MongoDB connection management
├── 🗄️ models/
│   ├── User.js         # Unified User schema
│   └── CheckingLog.js  # Scan activity logging
├── 🛠️ scripts/          # Administrative & Diagnostic utilities
│   ├── check_linked.js # View all Telegram-linked users
│   ├── check_logs.js   # Audit recent scanning logs
│   ├── diagnostic.js   # Verify database & connection health
│   └── list_dbs.js     # List available databases
├── 🚀 services/
│   └── scanner.js      # Core scanning logic & file handling
├── 📄 index.js         # Bot entry point & command handlers
└── 📝 README.md        # Documentation
```

---

## 🛠️ Setup & Installation

### 1️⃣ Prerequisites
- **Node.js**: v16+ recommended.
- **MongoDB**: Access to the production/dev database URI.
- **Telegram Token**: Get one from [@BotFather](https://t.me/BotFather).

### 2️⃣ Installation
```bash
npm install
```

### 3️⃣ Environment Configuration
Create or edit your `.env` file:
```env
TELEGRAM_BOT_TOKEN="your_bot_token"
MONGODB_URI="your_mongodb_connection_string"
```

### 4️⃣ Launching the Bot
```bash
# Production
npm start

# Development
npm run dev
```

---

## 🤖 Bot Commands & Usage

### User Commands
- `/start`: Initialize the bot and view your account menu.
- **👤 Profile**: Check your current plan (Free/VIP) and API access.
- **🔍 Check Accounts**: Enter the scanning wizard (VIP only).
- **📤 Logout**: Unlink your Telegram from your Email-Scan account.

### Automated Features
- **File Upload**: Send any `.txt` file containing `email:pass` or just `email` lists to trigger an automatic scan if you are a VIP user.

---

## 🛠️ Developer Scripts
Located in the `scripts/` directory for system maintenance:
- `node scripts/diagnostic.js`: Quick health check for DB connectivity.
- `node scripts/check_linked.js`: List all users currently using the bot.

---

## ⚖️ License
This project is licensed under the ISC License.
