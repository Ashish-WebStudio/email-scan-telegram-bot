const mongoose = require("mongoose");
const crypto = require("crypto");

const genShareId = (len = 8) => {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex')
        .slice(0, len);
};

const StatusSchema = new mongoose.Schema(
    {
        Good: { type: Number, default: 0 },
        Disable: { type: Number, default: 0 },
        Unknown: { type: Number, default: 0 },
        Verify: { type: Number, default: 0 },
        NotExist: { type: Number, default: 0 },
    },
    { _id: false },
);

const CheckingLogSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            default: "anonymous",
            index: true,
        },
        checkingcount: { type: Number, required: true, default: 0 },
        compressedresult: { type: String, required: true },
        status: { type: StatusSchema, required: true },
        shareId: { type: String, required: true, unique: true, index: true },
        ip: { type: String, index: true },
        method: { type: String, default: "bot", index: true }, // "web" or "bot"
        completionTime: { type: Number, default: 0 }, // in milliseconds
    },
    { timestamps: true },
);

CheckingLogSchema.pre("validate", function (next) {
    if (!this.shareId) {
        this.shareId = genShareId(8);
    }
    if (typeof next === 'function') next();
});

const CheckingLog = mongoose.models.CheckingLog || mongoose.model("CheckingLog", CheckingLogSchema);

module.exports = CheckingLog;
