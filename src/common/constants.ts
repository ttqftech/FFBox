export const version = (() => {
    let ret = '6.0-alpha';
    if (!buildInfo) {
        ret += ' *'
    } else if (buildInfo.isDev) {
        ret += ` ${buildInfo.gitCommit}`
    }
    return ret;
})();
export const buildNumber = 22;
//	1.0	1.1	2.0	2.1	2.2	2.3	2.4 2.5 2.6 3.0 4.0 4.1 4.2 4.3 4.4 4.5 5.0 5.1 5.2 5.3 5.4 6.0
export const validUntil: Date | undefined = new Date('2026-12-01'); // 时间炸弹，仅在开发版本下存在，正式版本务必去除
