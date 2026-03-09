require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({ telegramId: { $exists: true, $ne: "" } });
        console.log(`Found ${users.length} linked users:`);
        users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.telegramId})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
