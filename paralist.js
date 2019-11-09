/* 参数表参数顺序：参数短名、参数长名（列表中显示）、icon 名称、icon 偏移数、描述 */


// ======================== 基本视频信息 ========================

exports.paralist_format_format = [
	["MP4", "MP4", "format_format", 9, "MP4 - MP4 即 MPEG-4 Part 14 是一种标准的数字多媒体容器格式。"],
	["MKV", "MKV", "format_format", 7, "MKV - MKV 即 Matroska Video File 是一种开放源代码的多媒体封装格式。"],
	["MOV", "MOV", "format_format", 6, "MOV - MOV 为 QuickTime Movie 的文件扩展名。QuickTime 是由苹果公司所开发的一种多媒体框架。"],
	["FLV", "FLV", "format_format", 8, "FLV - FLV 即 Flash Video，是一种网络视频格式，用作流媒体格式。"],
	["TS", "TS", "format_format", 5, "TS - TS 即 MPEG2-TS 传输流（MPEG-2 Transport Stream；又称 MPEG-TS、MTS）是一种传输和存储包含视频、音频与通信协议各种数据的标准格式，用于数字电视广播系统。"],
	["3GP", "3GP", "format_format", 4, "3GP - 3GP 是 MPEG-4 Part 14（MP4）的一种简化版本，减少了存储空间和较低的带宽需求，让手机上有限的存储空间可以使用。"],
	["RM", "RM (RMVB)", "format_format", 3, "RM - RM 即 RealMedia。RealVideo 是由 RealNetworks 开发的一种专用视频压缩格式。"],
	["WMV", "WMV", "format_format", 2, "WMV - WMV 即 Windows Media Video 是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。"],
	["AVI", "AVI", "format_format", 1, "AVI - AVI 即 Audio Video Interleave 是由微软在 1992 年 11 月推出的一种多媒体文件格式。"]
];
exports.paralist_format_hwaccel = [
	["不使用", "不使用", "", 0, "不使用硬件解码。"],
	["dxva2", "dxva2", "", 0, "​Direct-X Video Acceleration API 2 - Windows 和 Xbox360 上的通用硬件解码器，支持包括 H.264, MPEG-2, VC-1, WMV 3 在内的视频解码。（解码所用的设备与您的主显示器连接的 GPU 有关）"],
	["d3d11va", "d3d11va", "", 0, "d3d11va"],
	["cuda", "cuda", "", 0, "NVIDIA 显卡的 cuda 解码器。"],
	["cuvid", "cuvid/nvdec", "", 0, "NVIDIA 显卡的视频解码器。"],
	["qsv", "qsv", "", 0, "Intel 显卡的 Quick Sync Video 解码。"]
];
exports.paralist_video_vcodec = [
	["不重新编码", "不重新编码", "video_vcodec", 1, "复制源码流，不重新编码。"],
	["AV1", "AV1", "video_vcodec", 2, "AV1 - AV1 即 AOMedia Video 1 是一个开放、免专利的影片编码格式，专为通过网络进行流传输而设计。"],
	["HEVC", "HEVC (H.265)", "video_vcodec", 3, "HEVC - HEVC 即高效率视频编码（High Efficiency Video Coding），又称为 H.265 和 MPEG-H 第 2 部分，是一种视频压缩标准，被视为是 ITU-T H.264/MPEG-4 AVC 标准的继任者。"],
	["H.264", "H.264 (AVC)", "video_vcodec", 4, "H.264 - H.264 又称为 MPEG-4 第 10 部分，高级视频编码（MPEG-4 Part 10, Advanced Video Coding，缩写为 MPEG-4 AVC）是一种面向块，基于运动补偿的视频编码标准 。到 2014 年，它已经成为高精度视频录制、压缩和发布的最常用格式之一。"],
	["H.263", "H.263", "video_vcodec", 5, "H.263 - H.263 是由 ITU-T 用于视频会议的低码率影像编码标准，属于影像编解码器。"],
	["H.261", "H.261", "video_vcodec", 6, "H.261 - H.261 是 1990 年ITU-T 制定的一个影片编码标准，属于影片编解码器。"],
	["VP9", "VP9", "video_vcodec", 7, "VP9 - VP9 是谷歌公司为了替换老旧的 VP8 影像编码格式并与动态专家图像组（MPEG）主导的高效率视频编码（H.265/HEVC）竞争所开发的免费、开源的影像编码格式。"],
	["VP8", "VP8", "video_vcodec", 8, "VP8 - VP8 是一个由 On2 Technologies 开发并由 Google 发布的开放的影像压缩格式。"],
	["MPEG-4", "MPEG-4 (Part 2)", "video_vcodec", 9, "MPEG-4 Part 2 - MPEG-4 是一套用于音频、视频信息的压缩编码标准，由国际标准化组织（ISO）和国际电工委员会（IEC）下属的“动态影像专家组”（Moving Picture Experts Group，即 MPEG）制定。该标准的第二部分为视频编解码器。"],
	["MPEG-2", "MPEG-2 (Part 2)", "video_vcodec", 10, "MPEG-2 Part 2 - MPEG-2 是 MPEG 工作组于 1994 年发布的视频和音频压缩国际标准。MPEG-2 通常用来为广播信号提供视频和音频编码，包括卫星电视、有线电视等。MPEG-2 经过少量修改后，也成为 DVD 产品的核心技术。"],
	["MPEG-1", "MPEG-1", "video_vcodec", 11, "MPEG-1 - VP8 是一个由 On2 Technologies 开发并由 Google 发布的开放的影像压缩格式。"],
	["MJPEG", "MJPEG", "video_vcodec", 12, "MJPEG - MJPEG 即 Motion JPEG（Motion Joint Photographic Experts Group）是一种影像压缩格式，其中每一帧图像都分别使用 JPEG 编码。"],
	["WMV2", "WMV2 (WMV v8)", "video_vcodec", 13, "WMV2 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV2 即 Windows Media Video v8"],
	["WMV1", "WMV1 (WMV v7)", "video_vcodec", 14, "WMV1 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV1 即 Windows Media Video v7"],
	["RV20", "RV20", "video_vcodec", 15, "RV20 - RealVideo 是由 RealNetworks 于 1997 年所开发的一种专用视频压缩格式。RV20 使用 H.263 编码器。"],
	["RV10", "RV10", "video_vcodec", 16, "RV10 - RealVideo 是由 RealNetworks 于 1997 年所开发的一种专用视频压缩格式。RV10 使用 H.263 编码器。"],
	["msvideo1", "Microsoft Video 1", "video_vcodec", 17, "Microsoft Video 1 - Microsoft Video 1 is a vector quantizer video codec with frame differencing that operates in either a palettized 8-bit color space or a 16-bit RGB color space."]
];
exports.paralist_video_hwencode = [
	["不使用", "不使用", "", 0, "不使用硬件编码。"],
	["AMD AMF", "h264_amf (AMD)", "", 0, "h264_amf (AMD)"],
	["Intel QSV", "h264_qsv (Intel)", "", 0, "h264_qsv (Intel Quick Sync Video)"],
	["NVIDIA NVENC", "h264_nvenc (NVIDIA)", "", 0, "h264_nvenc (NVIDIA)"],
	["AMD AMF", "hevc_amf (AMD)", "", 0, "hevc_amf (AMD)"],
	["Intel QSV", "hevc_qsv (Intel)", "", 0, "hevc_qsv (Intel Quick Sync Video)"],
	["NVIDIA NVENC", "hevc_nvenc (NVIDIA)", "", 0, "hevc_nvenc (NVIDIA)"],
	["Intel QSV", "mjpeg_qsv (Intel)", "", 0, "mjpeg_qsv (Intel)"],
	["Intel QSV", "mpeg_qsv (Intel)", "", 0, "mpeg2_qsv (Intel)"]
];
exports.paralist_video_resolution = [
	["不改变", "不改变", "video_resolution", 1, "不改变分辨率。"],
	["7680x4320", "7680x4320", "video_resolution", 58, "UHD 8K (16:9)"],
	["5120x3200", "5120x3200", "video_resolution", 57, "WHXGA (8:5)"],
	["5120x2880", "5120x2880", "video_resolution", 56, "5K (16:9)"],
	["3840x2400", "3840x2400", "video_resolution", 55, "WQUXGA (8:5)"],
	["4096x2160", "4096x2160", "video_resolution", 54, "DCI 4K"],
	["3840x2160", "3840x2160", "video_resolution", 53, "UHD 4K (16:9)"],
	["3200x2400", "3200x2400", "video_resolution", 52, "QUXGA (4:3)"],
	["3200x1800", "3200x1800", "video_resolution", 51, "WQXGA+ (16:9)"],
	["2560x1600", "2560x1600", "video_resolution", 50, "WQXGA (8:5)"],
	["2400x1600", "2400x1600", "video_resolution", 49, "(3:2)"],
	["2560x1440", "2560x1440", "video_resolution", 48, "QHD 2K (16:9)"],
	["2048x1536", "2048x1536", "video_resolution", 47, "QXGA (4:3)"],
	["2560x1440", "1920x1440", "video_resolution", 46, "(4:3)"],
	["1920x1280", "1920x1280", "video_resolution", 45, "(3:2)"],
	["2048x1152", "2048x1152", "video_resolution", 44, "QWXGA (4:3)"],
	["2160x1080", "2160x1080", "video_resolution", 43, "(2:1)"],
	["1920x1200", "1920x1200", "video_resolution", 42, "WUXGA (8:5)"],
	["2048x1080", "2048x1080", "video_resolution", 41, "DCI 2K"],
	["1920x1080", "1920x1080", "video_resolution", 40, "FHD (16:9)"],
	["1600x1200", "1600x1200", "video_resolution", 39, "UGA (4:3)"],
	["1680x1050", "1680x1050", "video_resolution", 38, "WSXGA+ (3:2)"],
	["1440x1080", "1440x1080", "video_resolution", 37, "(4:3)"],
	["1600x900", "1600x900", "video_resolution", 36, "HD+ (16:9)"],
	["1440x960", "1440x960", "video_resolution", 35, "FWXGA+ (3:2)"],
	["1440x900", "1440x900", "video_resolution", 34, "WXGA+ (8:5)"],
	["1280x960", "1280x960", "video_resolution", 33, "QVGA (4:3)"],
	["1200x900", "1200x900", "video_resolution", 32, "(4:3)"],
	["1366x768", "1366x768", "video_resolution", 31, "FWXGA"],
	["1280x800", "1280x800", "video_resolution", 30, "WXGA (8:5)"],
	["1152x864", "1152x864", "video_resolution", 29, "XGA+ (4:3)"],
	["1280x720", "1280x720", "video_resolution", 28, "HD (16:9)"],
	["1152x768", "1152x768", "video_resolution", 27, "WXGA (3:2)"],
	["1152x720", "1152x720", "video_resolution", 26, "(8:5)"],
	["1024x768", "1024x768", "video_resolution", 25, "XGA (4:3)"],
	["960x720", "960x720", "video_resolution", 24, "(4:3)"],
	["1024x640", "1024x640", "video_resolution", 23, "(8:5)"],
	["960x640", "960x640", "video_resolution", 22, "DVGA (3:2)"],
	["1024x576", "1024x576", "video_resolution", 21, "WSVGA"],
	["960x576", "960x576", "video_resolution", 20, "960H"],
	["960x540", "960x540", "video_resolution", 19, "qHD (16:9)"],
	["800x600", "800x600", "video_resolution", 18, "SVGA (4:3)"],
	["720x576", "720x576", "video_resolution", 17, "PAL"],
	["854x480", "854x480", "video_resolution", 16, "FWVGA (16:9)"],
	["704x576", "704x576", "video_resolution", 15, "D1 (11:9)"],
	["800x480", "800x480", "video_resolution", 14, "WVGA (5:3)"],
	["720x480", "720x480", "video_resolution", 13, "NTSC (4:3)"],
	["640x480", "640x480", "video_resolution", 12, "VGA (4:3)"],
	["640x400", "640x400", "video_resolution", 11, "QCGA (8:5)"],
	["480x360", "480x360", "video_resolution", 10, "(4:3)"],
	["480x320", "480x320", "video_resolution", 9, "HVGA (3:2)"],
	["352x288", "352x288", "video_resolution", 8, "CIF (11:9)"],
	["400x240", "400x240", "video_resolution", 7, "WqVGA (5:3)"],
	["320x240", "320x240", "video_resolution", 6, "qVGA (4:3)"],
	["320x200", "320x200", "video_resolution", 5, "CGA (8:5)"],
	["240x160", "240x160", "video_resolution", 4, "HqVGA (3:2)"],
	["176x144", "176x144", "video_resolution", 3, "qCIF (11:9)"],
	["160x120", "160x120", "video_resolution", 2, "qqVGA (4:3)"]
];
exports.paralist_video_fps = [
	["不改变", "不改变", "", 0, "不改变帧速率。"],
	["960", "960", "", 0, "960p"],
	["480", "480", "", 0, "480p"],
	["240", "240", "", 0, "240p"],
	["144", "144", "", 0, "144p"],
	["120", "120", "", 0, "120p"],
	["90", "90", "", 0, "90p"],
	["75", "75", "", 0, "75p"],
	["60", "60", "", 0, "60p"],
	["50", "50", "", 0, "50p"],
	["30", "30", "", 0, "30p"],
	["29.97", "29.97", "", 0, "邪教"],
	["25", "25", "", 0, "25p"],
	["24", "24", "", 0, "24p"],
	["23.976", "23.976", "", 0, "邪教"],
	["15", "15", "", 0, "15p"],
	["12", "12", "", 0, "12p"],
	["10", "10", "", 0, "卡成 PPT"],
	["5", "5", "", 0, "卡成 WPS Presentation"],
	["3", "3", "", 0, "三帧极致"],
	["2", "2", "", 0, "二帧流畅"],
	["1", "1", "", 0, "一帧能玩"]
];


