import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// 手动加载 .env 到 process.env
dotenv.config();

interface TokenPayload {
  memberId: string;
  rolekey: 'teachers' | 'students';
  school: string;
  email: string;
  class: string;
}

// 从命令行参数获取配置
const email = process.argv[2];
const role = (process.argv[3] || 'teachers') as 'teachers' | 'students';
const memberId = process.argv[4] || 'mock-member-id';
const school = process.argv[5] || 'demo-school';
const className = process.argv[6] || 'demo-class';

// 从环境变量获取 JWT secret 和过期时间
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

if (!email) {
  console.error('❌ Error: Email is required');
  console.error('\nUsage: npm run generate-jwt <email> [role] [memberId] [school] [class]');
  console.error('\nExample:');
  console.error('  npm run generate-jwt teacher@example.com teachers teacher-123 MySchool ClassA');
  console.error('  npm run generate-jwt student@example.com students student-456 MySchool ClassB');
  process.exit(1);
}

if (role !== 'teachers' && role !== 'students') {
  console.error('❌ Error: Role must be either "teachers" or "students"');
  process.exit(1);
}

/**
 * 生成 JWT Token
 */
function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

async function main() {
  console.log('🔐 Generating JWT Token\n');
  console.log('Configuration:');
  console.log(`  Email: ${email}`);
  console.log(`  Role: ${role}`);
  console.log(`  Member ID: ${memberId}`);
  console.log(`  School: ${school}`);
  console.log(`  Class: ${className}`);
  console.log(`  Expires In: ${expiresIn}\n`);

  try {
    const payload: TokenPayload = {
      memberId,
      rolekey: role,
      school,
      email,
      class: className,
    };

    const token = generateToken(payload);

    console.log('✅ Token generated successfully!\n');
    console.log('─────────────────────────────────────────────────────────');
    console.log('JWT Token:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(token);
    console.log('─────────────────────────────────────────────────────────\n');

    // 解码并显示 token 内容以便验证
    const decoded = jwt.decode(token) as TokenPayload;
    console.log('Decoded Payload:');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n📝 Usage:');
    console.log(`  Add to URL: ?jwt=${token}`);
    console.log(`  Bearer Auth: Authorization: Bearer ${token}`);

  } catch (error) {
    console.error('❌ Error generating token:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
