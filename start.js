import { app } from "./server.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const directory = path.dirname(fileURLToPath(import.meta.url));
const bookingsFile = path.join(directory, "bookings.json");

try {
    const bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
    await writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
} catch (error) {
    if (error.code !== "ENOENT") {
        console.error("Could not normalize bookings.");
    }
}

app.listen(port, () => {
    console.log(`Nails By Rayo is running at http://localhost:${port}`);
});