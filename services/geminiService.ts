import { GoogleGenAI } from "@google/genai";
import { Node, Link, TopologyType, Language } from '../types';

// Initialize Gemini
// Note: In a real app, ensure process.env.API_KEY is defined in your build environment.
// For this simulator, we rely on the environment variable availability.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const explainSimulation = async (
  topology: TopologyType,
  nodes: Node[],
  links: Link[],
  path: string[],
  success: boolean,
  senderId: string,
  receiverId: string,
  language: Language
): Promise<string> => {
  
  if (!apiKey) {
    return language === 'fr' 
      ? "Clé API manquante. Impossible de générer l'explication." 
      : "API Key missing. Cannot generate explanation.";
  }

  const brokenNodes = nodes.filter(n => !n.active).map(n => n.label).join(', ');
  const brokenLinks = links.filter(l => !l.active).map(l => `${l.source}-${l.target}`).join(', ');
  
  const context = `
    Context: Network Topology Simulator.
    Topology Type: ${topology}.
    Sender: Node ${senderId}.
    Receiver: Node ${receiverId}.
    Outcome: ${success ? "SUCCESS" : "FAILURE"}.
    Path Taken: ${path.join(' -> ')}.
    Broken Devices: [${brokenNodes}].
    Broken Cables: [${brokenLinks}].
    Language: ${language === 'fr' ? "French" : "English"}.
  `;

  const prompt = `
    ${context}
    
    Task: Explain simply why the data transmission succeeded or failed based on the topology rules and the specific failures (if any).
    
    If it is a BUS topology, mention how the backbone or terminators affect it.
    If it is a RING, mention the loop direction or break.
    If it is a STAR, mention the central hub status.
    If it is MESH, mention redundancy or lack of paths.

    Keep it short (max 3 sentences). act as a network engineer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || (language === 'fr' ? "Pas de réponse." : "No response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'fr' 
      ? "Erreur lors de la consultation de l'IA." 
      : "Error consulting AI.";
  }
};
