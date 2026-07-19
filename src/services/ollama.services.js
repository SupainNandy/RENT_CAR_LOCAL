const axios = require("axios");

const askOllama = async (messages, tools = []) => {
  const response = await axios.post("http://127.0.0.1:11434/api/chat", {
    model: "llama3.2:3b",
    messages,
    tools,
    stream: false,
  });

  return response.data.message;
};

module.exports = { askOllama };