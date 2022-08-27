import express, { Express, Request, Response } from "express";
import { resolve } from "path";
import { IncomingMessage } from "http";
import got from "got";
import domParser from "dom-parser";

const app: Express = express();
const port = 5050;
const frontEndPath = "./frontend/src/";
const htmlPath = "./frontend/src/index.html";

app.use(express.static(resolve(process.cwd(), frontEndPath)));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(htmlPath, { root: process.cwd() });
});

app.get("/data", handleUrls);

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});

async function handleUrls(req: Request, res: Response) {
    let url1 = req.query.url1;
    let url2 = req.query.url2;
    let parser = new domParser();
    console.log("Checking url1: " + url1);
    console.log("Checking url2: " + url2);

    if (typeof url1 !== "string" || typeof url2 !== "string")
        return res.sendStatus(400);

    let result = await got(url1);
    let document1 = parser.parseFromString(result.body);

    if (!document1) res.status(400).send("URL1 Failed");

    console.log(document1.getElementById("mw-content-text").innerHTML);
}
