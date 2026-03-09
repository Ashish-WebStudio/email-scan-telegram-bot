require("dotenv").config();
const mongoose = require("mongoose");
const CheckingLog = require("../models/CheckingLog");

const checkLogs = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);

        const logs = await mongoose.connection.db.collection("checkinglogs")
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log("Recent Logs found:", logs.length);
        logs.forEach(log => {
            console.log(`- ID: ${log._id}, Email: ${log.email}, shareId: ${log.shareId}, IP: ${log.ip}, Date: ${log.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
};

checkLogs();
