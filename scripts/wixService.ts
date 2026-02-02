/**
 * Wix Service - Handles interactions with Wix Data API
 * Provides methods to query MemberLookup collection for teachers and students
 */

import { createClient, ApiKeyStrategy, WixClient, IApiKeyStrategy } from '@wix/sdk';
import { items } from '@wix/data';
import { config } from '../src/config';

/**
 * Member interface based on MemberLookup collection schema
 */
export interface Member {
  _id: string;
  _owner: string;
  _createdDate: string;
  _updatedDate: string;
  lastname_e: string;
  lastname_c: string;
  firstname_e: string;
  firstname_c: string;
  title: string; // email
  school: string;
  classno: any;
  class: string;
  roleid: string;
  rolekey: string;
  memberId: string;
  userCredits: number;
}

/**
 * Oral Usage interface based on oralUsage collection schema
 * 实际 Wix 返回的数据格式（驼峰命名 + 数组类型）
 */
export interface OralUsage {
  _id: string;
  _owner: string;
  _createdDate: string;
  _updatedDate: string;
  callId: string;
  durationMs?: number;
  creditsUsed?: number;
  durationS?: number;
  contactId?: string;
  fullName?: string;
  email?: string;
  memberId?: string;
  school?: string;
  overallTotalScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  createDate?: string;
  owner?: string;
  createdDate?: string;
  oralReportItemLink?: string;
  assistantId?: string;
  studentHomeworkId?: string;
  subject?: string;
  mode?: string;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  cost?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  updateNote?: string;
  classno?: number;
  class?: string;
  accuracyScore?: number;
  completenessScore?: number;
  fluencyScore?: number;
  speechWords?: string;
  speechErrorSummary?: string;
  pronunciationScore?: number;
  prosodyScore?: number;
  oralUsageType?: number;
  oralMode?: number;
  audioFilename?: string;
  processingTimeMs?: number;
  speechRecognizedText?: string;
  speechReferenceText?: string;
  speechMispronounced?: string;
  contentScores?: string;
  note?: string;
  totalScore?: number;
  language?: string;
  modeId?: number;
  speechProvider?: string;
  oralQuestionId?: string;
  ID?: string;
  updatedDate?: string;
  feedbackSummary?: string;
  pronunciationImprovementWords?: string[];
  contentScore?: number;
  interactionTotalScore?: number;
  languageScore?: number;
  readingScore?: number;
  personalExperienceExpressionScore?: number;
  pronunciationScore2?: number;
  interactionScore?: number;
  expressionScore?: number;
  communicationScore?: number;
  vocabularyScore?: number;
  ideasScore?: number;
  pacingScore?: number;
  organizationScore?: number;
  veloCode?: number;
}

/**
 * Oral Report interface based on oralReport collection schema
 */
export interface OralReport {
  _id: string;
  _owner: string;
  _createdDate: string;
  _updatedDate: string;
  CallID: string;
  Overalltotalscore?: number;
  Transcript?: string;
  Feedbacksummary?: string;
  Summary?: string;
  Pronunciationimprovementwords?: string;
  Strengths?: string;
  Weaknesses?: string;
  Contentscore?: number;
  Interactiontotalscore?: number;
  Languagescore?: number;
  Readingscore?: number;
  Personalexperienceexpressionscore?: number;
  Pronunciationscore?: number;
  Interactionscore?: number;
  expressionScore?: number;
  communicationScore?: number;
  vocabularyScore?: number;
  ideasScore?: number;
  Pacingscore?: number;
  Organizationscore?: number;
  Recordingurl?: string;
  Oral_Report_Item?: string;
  AssistantId?: string;
  Cost?: number;
  Endedreason?: string;
  Timestamp?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  studentHomeworkId?: string;
  updateNote?: string;
  ID?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Owner?: string;
}


/**
 * Wix Service class
 */
class WixService {
  private client: WixClient<undefined, IApiKeyStrategy, {
    items: typeof items;
  }>;

  /**
   * Wix API query limit per request
   */
  private readonly WIX_QUERY_LIMIT = 500;

  /**
   * Initialize Wix service with API credentials
   */
  constructor() {
    if (!config.wix.apiKey) {
      throw new Error('WIX_API_KEY environment variable is required');
    }

    this.client = createClient({
      modules: { items },
      auth: ApiKeyStrategy({
        apiKey: config.wix.apiKey,
        siteId: config.wix.siteId,
      }),
    });
  }

  /**
   * Get all members from MemberLookup collection with pagination
   */
  async getAllMembers(): Promise<Member[]> {
    const collectionId = 'MemberLookup';

    try {
      console.log('Fetching all members from Wix (with pagination)...');

      const allMembers: Member[] = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.client.items
          .query(collectionId)
          .skip(skip)
          .limit(this.WIX_QUERY_LIMIT)
          .find();

        const members = result.items as unknown as Member[];
        allMembers.push(...members);

        console.log(`Fetched ${members.length} members (offset: ${skip}, total so far: ${allMembers.length})`);

        // If we got fewer items than the limit, we've reached the end
        hasMore = members.length === this.WIX_QUERY_LIMIT;
        skip += this.WIX_QUERY_LIMIT;
      }

      console.log(`Total members fetched from Wix: ${allMembers.length}`);

      return allMembers;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw new Error(`Failed to fetch members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all oral usage records from oralUsage collection with pagination
   */
  async getAllOralUsage(): Promise<OralUsage[]> {
    const collectionId = 'oralUsage';

    try {
      console.log('Fetching all oral usage records from Wix (with pagination)...');

      const allOralUsage: OralUsage[] = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.client.items
          .query(collectionId)
          .skip(skip)
          .limit(this.WIX_QUERY_LIMIT)
          .find();

        const oralUsage = result.items as unknown as OralUsage[];
        allOralUsage.push(...oralUsage);

        console.log(`Fetched ${oralUsage.length} oral usage records (offset: ${skip}, total so far: ${allOralUsage.length})`);

        // If we got fewer items than the limit, we've reached the end
        hasMore = oralUsage.length === this.WIX_QUERY_LIMIT;
        skip += this.WIX_QUERY_LIMIT;
      }

      console.log(`Total oral usage records fetched from Wix: ${allOralUsage.length}`);

      return allOralUsage;
    } catch (error) {
      console.error('Error fetching oral usage:', error);
      throw new Error(`Failed to fetch oral usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all oral report records from oralReport collection with pagination
   */
  async getAllOralReports(): Promise<OralReport[]> {
    const collectionId = 'oralReport';

    try {
      console.log('Fetching all oral reports from Wix (with pagination)...');

      const allOralReports: OralReport[] = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.client.items
          .query(collectionId)
          .skip(skip)
          .limit(this.WIX_QUERY_LIMIT)
          .find();

        const oralReports = result.items as unknown as OralReport[];
        allOralReports.push(...oralReports);

        console.log(`Fetched ${oralReports.length} oral reports (offset: ${skip}, total so far: ${allOralReports.length})`);

        // If we got fewer items than the limit, we've reached the end
        hasMore = oralReports.length === this.WIX_QUERY_LIMIT;
        skip += this.WIX_QUERY_LIMIT;
      }

      console.log(`Total oral reports fetched from Wix: ${allOralReports.length}`);

      return allOralReports;
    } catch (error) {
      console.error('Error fetching oral reports:', error);
      throw new Error(`Failed to fetch oral reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const wixService = new WixService();
