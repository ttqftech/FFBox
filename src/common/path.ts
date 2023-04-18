import path, { basename, dirname } from 'path-browserify';

const isValidExt = function (ext: string, ignoreExts: any, maxSize: number) {
	if (ignoreExts == null) {
		ignoreExts = [];
	}
	return ext && ext.length <= maxSize && [].indexOf.call(ignoreExts.map(function (e: any) {
		return (e && e[0] !== "." ? "." : "") + e;
	}), ext) < 0;
};

export default {
    trimExt(filename: string, ignoreExts?: any, maxSize?: number) {
        var oldExt;
        if (maxSize == null) {
            maxSize = 7;
        }
        oldExt = path.extname(filename);
        if (isValidExt(oldExt, ignoreExts, maxSize)) {
          return filename.slice(0, +(filename.length - oldExt.length - 1) + 1 || 9000000000);
        } else {
          return filename;
        }
    },
    basename,
    dirname,
}
