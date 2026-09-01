const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            minlength: 3,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: function () {
                return this.provider === "local";
            },
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        googleId: {
            type: String,
        },
        vip: {
            type: Boolean,
            default: false,
        },
        apiaccess: {
            type: Boolean,
            default: false,
        },
        provider: {
            type: String,
            enum: ["local", "google", "telegram"],
            default: "local",
        },
        activationExpiryDate: {
            type: Date,
        },
        activationCode: {
            type: String,
        },
        activationDate: {
            type: Date,
        },
        resetToken: {
            type: String,
        },
        resetTokenExpiry: {
            type: Date,
        },
        socialUsername: {
            type: String,
            sparse: true,
        },
        apiKey: {
            type: String,
            default: null,
        },
        apiKeyCreatedAt: {
            type: Date,
        },
        // Telegram Integration Fields
        telegramId: {
            type: String,
            unique: true,
            sparse: true,
        },
        telegramChatId: {
            type: String,
        },
        telegramUsername: {
            type: String,
        },
        telegramLinkToken: {
            type: String,
            unique: true,
            sparse: true,
        },
        telegramLinkTokenExpires: {
            type: Date,
        },
        registrationSource: {
            type: String,
            default: "bot", // can be "web" or "bot"
        },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
