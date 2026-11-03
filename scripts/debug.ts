// GKD 真机调试工具：连接手机、抓快照、看节点、试选择器、推内存订阅
// 用法见 docs/debugging.md，或运行 `pnpm run debug help`
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.GKD_HTTP || 'http://127.0.0.1:8888';
const ROOT = path.resolve(import.meta.dirname, '..');
const SNAP_DIR = path.join(ROOT, 'tmp', 'snapshots');
// 推内存订阅时用的占位 id，GKD 收到后会改写成内置的内存订阅 id
const MEMORY_SUBS_ID = -2;

type SnapshotNode = {
  id: number;
  pid: number;
  attr: {
    id?: string | null;
    vid?: string | null;
    name: string;
    text: string | null;
    desc: string | null;
    clickable: boolean;
    visibleToUser: boolean;
    left: number;
    top: number;
    right: number;
    bottom: number;
    childCount: number;
  };
};

const api = async (route: string, body: unknown = {}) => {
  const res = await fetch(`${BASE}/api/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return res;
};

const adb = (...args: string[]) =>
  execFileSync('adb', args, { encoding: 'utf-8' }).trim();

// 无线调试每次打开端口都会变，从 mDNS 里找手机的 IP:端口
const connect = () => {
  const line = adb('mdns', 'services')
    .split('\n')
    .find((l) => l.includes('_adb-tls-connect'));
  if (!line) {
    throw new Error(
      '没找到无线调试设备：确认手机已打开「无线调试」且与电脑在同一 Wi-Fi',
    );
  }
  const addr = line.trim().split(/\s+/).pop()!;
  console.log(adb('connect', addr));
  console.log(`export ANDROID_SERIAL=${addr}`);
  console.log(adb('-s', addr, 'forward', 'tcp:8888', 'tcp:8888'));
};

const info = async () => {
  const res = await api('getServerInfo');
  console.log(await res.text());
};

const saveSnapshot = (id: string | number, json: string, png?: Buffer) => {
  const dir = path.join(SNAP_DIR, String(id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'snapshot.json'), json);
  if (png) fs.writeFileSync(path.join(dir, 'screenshot.png'), png);
  return dir;
};

const snap = async () => {
  const meta = JSON.parse(await (await api('captureSnapshot')).text());
  if (!meta.id) throw new Error(JSON.stringify(meta));
  const json = await (await api('getSnapshot', { id: meta.id })).text();
  const png = Buffer.from(
    await (await api('getScreenshot', { id: meta.id })).arrayBuffer(),
  );
  const dir = saveSnapshot(meta.id, json, png);
  console.log(
    `${meta.appInfo?.name} ${meta.appInfo?.versionName} ${meta.activityId}`,
  );
  console.log(dir);
};

// 下载 i.gkd.li 分享链接对应的快照 zip，不需要手机在线
const fetchShared = (url: string) => {
  const id = url.match(/(\d+)(?:\/file\.zip)?$/)?.[1];
  if (!id) throw new Error(`无法从链接中解析快照编号：${url}`);
  const dir = path.join(SNAP_DIR, `shared-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  const zip = path.join(dir, 'file.zip');
  execFileSync('curl', [
    '-sL',
    '-o',
    zip,
    `https://github.com/user-attachments/files/${id}/file.zip`,
  ]);
  execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  console.log(dir);
};

const resolveSnapshotFile = (arg: string) => {
  if (fs.existsSync(arg)) {
    return fs.statSync(arg).isDirectory()
      ? path.join(arg, 'snapshot.json')
      : arg;
  }
  return path.join(SNAP_DIR, arg, 'snapshot.json');
};

// 按树形打印节点；带 --grep 时只打印命中节点及其祖先链
const nodes = (arg: string, grep?: string) => {
  const data = JSON.parse(fs.readFileSync(resolveSnapshotFile(arg), 'utf-8'));
  const list: SnapshotNode[] = data.nodes;
  // 老格式快照没有 vid，从完整 id 里截取
  for (const n of list) {
    n.attr.vid ??= n.attr.id?.split(':id/')[1] ?? null;
  }
  const byId = new Map(list.map((n) => [n.id, n]));
  const children = new Map<number, SnapshotNode[]>();
  for (const n of list) {
    if (!children.has(n.pid)) children.set(n.pid, []);
    children.get(n.pid)!.push(n);
  }
  const keep = new Set<number>();
  if (grep) {
    for (const n of list) {
      const a = n.attr;
      const hay = [a.id, a.vid, a.name, a.text, a.desc].join(' ');
      if (!hay.includes(grep)) continue;
      for (
        let cur: SnapshotNode | undefined = n;
        cur;
        cur = byId.get(cur.pid)
      ) {
        keep.add(cur.id);
      }
    }
  }
  const fmt = (n: SnapshotNode) => {
    const a = n.attr;
    const parts = [`#${n.id}`, a.name.split('.').pop()];
    if (a.vid) parts.push(`vid=${a.vid}`);
    if (a.text) parts.push(`text=${JSON.stringify(a.text.slice(0, 40))}`);
    if (a.desc) parts.push(`desc=${JSON.stringify(a.desc.slice(0, 40))}`);
    if (a.clickable) parts.push('clickable');
    if (!a.visibleToUser) parts.push('hidden');
    parts.push(
      `[${a.left},${a.top},${a.right},${a.bottom}]`,
      `cc=${a.childCount}`,
    );
    return parts.join(' ');
  };
  const walk = (n: SnapshotNode, depth: number) => {
    if (grep && !keep.has(n.id)) return;
    console.log('  '.repeat(depth) + fmt(n));
    for (const c of children.get(n.id) ?? []) walk(c, depth + 1);
  };
  console.log(
    `${data.appInfo?.name} ${data.appInfo?.versionName} ${data.activityId}`,
  );
  for (const root of children.get(-1) ?? []) walk(root, 0);
};

const exec = async (selector: string, click: boolean) => {
  const res = await api('execSelector', {
    selector,
    action: click ? 'click' : 'none',
  });
  console.log(await res.text());
};

// 把 src/apps/<应用id>.ts 原样推成手机上的内存订阅，测试的就是将要提交的规则
const push = async (appIds: string[]) => {
  const apps = [];
  for (const id of appIds) {
    const mod = await import(path.join(ROOT, 'src', 'apps', `${id}.ts`));
    apps.push(mod.default);
  }
  const res = await api('updateSubscription', {
    id: MEMORY_SUBS_ID,
    name: 'memory',
    version: 0,
    apps,
  });
  console.log(await res.text());
};

const clear = async () => {
  const res = await api('updateSubscription', {
    id: MEMORY_SUBS_ID,
    name: 'memory',
    version: 0,
    apps: [],
  });
  console.log(await res.text());
};

const HELP = `用法：pnpm run debug <命令>
  connect               自动发现无线调试端口，连接并转发 8888
  info                  读取 GKD 服务与设备信息
  snap                  抓当前界面快照，存到 tmp/snapshots/<id>/
  fetch <分享链接>        下载 i.gkd.li 快照链接（不需要手机在线）
  nodes <id|路径> [关键词] 打印节点树；给关键词时只看命中节点及其祖先
  exec <选择器> [--click]  在手机当前界面试跑选择器，默认只匹配不点击
  push <应用id...>        把 src/apps 里的规则推成内存订阅实测
  clear                 清空内存订阅
环境变量 GKD_HTTP 可改服务地址，默认 ${BASE}`;

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'connect':
    connect();
    break;
  case 'info':
    await info();
    break;
  case 'snap':
    await snap();
    break;
  case 'fetch':
    fetchShared(args[0]);
    break;
  case 'nodes':
    nodes(args[0], args[1]);
    break;
  case 'exec':
    await exec(args[0], args.includes('--click'));
    break;
  case 'push':
    await push(args);
    break;
  case 'clear':
    await clear();
    break;
  default:
    console.log(HELP);
}
