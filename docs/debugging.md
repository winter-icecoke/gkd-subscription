# 调试与新增规则

本仓库规则的完整工作流：抓界面、找节点、写选择器、真机实测、发布。分「在家」和「在外」两种情况。

## 环境

| 项                   | 值                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------- |
| 测试手机             | OPPO Find X9 Ultra（型号 PMA110，1440×3168，ColorOS 17 / Android 17）                   |
| 已配对无线调试的电脑 | 家里 Mac mini M4（`Leos-Mac-mini-M4`）                                                  |
| GKD                  | `li.songe.gkd`，2026-11-04 时版本 1.12.1，HTTP 服务端口 8888                            |
| 订阅链接（GitHub）   | `https://raw.githubusercontent.com/winter-icecoke/gkd-subscription/main/dist/gkd.json5` |

GitHub raw 的缓存是 `max-age=300`，推送发布后最多约 5 分钟手机才能拉到新版本。

## 调试命令

`pnpm run debug <命令>`，实现见 [scripts/debug.ts](../scripts/debug.ts)：

| 命令                        | 作用                                                      | 需要手机在线 |
| --------------------------- | --------------------------------------------------------- | ------------ |
| `connect`                   | 从 mDNS 自动发现无线调试端口，`adb connect` 并转发 8888   | 是           |
| `info`                      | 读取 GKD 服务与设备信息，用来确认连通                     | 是           |
| `snap`                      | 抓当前界面快照，存到 `tmp/snapshots/<id>/`（截图 + 节点） | 是           |
| `fetch <分享链接>`          | 下载 `https://i.gkd.li/i/<编号>` 对应的快照 zip           | 否           |
| `nodes <id\|路径> [关键词]` | 打印节点树；给关键词时只看命中节点和它的祖先链            | 否           |
| `exec <选择器> [--click]`   | 在手机当前界面试跑选择器，默认只匹配不点击                | 是           |
| `push <应用id...>`          | 把 `src/apps/<应用id>.ts` 原样推成手机上的「内存订阅」    | 是           |
| `clear`                     | 清空内存订阅                                              | 是           |

`tmp/` 已被 gitignore：快照含截图和界面文字，不提交。

## 在家：无线调试实时调

前提：手机和 Mac 在同一 Wi-Fi，手机已与这台 Mac 配对过（只需一次，见下文）。

1. 手机：开发者选项 → 打开「无线调试」；GKD → 高级设置 → 打开「HTTP 服务」。
2. Mac：`pnpm run debug connect`，再 `pnpm run debug info` 能返回设备信息即连通。
3. 手机停在目标界面（广告露出、不要点掉）。
4. `pnpm run debug snap`，看截图定位目标；`pnpm run debug nodes <id> <关键词>` 找节点。
5. 在 `src/apps/<包名>.ts` 写规则组，`pnpm run check` 校验。
6. `pnpm run debug push <包名>` 推到手机实测，让手机界面动一下（滑动或重进）以触发匹配。
7. 实测通过 → 提交并 push 到 main，Actions 自动发布 → 手机 GKD 订阅页手动刷新或等自动更新。
8. 收尾：`pnpm run debug clear`；关闭 HTTP 服务和无线调试。

首次配对（换电脑、撤销授权、恢复出厂后才需要）：手机无线调试里点「使用配对码配对设备」，在 Mac 终端运行 `adb pair <IP>:<配对端口>` 并输入弹窗里的 6 位码。配对码是一次性凭据，由 Leo 本人输入，Agent 不经手。

## 在外：快照链接远程调

在外面时手机不在家里局域网，adb 和 HTTP 服务都连不上。安卓同一时间只能有一个 VPN，FlClash 占着，FlClash 内置的 Tailscale 在安卓上又连不上（2026-11-02 记录），所以远程 adb 目前不可行。改用快照链接：

1. 手机准备（一次性）：GKD → 高级设置 → 打开「快照按钮」；在「Github Cookie」里填好 Cookie（GKD 官方「获取教程」），用于生成快照链接。
2. 遇到广告：点悬浮快照按钮。
3. GKD → 快照记录 → 选中快照 → 生成链接，得到 `https://i.gkd.li/i/<编号>`。链接是公开的，涉及聊天、账号、支付的界面先打码。
4. 把链接和需求发给 Claude，例如：「微博首页这个悬浮窗，点右上角的 ×」。可以在手机 Claude App 里开这个仓库的 Claude Code 云端会话，也可以通过 Remote Control 连回家里的 Mac 会话。
5. Claude：`pnpm run debug fetch <链接>` → `nodes` 找节点 → 写规则 → `pnpm run check` → push 发布。
6. 手机：GKD 订阅页刷新，拿到新版本后实测。

在外没法用 `exec`/`push` 做真机预演，所以：

- 规则写得保守：限定 `activityIds`，开屏类加 `matchTime`/`actionMaximum`，坐标点击加 `actionDelay`，多步操作用 `preKeys` 串起来。
- 想先试再发布：Claude 把规则组转成 JSON5，Leo 粘进 GKD「订阅 → 本地订阅」试跑，没问题再提交。
- 发布后误触：在 GKD 里关掉该规则组（「触发记录」能定位是哪条），告诉 Claude 修。

## 踩过的坑

- **GKD 后台被暂停**：切到别的 App 后 HTTP 服务可能被系统暂停，表现为 8888 端口拒绝连接。在多任务里给 GKD 加锁，电池设为「无限制」并允许后台活动。
- **`exec` 查不到的节点，规则可能照样生效**：2026-11-04 在微博首页，`execSelector` 查不到信息流里的节点，但快照里有，推内存订阅实测也能命中。判断以实测为准。
- **滑动中点击会点偏**：规则在列表惯性滚动时触发，点击落下时卡片已经移开，结果点进了广告。坐标点击要加 `actionDelay`（500 ms 时实测可用），并限定目标完整显示在屏幕中间。
- **自绘元素没有节点**：微博信息流广告头部的「广告」字样和 × 都是自绘的，只能找结构特征（例如没有转发评论栏）识别，再用 `position` 点头部内的相对位置。
- **adb 输入文字被输入法改坏**：`adb shell input text` 会被中文输入法转成中文标点。需要在手机上输入链接时，让 Leo 自己粘贴，不改输入法设置。
- **快照里的 vid**：新快照直接有 `vid`；老快照只有完整 `id`（`包名:id/xxx`），`nodes` 命令会自动截取。
