import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 3000;
const directory = path.dirname(fileURLToPath(import.meta.url));
const bookingsFile = path.join(directory, "bookings.json");

function normalizePrice(price) {
    return String(price || "").replace(/\u00e2\u201a\u00a6/g, "\u20a6");
}

function cleanBookings(bookings) {
    return bookings
        .filter((booking) => booking.id !== 1787152810583)
        .map((booking) => ({
            ...booking,
            price: normalizePrice(booking.price)
        }));
}

async function normalizeStoredPrices() {
    try {
        const bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
        const normalizedBookings = cleanBookings(bookings);
        await writeFile(bookingsFile, JSON.stringify(normalizedBookings, null, 2));
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Could not normalize bookings.");
        }
    }
}

app.use(express.json());
app.use((request, response, next) => {
    if (request.path === "/bookings.json") {
        return response.sendStatus(404);
    }

    return next();
});
app.use(express.static(directory));

app.post("/api/bookings", async (request, response) => {
    const { name, phone, service, price, date, message } = request.body;

    if (!name || !phone || !service || !date) {
        return response.status(400).json({
            error: "Name, phone, service, and date are required."
        });
    }

    let bookings = [];

    try {
        bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
        bookings = cleanBookings(bookings);
    } catch (error) {
        if (error.code !== "ENOENT") {
            return response.status(500).json({ error: "Could not read bookings." });
        }
    }

    bookings.push({
        id: Date.now(),
        name: name.trim(),
        phone: phone.trim(),
        service: service.trim(),
        price: normalizePrice(price),
        date,
        message: message ? message.trim() : "",
        createdAt: new Date().toISOString()
    });

    try {
        await writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
    } catch {
        return response.status(500).json({ error: "Could not save booking." });
    }

    return response.status(201).json({ message: "Booking request received." });
});

app.get("/", (request, response) => {
    response.sendFile(path.join(directory, "rayo.html"));
});

export { app };

if (process.env.VERCEL !== "1") {
    normalizeStoredPrices().then(() => {
        app.listen(port, () => {
            console.log(`Nails By Rayo is running at http://localhost:${port}`);
        });
    });
}
