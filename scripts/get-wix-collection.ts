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
 * 获取 collection 中的示例数据来推断结构
 */
async function getCollectionSampleData(): Promise<any[]> {
  try {
     // 获取总数
    const items = await wixClient.items.query(collectionId).limit(5).find({ returnTotalCount: true });
    return items.items;
  } catch (error) {
    console.error('Error fetching sample data:', JSON.stringify(error, null, 2));
    throw error;
  }
}

async function main() {
  console.log(`📊 Fetching information for collection: ${collectionId}\n`);

  try {
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
