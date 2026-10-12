console.log("Starting index.js...");
import express from "express";
import cors from "cors";
console.log("Express and CORS imported");
import { answerQuestion } from "./agent.js";

console.log("Agent imported successfully");


const app = express();


// ============================================
// 1. MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());


// ============================================
// 2. HOME ROUTE
// ============================================

app.get("/", (req, res) => {
    res.send("YouTube RAG server is running!");
});


// ============================================
// 3. GENERATE ANSWER ROUTE
// ============================================

app.post("/generate", async (req, res) => {
    try {
        const { query, video_id } = req.body;

        if (!query) {
            return res.status(400).json({
                error: "Query is required"
            });
        }

        console.log("Question received:", query);

        const answer = await answerQuestion(query, video_id);

        return res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error("Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// ============================================
// 4. START SERVER
// ============================================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(
        `Server is running on http://localhost:${PORT}`
    );
});