import { defineGkdCategories } from '@gkd-kit/define';

// 分类按规则组 name 的前缀归类：规则组命名为「分类名」或「分类名-细项」
// 分类的 enable 一律不设，开关写在各规则组自己的 enable 上，保证状态全在代码里
// key 一旦使用不再改动、不复用
export default defineGkdCategories([
  // 启动时的开屏页
  { key: 0, name: '开屏广告' },
  // 不关闭就无法继续操作的弹窗广告
  { key: 1, name: '全屏广告' },
  // 不挡操作的卡片、悬浮按钮、信息流广告
  { key: 2, name: '局部广告' },
  { key: 3, name: '更新提示' },
  { key: 4, name: '青少年模式' },
  { key: 5, name: '评价提示' },
  { key: 6, name: '权限提示' },
  // 公告、活动通知类弹窗
  { key: 7, name: '通知提示' },
  // 非广告的自动点击，如勾选原图、确认登录
  { key: 8, name: '功能类' },
]);
