# AGENTS.md

Leo 自用的 GKD（安卓跳广告）订阅规则仓库。`src/` 是规则源码，push 到 main 后 Actions 检查并构建出 `dist/gkd.json5`，手机 GKD 订阅这个文件自动更新。

## 先读哪份

- 规则写法规范（命名、key、开关、快照、开屏三件套）：[README.md](README.md)「规范」「新增规则」。改 `src/` 前读。
- 抓快照、真机实测、在家无线调试、在外用快照链接、踩过的坑：[docs/debugging.md](docs/debugging.md)。要新增或修改规则、连手机、处理 Leo 发来的 `i.gkd.li` 链接时读。
- 字段含义：VS Code 悬停，或 <https://gkd.li/api>；选择器语法：<https://gkd.li/guide/selector>。

## 工作约定

- 一条规则算完成：`pnpm run check` 通过，并且在真机上实测命中、没有误触；在外无法实测时，在提交说明和规则注释里写明「未实测」。
- 发布就是 push 到 main：`check_fix_push` 通过后 `build_release` 自动递增 version 并打 Release。`dist/` 由构建生成，只改 `src/`。
- 订阅 `id` 固定为 `123321256`；规则组和分类的 `key` 一经使用就永久占用。手机上的开关状态按 key 记，改 key 等于换了一条规则。
- 本机没有全局 pnpm，用 `corepack pnpm`；git 钩子直接调用 `pnpm`，提交前需要让 `pnpm` 在 PATH 上可用（例如一个 `exec corepack pnpm "$@"` 的垫片）。`devEngines` 要求 Node 26，低版本只报 WARN，不影响构建。
- commit message 用中文 + Conventional Commits，范围写应用名，例如 `feat(微博): …`。
- 参考社区订阅（如 AIsouler/GKD_subscription）时按本仓库规范改写；社区仓库没有开源许可证，只参考写法。

## 碰手机时的边界

- adb 做读取类操作：连接、端口转发、快照、截图、读节点、`exec` 只匹配不点击、推送和清空内存订阅。
- 在手机上点击、输入、改设置，先得到 Leo 当次同意。不用 adb 注入文字或按键：会被输入法改坏，还会让软键盘消失（恢复方法见 docs/debugging.md「踩过的坑」），需要输入链接时请 Leo 粘贴。
- 无线调试配对码由 Leo 本人在终端输入，不经 Agent。
- 快照含截图和界面文字，留在被 gitignore 的 `tmp/`；分享链接是公开的，涉及隐私的界面先打码。
