require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();
const helmet = require("helmet");
const router = require("./src/routes/index");
const cors = require("cors");
const morgan = require("morgan");

// Middleware
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

app.use("/api", router);

// GRAPHQL

// Resolver functions
const { createHandler } = require("graphql-http/lib/use/express");
const resolvers = require("./src/resolver/resolver");
const { typeDefs } = require("./src/schema/schema");

// GraphQL endpoint
app.use(
  "/graphql",
  createHandler({
    schema: typeDefs,
    rootValue: resolvers,
  })
);

// SSE
const {
  addClient,
  removeClient,
  sendEvent,
} = require("./src/broadcast/broadcast");
const { usersSchema } = require("./src/models/mongodb");
const { analyzeLeaks } = require("./src/service/ai");
const { scanNIK }     = require("./src/service/nikScan");

const getUserLeak = async (userEmail) => {
  const doc = await usersSchema.findOne({ "users.leakEmailUser": userEmail });
  if (!doc) throw new Error("User not found");

  const user = doc.users.find((u) => u.leakEmailUser === userEmail);
  if (!user) throw new Error("User not found in array");

  // Ubah bentuk dari array of object dengan key dinamis menjadi array LeakItem
  const leaks = user.leakItems.map((item) => {
    const phone = Object.keys(item)[0];
    const data = item[phone];

    return {
      phone,
      email: data.email,
      status: data.status,
      leakStatus: data.leakStatus,
      leakLocation: data.leakLocation || [],
    };
  });

  return leaks;
};

app.get("/events", async (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  addClient(res);

  try {
    const datas = await getUserLeak("ferta966@gmail.com");
    sendEvent(datas);
  } catch {
    // user belum ada di DB, kirim array kosong
    sendEvent([]);
  }

  req.on("close", () => {
    removeClient(res);
  });
});

// AI Analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { leakItems } = req.body;
    if (!leakItems || !Array.isArray(leakItems)) {
      return res.status(400).json({ error: "leakItems array required" });
    }
    const result = await analyzeLeaks(leakItems);
    res.json(result);
  } catch (err) {
    console.error("AI analyze error:", err.message);
    res.status(500).json({ error: "Gagal menganalisis data" });
  }
});

// NIK / KTP Scan endpoint
app.post("/api/nik-scan", async (req, res) => {
  try {
    const { nik } = req.body;
    if (!nik) return res.status(400).json({ error: "NIK wajib diisi" });
    const result = await scanNIK(nik);
    res.json(result);
  } catch (err) {
    console.error("NIK scan error:", err.message);
    res.status(500).json({ error: "Gagal melakukan scan NIK" });
  }
});

// Start server
const PORT = process.env.PORT_GRAPHQL || 5000;
app.listen(PORT, () => {
  console.log(`FRONTEND : http://localhost:${PORT}`);
  console.log(`REST     : http://localhost:${PORT}/api/dorks`);
  console.log(`GRAPHQL  : http://localhost:${PORT}/graphql`);
  console.log(`SSE      : http://localhost:${PORT}/events`);
});
