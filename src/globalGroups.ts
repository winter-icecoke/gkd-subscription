import { defineGkdGlobalGroups } from '@gkd-kit/define';

export default defineGkdGlobalGroups([
  {
    key: 0,
    name: '开屏广告',
    desc: '通用跳过按钮兜底；应用内已有「开屏广告」规则组时自动让位',
    // 应用里存在以「开屏广告」开头的规则组时，本全局组不作用于该应用
    disableIfAppGroupMatch: '',
    fastQuery: true,
    matchTime: 10000,
    actionMaximum: 1,
    resetMatch: 'app',
    priorityTime: 10000,
    rules: [
      {
        matches: '[text*="跳过"][text.length<10][visibleToUser=true]',
      },
    ],
  },
]);
