import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.sina.weibo',
  name: '微博',
  groups: [
    {
      key: 0,
      name: '局部广告-悬浮广告',
      desc: '首页右下角悬浮红包等浮窗，点击右上角关闭',
      enable: true,
      fastQuery: true,
      activityIds: 'com.sina.weibo.MainTabActivity',
      rules: [
        // 0、1 参考社区订阅（ganlinte、MengNianxiaoyao）的写法，快照为 2023 年版本，待用当前版本快照核对
        {
          key: 0,
          matches: '[vid="floating_window"] >2 [vid="close"]',
          snapshotUrls: 'https://i.gkd.li/i/12750118',
        },
        {
          key: 1,
          matches: '[vid="floating_window"] >n [vid="closeView"]',
          snapshotUrls: 'https://i.gkd.li/i/13206775',
        },
      ],
    },
    {
      key: 1,
      name: '局部广告-信息流广告',
      desc: '首页信息流广告：点右上角关闭，再选「对此内容不感兴趣」',
      enable: true,
      activityIds: 'com.sina.weibo.MainTabActivity',
      rules: [
        // 2026-11-04 在微博 16.10.3、OPPO Find X9 Ultra（1440×3168）上实测通过
        // 广告卡片没有转发/评论/点赞栏，最后一个子节点是 ext_multiple_view；普通微博最后是 ly_bottom_btns
        // 头部的「广告」字样和关闭按钮是自绘的，没有独立节点，只能按头部内的相对位置点击
        // top/bottom 是像素值，要求头部完整停在顶栏与底栏之间，避免滑动中误点进广告；换机型需重新确认
        {
          key: 0,
          actionDelay: 500,
          matches:
            '@[vid="mblogHeadtitle"][visibleToUser=true][top>330][bottom<2900][parent.childCount=4][parent.getChild(3).vid="ext_multiple_view"]',
          position: {
            left: 'width * 0.955',
            top: 'height * 0.45',
          },
        },
        // 关闭后弹出的反馈面板；以「为何会看到此广告」限定为广告面板
        {
          key: 90,
          preKeys: [0],
          fastQuery: true,
          matches: [
            '[text="为何会看到此广告"]',
            '[text="对此内容不感兴趣"][clickable=true]',
          ],
        },
      ],
    },
  ],
});
