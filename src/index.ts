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
	endPath = encodeURIComponent(endPath);

	let unexploredNodes: Node[] = [];
	unexploredNodes.push(startNode);
	let frontier: Node[] = [];

	let allPaths: string[] = [];
	allPaths.push(startNode.path);

	let searchedPaths: string[] = [];

	let endNotFound = true;

	while (endNotFound) {
		let nodesToExplore = [...unexploredNodes];
		unexploredNodes = [];

		let currentCounter = 0;
		let max = nodesToExplore.length;

		console.log("Exploring " + nodesToExplore.length + " new nodes");

		await Promise.all(
			nodesToExplore.map(async (node) => {
				unexploredNodes = (
					await createChildrenNodes(node, allPaths, searchedPaths)
				).concat(unexploredNodes);
				console.clear();
				currentCounter++;
				console.log(`Loaded ${currentCounter} of ${max} nodes`);
			})
		).catch((errPath) => {
			console.log("Failed to parse document on path: " + errPath);
			res.status(500).send("Internal Server Error");
		});

		console.log(unexploredNodes.length + " new unexplored nodes found");
		console.log("Searching through all nodes...");

		frontier.push(startNode);
		while (frontier.length > 0 && endNotFound) {
			let currentNode = frontier.shift();
			// console.log("Checking node " + currentNode.path);
			currentNode.children.forEach((next) => {
				frontier.push(next);
				next.distance = 1 + currentNode.distance;
				if (next.path === endPath) {
					console.log("Found on path: " + currentNode.path);
					console.log("Distance: " + next.distance);
					res.status(200).json({
						path: currentNode.path,
						distance: next.distance,
					});
					endNotFound = false;
					return;
				}
			});
		}
		if (endNotFound) console.log("End not found on current depth");
		if (nodesToExplore.length > 1) {
			fs.writeFileSync("tree.json", JSON.stringify(startNode));
			while (true);
		}
	}
}

function createChildrenNodes(
	parent: Node,
	allPaths: string[],
	searchedPaths: string[]
): Promise<Node[]> {
	return new Promise<Node[]>(async (resolve, reject) => {
		if (searchedPaths.includes(parent.path)) return [];
		// console.log("Creating children nodes of: " + parent.path);
		searchedPaths.push(parent.path);

		let result = await got(wikipediaURL + parent.path);
		let parser = new domParser();
		// fs.writeFile("wiki.html", result.body, (err) => {
		// 	console.log(err);
		// });

		let doc = parser.parseFromString(result.body);

		if (!doc) reject(parent.path);

		let paths = doc
			.getElementById("mw-content-text")
			.getElementsByTagName("a")
			.map((element) => element.getAttribute("href"))
			.filter((link) => {
				if (!link) return false;

				return (
					link.match(/\/wiki\/.+/) &&
					!link.match(/File:/) &&
					!link.match(/https:/)
				);
			})
			.map((link) => link.replace("/wiki/", ""))
			.filter((path) => {
				if (allPaths.includes(path)) return false;

				allPaths.push(path);
				return true;
			});

		// console.log(`Found ${paths.length} new nodes on path ${parent.path}`);

		paths.forEach((path) => {
			parent.addChild(new Node(path, parent.path));
		});

		resolve(parent.children);
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
	parentPath: string;
	children: Node[];
	distance: number;

	constructor(path: string, parentPath?: string) {
		this.path = path;
		this.parentPath = parentPath;
		this.children = [];
		this.distance = 0;
	}

	addChild(node: Node) {
		if (!this.children.includes(node)) this.children.push(node);
	}
}
