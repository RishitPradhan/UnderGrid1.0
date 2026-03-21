import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Generate content using local Ollama API
 * @param {string} prompt - The prompt to send to the model
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} - The generated text response
 */
export const generateOllamaContent = async (prompt, systemPrompt = "") => {
    try {
        const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: prompt,
            system: systemPrompt,
            stream: false,
            options: {
                temperature: 0.7,
            }
        }, {
            timeout: 60000 // 60 seconds timeout for local LLM
        });

        if (response.status !== 200) {
            throw new Error(`Ollama returned status ${response.status}`);
        }

        return response.data.response;
    } catch (error) {
        console.error("Ollama Utility Error:", error.message);
        throw error;
    }
};

/**
 * Check if Ollama is running and the model is available
 * @returns {Promise<boolean>}
 */
export const checkOllamaStatus = async () => {
    try {
        const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2000 });
        if (response.status === 200) {
            const models = response.data.models || [];
            return models.some(m => m.name.startsWith(OLLAMA_MODEL));
        }
        return false;
    } catch (error) {
        return false;
    }
};
