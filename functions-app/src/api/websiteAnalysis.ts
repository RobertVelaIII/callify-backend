import * as express from "express";
import {analyzeWebsite} from "../services/openaiService";

const router = express.Router();

router.post("/", async (req: express.Request, res: express.Response) => {
  const {websiteUrl} = req.body;

  if (!websiteUrl) {
    return res.status(400).send({error: "Website URL is required"});
  }

  try {
    const analysis = await analyzeWebsite(websiteUrl);
    return res.status(200).send(analysis);
  } catch (error) {
    console.error("Error analyzing website:", error);
    return res.status(500).send({error: "An internal error occurred while analyzing the website."});
  }
});

export default router;
