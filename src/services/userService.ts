/**
 * User Service - Handles user-related operations
 * Provides methods to query MemberLookup table for teachers and students
 */

import { prisma } from '../db/connection';
import { Prisma } from '@prisma/client';

/**
 * Member interface based on MemberLookup table schema
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
 * User Service class
 */
class UserService {
  /**
   * Get all students for a given teacher
   * @param email - Teacher's email address
   * @returns Array of student members
   */
  async getStudentsByTeacher(email: string): Promise<Member[]> {
    try {
      console.log(`Fetching students for teacher: ${email} from database...`);

      // First, get the teacher's record to find their school and classes
      const teacherResult = await prisma.$queryRaw<Member[]>`
        SELECT TOP 1 *
        FROM MemberLookup
        WHERE email = ${email}
      `;

      if (!teacherResult || teacherResult.length === 0) {
        throw new Error(`Teacher with email ${email} not found`);
      }

      const teacher = teacherResult[0];

      if (!teacher.school || !teacher.class) {
        throw new Error(`Teacher record missing school or class information`);
      }

      const school = teacher.school;
      const classes = teacher.class.split(',').map((c) => c.trim());

      // Now, get all students in the same school and classes
      // Use IN clause for exact matching (enables index usage, faster than LIKE)
      const students = await prisma.$queryRaw<Member[]>(
        Prisma.sql`
          SELECT
            memberId, firstname_e, lastname_e, firstname_c, lastname_c,
            school, class, classno, rolekey, roleid
          FROM MemberLookup
          WHERE rolekey = 'students'
            AND school = ${school}
            AND class IN (${Prisma.join(classes)})
        `
      );

      console.log(`Found ${students.length} students for teacher: ${email}`);

      return students;
    } catch (error) {
      console.error('Error finding students:', error);
      throw new Error(`Failed to find students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
