/**
 * Wix Service - Handles interactions with Wix Data API
 * Provides methods to query MemberLookup collection for teachers and students
 */

import { createClient, ApiKeyStrategy, WixClient, IApiKeyStrategy } from '@wix/sdk';
import { items } from '@wix/data';
import { config } from '../config';
import { OralSpeechRecord } from '../types/oral-speech-record.types';

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
 * Wix Service class
 */
class WixService {
  private client: WixClient<undefined, IApiKeyStrategy, {
    items: typeof items;
  }>;

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

  async getStudentsByTeacher(email: string): Promise<Member[]> {
    const collectionId = 'MemberLookup';

    try {
      // First, get the teacher's record to find their school and classes
      const result = await this.client.items
        .query(collectionId)
        .eq('title', email)
        .limit(1).find();

      if (result.items.length === 0) {
        throw new Error(`Teacher with email ${email} not found`);
      }

      const teacher = result.items[0] as unknown as Member;

      const school = teacher.school;
      const classes = teacher.class.split(',').map((c) => c.trim());

      // Now, get all students in the same school and classes
      const studentsResult = await this.client.items
        .query(collectionId)
        .eq('rolekey', 'students')
        .eq('school', school)
        .hasSome('class', classes).find();

      return studentsResult.items as unknown as Member[];
      // Parse teacher's class assignments        
    } catch (error) {
      console.error('Error finding students:', error);
      throw new Error(`Failed to find students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOralByMember(
    memberId: string,
    startDate?: string,
    endDate?: string
  ): Promise<OralSpeechRecord[]> {
    const collectionId = 'oralUsage';

    try {
      let query = this.client.items.query(collectionId).eq('memberId', memberId).descending('_createdDate').limit(1000);

      // 添加时间范围筛选（Wix Data API 支持 ge 和 le 操作符）
      if (startDate) {
        query = query.ge('_createdDate', new Date(startDate));
      }
      if (endDate) {
        query = query.le('_createdDate', new Date(endDate));
      }
      

      const result = await query.find();

      result

      return result.items as unknown as OralSpeechRecord[];
    } catch (error) {
      console.error('Error finding oral records:', error);
      throw new Error(`Failed to find oral records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const wixService = new WixService();
