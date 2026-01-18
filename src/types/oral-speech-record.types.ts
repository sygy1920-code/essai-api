/**
 * Speech word analysis with timing and accuracy information
 */
export interface SpeechWord {
  duration: number;
  color: string;
  error_type: string;
  offset: number;
  word: string;
  accuracy_score: number;
}

/**
 * Summary of speech errors
 */
export interface SpeechErrorSummary {
  mispronunciations: number;
  omissions: number;
  monotone: number;
  unexpected_breaks: number;
  insertions: number;
  missing_breaks: number;
}

/**
 * Content scores for oral speech assessment
 */
export interface ContentScores {
  organization: number;
  coherence: number;
  strengths: string[];
  improvements: string[];
  grammar: number;
  vocabulary: number;
  topic_relevance: number;
  summary: string;
}

/**
 * Oral speech record data structure
 */
export interface OralSpeechRecord {
  speechErrorSummary: SpeechErrorSummary;
  school: string;
  oralMode: number;
  speechFluencyScore: number;
  audioFilename: string;
  oralLanguage: string;
  email: string;
  speechReferenceText: string;
  strengths: string[];
  _id: string;
  _owner: string;
  _createdDate: Date;
  classno: number;
  fullName: string;
  speechProsodyScore: number;
  oralUsageType: number;
  durationS: number;
  _updatedDate: Date;
  speechAccuracyScore: number;
  contentScores: ContentScores;
  overallTotalScore: number;
  language: string;
  modeId: number;
  totalScore: number;
  durationMs: number;
  speechCompletenessScore: number;
  contactId: string;
  recordingUrl: string;
  callId: string;
  processingTimeMs: number;
  speechMispronounced: string[];
  mode: string;
  class: string;
  memberId: string;
  weaknesses: string[];
  speechPronunciationScore: number;
  speechWords: SpeechWord[];
  speechRecognizedText: string;
  oralReportItemLink: string;
  oralQuestionId: string;
}
