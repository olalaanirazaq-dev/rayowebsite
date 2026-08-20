import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const bookingsFile = path.join(directory, "..", "bookings.json");

export default async function handler(request, response) {
	if (request.method !== "POST") {
		response.statusCode = 405;
		return response.end("Method Not Allowed");
	}

	const { name, phone, service, price, date, message } = request.body || {};

	if (!name || !phone || !service || !date) {
		response.statusCode = 400;
		response.setHeader("Content-Type", "application/json");
		return response.end(JSON.stringify({
			error: "Name, phone, service, and date are required."
		}));
	}

	let bookings = [];

	try {
		bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
	} catch (error) {
		if (error.code !== "ENOENT") {
			response.statusCode = 500;
			return response.end("Could not read bookings.");
		}
	}

	bookings.push({
		id: Date.now(),
		name: String(name).trim(),
		phone: String(phone).trim(),
		service: String(service).trim(),
		price: String(price || ""),
		date,
		message: String(message || "").trim(),
		createdAt: new Date().toISOString()
	});

	try {
		await writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
	} catch {
		response.statusCode = 500;
		return response.end("Could not save booking.");
	}

	response.statusCode = 201;
	response.setHeader("Content-Type", "application/json");
	return response.end(JSON.stringify({ message: "Booking request received." }));
}