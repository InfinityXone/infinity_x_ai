import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/health", (_req,res)=>{res.json({ok:true,ts:Date.now()});});
app.listen(PORT, ()=>{ console.log('Server running on http://localhost:' + PORT); });
