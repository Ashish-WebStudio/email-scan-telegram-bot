require("dotenv").config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const connectDB = require("./config/db");
const User = require("./models/User");
const { loginWizard, signupWizard, uploadWizard } = require("./bot/scenes");

// Connect to MongoDB
connectDB();

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN in .env");
    process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Setup scenes
const stage = new Scenes.Stage([loginWizard, signupWizard, uploadWizard]);
bot.use(session());
bot.use(stage.middleware());

const WEBSITE_URL = "https://emailscan.in";

const unlinkedKeyboard = Markup.keyboard([
    ["🔑 Login", "📝 Sign Up"],
    ["🌐 Visit Website"]
], {
    input_field_placeholder: "Authenticate to get started...",
    is_persistent: true
}).resize();

const linkedKeyboard = Markup.keyboard([
    ["👤 Profile", "🔍 Check Accounts"],
    ["🌐 Visit Website", "📤 Logout"]
], {
    input_field_placeholder: "Choose an action or send a file...",
    is_persistent: true
}).resize();

// Main Start Command
bot.start(async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        console.log(`[DEBUG] /start received from: ${telegramId} (${ctx.from.username || "no-username"})`);

        const user = await User.findOne({ telegramId });

        if (user) {
            // Update social info if it has changed or is missing
            const currentSocial = `(${ctx.from.id})[@${ctx.from.username || 'N/A'}]`;
            if (user.socialUsername !== currentSocial) {
                user.socialUsername = currentSocial;
                await user.save();
            }

            console.log(`[DEBUG] User found: ${user.email}. Sending linked keyboard.`);
            let message = `Welcome back, ${user.username || user.email}! 👋\n\n`;
            message += `*Your Account Status:*\n`;
            message += `- Plan: ${user.vip ? "VIP ⭐️" : "Free Player"}\n`;
            message += `- API Access: ${user.apiaccess ? "Enabled ✅" : "Disabled ❌"}\n\n`;
            message += `Use the menu below to navigate:`;

            return ctx.replyWithMarkdown(message, linkedKeyboard);
        } else {
            console.log(`[DEBUG] User NOT found. Sending unlinked keyboard.`);
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
    ctx.scene.enter("LOGIN_SCENE");
});

bot.action("SIGNUP", (ctx) => {
    ctx.answerCbQuery().catch(() => { });
    ctx.scene.enter("SIGNUP_SCENE");
});

// Reply Keyboard Handlers for Unlinked
bot.hears("🔑 Login", (ctx) => {
    ctx.scene.enter("LOGIN_SCENE");
});

bot.hears("📝 Sign Up", (ctx) => {
    ctx.scene.enter("SIGNUP_SCENE");
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
        message += `*Plan Status:* ${user.vip ? "VIP ⭐️" : "Free Player"}\n`;
        if (user.vip && user.activationExpiryDate) {
            message += `*VIP Expiry:* ${new Date(user.activationExpiryDate).toLocaleDateString()}\n`;
        }
        message += `*API Access:* ${user.apiaccess ? "Enabled ✅" : "Disabled ❌"}\n`;

        ctx.replyWithMarkdown(message, linkedKeyboard);
    } catch (err) {
        console.error("Error showing profile:", err);
    }
});

bot.hears("🔍 Check Accounts", async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        const user = await User.findOne({ telegramId });
        if (!user) return ctx.reply("Please link your account first via /start.");

        if (!user.vip) {
            return ctx.reply("⭐ *VIP Feature*\n\nEmail checking is currently exclusive to VIP members. Please visit the website to upgrade your plan!\n\n🌐 https://emailscan.in", { parse_mode: 'Markdown' });
        }

        ctx.scene.enter("UPLOAD_SCENE");
    } catch (err) {
        console.error(err);
    }
});

bot.hears("🌐 Visit Website", (ctx) => {
    ctx.reply(`Opening website: ${WEBSITE_URL}`);
});

bot.hears("📤 Logout", async (ctx) => {
    try {
        const telegramId = ctx.from.id.toString();
        await User.updateOne({ telegramId }, { $unset: { telegramId: "" } });
        await ctx.reply("You have been logged out and your account has been unlinked.", Markup.removeKeyboard());
        return ctx.reply("Type /start to login or sign up again.");
    } catch (err) {
        console.error("Logout error:", err);
    }
});

bot.launch().then(() => {
    console.log("Bot is running with persistent keyboard logic!");
}).catch(err => {
    console.error("Failed to launch bot:", err);
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
