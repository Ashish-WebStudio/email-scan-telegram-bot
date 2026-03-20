const mongoose = require("mongoose");

const connectDB = async (retryCount = 5) => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MongoDB URI is missing in .env");
        process.exit(1);
    }

    while (retryCount > 0) {
        try {
            const conn = await mongoose.connect(uri, {
                // Pre-Mongoose 6 options (just in case)
                // useNewUrlParser: true,
                // useUnifiedTopology: true,
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            retryCount--;
            console.error(`❌ Error connecting to MongoDB: ${error.message}`);
            if (retryCount === 0) {
                console.error("🔥 All MongoDB connection retries failed. Exiting...");
                process.exit(1);
            }
            console.log(`🔄 Retrying in 5 seconds... (${retryCount} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};

module.exports = connectDB;
