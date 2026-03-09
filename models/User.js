const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
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
        telegramId: {
            type: String,
            sparse: true,
            unique: true,
        },
        activationCode: {
            type: String,
        },
        activationDate: {
            type: Date,
        },
        activationExpiryDate: {
            type: Date,
        },
        socialUsername: {
            type: String,
            sparse: true,
        },
        registrationSource: {
            type: String,
            default: "bot", // can be "web" or "bot"
        },
        // We omit fields not immediately needed by the bot for auth checks (e.g. OTP tokens) 
        // unless they are explicitly required in queries.
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
