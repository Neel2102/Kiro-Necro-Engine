import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { scanRepository } from "@necro/scanner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Update the static files path to be relative to the project root
const publicPath = path.join(process.cwd(), "public");
app.use(express.json());
app.use(express.static(publicPath));

app.post("/api/scan", async (req, res) => {
  try {
    const { repoPath } = req.body;
    if (!repoPath) {
      return res.status(400).json({ error: "Repository path is required" });
    }
    const report = await scanRepository(repoPath);
    res.json({ success: true, report });
  } catch (error) {
    console.error("Scan error:", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message, success: false });
  }
});

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Handle 404 - Return index.html for any other GET request
app.use((req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving static files from: ${publicPath}`);
});
