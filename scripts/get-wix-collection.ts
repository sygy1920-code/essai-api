import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { items } from '@wix/data';
import dotenv from 'dotenv'

// 手动加载 .env 到 process.env
dotenv.config()

interface CollectionStats {
  collectionId: string;
  totalCount: number;
  schema: any;
}

// 从环境变量获取配置
const collectionId = process.argv[2] || 'MemberLookup';
const apiKey = process.env.WIX_API_KEY;

if (!collectionId) {
  console.error('❌ Error: Collection ID is required');
  console.log('\nUsage:');
  console.log('  ts-node scripts/get-wix-collection.ts <collectionId> [apiKey] [accountId]');
  console.log('\nOr set environment variables:');
  console.log('  WIX_COLLECTION_ID');
  console.log('  WIX_API_KEY');
  console.log('  WIX_ACCOUNT_ID');
  process.exit(1);
}

if (!apiKey) {
  console.error('❌ Error: API Key is required');
  process.exit(1);
}

const wixClient = createClient({
  modules: { items },
  auth: ApiKeyStrategy({
    apiKey: apiKey,
    siteId: '5a9be9f4-02c1-4ec5-93f4-f03240e69bd4'
  })
});

/**
 * 获取 Wix Collection 的数据总数和结构
 */
async function getWixCollectionInfo(): Promise<CollectionStats> {
  try {
    // 获取总数
    const totalCount = await wixClient.items.query(collectionId).count();

    // 获取 collection 的结构信息
    // 注意: 获取 schema 可能需要使用不同的 API
    const schema = {
      collectionId,
      description: `Schema information for ${collectionId}`,
      // Wix SDK 可能需要通过其他方式获取完整的 schema
      // 这里提供一个基础结构
    };

    return {
      collectionId,
      totalCount,
      schema,
    };
  } catch (error) {
    console.error('Error fetching collection info:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * 获取 collection 中的示例数据来推断结构
 */
async function getCollectionSampleData(): Promise<any[]> {
  try {
     // 获取总数
    const items = await wixClient.items.query(collectionId).limit(5).find();

    return items.items;
  } catch (error) {
    console.error('Error fetching sample data:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * 主函数 - 从环境变量或命令行参数获取配置并执行
 */
async function main() {
  console.log(`📊 Fetching information for collection: ${collectionId}\n`);

  try {
    // 获取 collection 基本信息
    const stats = await getWixCollectionInfo();
    console.log('📈 Collection Statistics:');
    console.log(`  Collection ID: ${stats.collectionId}`);
    console.log(`  Total Count: ${stats.totalCount}\n`);

    // 获取样本数据
    console.log('📋 Fetching sample data to infer schema...');
    const sampleData = await getCollectionSampleData();

    if (sampleData.length > 0) {
      console.log(`\n🔍 Schema (inferred from ${sampleData.length} sample items):\n`);
      const firstItem = sampleData[0];

      // 分析结构
      const schemaInfo = {
        fields: Object.keys(firstItem).map((key) => ({
          name: key,
          type: typeof firstItem[key],
          example: firstItem[key],
        })),
      };

      console.log(JSON.stringify(schemaInfo, null, 2));
    } else {
      console.log('⚠️  No data found in collection');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { getWixCollectionInfo, getCollectionSampleData };
