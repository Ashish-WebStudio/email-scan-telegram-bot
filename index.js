require("dotenv").config();
const express = require("express");
const path = require("path");
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const connectDB = require("./config/db");
const User = require("./models/User");
const { loginWizard, signupWizard, uploadWizard } = require("./bot/scenes");

// Connect to MongoDB
connectDB().catch(err => {
    console.error("Critical DB Connection Error:", err);
    process.exit(1);
});

// --- Express App for Dashboard ---
const app = express();
const PORT = process.env.DASHBOARD_PORT || 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            vipUsers: await User.countDocuments({ vip: true }),
            linkedUsers: await User.countDocuments({ telegramId: { $exists: true } }),
        };
        const users = await User.find({ telegramId: { $exists: true } })
            .sort({ updatedAt: -1 })
            .limit(10);
        res.render("index", { stats, users });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).send("Dashboard error occurred.");
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Front-end monitoring dashboard is running on port ${PORT}`);
});

// --- Telegram Bot Setup ---
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ Missing TELEGRAM_BOT_TOKEN in .env");
    process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Bot error handling to prevent crashes
bot.catch((err, ctx) => {
    console.error(`❌ Bot encountered error for update ${ctx.updateType}:`, err);
    try {
        ctx.reply("⚠️ An unexpected error occurred. Please try /start to reset.");
    } catch (e) {
        console.error("Failed to send error reply:", e);
    }
});

// Setup scenes
const stage = new Scenes.Stage([loginWizard, signupWizard, uploadWizard]);
bot.use(session());
bot.use(stage.middleware());

const WEBSITE_URL = process.env.FRONTEND_URL || "https://emailscan.in";

const unlinkedKeyboard = Markup.keyboard([
    ["🔑 Login", "📝 Sign Up"],
    ["🌐 Visit Website"]
], {
    input_field_placeholder: "Authenticate to get started...",
    is_persistent: true
}).resize();

const linkedKeyboard = Markup.keyboard([
    ["👤 Profile", "📧 Check Accounts"],
    ["🌐 Visit Website", "🚪 Logout"]
], {
    input_field_placeholder: "Choose an action or send a file...",
    is_persistent: true
}).resize();

// Main Start Command (handles both deep-link tokens from website AND normal start)
bot.start(async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        const telegramChatId = ctx.chat.id.toString();
        const connectToken = ctx.startPayload; // Deep-link payload from website

        // --- Deep-link auto-linking from website ---
        if (connectToken) {
            try {
                const user = await User.findOne({
                    telegramLinkToken: connectToken,
                    telegramLinkTokenExpires: { $gt: new Date() }
                });

                if (!user) {
                    return ctx.reply(
                        "❌ Invalid or expired linking link. Please log into the website and generate a new connection link.",
                        unlinkedKeyboard
                    );
                }

                // Unlink any old account currently associated with this telegramId
                const existingUser = await User.findOne({ telegramId });
                if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                    existingUser.telegramId = undefined;
                    existingUser.telegramChatId = undefined;
                    existingUser.telegramUsername = undefined;
                    await existingUser.save();
                }

                // Bind new telegram info and clear the single-use token
                user.telegramId = telegramId;
                user.telegramChatId = telegramChatId;
                user.telegramUsername = ctx.from.username || undefined;
                user.socialUsername = `(${ctx.from.id})[@${ctx.from.username || 'N/A'}]`;
                user.telegramLinkToken = undefined;
                user.telegramLinkTokenExpires = undefined;
                await user.save();

                const vipStatus = user.vip ? "✅ Active" : "❌ Inactive";
                const expiryText = user.activationExpiryDate
                    ? new Date(user.activationExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : "N/A";

                let message = `🎉 *Account linked successfully!*\n\n`;
                message += `Welcome back, *${user.username}*!\n`;
                message += `Your Telegram is now linked to your Email Scan account.\n\n`;
                message += `📧 *Email:* ${user.email}\n`;
                message += `⭐ *VIP Status:* ${vipStatus}\n`;
                message += `📅 *Plan Expiry:* ${expiryText}\n\n`;
                message += `Use the menu below to explore features!`;

                return ctx.replyWithMarkdown(message, linkedKeyboard);
            } catch (err) {
                console.error("Error during Telegram deep link autolink:", err);
                return ctx.reply("❌ An error occurred during auto-linking. Please try again.", unlinkedKeyboard);
            }
        }

        // --- Normal start (no deep-link) ---
        const user = await User.findOne({ telegramId });

        if (user) {
            // Update social info if it has changed or is missing
            const currentSocial = `(${ctx.from.id})[@${ctx.from.username || 'N/A'}]`;
            if (user.socialUsername !== currentSocial) {
                user.socialUsername = currentSocial;
                await user.save();
            }

            let message = `Welcome back, ${user.username || user.email}! 👋\n\n`;
            message += `*Your Account Status:*\n`;
            message += `- Plan: ${user.vip ? "VIP 💎✨" : "Free Player"}\n`;
            message += `- API Access: ${user.apiaccess ? "Enabled 🚀" : "Disabled ❌"}\n\n`;
            message += `Use the menu below to navigate:`;

            return ctx.replyWithMarkdown(message, linkedKeyboard);
        } else {
            let message = `Hello! 👋 Welcome to Email Scan Bot.\n\n`;
            message += `Your Telegram account is not linked to any Email Scan account yet.\n`;
            message += `Please choose an option from the menu below to get started:`;

            return ctx.replyWithMarkdown(message, unlinkedKeyboard);
        }
    } catch (error) {
        console.error("Error in /start command:", error);
        ctx.reply("An error occurred. Please try again later.");
    }
});

// Action Handlers for Inline Buttons (Keep for compatibility)
bot.action("LOGIN", (ctx) => {
    ctx.answerCbQuery().catch(() => { });
    ctx.scene.enter("LOGIN_SCENE").catch(err => console.error("Scene enter error (LOGIN):", err));
});

bot.action("SIGNUP", (ctx) => {
    ctx.answerCbQuery().catch(() => { });
    ctx.scene.enter("SIGNUP_SCENE").catch(err => console.error("Scene enter error (SIGNUP):", err));
});

// Reply Keyboard Handlers for Unlinked
bot.hears("🔑 Login", (ctx) => {
    ctx.scene.enter("LOGIN_SCENE").catch(err => console.error("Scene enter error (Login Button):", err));
});

bot.hears("📝 Sign Up", (ctx) => {
    ctx.scene.enter("SIGNUP_SCENE").catch(err => console.error("Scene enter error (Signup Button):", err));
});

// Reply Keyboard Handlers
bot.hears("👤 Profile", async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        const user = await User.findOne({ telegramId });

        if (!user) {
            return ctx.reply("Account not found. Please link your account first via /start.");
        }

        let message = `*👤 User Profile*\n\n`;
        message += `*Username:* \`${user.username || "N/A"}\` \n`;
        message += `*Email:* \`${user.email}\` \n`;
        message += `*Plan Status:* ${user.vip ? "VIP 💎✨" : "Free Player"}\n`;
        if (user.vip && user.activationExpiryDate) {
            message += `*VIP Expiry:* ${new Date(user.activationExpiryDate).toLocaleDateString()}\n`;
        }
        message += `*API Access:* ${user.apiaccess ? "Enabled 🚀" : "Disabled ❌"}\n`;

        ctx.replyWithMarkdown(message, linkedKeyboard);
    } catch (err) {
        console.error("Error showing profile:", err);
        ctx.reply("Unable to fetch profile.");
    }
});

