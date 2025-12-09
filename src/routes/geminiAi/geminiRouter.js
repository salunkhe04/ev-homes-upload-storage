import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { successRes } from "../../model/response.js";

const geminiRouter = Router();
const ai = new GoogleGenAI({
  apiKey: "AIzaSyCF4RBaoOghGK7YRXEPlcmxsgO2G-quq4I",
});

geminiRouter.post("/gemini-chat", async (req, res) => {
  try {
    console.log(req.body);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: req.body.text,
      // contents:
      //   'Here is user data: {"name": "Nikhil Rupainwar", "phoneNumber": "+91-8657684467", "linkedIn":"https://www.linkedin.com/in/nikhil-rupainwar-702640136"} based on the linkedIn i provide,can you tell me what is the designation, a?',
    });
    console.log(response.text);
    
    return res.send(
      successRes(200, "oka", {
        data: {
          response: response.text,
        },
      })
    );
  } catch (e) {
    console.log(e);
    return res.send(
      successRes(200, "oka", {
        data: {
          response: `${e}`,
        },
      })
    );
  }
  // const ai = new GoogleGenAI({ apiKey: "AIzaSyCF4RBaoOghGK7YRXEPlcmxsgO2G-quq4I" });

  // const response = await ai.models.generateContent({
  //   model: "gemini-2.5-flash",
  //   contents:
  //     "List a few popular cookie recipes, and include the amounts of ingredients.",
  //   config: {
  //     responseMimeType: "application/json",
  //     responseSchema: {
  //       type: Type.ARRAY,
  //       items: {
  //         type: Type.OBJECT,
  //         properties: {
  //           recipe_name: { type: Type.STRING },
  //           ingredients: {
  //             type: Type.ARRAY,
  //             items: { type: Type.STRING },
  //           },
  //         },
  //         required: ["recipe_name", "ingredients"],
  //       },
  //     },
  //   },
  // });

  // console.log(response.text);
});

export default geminiRouter;
