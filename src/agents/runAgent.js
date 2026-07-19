const { askOllama } = require("../services/ollama.services");
const {
  getTodayBookings,
  getPendingBookings,
  totalRevenue,
  getMostBookedCars,
  getAvailableCars,
  getTotalCars,
  getRejectedBookings,
  getApprovedBookings,
  getCancelledBookings,
  getBookedCars,
  getRevenueToday,
  getAverageBookingValue,
  getHighestRevenueCar,
  getLatestBooking,
  getMonthlyRevenue,
  getFleetUtilization,
  getBusinessInsights,
} = require("./tools");

// ─── Ollama tool definitions for function calling ────────────
const adminTools = [
  {
    type: "function",
    function: {
      name: "get_today_bookings",
      description: "Get the count of bookings created today.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_bookings",
      description: "Get the count of bookings that are pending approval.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_approved_bookings",
      description: "Get the count of approved bookings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_rejected_bookings",
      description: "Get the count of rejected bookings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cancelled_bookings",
      description: "Get the count of cancelled bookings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_total_revenue",
      description: "Get the total revenue generated from all bookings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_today",
      description: "Get the revenue generated today.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_revenue",
      description: "Get the revenue generated this month.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_average_booking_value",
      description: "Get the average booking value across all bookings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_most_booked_car",
      description:
        "Get the most popular / most booked car in the fleet.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_highest_revenue_car",
      description: "Get the car that generated the highest revenue.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_cars",
      description: "Get the count of cars currently available for rent.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booked_cars",
      description: "Get the count of cars currently booked / occupied.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_total_cars",
      description: "Get the total number of cars in the fleet.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_latest_booking",
      description: "Get details of the most recent booking.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fleet_utilization",
      description:
        "Get the fleet utilization percentage (booked cars / total cars).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_business_insights",
      description:
        "Get a full business overview including total cars, available cars, total bookings, and revenue.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ─── Map tool names to actual function calls ────────────────
const toolExecutors = {
  get_today_bookings: async () => {
    const count = await getTodayBookings();
    return { todayBookings: count };
  },
  get_pending_bookings: async () => {
    const count = await getPendingBookings();
    return { pendingBookings: count };
  },
  get_approved_bookings: async () => {
    const count = await getApprovedBookings();
    return { approvedBookings: count };
  },
  get_rejected_bookings: async () => {
    const count = await getRejectedBookings();
    return { rejectedBookings: count };
  },
  get_cancelled_bookings: async () => {
    const count = await getCancelledBookings();
    return { cancelledBookings: count };
  },
  get_total_revenue: async () => {
    const revenue = await totalRevenue();
    return { totalRevenue: revenue };
  },
  get_revenue_today: async () => {
    const revenue = await getRevenueToday();
    return { revenueToday: revenue };
  },
  get_monthly_revenue: async () => {
    const revenue = await getMonthlyRevenue();
    return { monthlyRevenue: revenue };
  },
  get_average_booking_value: async () => {
    const avg = await getAverageBookingValue();
    return { averageBookingValue: avg };
  },
  get_most_booked_car: async () => {
    const car = await getMostBookedCars();
    return { mostBookedCar: car };
  },
  get_highest_revenue_car: async () => {
    const result = await getHighestRevenueCar();
    return { highestRevenueCar: result };
  },
  get_available_cars: async () => {
    const count = await getAvailableCars();
    return { availableCars: count };
  },
  get_booked_cars: async () => {
    const count = await getBookedCars();
    return { bookedCars: count };
  },
  get_total_cars: async () => {
    const count = await getTotalCars();
    return { totalCars: count };
  },
  get_latest_booking: async () => {
    const booking = await getLatestBooking();
    return { latestBooking: booking };
  },
  get_fleet_utilization: async () => {
    const utilization = await getFleetUtilization();
    return { fleetUtilization: utilization };
  },
  get_business_insights: async () => {
    const data = await getBusinessInsights();
    return { businessInsights: data };
  },
};

// ─── Keyword-based fallback (used when Ollama is offline) ───
async function keywordFallback(question) {
  const q = question.toLowerCase();

  if (q.includes("today") && q.includes("booking")) {
    const count = await getTodayBookings();
    return `There are ${count} bookings today.`;
  }
  if (q.includes("pending")) {
    const count = await getPendingBookings();
    return `${count} bookings are pending approval.`;
  }
  if (q.includes("approved")) {
    const count = await getApprovedBookings();
    return `${count} bookings are approved.`;
  }
  if (q.includes("rejected")) {
    const count = await getRejectedBookings();
    return `${count} bookings were rejected.`;
  }
  if (q.includes("cancelled")) {
    const count = await getCancelledBookings();
    return `${count} bookings were cancelled.`;
  }
  if (q.includes("today") && q.includes("revenue")) {
    const revenue = await getRevenueToday();
    return `Today's revenue is ₹${revenue.toLocaleString("en-IN")}.`;
  }
  if (q.includes("monthly") && q.includes("revenue")) {
    const revenue = await getMonthlyRevenue();
    return `This month's revenue is ₹${revenue.toLocaleString("en-IN")}.`;
  }
  if (q.includes("revenue")) {
    const revenue = await totalRevenue();
    return `Total revenue generated is ₹${revenue.toLocaleString("en-IN")}.`;
  }
  if (q.includes("average") && q.includes("booking")) {
    const avg = await getAverageBookingValue();
    return `Average booking value is ₹${avg.toLocaleString("en-IN")}.`;
  }
  if (q.includes("most booked") || q.includes("popular car") || q.includes("top car")) {
    const car = await getMostBookedCars();
    return `${car} is the most booked vehicle.`;
  }
  if (q.includes("highest revenue car") || q.includes("top earning car")) {
    const result = await getHighestRevenueCar();
    return `${result.car} generated ₹${result.revenue?.toLocaleString("en-IN")} revenue.`;
  }
  if (q.includes("available cars") || q.includes("available vehicle")) {
    const count = await getAvailableCars();
    return `${count} cars are available.`;
  }
  if (q.includes("booked cars") || q.includes("occupied cars")) {
    const count = await getBookedCars();
    return `${count} cars are currently booked.`;
  }
  if (q.includes("total cars") || q.includes("fleet")) {
    const count = await getTotalCars();
    return `Your fleet contains ${count} vehicles.`;
  }
  if (q.includes("latest booking") || q.includes("recent booking")) {
    const booking = await getLatestBooking();
    return `Latest Booking\n\nCustomer: ${booking.customer}\nCar: ${booking.car}\nAmount: ₹${booking.amount?.toLocaleString("en-IN")}`;
  }
  if (q.includes("utilization")) {
    const utilization = await getFleetUtilization();
    return `Fleet utilization is ${utilization}%.`;
  }
  if (q.includes("insights") || q.includes("business") || q.includes("overview") || q.includes("summary") || q.includes("dashboard")) {
    const data = await getBusinessInsights();
    return `Business Overview\n\nTotal Cars: ${data.totalCars}\nAvailable Cars: ${data.availableCars}\nTotal Bookings: ${data.totalBookings}\nRevenue: ₹${data.revenue?.toLocaleString("en-IN")}`;
  }

  return null; // No keyword match
}

// ─── Main agent function ────────────────────────────────────
async function runAgent(question) {
  try {
    // First, try Ollama with function-calling tools
    const messages = [
      {
        role: "system",
        content: `You are Royal Route Admin AI Assistant — an intelligent business analytics agent for the Royal Route luxury car rental platform.

Your role:
- Help the admin analyze bookings, revenue, fleet status, and business performance.
- Use the provided tools to fetch real-time data from the database.
- Present data clearly and professionally with proper formatting.
- Always use Indian Rupees (₹) for any monetary values.
- Be concise but informative. Use line breaks for readability.
- If the admin asks a general question not related to the business, answer it briefly using your knowledge.
- If the admin greets you, respond warmly and offer to help with business analytics.
- Never invent or fabricate data — only use what the tools return.
- When presenting numbers, use Indian number formatting (e.g. ₹1,50,000).`,
      },
      {
        role: "user",
        content: question.trim(),
      },
    ];

    const firstResponse = await askOllama(messages, adminTools);

    console.log("ADMIN OLLAMA RESPONSE:", JSON.stringify(firstResponse, null, 2));

    // If no tool calls, return the direct response
    if (!firstResponse?.tool_calls?.length) {
      // Check for malformed tool call text
      const content = firstResponse?.content || "";
      if (
        content.includes('"name"') &&
        (content.includes("get_") || content.includes("business"))
      ) {
        // Model tried to call a tool but emitted it as text — use keyword fallback
        const fallback = await keywordFallback(question);
        return fallback || "I can help you with bookings, revenue, fleet status, and business insights. What would you like to know?";
      }

      return (
        firstResponse?.content ||
        "How can I help you manage your Royal Route business?"
      );
    }

    // Execute tool calls
    messages.push({
      role: "assistant",
      content: firstResponse.content || "",
      tool_calls: firstResponse.tool_calls,
    });

    for (const toolCall of firstResponse.tool_calls) {
      const toolName = toolCall.function?.name;
      const executor = toolExecutors[toolName];

      let toolResult;
      if (executor) {
        toolResult = await executor();
      } else {
        toolResult = { error: `Unknown tool: ${toolName}` };
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Get the final response from Ollama with the tool results
    const finalResponse = await askOllama(messages);

    return (
      finalResponse?.content ||
      "I retrieved the data but couldn't format a response. Please try again."
    );
  } catch (error) {
    console.log("Ollama error (falling back to keyword matching):", error.message);

    // Fallback to keyword-based answers when Ollama is offline
    try {
      const fallback = await keywordFallback(question);
      if (fallback) return fallback;
    } catch (fbErr) {
      console.log("Keyword fallback also failed:", fbErr.message);
    }

    return `I can help you with the following queries:

• Today's bookings
• Pending / Approved / Rejected / Cancelled bookings
• Revenue (today, monthly, total)
• Available / Booked cars
• Fleet size & utilization
• Most booked car
• Top earning car
• Average booking value
• Latest booking
• Business insights & overview

Please try asking one of these questions.`;
  }
}

module.exports = runAgent;