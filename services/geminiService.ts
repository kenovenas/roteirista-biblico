import { GoogleGenAI, Type } from "@google/genai";
import { FormData, GeneratedContent, GeneratedContentBlock, ScriptContent } from '../types';

const getSystemInstruction = () => `Você é o "Roteirista Bíblico", um especialista em criar roteiros de vídeo emocionantes e respeitosos baseados em histórias da Bíblia para o YouTube. Seu estilo é cinematográfico, inspirador e fiel às escrituras. Todo o texto gerado DEVE estar exclusivamente em português do Brasil. Você sempre gera o conteúdo no formato JSON solicitado. Evite sermões longos e priorize uma narrativa envolvente.`;

const scriptSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING, description: "Introdução do roteiro, com contexto e um gancho emocional." },
        development: { type: Type.STRING, description: "O desenvolvimento principal da história, dividido em parágrafos claros. Deve conter o corpo principal do roteiro." },
        conclusion: { type: Type.STRING, description: "A conclusão do roteiro, com a mensagem final e uma chamada para ação." },
    },
    required: ["introduction", "development", "conclusion"],
};

const contentSchema = {
    type: Type.OBJECT,
    properties: {
        script: scriptSchema,
        titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 5 títulos criativos e otimizados para SEO." },
        description: { type: Type.STRING, description: "Uma descrição persuasiva para o YouTube com até 2000 caracteres." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de pelo menos 10 tags relevantes." },
        thumbnailPrompts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 3 prompts descritivos para uma IA de imagem gerar thumbnails." },
    },
    required: ["script", "titles", "description", "tags", "thumbnailPrompts"],
};

export const generateFullScript = async (formData: FormData, apiKey: string): Promise<GeneratedContent> => {
    if (!apiKey) {
        throw new Error("A chave de API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
        Gere um pacote completo de conteúdo para um vídeo do YouTube de aproximadamente 10 minutos com base no seguinte prompt: "${formData.story}".

        Siga estritamente as seguintes especificações:
        - Nome do Projeto: ${formData.projectName}
        - Tom: ${formData.tone}
        - Estrutura: ${formData.structure}
        - Incluir Versículos: ${formData.includeVerses ? 'Sim, de forma integrada e natural.' : 'Não, foque apenas na narrativa.'}
        - Incluir Reflexões Pessoais: ${formData.includeReflections ? 'Sim, adicione reflexões curtas e impactantes ao final.' : 'Não, mantenha o foco na história.'}
        - Público-alvo: ${formData.targetAudience}

        O roteiro (script) deve ser dividido em 'introduction', 'development' e 'conclusion'.
        O conteúdo total do roteiro deve ser de aproximadamente 1500-1600 palavras.

        Considere estas ideias iniciais do usuário (use como inspiração, mas crie as suas próprias):
        - Ideias de Títulos: ${formData.titleIdeas || 'Nenhuma'}
        - Ideias de Descrição: ${formData.descriptionIdeas || 'Nenhuma'}
        - Ideias de Thumbnails: ${formData.thumbnailIdeas || 'Nenhuma'}

        O resultado DEVE ser um objeto JSON que obedece ao schema fornecido.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: contentSchema,
            }
        });

        const jsonString = response.text;
        const parsedContent = JSON.parse(jsonString) as GeneratedContent;
        // Gemini sometimes returns tags as a single comma-separated string instead of an array.
        if (typeof parsedContent.tags === 'string') {
           parsedContent.tags = (parsedContent.tags as string).split(',').map(tag => tag.trim());
        }
        return parsedContent;
    } catch (error) {
        console.error("Error generating full script:", error);
        throw new Error("Não foi possível gerar o roteiro. Verifique sua chave de API e tente novamente.");
    }
};

export const regenerateBlock = async (
    block: GeneratedContentBlock,
    formData: FormData,
    existingContent: GeneratedContent,
    instruction: string,
    apiKey: string
): Promise<string | string[] | ScriptContent> => {
    if (!apiKey) {
        throw new Error("A chave de API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });

    let prompt = '';
    let responseSchema: any;

    const fullScriptForContext = `Introdução: ${existingContent.script.introduction}\nDesenvolvimento: ${existingContent.script.development.substring(0, 800)}...\nConclusão: ${existingContent.script.conclusion}`;
    const scriptContext = `Contexto: A história é sobre "${formData.story}" com um tom ${formData.tone} para um público de ${formData.targetAudience}. O roteiro principal é:\n\n${fullScriptForContext}`;
    const instructionPrompt = instruction ? `Ajuste o conteúdo seguindo esta instrução específica do usuário: "${instruction}".` : 'Gere uma nova versão aprimorada do conteúdo abaixo.';

    switch (block) {
        case 'script':
            prompt = `Com base nas preferências do usuário (história: "${formData.story}", tom: ${formData.tone}), gere um novo roteiro completo de ~10 minutos. O roteiro DEVE ser dividido em 'introduction', 'development' e 'conclusion'. ${instructionPrompt}`;
            responseSchema = scriptSchema;
            break;
        case 'titles':
            prompt = `${scriptContext}\n\n${instructionPrompt}\n\nGere 5 novos títulos criativos e otimizados para SEO para este vídeo. A resposta deve ser uma lista de strings.`;
            responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
            break;
        case 'description':
            prompt = `${scriptContext}\n\n${instructionPrompt}\n\nGere uma nova descrição para o YouTube (até 2000 caracteres), que seja persuasiva, resuma a história e inclua uma chamada para ação.`;
            responseSchema = { type: Type.STRING };
            break;
        case 'tags':
            prompt = `${scriptContext}\n\n${instructionPrompt}\n\nCom base no roteiro e nos títulos, gere uma nova lista de pelo menos 10 tags (palavras-chave) relevantes para o YouTube. A resposta deve ser uma lista de strings.`;
            responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
            break;
        case 'thumbnailPrompts':
            prompt = `${scriptContext}\n\n${instructionPrompt}\n\nGere 3 novos prompts detalhados para uma IA de imagem criar thumbnails cinematográficas para este vídeo. A resposta deve ser uma lista de strings.`;
            responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        result: responseSchema
                    }
                }
            }
        });
        const jsonString = response.text;
        const parsedResponse = JSON.parse(jsonString) as { result: string | string[] | ScriptContent };
        return parsedResponse.result;
    } catch (error) {
        console.error(`Error regenerating ${block}:`, error);
        throw new Error(`Não foi possível ajustar '${block}'. Verifique sua chave de API e tente novamente.`);
    }
};