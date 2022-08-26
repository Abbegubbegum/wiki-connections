import express, { Express, Request, Response } from "express";
import { resolve } from "path";

const app: Express = express();
const port = 5050;
const frontEndPath = "./frontend/src/";
const htmlPath = "./frontend/src/index.html";

app.use(express.static(resolve(process.cwd(), frontEndPath)));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(htmlPath, { root: process.cwd() });
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