bot.hears("📧 Check Accounts", async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        const user = await User.findOne({ telegramId });
        if (!user) return ctx.reply("Please link your account first via /start.");

        if (!user.vip) {
            return ctx.reply(`💎 *VIP Feature*\n\nEmail checking is currently exclusive to VIP members. Please visit the website to upgrade your plan!\n\n🌐 ${WEBSITE_URL}`, { parse_mode: 'Markdown' });
        }

        ctx.scene.enter("UPLOAD_SCENE").catch(err => console.error("Scene enter error (Check Accounts):", err));
    } catch (err) {
        console.error("Error in check accounts:", err);
    }
});

bot.hears("🌐 Visit Website", (ctx) => {
    ctx.reply(`Opening website: ${WEBSITE_URL}`).catch(() => {});
});

bot.hears("🚪 Logout", async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        // Clear all telegram fields on logout
        await User.updateOne(
            { telegramId },
            {
                $unset: {
                    telegramId: "",
                    telegramChatId: "",
                    telegramUsername: "",
                    telegramLinkToken: "",
                    telegramLinkTokenExpires: ""
                }
            }
        );
        await ctx.reply("You have been logged out and your account has been unlinked.", Markup.removeKeyboard());
        return ctx.reply("Type /start to login or sign up again.");
    } catch (err) {
        console.error("Logout error:", err);
        ctx.reply("Logout failed. Please try again.");
    }
});

// Launch bot
bot.launch().then(() => {
    console.log("🤖 Telegram Bot is running!");
}).catch(err => {
    console.error("❌ Failed to launch bot:", err);
});

// --- Global Error Handling for Process ---
process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION:", err);
    // In production, you might want to restart the process
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// Enable graceful stop
process.once("SIGINT", () => {
    console.log("SIGINT received. Stopping...");
    bot.stop("SIGINT");
    process.exit(0);
});
process.once("SIGTERM", () => {
    console.log("SIGTERM received. Stopping...");
    bot.stop("SIGTERM");
    process.exit(0);
});
