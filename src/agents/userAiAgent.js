const { askOllama } = require("../services/ollama.services");
const Car = require("../module/car.model");
const Booking = require("../module/booking.model");

const tools = [
  {
    type: "function",
    function: {
      name: "find_cars",
      description:
        "Find available rental cars only when the customer clearly asks to find, see, rent, compare, recommend, or check available cars.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City or pickup location",
          },
          maxPrice: {
            type: "number",
            description: "Maximum daily rental price in Indian Rupees (INR)",
          },
          transmission: {
            type: "string",
            enum: ["Manual", "Automatic"],
          },
          brand: {
            type: "string",
            description:
              "Car brand such as BMW, Audi, Mercedes-Benz. If the customer names multiple brands, call find_cars once per brand.",
          },
          seats: {
            type: "number",
            description: "Required number of seats",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_bookings",
      description:
        "Get the current logged-in customer's bookings only when they ask about their own reservations or booking history.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const isGreeting = (message = "") => {
  const text = message
    .toLowerCase()
    .trim()
    .replace(/[!?.]/g, "");

  return [
    "hi",
    "hello",
    "hey",
    "hii",
    "hiii",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
  ].includes(text);
};

const isCarRentalQuestion = (message = "") => {
  const text = message.toLowerCase();

  const rentalKeywords = [
    "car",
    "cars",
    "rental",
    "rent",
    "vehicle",
    "vehicles",
    "booking",
    "bookings",
    "reservation",
    "reservations",
    "available",
    "availability",
    "price",
    "prices",
    "cost",
    "budget",
    "automatic",
    "manual",
    "seats",
    "seat",
    "location",
    "pickup",
    "drop",
    "bmw",
    "audi",
    "mercedes",
    "mercedes-benz",
    "toyota",
    "hyundai",
    "kia",
    "fortuner",
    "creta",
    "seltos",
    "x5",
    "q7",
    "glc",
    "rupee",
    "inr",
    "₹",
    "select",
    "choose",
    "recommend",
    "suggest",
    "compare",
  ];

  return rentalKeywords.some((keyword) => text.includes(keyword));
};

// Known brands we support filtering on. Used to (a) detect brand mentions
// directly in the user's message, and (b) fall back to a deterministic
// DB query when the local LLM fails to call find_cars on its own.
const KNOWN_BRANDS = [
  "bmw",
  "audi",
  "mercedes-benz",
  "mercedes",
  "toyota",
  "hyundai",
  "kia",
];

const extractBrandsFromMessage = (message = "") => {
  const text = message.toLowerCase();
  const found = new Set();
  for (const brand of KNOWN_BRANDS) {
    if (text.includes(brand)) {
      found.add(brand === "mercedes" ? "mercedes-benz" : brand);
    }
  }
  return Array.from(found);
};

const LUXURY_KEYWORDS = ["luxury", "premium", "exotic", "high-end", "high end", "top end"];

const isLuxuryQuery = (message = "") => {
  const text = message.toLowerCase();
  return LUXURY_KEYWORDS.some((kw) => text.includes(kw));
};

// Detects when the model tried to make a tool call but emitted it as broken
// plain text instead of a structured tool_calls array (common with local
// models that don't natively support function calling). We don't try to
// parse the garbled JSON — that's unreliable — we just recognize the intent
// and take the safe, deterministic action instead of showing raw text.
const looksLikeMalformedToolCall = (text = "") => {
  const t = text.toLowerCase();
  return (
    (t.includes('"name"') || t.includes("'name'")) &&
    (t.includes("find_cars") || t.includes("get_my_bookings"))
  );
};

const findCars = async (args = {}) => {
  const query = { available: true };

  if (args.location?.trim()) {
    query.location = new RegExp(args.location.trim(), "i");
  }

  if (args.brand?.trim()) {
    query.brand = new RegExp(args.brand.trim(), "i");
  }

  if (args.transmission) {
    query.transmission = args.transmission;
  }

  if (args.maxPrice) {
    query.pricePerDay = {
      $lte: Number(args.maxPrice),
    };
  }

  if (args.seats) {
    query.seats = Number(args.seats);
  }

  return Car.find(query)
    .select(
      "brand model pricePerDay transmission seats location images fuelType year"
    )
    .limit(6)
    .lean();
};

// Query multiple brands at once with a single DB call ($or of regexes).
// This is what lets "Audi and BMW" resolve correctly instead of the model
// having to guess or invent results for the brand it didn't query.
const findCarsMultiBrand = async (brands = [], baseArgs = {}) => {
  const query = { available: true };

  if (baseArgs.location?.trim()) {
    query.location = new RegExp(baseArgs.location.trim(), "i");
  }
  if (baseArgs.transmission) {
    query.transmission = baseArgs.transmission;
  }
  if (baseArgs.maxPrice) {
    query.pricePerDay = { $lte: Number(baseArgs.maxPrice) };
  }
  if (baseArgs.seats) {
    query.seats = Number(baseArgs.seats);
  }

  if (brands.length) {
    query.$or = brands.map((b) => ({ brand: new RegExp(b, "i") }));
  }

  return Car.find(query)
    .select(
      "brand model pricePerDay transmission seats location images fuelType year"
    )
    .limit(12)
    .lean();
};

const getMyBookings = async (userId) => {
  return Booking.find({ userId })
    .populate("carId", "brand model images pricePerDay location")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
};

// Extra protection: replace foreign currency symbols in AI response
const convertToIndianRupee = (text = "") => {
  return text
    .replace(/£/g, "₹")
    .replace(/€/g, "₹")
    .replace(/\$/g, "₹")
    .replace(/GBP/gi, "INR")
    .replace(/EUR/gi, "INR")
    .replace(/USD/gi, "INR")
    .replace(/pounds?/gi, "rupees")
    .replace(/euros?/gi, "rupees")
    .replace(/dollars?/gi, "rupees");
};

// Build the factual part of the reply directly from real DB documents.
// The LLM is never trusted to state model names or prices — those always
// come straight from `cars`, so it is structurally impossible to hallucinate
// a car that isn't in your MongoDB.
// Plain text only — the frontend renders `cars` as visual cards separately,
// so this just needs to be a short, non-redundant intro line. No markdown:
// the chat bubble is a plain <p>, so "**bold**" shows as literal asterisks
// jammed next to the text, which is what was reading as "overlapping" text.
const formatCarsList = (cars = []) => {
  if (!cars.length) return "";

  const brands = [...new Set(cars.map((c) => c.brand).filter(Boolean))];
  const brandLabel =
    brands.length > 1
      ? `${brands.slice(0, -1).join(", ")} and ${brands[brands.length - 1]}`
      : brands[0] || "matching";

  const count = cars.length;
  return `I found ${count} ${brandLabel} car${count === 1 ? "" : "s"} available for you below.`;
};

const formatBookingsList = (bookings = []) => {
  if (!bookings.length) return "";
  const count = bookings.length;
  return `Here ${count === 1 ? "is" : "are"} your ${count} reservation${
    count === 1 ? "" : "s"
  }.`;
};

const answerGeneralQuestion = async (message) => {
  const response = await askOllama([
    {
      role: "system",
      content: `
You are Royal Route AI.

Answer the user's general knowledge question briefly and accurately.
Do not mention car rentals unless the user asks about them.
Do not call any tools.

IMPORTANT:
- If you mention money, always use Indian Rupees only.
- Always use ₹ symbol for prices.
- Never use £, €, $, GBP, EUR, USD, pounds, euros, or dollars.
      `,
    },
    {
      role: "user",
      content: message.trim(),
    },
  ]);

  return convertToIndianRupee(
    response?.content || "I’m not certain about that."
  );
};

const runUserAiAgent = async ({ message, userId }) => {
  const cleanMessage = message?.trim();

  if (!cleanMessage) {
    return {
      reply: "Please tell me how I can assist you.",
      cars: [],
      bookings: [],
    };
  }

  if (isGreeting(cleanMessage)) {
    return {
      reply:
        "Welcome to Royal Route. I can assist with vehicle availability, rental prices in ₹, car recommendations, and your reservations.",
      cars: [],
      bookings: [],
    };
  }

  if (!isCarRentalQuestion(cleanMessage)) {
    const reply = await answerGeneralQuestion(cleanMessage);

    return {
      reply,
      cars: [],
      bookings: [],
    };
  }

  // --- Deterministic pre-check ---------------------------------------
  // If the message clearly names one or more known brands, go straight to
  // the database instead of relying on Ollama to decide to call find_cars.
  // This is what actually fixes "select audi and bmw": local models often
  // skip the tool call (or only call it for one brand) and just complete
  // the sentence with invented specs. We remove that failure path entirely
  // for the common case, and still let the LLM add a short friendly intro.
  const mentionedBrands = extractBrandsFromMessage(cleanMessage);

  if (mentionedBrands.length >= 1 && /select|choose|compare|recommend|suggest|show|find|available|rent/i.test(cleanMessage)) {
    const cars = await findCarsMultiBrand(mentionedBrands);

    if (!cars.length) {
      return {
        reply:
          "No matching vehicles are currently available for that brand. You can try a different brand, budget, or location.",
        cars: [],
        bookings: [],
      };
    }

    return {
      reply: `${formatCarsList(cars)} Would you like me to filter by budget, location, or transmission?`,
      cars,
      bookings: [],
    };
  }

  // "Show me luxury cars" and similar have no brand to match on, so they'd
  // otherwise fall through to the LLM tool-call flow — which is exactly the
  // path that was returning broken pseudo-JSON instead of calling find_cars.
  // Treat "luxury" as: available cars, sorted highest price first.
  if (isLuxuryQuery(cleanMessage) && !mentionedBrands.length) {
    const cars = await Car.find({ available: true })
      .select(
        "brand model pricePerDay transmission seats location images fuelType year"
      )
      .sort({ pricePerDay: -1 })
      .limit(6)
      .lean();

    if (!cars.length) {
      return {
        reply:
          "No vehicles are currently available. Please check back soon or try a different filter.",
        cars: [],
        bookings: [],
      };
    }

    return {
      reply: `${formatCarsList(cars)} These are our top picks by price — let me know if you'd like a specific brand or budget instead.`,
      cars,
      bookings: [],
    };
  }

  const messages = [
    {
      role: "system",
      content: `
You are Royal Route AI, a premium car rental concierge based in India.

Rules:
- Be professional, concise, and helpful.
- Royal Route is an Indian car rental platform.
- ALL prices must always be shown in Indian Rupees using ₹.
- Example correct price: ₹2,500/day or ₹2,500 per day.
- Never use £, €, $, GBP, EUR, USD, pounds, euros, or dollars.
- Never recommend foreign-market used car prices.
- Only call find_cars when the user clearly asks to find, view, compare, rent, recommend, or check available cars.
- Only call get_my_bookings when the user asks about their own bookings or reservations.
- Never assume a celebrity, person's name, city, or random word is a car brand.
- Never invent cars, prices, availability, bookings, or policies.
- When find_cars returns vehicles, use only those vehicles and their exact pricePerDay values.
- If the user asks a general question, answer it normally without tools.
      `,
    },
    {
      role: "user",
      content: cleanMessage,
    },
  ];

  const firstResponse = await askOllama(messages, tools);

  console.log(
    "OLLAMA FIRST RESPONSE:",
    JSON.stringify(firstResponse, null, 2)
  );

  if (!firstResponse?.tool_calls?.length) {
    // The model may have tried to call a tool but emitted it as broken plain
    // text instead of a real tool_calls entry (seen with local models that
    // don't reliably support structured function calling). Never show that
    // raw text to the user — fall back to the safe deterministic action.
    if (looksLikeMalformedToolCall(firstResponse?.content || "")) {
      const cars = await findCars({});

      if (!cars.length) {
        return {
          reply:
            "No matching vehicles are currently available. You can try changing the budget, location, brand, or transmission preference.",
          cars: [],
          bookings: [],
        };
      }

      return {
        reply: `${formatCarsList(cars)} Would you like me to filter by budget, location, or transmission?`,
        cars,
        bookings: [],
      };
    }

    return {
      reply: convertToIndianRupee(
        firstResponse?.content ||
          "How may I assist you with your Royal Route rental?"
      ),
      cars: [],
      bookings: [],
    };
  }

  messages.push({
    role: "assistant",
    content: firstResponse.content || "",
    tool_calls: firstResponse.tool_calls,
  });

  let cars = [];
  let bookings = [];
  let searchedCars = false;
  let searchedBookings = false;

  for (const toolCall of firstResponse.tool_calls) {
    const toolName = toolCall.function?.name;

    let args = toolCall.function?.arguments || {};

    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }

    let toolResult = [];

    if (toolName === "find_cars") {
      searchedCars = true;
      toolResult = await findCars(args);
      // Accumulate rather than overwrite, so multiple find_cars calls
      // (e.g. one per brand) all end up represented in the final list.
      const existingIds = new Set(cars.map((c) => String(c._id)));
      for (const c of toolResult) {
        if (!existingIds.has(String(c._id))) {
          cars.push(c);
          existingIds.add(String(c._id));
        }
      }
    } else if (toolName === "get_my_bookings") {
      searchedBookings = true;
      toolResult = await getMyBookings(userId);
      bookings = toolResult;
    } else {
      toolResult = {
        error: "Unknown tool requested",
      };
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult),
    });
  }

  // --- Deterministic final reply --------------------------------------
  // Instead of asking Ollama to restate car/booking facts in prose (which
  // is where hallucinated models/prices were coming from), build the
  // factual list ourselves from the real DB documents, and only use the
  // LLM for a short conversational intro/closing line.
  if (searchedCars) {
    if (!cars.length) {
      return {
        reply:
          "No matching vehicles are currently available. You can try changing the budget, location, brand, or transmission preference.",
        cars: [],
        bookings: [],
      };
    }

    return {
      reply: `${formatCarsList(cars)} Would you like me to filter by budget, location, or transmission?`,
      cars,
      bookings: [],
    };
  }

  if (searchedBookings) {
    if (!bookings.length) {
      return {
        reply:
          "You do not have any reservations yet. You can explore our available vehicles whenever you are ready.",
        cars: [],
        bookings: [],
      };
    }

    return {
      reply: formatBookingsList(bookings),
      cars: [],
      bookings,
    };
  }

  return {
    reply: "How may I assist you with your Royal Route rental?",
    cars: [],
    bookings: [],
  };
};

module.exports = { runUserAiAgent };