// ======================== 基本音频信息 ========================

exports.paralist_audio_acodec = [
	["不重新编码", "不重新编码", "audio_acodec", 1, "复制源码流，不重新编码。"],
	["OPUS", "OPUS", "audio_acodec", 2, "OPUS - Opus 是一个有损声音编码的格式，由 Xiph.Org 基金会开发，之后由互联网工程任务组进行标准化，目标是希望用单一格式包含声音和语音，取代 Speex 和 Vorbis，且适用于网络上低延迟的即时声音传输，标准格式定义于 RFC 6716 文件。Opus 格式是一个开放格式，使用上没有任何专利或限制。"],
	["AAC", "AAC", "audio_acodec", 3, "AAC - AAC 即 Advanced Audio Coding，高级音频编码，出现于 1997 年，为一种基于 MPEG-2 的有损数字音频压缩的专利音频编码标准，由 Fraunhofer IIS、杜比实验室、AT&T、Sony、Nokia 等公司共同开发。2000 年，MPEG-4 标准在原本的基础上加上了 PNS（Perceptual Noise Substitution）等技术，并提供了多种扩展工具。为了区别于传统的MPEG-2 AAC 又称为 MPEG-4 AAC。其作为 MP3 的后继者而被设计出来，在相同的比特率之下，AAC 相较于 MP3 通常可以达到更好的声音质量。"],
	["Vorbis", "Vorbis (OGG)", "audio_acodec", 4, "Vorbis - Vorbis 是一种有损音频压缩格式，由 Xiph.Org 基金会所领导并开放源代码的一个免费的开源软件项目。该项目为有损音频压缩产生音频编码格式和软件参考编码器╱解码器（编解码器）。Vorbis 通常以 Ogg 作为容器格式，所以常合称为Ogg Vorbis。"],
	["MP3", "MP3", "audio_acodec", 5, "MP3 - MP3 即 MPEG-1 Audio Layer Ⅲ，是当今流行的一种数字音频编码和有损压缩格式，它被设计来大幅降低音频数据量，通过舍弃 PCM 音频数据中对人类听觉不重要的部分，达成压缩成较小文件的目的。而对于大多数用户的听觉感受来说，MP3 的音质与最初的不压缩音频相比没有明显的下降。"],
	["MP2", "MP2", "audio_acodec", 6, "MP3 - MP3 即 MPEG-1 Audio Layer Ⅱ，是当今流行的一种数字音频编码和有损压缩格式，它被设计来大幅降低音频数据量，通过舍弃 PCM 音频数据中对人类听觉不重要的部分，达成压缩成较小文件的目的。而对于大多数用户的听觉感受来说，MP3 的音质与最初的不压缩音频相比没有明显的下降。"],
	["MP1", "MP1", "audio_acodec", 7, "MP3 - MP3 即 MPEG-1 Audio Layer Ⅰ，是当今流行的一种数字音频编码和有损压缩格式，它被设计来大幅降低音频数据量，通过舍弃 PCM 音频数据中对人类听觉不重要的部分，达成压缩成较小文件的目的。而对于大多数用户的听觉感受来说，MP3 的音质与最初的不压缩音频相比没有明显的下降。"],
	["AC3", "AC3", "audio_acodec", 8, "AC3 - AC3 即杜比数字音频编码。杜比数字（Dolby Digital）是美国杜比实验室开发的一系列有损和无损的多媒体单元格式。"],
	["FLAC", "FLAC", "audio_acodec", 9, "FLAC - FLAC 即 Free Lossless Audio Codec，FLAC 是一款的自由音频压缩编码，其特点是可以对音频文件无损压缩。"],
	["ALAC", "ALAC", "audio_acodec", 10, "ALAC - ALAC 即 Apple Lossless Audio Codec，为苹果的无损音频压缩编码格式，可将非压缩音频格式（WAV、AIFF）压缩至原先容量的 40% 至 60% 左右。"],
	["WMA V2", "WMA V2", "audio_acodec", 11, "WMA 2 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。"],
	["WMA V1", "WMA V1", "audio_acodec", 12, "WMA 1 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。"],
	["DTS", "DTS", "audio_acodec", 13, "DTS - DTS 即 Digital Theater Systems，数字影院系统，由 DTS 公司（DTS Inc.，NASDAQ：DTSI）开发，为多声道音频格式中的一种，广泛应用于 DVD 音效上。其最普遍的格式为 5.1 声道。"],
	["AMR WB", "AMR 宽带", "audio_acodec", 14, "AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。"],
	["AMR NB", "AMR 窄带", "audio_acodec", 15, "AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。"],
];


