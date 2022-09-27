import express, { Express, Request, Response } from "express";
import { resolve } from "path";
import fs from "fs";
import got from "got";
import domParser from "dom-parser";

const app: Express = express();
const port = 5050;
const frontEndPath = "./frontend/src/";
const htmlPath = "./frontend/src/index.html";

const wikipediaURL = "https://en.wikipedia.org/wiki/";

app.use(express.static(resolve(process.cwd(), frontEndPath)));

app.get("/", (req: Request, res: Response) => {
	res.sendFile(htmlPath, { root: process.cwd() });
});

app.get("/data", handleUrls);

app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});

async function handleUrls(req: Request, res: Response) {
	let startPath = req.query.start;
	let endPath = req.query.end;

	if (typeof startPath !== "string" || typeof endPath !== "string")
		return res.sendStatus(400);

	let startNode = new Node(startPath);
	await createChildrenNodes(startNode);
	console.dir(startNode);
	let frontier: Node[] = [];
	frontier.push(startNode);
	let distance: {} = {};
	distance[startNode.path] = 0;
	
	while (frontier.length > 0) {
		let currentNode = frontier.shift();
		currentNode.neighbors.forEach((next) => {
			if (!distance[currentNode.path]) {
				frontier.push(next);
				distance[next.path] = 1 + distance[currentNode.path];
				if (next.path === endPath) {
					console.log("Found on path" + currentNode.path);
					console.log("Distance: " + distance[next.path]);
				}
			}
		});
	}
}

function createChildrenNodes(node: Node): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		let result = await got(wikipediaURL + node.path);
		let parser = new domParser();
		// fs.writeFile("wiki.html", result.body, (err) => {
		// 	console.log(err);
		// });

		let doc = parser.parseFromString(result.body);

		if (!doc) return undefined;

		let paths = doc
			.getElementById("mw-content-text")
			.getElementsByTagName("a")
			.map((link) => link.getAttribute("href"))
			.filter((link) => {
				if (!link) return false;

				return link.match(/\/wiki\/.+/);
			})
			.map((link) => link.replace("/wiki/", ""));

		paths.forEach((path) => {
			node.addNeighbor(new Node(path));
		});

		resolve();
	});
}

// async function searchPath(path: string, endPath: string) {
// 	let paths = await createChildrenNodes(path);

// 	if (!paths) return;

// 	if (paths.includes(endPath)) {
// 		console.log("Found on path: " + path);
// 		return;
// 	}

// 	paths.forEach((path) => {
// 		searchPath(path, endPath);
// 	});
// }

class Node {
	path: string;
	neighbors: Node[];

	constructor(path: string) {
		this.path = path;
		this.neighbors = [];
	}

	addNeighbor(node: Node) {
		this.neighbors.push(node);
	}
}

interface Distance {
	node: Node;
	distance: number;
}
