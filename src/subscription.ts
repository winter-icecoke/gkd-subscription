import { defineGkdSubscription } from '@gkd-kit/define';
import { batchImportApps } from '@gkd-kit/tools';
import categories from './categories';
import globalGroups from './globalGroups';

export default defineGkdSubscription({
  // 订阅身份，GKD 靠它判断是不是同一个订阅；一旦发布永远不改
  id: 123321256,
  name: 'Leo 的自用订阅',
  // version 由构建脚本自动递增，不手改
  version: 0,
  author: 'winter-icecoke',
  checkUpdateUrl: './gkd.version.json5',
  supportUri: 'https://github.com/winter-icecoke/gkd-subscription',
  categories,
  globalGroups,
  apps: await batchImportApps(`${import.meta.dirname}/apps`),
});
