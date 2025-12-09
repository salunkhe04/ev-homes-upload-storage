import { Router } from "express";
const chatRouter = Router();

const regexResponses = [
  { pattern: /hello/i, response: "Hi there! How can I assist you today?" },
  { pattern: /hii/i, response: "Hi there! How can I assist you today?" },
  { pattern: /hi/i, response: "Hi there! How can I assist you today?" },
  {
    pattern: /help/i,
    response: "I'm here to help! Let me know your questions.",
  },
  { pattern: /bye/i, response: "Goodbye! Have a great day!" },
  { pattern: /mayur/i, response: "Yes! Mayur is noob!" },
];

chatRouter.post("/chat", (req, res) => {
  const { message } = req.body;

  let response = "I'm sorry, I don't understand. Can you please rephrase?";
  regexResponses.forEach(({ pattern, response: customResponse }) => {
    if (pattern.test(message)) {
      response = customResponse;
    }
  });

  res.json({ reply: response });
});



export default chatRouter;
