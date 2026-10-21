require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

async function start() {
  if (!mongoUri) {
    console.error("MONGODB_URI is missing. Set it in backend/.env.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to MongoDB.");

    app.listen(port, "127.0.0.1", () => {
      console.log(`Task Manager API listening on http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
