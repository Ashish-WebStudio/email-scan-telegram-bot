require("dotenv").config();
const mongoose = require("mongoose");

const listDBs = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log("Available Databases:", dbs.databases.map(db => db.name).join(", "));
        process.exit(0);
    } catch (err) {
        console.error("Failed to list databases:", err);
        process.exit(1);
    }
};

listDBs();
