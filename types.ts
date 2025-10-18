export enum Tone {
  Inspirador = 'Inspirador',
  Narrativo = 'Narrativo',
  Reflexivo = 'Reflexivo',
  Educativo = 'Educativo',
  Dramatico = 'Dramático'
}

export enum Structure {
  Padrao = 'Introdução, Desenvolvimento e Conclusão',
  Personalizada = 'Personalizada'
}

export interface FormData {
  projectName: string;
  story: string; // This will now be treated as a detailed prompt
  tone: Tone;
  structure: Structure;
  includeVerses: boolean;
  includeReflections: boolean;
  titleIdeas: string;
  descriptionIdeas: string;
  thumbnailIdeas: string;
  targetAudience: string;
}

export interface ScriptContent {
  introduction: string;
  development: string;
  conclusion: string;
}

export interface GeneratedContent {
  script: ScriptContent; // Changed from string to ScriptContent
  titles: string[];
  description: string;
  tags: string[];
  thumbnailPrompts: string[];
}

export type GeneratedContentBlock = keyof GeneratedContent;

export interface HistoryItem {
  id: string;
  timestamp: string;
  formData: FormData;
  generatedContent: GeneratedContent;
}
