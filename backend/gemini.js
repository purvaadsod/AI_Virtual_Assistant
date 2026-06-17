import axios from "axios"

const geminiResponse = async (command, assistantName, userName) => {
    try {
        const apiUrl = process.env.GEMINI_API_URL
        
        // Detailed prompt to ensure Gemini always returns valid JSON
        const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond ONLY with a JSON object in this exact format:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "clean search query or original input",
  "response": "a short spoken response"
}

Instructions:
- If searching Google/YouTube, put only the search term in "userInput".
- Use ${userName}'s name if they ask who made you.
- "general": For facts or chat. Keep responses short.
- "weather-show": If they ask about temperature or weather.
- IMPORTANT: Do not include any explanation, no markdown backticks, and no text before or after the JSON.

User Input: ${command}`;

        const result = await axios.post(apiUrl, {
            "contents": [{
                "parts": [{ "text": prompt }]
            }]
        });

        // Check if the response exists
        if (!result?.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error("Empty response from Gemini API");
        }

        let rawResponse = result.data.candidates[0].content.parts[0].text;

        // Clean the response: remove ```json and ``` backticks if present
        const cleanJsonString = rawResponse.replace(/```json|```/g, "").trim(); 
        
        // Parse the string into a JavaScript Object
        const parsedData = JSON.parse(cleanJsonString);

        return parsedData;

    } catch (error) {
        console.error("Gemini API error:", error?.response?.data || error.message);
        
        // Return a fallback object so Home.jsx doesn't crash
        return {
            type: "general",
            userInput: command,
            response: "Sorry, I couldn't process that command right now. Please check your connection or API key."
        };
    }
}

export default geminiResponse;