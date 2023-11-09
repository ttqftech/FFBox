export const version = (() => {
    let ret = '4.0_beta';
    if (!buildInfo) {
        ret += ' *'
    } else if (buildInfo.isDev) {
        ret += ` ${buildInfo.gitCommit}`
    }
    return ret;
})();
export const buildNumber = 11;
//	1.0	1.1	2.0	2.1	2.2	2.3	2.4 2.5 2.6 3.0 4.0
