require("dotenv").config();
const mongoose = require("mongoose");

const runDiagnostic = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const dbName = mongoose.connection.db.databaseName;
        console.log("Connected to Database:", dbName);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in this DB:", collections.map(c => c.name).join(", "));

        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
};

runDiagnostic();
