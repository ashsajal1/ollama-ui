import { getModels as fetchModels } from "@/lib/ollama";

export async function initializeModel() {
  try {
    // First try to get the saved model from localStorage
    const savedModel = localStorage.getItem("selectedModel");

    // Fetch available models
    const modelList = await fetchModels();

    // Set the selected model in this order:
    // 1. Use saved model if it exists and is available in the model list
    // 2. Otherwise use the first available model
    // 3. Fallback to "llama2" if no models available
    if (savedModel && modelList.some((m) => m.name === savedModel)) {
      return { models: modelList, selectedModel: savedModel };
    } else if (modelList.length > 0) {
      const defaultModel = modelList[0].name;
      localStorage.setItem("selectedModel", defaultModel);
      return { models: modelList, selectedModel: defaultModel };
    } 
    
    return { models: modelList, selectedModel: "llama2" };
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
}

export function saveSelectedModel(model: string) {
  localStorage.setItem("selectedModel", model);
}