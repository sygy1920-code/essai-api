/**
 * 学生作文列表相关类型定义
 */

/**
 * 英文作文评分数据
 */
export interface EnglishScore {
  id: number | null;
  score2: string | null;
  total_score: number | null;
  total_score_max: number | null;
  content_score: number | null;
  content_score_max: number | null;
  language_score: number | null;
  language_score_max: number | null;
  grammar_score: number | null;
  grammar_score_max: number | null;
  organization_score: number | null;
  organization_score_max: number | null;
  word_count_score: number | null;
  word_count_score_max: number | null;
  strengths: string | null;
  weaknesses: string | null;
  school: string | null;
  schoolclass: string | null;
  classno: number | null;
  image_url: string | null;
  pdf_url: string | null;
  report_url: string | null;
  misspelling: number | null;
  inserted_at: Date | null;
}

/**
 * 中文作文评分数据
 */
export interface ChineseScore {
  id: number;
  score2: string | null;
  total_score: number | null;
  total_score_max: number | null;
  content_score: number | null;
  content_score_max: number | null;
  language_score: number | null;
  language_score_max: number | null;
  grammar_score: number | null;
  grammar_score_max: number | null;
  wording_score: number | null;
  wording_score_max: number | null;
  organization_score: number | null;
  organization_score_max: number | null;
  punctuation_score: number | null;
  punctuation_score_max: number | null;
  misspelling_score: number | null;
  misspelling_score_max: number | null;
  word_count_score: number | null;
  word_count_score_max: number | null;
  word_count: number | null;
  strengths: string | null;
  weaknesses: string | null;
  school: string | null;
  schoolclass: string | null;
  classno: number | null;
  image_url: string | null;
  pdf_url: string | null;
  inserted_at: Date;
}

/**
 * 英文作文详情数据
 */
export interface EnglishDetail {
  id: number;
  original_text: string | null;
  revised_text: string | null;
  revised_text2: string | null;
  revised_text3: string | null;
  wordcount_comment: string | null;
  title: string | null;
  relevancy: string | null;
  relevancy_comment: string | null;
  studentshare_yn: boolean | null;
  score2_user: string | null;
  revised_text3_user: string | null;
  relevancy_comment_user: string | null;
}

/**
 * 中文作文详情数据
 */
export interface ChineseDetail {
  id: number;
  original_text: string | null;
  revised_text: string | null;
  revised_text2: string | null;
  revised_text3: string | null;
  wordcount_comment: string | null;
  title: string | null;
  relevancy: number | null;
  relevancy_comment: string | null;
  studentshare_yn: boolean | null;
  score2_user: string | null;
  revised_text3_user: string | null;
  relevancy_comment_user: string | null;
}

/**
 * 英文作文完整数据（评分 + 详情）
 */
export interface EnglishEssay extends EnglishScore, EnglishDetail {
  language: 'english';
  language_type: 'en';
}

/**
 * 中文作文完整数据（评分 + 详情）
 */
export interface ChineseEssay extends ChineseScore, ChineseDetail {
  language: 'chinese';
  language_type: 'zh';
}

/**
 * 单个作文数据（英文或中文）
 */
export type Essay = EnglishEssay | ChineseEssay;

/**
 * 请求参数
 */
export interface GetStudentEssaysParams {
  member_id: string;
  school: string;
  schoolclass: string;
  classno: string;
  start_date?: string; // ISO 8601 格式，例如: "2024-01-01"
  end_date?: string; // ISO 8601 格式，例如: "2024-12-31"
}

/**
 * 统计信息
 */
export interface EssaysSummary {
  english_count: number;
  chinese_count: number;
}

/**
 * 成功响应数据
 */
export interface StudentEssaysSuccessResponse {
  success: true;
  data: Essay[];
  total: number;
  summary: EssaysSummary;
  params: GetStudentEssaysParams;
}

/**
 * 错误响应
 */
export interface StudentEssaysErrorResponse {
  error: string;
  message?: string;
}

/**
 * API 响应类型
 */
export type StudentEssaysResponse = StudentEssaysSuccessResponse | StudentEssaysErrorResponse;