/* 参数表参数顺序：编码器、细项列表 */
	/* 细项列表：模式（slider, combo, switch）、参数名、显示名、根据 mode 产生的项 */
		/* slider：tags: {百分比: 说明}　*/
		/* combo: 跟上面一样 */


// ======================== 视频编码细项 ========================


exports.paralist_video_detail = {
	h264: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CRF：-crf (-1~51)　CQP：-qp (-1~70)　ABR：-b:v　CBR：-b:v -minrate -maxrate */
		{mode: "slider", name: "crf51", display: "CRF", tags: {0: "51（最低画质）", 41.1: "30（低画质）", 52.9: "24（中画质）", 64.7: "18（高画质）", 76.5: "12（肉眼无损）", 100: "0（无损）"}},
		{mode: "slider", name: "qp70", display: "QP", tags: {0: "70（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "preset_long", display: "编码质量", tags: {0: "ultrafast", 11.1: "superfast", 22.2: "veryfast", 33.3: "faster", 44.4: "fast", 55.6: "medium", 66.7: "slow", 77.8: "slower", 88.9: "veryslow", 100: "placebo"}},
		{mode: "combo", name: "tune", display: "编码倾重", items: [["普通", "普通", "", 0, "普通"],["film","film","",0,"电影"],["animation","animation","",0,"动画"],["grain","grain","",0,"保留噪点"],["stillimage","stillimage","",0,"静态图像"],["psnr","psnr","",0,"优化 PSNR"],["ssim","ssim","",0,"优化 SSIM"],["fastdecode","fastdecode","",0,"快速解码"],["zerolatency","zerolatency","",0,"超低延迟"]]},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动"],["baseline","baseline","",0,"--no-8x8dct  --bframes 0  --no-cabac  --cqm flat  --weightp 0  NoInterlaced  NoLossless"],["main","main","",0,"--no-8x8dct  --cqm flat  NoLossless"],["high","high","",0,"NoLossless"],["high10","high10","",0,"NoLossless  Support forbit depth 8-10"],["high422","high422","",0,"NoLossless  Support forbit depth 8-10  Support for 4:2:0/4:2:2 chroma subsampling"],["high444","high444","",0,"Support forbit depth 8-10  Support for 4:2:0/4:2:2/4:4:4 chroma subsampling"]]},
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1b","1b","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1.1","1.1","",0,"高清晰度@最高帧率：<br />128×96@60<br />176×144@30<br />352×288@7.5"],["1.2","1.2","",0,"高清晰度@最高帧率：<br />128×96@120<br />176×144@60<br />352×288@15"],["1.3","1.3","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2","2","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@60<br />352×288@50<br />352×480@30<br />352×576@25"],["2.2","2.2","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×480@30<br />352×576@25<br />720×480@15<br />720×576@12.5"],["3","3","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@120<br />352×480@60<br />720×480@30<br />720×576@25"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />352×288@172<br />352×576@130<br />640×480@90<br />720×576@60<br />1280×720@30"],["3.2","3.2","",0,"高清晰度@最高帧率：<br />640×480@172<br />720×480@160<br />720×576@130<br />1280×720@60"],["4","4","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.2","4.2","",0,"高清晰度@最高帧率：<br />720×576@172<br />1280×720@140<br />2048×1080@60"],["5","5","",0,"高清晰度@最高帧率：<br />1024×768@172<br />1280×720@160<br />2048×1080@60<br />2560×1920@30<br />3680×1536@25"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1280×720@172<br />1920×1080@120<br />2048×1536@80<br />4096×2048@30"],["5.2","5.2","",0,"高清晰度@最高帧率：<br />1920×1080@172<br />2048×1536@160<br />4096×2048@60"],["6","6","",0,"高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@120<br />8192×4320@30"],["6.1","6.1","",0,"高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@240<br />8192×4320@60"],["6.2","6.2","",0,"高清晰度@最高帧率：<br />4096×2304@300<br />8192×4320@120"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuvj420p", "yuvj420p", "", 0, "yuvj420p"],["yuv422p", "yuv422p", "", 0, "yuv422p"],["yuvj422p", "yuvj422p", "", 0, "yuvj422p"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["yuvj444p", "yuvj444p", "", 0, "yuvj444p"],["nv12", "nv12", "", 0, "nv12"],["nv16", "nv16", "", 0, "nv16"],["nv21", "nv21", "", 0, "nv21"],["yuv420p10le", "yuv420p10le", "", 0, "yuv420p10le"],["yuv422p10le", "yuv422p10le", "", 0, "yuv422p10le"],["yuv444p10le", "yuv444p10le", "", 0, "yuv444p10le"],["nv20le", "nv20le", "", 0, "nv20le"],["gray", "gray", "", 0, "gray"],["gray10le", "gray10le", "", 0, "gray10le"]]}
	],
	h264_amf: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"]]},
		/* CQP：-qp_i -qp_p -qp_b (-1~51)　ABR：-b:v　CBR：-rc cbr -b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "usage", display: "编码倾重", items: [["transcoding", "transcoding（默认）", "", 0, "转码"],["ultralowlatency","ultralowlatency","",0,"超低延迟"],["webcam","webcam","",0,"网络摄像头"]]},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动"],["main","main","",0,"main"],["high","high","",0,"high"],["constrained_baseline","constrained_baseline","",0,"constrained_baseline"],["constrained_high","constrained_high","",0,"constrained_high"]]},
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1b","1b","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1.1","1.1","",0,"高清晰度@最高帧率：<br />128×96@60<br />176×144@30<br />352×288@7.5"],["1.2","1.2","",0,"高清晰度@最高帧率：<br />128×96@120<br />176×144@60<br />352×288@15"],["1.3","1.3","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2","2","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@60<br />352×288@50<br />352×480@30<br />352×576@25"],["2.2","2.2","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×480@30<br />352×576@25<br />720×480@15<br />720×576@12.5"],["3","3","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@120<br />352×480@60<br />720×480@30<br />720×576@25"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />352×288@172<br />352×576@130<br />640×480@90<br />720×576@60<br />1280×720@30"],["3.2","3.2","",0,"高清晰度@最高帧率：<br />640×480@172<br />720×480@160<br />720×576@130<br />1280×720@60"],["4","4","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.2","4.2","",0,"高清晰度@最高帧率：<br />720×576@172<br />1280×720@140<br />2048×1080@60"],["5","5","",0,"高清晰度@最高帧率：<br />1024×768@172<br />1280×720@160<br />2048×1080@60<br />2560×1920@30<br />3680×1536@25"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1280×720@172<br />1920×1080@120<br />2048×1536@80<br />4096×2048@30"],["5.2","5.2","",0,"高清晰度@最高帧率：<br />1920×1080@172<br />2048×1536@160<br />4096×2048@60"],["6","6","",0,"高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@120<br />8192×4320@30"],["6.1","6.1","",0,"高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@240<br />8192×4320@60"],["6.2","6.2","",0,"高清晰度@最高帧率：<br />4096×2304@300<br />8192×4320@120"]]},
		{mode: "combo", name: "quality", display: "质量", items: [["speed", "speed", "", 0, "速度优先"],["balanced","balanced（默认）","",0,"均衡"],["quality","quality","",0,"质量优先"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["nv12", "nv12", "", 0, "nv12"],["d3d11", "d3d11", "", 0, "d3d11"],["dxva2_vld", "dxva2_vld", "", 0, "dxva2_vld"]]}
	],
	h264_nvenc: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"]]},
		/* CRF：-cq (0~51)　CQP：-qp (-1~51)　ABR：-b:v　CBR：-cbr true -b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "crf51", display: "CRF", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "preset", display: "预设", items: [["自动", "自动", "", 0, "自动"],["slow","slow","",0,"hq 2 passes"],["medium","medium","",0,"hq 1 pass"],["fast","fast","",0,"hp 1 pass"],["hq","hq","",0,""],["bd","bd","",0,""],["ll","ll","",0,"low latency"],["llhq","llhq","",0,"low latency hq"],["llhp","llhp","",0,"low latency hp"],["lossless","lossless","",0,""],["losslesshp","losslesshp","",0,""]]},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动"],["baseline","baseline","",0,"baseline"],["main","main","",0,"main"],["high","high","",0,"high"],["high444p","high444p","",0,"high444p"]]},
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1b","1b","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1.1","1.1","",0,"高清晰度@最高帧率：<br />128×96@60<br />176×144@30<br />352×288@7.5"],["1.2","1.2","",0,"高清晰度@最高帧率：<br />128×96@120<br />176×144@60<br />352×288@15"],["1.3","1.3","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2","2","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@60<br />352×288@50<br />352×480@30<br />352×576@25"],["2.2","2.2","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×480@30<br />352×576@25<br />720×480@15<br />720×576@12.5"],["3","3","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@120<br />352×480@60<br />720×480@30<br />720×576@25"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />352×288@172<br />352×576@130<br />640×480@90<br />720×576@60<br />1280×720@30"],["3.2","3.2","",0,"高清晰度@最高帧率：<br />640×480@172<br />720×480@160<br />720×576@130<br />1280×720@60"],["4","4","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.2","4.2","",0,"高清晰度@最高帧率：<br />720×576@172<br />1280×720@140<br />2048×1080@60"],["5","5","",0,"高清晰度@最高帧率：<br />1024×768@172<br />1280×720@160<br />2048×1080@60<br />2560×1920@30<br />3680×1536@25"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1280×720@172<br />1920×1080@120<br />2048×1536@80<br />4096×2048@30"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["nv12", "nv12", "", 0, "nv12"],["p016le", "p016le", "", 0, "p016le"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["p010le", "p010le", "", 0, "p010le"],["yuv444p16le", "yuv444p16le", "", 0, "yuv444p16le"],["bgr0", "bgr0", "", 0, "bgr0"],["rgb0", "rgb0", "", 0, "rgb0"],["cuda", "cuda", "", 0, "cuda"],["d3d11", "d3d11", "", 0, "d3d11"]]}
	],
	h264_qsv: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CQP：-q (0~51)　ABR：-b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "preset_short", display: "编码质量", tags: {0: "veryfast", 16.7: "faster", 33.3: "fast", 50: "medium", 66.7: "slow", 83.3: "slower", 100: "veryslow"}},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动（unknown）"],["baseline","baseline","",0,"baseline"],["main","main","",0,"main"],["high","high","",0,"high"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["nv12", "nv12", "", 0, "nv12"],["p010le", "p010le", "", 0, "p010le"],["qsv", "qsv", "", 0, "qsv"]]}
	],
	hevc: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CRF：-crf (0~51)　ABR：-b:v */
		{mode: "slider", name: "crf51", display: "CRF", tags: {0: "51（最低画质）", 41.1: "30（低画质）", 52.9: "24（中画质）", 64.7: "18（高画质）", 76.5: "12（肉眼无损）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "preset_long", display: "编码质量", tags: {0: "ultrafast", 11.1: "superfast", 22.2: "veryfast", 33.3: "faster", 44.4: "fast", 55.6: "medium", 66.7: "slow", 77.8: "slower", 88.9: "veryslow", 100: "placebo"}},
		{mode: "combo", name: "tune", display: "编码倾重", items: [["普通", "普通", "", 0, "普通"],["psnr","psnr","",0,"优化 PSNR"],["ssim","ssim","",0,"优化 SSIM"],["fastdecode","fastdecode","",0,"快速解码"],["zerolatency","zerolatency","",0,"超低延迟"]]},
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@33.7<br />176×144@15.0"],["2","2","",0,"高清晰度@最高帧率：<br />176×144@100.0<br />320×240@45.0<br />352×240@37.5<br />352×288@30.0"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />320×240@90.0<br />352×240@75.0<br />352×288@60.0<br />352×480@37.5<br />352×576@33.3<br />640×360@30.0"],["3","3","",0,"高清晰度@最高帧率：<br />352×480@84.3<br />352×576@75.0<br />640×360@67.5<br />720×480@42.1<br />720×576@37.5<br />960×540@30.0"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />720×480@84.3<br />720×576@75.0<br />960×540@60.0<br />1280×720@33.7"],["4","4","",0,"高清晰度@最高帧率：<br />1280×720@68.0<br />1280×1024@51.0<br />1920×1080@32.0<br />2048×1080@30.0"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />1280×720@136.0<br />1280×1024@102.0<br />1920×1080@64.0<br />2048×1080@60.0"],["5","5","",0,"高清晰度@最高帧率：<br />1920×1080@128.0<br />2048×1024@127.5<br />2048×1080@120.0<br />2048×1536@85.0<br />2560×1920@54.4<br />3672×1536@46.8<br />3840×2160@32.0<br />4096×2160@30.0"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1920×1080@256.0<br />2048×1024@255.0<br />2048×1080@240.0<br />2048×1536@170.0<br />2560×1920@108.8<br />3672×1536@93.7<br />3840×2160@64.0<br />4096×2160@60.0"],["5.2","5.2","",0,"高清晰度@最高帧率：<br />1920×1080@300.0<br />2048×1024@300.0<br />2048×1080@300.0<br />2048×1536@300.0<br />2560×1920@217.6<br />3672×1536@187.5<br />3840×2160@128.0<br />4096×2160@120.0"],["6","6","",0,"高清晰度@最高帧率：<br />3840×2160@128.0<br />4096×2048@127.5<br />4096×2160@120.0<br />4096×2304@113.3<br />7680×4320@32.0<br />8192×4320@30.0"],["6.1","6.1","",0,"高清晰度@最高帧率：<br />3840×2160@256.0<br />4096×2048@255.0<br />4096×2160@240.0<br />4096×2304@226.6<br />7680×4320@64.0<br />8192×4320@60.0"],["6.2","6.2","",0,"高清晰度@最高帧率：<br />3840×2160@300.0<br />4096×2048@300.0<br />4096×2160@300.0<br />4096×2304@300.0<br />7680×4320@128.0<br />8192×4320@120.0"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuv422p", "yuv422p", "", 0, "yuv422p"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["gbrp", "gbrp", "", 0, "gbrp"],["yuv420p10le", "yuv420p10le", "", 0, "yuv420p10le"],["yuv422p10le", "yuv422p10le", "", 0, "yuv422p10le"],["yuv444p10le", "yuv444p10le", "", 0, "yuv444p10le"],["gbrp10le", "gbrp10le", "", 0, "gbrp10le"],["gray", "gray", "", 0, "gray"],["gray10le", "gray10le", "", 0, "gray10le"]]}
	],
	hevc_amf: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"]]},
		/* CQP：-qp_i -qp_p (-1~51)　ABR：-b:v　CBR：-rc cbr -b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "usage", display: "编码倾重", items: [["transcoding", "transcoding（默认）", "", 0, "转码"],["ultralowlatency","ultralowlatency","",0,"超低延迟"],["webcam","webcam","",0,"网络摄像头"]]},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动"],["main","main","",0,"main"],["high","high","",0,"high"]]},	/* -profilt_tier */
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@33.7<br />176×144@15.0"],["2","2","",0,"高清晰度@最高帧率：<br />176×144@100.0<br />320×240@45.0<br />352×240@37.5<br />352×288@30.0"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />320×240@90.0<br />352×240@75.0<br />352×288@60.0<br />352×480@37.5<br />352×576@33.3<br />640×360@30.0"],["3","3","",0,"高清晰度@最高帧率：<br />352×480@84.3<br />352×576@75.0<br />640×360@67.5<br />720×480@42.1<br />720×576@37.5<br />960×540@30.0"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />720×480@84.3<br />720×576@75.0<br />960×540@60.0<br />1280×720@33.7"],["4","4","",0,"高清晰度@最高帧率：<br />1280×720@68.0<br />1280×1024@51.0<br />1920×1080@32.0<br />2048×1080@30.0"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />1280×720@136.0<br />1280×1024@102.0<br />1920×1080@64.0<br />2048×1080@60.0"],["5","5","",0,"高清晰度@最高帧率：<br />1920×1080@128.0<br />2048×1024@127.5<br />2048×1080@120.0<br />2048×1536@85.0<br />2560×1920@54.4<br />3672×1536@46.8<br />3840×2160@32.0<br />4096×2160@30.0"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1920×1080@256.0<br />2048×1024@255.0<br />2048×1080@240.0<br />2048×1536@170.0<br />2560×1920@108.8<br />3672×1536@93.7<br />3840×2160@64.0<br />4096×2160@60.0"],["5.2","5.2","",0,"高清晰度@最高帧率：<br />1920×1080@300.0<br />2048×1024@300.0<br />2048×1080@300.0<br />2048×1536@300.0<br />2560×1920@217.6<br />3672×1536@187.5<br />3840×2160@128.0<br />4096×2160@120.0"],["6","6","",0,"高清晰度@最高帧率：<br />3840×2160@128.0<br />4096×2048@127.5<br />4096×2160@120.0<br />4096×2304@113.3<br />7680×4320@32.0<br />8192×4320@30.0"],["6.1","6.1","",0,"高清晰度@最高帧率：<br />3840×2160@256.0<br />4096×2048@255.0<br />4096×2160@240.0<br />4096×2304@226.6<br />7680×4320@64.0<br />8192×4320@60.0"],["6.2","6.2","",0,"高清晰度@最高帧率：<br />3840×2160@300.0<br />4096×2048@300.0<br />4096×2160@300.0<br />4096×2304@300.0<br />7680×4320@128.0<br />8192×4320@120.0"]]},
		{mode: "combo", name: "quality", display: "质量", items: [["speed", "speed", "", 0, "速度优先"],["balanced","balanced（默认）","",0,"均衡"],["quality","quality","",0,"质量优先"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["nv12", "nv12", "", 0, "nv12"],["d3d11", "d3d11", "", 0, "d3d11"],["dxva2_vld", "dxva2_vld", "", 0, "dxva2_vld"]]}
	],
	hevc_nvenc: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"]]},
		/* CRF：-cq (0~51)　CQP：-qp (-1~51)　ABR：-b:v　CBR：-cbr true -b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "crf51", display: "CRF", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "preset", display: "预设", items: [["自动", "自动", "", 0, "自动"],["slow","slow","",0,"hq 2 passes"],["medium","medium","",0,"hq 1 pass"],["fast","fast","",0,"hp 1 pass"],["hq","hq","",0,""],["bd","bd","",0,""],["ll","ll","",0,"low latency"],["llhq","llhq","",0,"low latency hq"],["llhp","llhp","",0,"low latency hp"],["lossless","lossless","",0,""],["losslesshp","losslesshp","",0,""]]},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动"],["main","main","",0,"main"],["main10","main10","",0,"main10"],["rext","rext","",0,"rext"]]},	/* 目前暂时忽略 tier */
		{mode: "combo", name: "level", display: "级别", items: [["自动", "自动", "", 0, "自动"],["1","1","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1b","1b","",0,"高清晰度@最高帧率：<br />128×96@30<br />176×144@15"],["1.1","1.1","",0,"高清晰度@最高帧率：<br />128×96@60<br />176×144@30<br />352×288@7.5"],["1.2","1.2","",0,"高清晰度@最高帧率：<br />128×96@120<br />176×144@60<br />352×288@15"],["1.3","1.3","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2","2","",0,"高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30"],["2.1","2.1","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@60<br />352×288@50<br />352×480@30<br />352×576@25"],["2.2","2.2","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×480@30<br />352×576@25<br />720×480@15<br />720×576@12.5"],["3","3","",0,"高清晰度@最高帧率：<br />176×144@172<br />352×240@120<br />352×480@60<br />720×480@30<br />720×576@25"],["3.1","3.1","",0,"高清晰度@最高帧率：<br />352×288@172<br />352×576@130<br />640×480@90<br />720×576@60<br />1280×720@30"],["3.2","3.2","",0,"高清晰度@最高帧率：<br />640×480@172<br />720×480@160<br />720×576@130<br />1280×720@60"],["4","4","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.1","4.1","",0,"高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30"],["4.2","4.2","",0,"高清晰度@最高帧率：<br />720×576@172<br />1280×720@140<br />2048×1080@60"],["5","5","",0,"高清晰度@最高帧率：<br />1024×768@172<br />1280×720@160<br />2048×1080@60<br />2560×1920@30<br />3680×1536@25"],["5.1","5.1","",0,"高清晰度@最高帧率：<br />1280×720@172<br />1920×1080@120<br />2048×1536@80<br />4096×2048@30"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["nv12", "nv12", "", 0, "nv12"],["p016le", "p016le", "", 0, "p016le"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["p010le", "p010le", "", 0, "p010le"],["yuv444p16le", "yuv444p16le", "", 0, "yuv444p16le"],["bgr0", "bgr0", "", 0, "bgr0"],["rgb0", "rgb0", "", 0, "rgb0"],["cuda", "cuda", "", 0, "cuda"],["d3d11", "d3d11", "", 0, "d3d11"]]}
	],
	hevc_qsv: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CQP：-q (0~51)　ABR：-b:v */
		{mode: "slider", name: "qp51", display: "QP", tags: {0: "51（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "preset_short", display: "编码质量", tags: {0: "veryfast", 16.7: "faster", 33.3: "fast", 50: "medium", 66.7: "slow", 83.3: "slower", 100: "veryslow"}},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动（unknown）"],["main","main","",0,"main"],["main10","main10","",0,"main10"],["mainsp","mainsp","",0,"mainsp"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["nv12", "nv12", "", 0, "nv12"],["p010le", "p010le", "", 0, "p010le"],["qsv", "qsv", "", 0, "qsv"]]}
	],
	av1: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CRF：-crf (-1~51)　ABR：-b:v */
		{mode: "slider", name: "crf63", display: "CRF", tags: {0: "63（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuv422p", "yuv422p", "", 0, "yuv422p"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["yuv420p10le", "yuv420p10le", "", 0, "yuv420p10le"],["yuv422p10le", "yuv422p10le", "", 0, "yuv422p10le"],["yuv444p10le", "yuv444p10le", "", 0, "yuv444p10le"],["yuv420p12le", "yuv420p12le", "", 0, "yuv420p12le"],["yuv422p12le", "yuv422p12le", "", 0, "yuv422p12le"],["yuv444p12le", "yuv444p12le", "", 0, "yuv444p12le"]]}
	],
	vp9: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CRF：-crf (-1~63), -lossless　ABR：-b:v */
		{mode: "slider", name: "crf63", display: "CRF", tags: {0: "63（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "quality", display: "编码质量", items: [["自动", "自动", "", 0, "自动"],["best","best","",0,"最佳（最慢）"],["good","good","",0,"好（默认）"],["realtime","realtime","",0,"实时（最快）"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuva420p", "yuva420p", "", 0, "yuva420p"],["yuv422p", "yuv422p", "", 0, "yuv422p"],["yuv440p", "yuv440p", "", 0, "yuv440p"],["yuv444p", "yuv444p", "", 0, "yuv444p"],["yuv420p10le", "yuv420p10le", "", 0, "yuv420p10le"],["yuv422p10le", "yuv422p10le", "", 0, "yuv422p10le"],["yuv440p10le", "yuv440p10le", "", 0, "yuv440p10le"],["yuv444p10le", "yuv444p10le", "", 0, "yuv444p10le"],["yuv420p12le", "yuv420p12le", "", 0, "yuv420p12le"],["yuv422p12le", "yuv422p12le", "", 0, "yuv422p12le"],["yuv440p12le", "yuv440p12le", "", 0, "yuv440p12le"],["yuv444p12le", "yuv444p12le", "", 0, "yuv444p12le"],["yuv444p12le", "yuv444p12le", "", 0, "yuv444p12le"],["gbrp", "gbrp", "", 0, "gbrp"],["gbrp10le", "gbrp10le", "", 0, "gbrp10le"],["gbrp12le", "gbrp12le", "", 0, "gbrp12le"]]}
	],
	vp8: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* CRF：-crf (-1~63), -lossless　ABR：-b:v */
		{mode: "slider", name: "crf63", display: "CRF", tags: {0: "63（最低画质）", 100: "0（无损）"}},
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "quality", display: "编码质量", items: [["自动", "自动", "", 0, "自动"],["best","best","",0,"最佳（最慢）"],["good","good","",0,"好（默认）"],["realtime","realtime","",0,"实时（最快）"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuva420p", "yuva420p", "", 0, "yuva420p"]]}
	],
	h263p: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	h261: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	mpeg4: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	mpeg2video: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"],["yuv422p", "yuv422p", "", 0, "yuv422p"]]}
	],
	mpeg2_qsv: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "slider", name: "preset_short", display: "编码质量", tags: {0: "veryfast", 16.7: "faster", 33.3: "fast", 50: "medium", 66.7: "slow", 83.3: "slower", 100: "veryslow"}},
		{mode: "combo", name: "profile", display: "规格", items: [["自动", "自动", "", 0, "自动（unknown）"],["main","main","",0,"main"],["main10","main10","",0,"main10"],["mainsp","mainsp","",0,"mainsp"]]},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["nv12", "nv12", "", 0, "nv12"],["qsv", "qsv", "", 0, "qsv"]]}
	],
	mpeg1video: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	mjpeg: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuvj420p", "yuvj420p", "", 0, "yuvj420p"],["yuvj422p", "yuvj422p", "", 0, "yuvj422p"],["yuvj444p", "yuvj444p", "", 0, "yuvj444p"]]}
	],
	mjpeg_qsv: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"]]},
		/* ABR：-b:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["nv12", "nv12", "", 0, "nv12"],["qsv", "qsv", "", 0, "qsv"]]}
	],
	wmv2: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	wmv1: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	rv20: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	rv10: [
		{mode: "combo", name: "ratecontrol", display: "码率控制", items: [["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],["Q", "Q", "video_ratecontrol", 6, "Q - 质量（值越高画质越低）：指定画质，具体值对应的画质由具体编码器决定。"]]},
		/* ABR：-b:v, Q: -q:v */
		{mode: "slider", name: "vbitrate", display: "码率", tags: {0: "64 Kbps", 25: "512 Kbps", 50: "4 Mbps", 75: "32 Mbps", 100: "256 Mbps"}},
		{mode: "slider", name: "q100", display: "质量指数", tags: {0: "最高画质", 100: "更低画质"}},
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["yuv420p", "yuv420p", "", 0, "yuv420p"]]}
	],
	msvideo1: [
		{mode: "combo", name: "pixelfmt", display: "像素格式", items: [["自动", "自动", "", 0, "自动"],["rgb555le", "rgb555le", "", 0, "rgb555le"]]}
	]	
}

/*
exports.paralist_video_ratecontrol = [
	["CRF", "CRF（推荐）", "video_ratecontrol", 1, "Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。"],
	["CQP", "CQP", "video_ratecontrol", 2, "Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。"],
	["VBR", "VBR", "video_ratecontrol", 3, "Variable Bit Rate - 可变码率：根据画面内容决定码率大小。"],
	["CBR", "CBR", "video_ratecontrol", 4, "Variable Bit Rate - 恒定码率：将码率恒定在一个值。"],
	["ABR", "ABR", "video_ratecontrol", 5, "Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。"],
	["Q", "Q", "video_ratecontrol", 6, "Q - 质量：指定画质，具体值对应的画质由具体编码器决定。"]
];
*/