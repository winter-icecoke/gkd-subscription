# gkd-subscription

自用 [GKD](https://gkd.li) 订阅规则，基于官方 [subscription-template](https://github.com/gkd-kit/subscription-template)。

## 订阅地址

在 GKD「订阅 → 添加订阅」里填：

```txt
https://raw.githubusercontent.com/winter-icecoke/gkd-subscription/main/dist/gkd.json5
```

- 首选这条 GitHub raw 链接。缓存 `max-age=300`，发布后最多约 5 分钟能拉到；手机需要能访问 GitHub。
- 备用 jsDelivr（大陆直连）：`https://fastly.jsdelivr.net/gh/winter-icecoke/gkd-subscription@main/dist/gkd.json5`。分支链接缓存较久，急用时打开 `https://purge.jsdelivr.net/gh/winter-icecoke/gkd-subscription@main/dist/gkd.json5` 和同目录的 `gkd.version.json5` 刷新。

GKD 先拉 `gkd.version.json5` 比对版本，版本变大才下载完整订阅。

调试方法（在家无线调试、在外用快照链接远程加规则）见 [docs/debugging.md](docs/debugging.md)。

## 发布流程

```
改 src/ → push 到 main
  → check_fix_push：类型检查 + 规则校验 + 自动格式化
  → build_release：合并为 dist/gkd.json5，version +1，打 Release
  → 手机端 GKD 自动检测更新（或在订阅页手动刷新）
```

- 规则没变时构建输出 `No changes`，不会发版。
- 也可以在 Actions 页手动运行 `build_release`。
- 不用电脑时，在 GitHub 网页或手机 App 里直接编辑 `src/apps/*.ts` 提交即可。

本地开发：

```sh
pnpm install
pnpm run check   # push 前也会自动运行
```

## 目录

| 位置                  | 内容                                          |
| --------------------- | --------------------------------------------- |
| `src/subscription.ts` | 订阅元数据。`id` 固定为 `123321256`，永不修改 |
| `src/categories.ts`   | 分类                                          |
| `src/globalGroups.ts` | 全局规则：通用开屏「跳过」兜底                |
| `src/apps/<包名>.ts`  | 应用规则，一个应用一个文件                    |
| `dist/`               | 构建产物，不手改                              |

## 规范

1. **开关写在代码里**：每个规则组用 `enable` 决定默认开关，分类不设 `enable`。换机或重装后订阅一更新即可复原。
2. **命名决定分类**：规则组 `name` 用「分类名」或「分类名-细项」，例如 `开屏广告`、`局部广告-信息流`、`全屏广告-首页弹窗`。分类按名称前缀归类，写错前缀就不进分类。
3. **key 永不复用**：规则组的 `key` 用过就不再改、不挪给别的组；删掉的组，key 也空着。
4. **只增不删**：应用改版后，新选择器追加进 `rules`，旧的保留；新旧版本差异大时用 `versionCodes` / `excludeVersionCodes` 区分。
5. **必须有快照**：每条规则至少一个 `snapshotUrls`；出现误触的界面放进 `excludeSnapshotUrls`。
6. **开屏防误触**：开屏类规则组带 `matchTime: 10000`、`actionMaximum: 1`、`resetMatch: 'app'`。
7. **应用开屏规则优先**：应用里一旦有以 `开屏广告` 开头的规则组，全局开屏兜底自动不作用于该应用。

## 新增规则

1. 在目标界面用 GKD 悬浮窗或快捷开关「捕获快照」。
2. 手机开启 HTTP 服务，电脑打开 <https://i.gkd.li> 连接设备，查看节点、调试选择器，并生成快照分享链接。
3. 可先在 GKD「本地订阅」里试跑，确认后写进 `src/apps/<包名>.ts`：

```ts
import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.example.app',
  name: '示例应用',
  groups: [
    {
      key: 0,
      name: '开屏广告',
      enable: true,
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      resetMatch: 'app',
      rules: [
        {
          matches: '[vid="skip"][visibleToUser=true]',
          snapshotUrls: 'https://i.gkd.li/i/xxxxxxxx',
        },
      ],
    },
    {
      key: 1,
      name: '局部广告-信息流',
      enable: false,
      activityIds: '.MainActivity',
      rules: [
        {
          matches: '@[clickable=true] > [text="不感兴趣"]',
          snapshotUrls: 'https://i.gkd.li/i/xxxxxxxx',
        },
      ],
    },
  ],
});
```

字段说明：VS Code 里鼠标悬停在字段上，或查 <https://gkd.li/api>；选择器语法见 <https://gkd.li/guide/selector>。

## 参考社区规则

自己的应用没头绪时，可以先看社区订阅里同一包名的写法，再按本仓库规范改写：

- [AIsouler/GKD_subscription](https://github.com/AIsouler/GKD_subscription)：`src/apps/<包名>.ts`

社区仓库没有声明开源许可证，参考写法即可，不要整段照搬。

## 隐私

快照链接会把截图和界面文字公开上传。抓聊天、账号、支付页面前，先给截图打码；界面文字可以解压快照 zip，把 `nodes` 里的文字换成等长的 `*` 后重新导入。
