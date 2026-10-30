// 地区前缀版高校库（/shanghai/universities、/nanjing/universities …）。
//
// 为什么需要它：高校库是全国维度数据、不区分地区，规范地址是 /universities（全局频道）。
// 但全站导航右上角的地区选择器语义是「换地区、保留当前频道」——在高校页选南京，
// 应当仍然停在高校库（而不是跳去 /nanjing/schools 中学频道）。带前缀的 URL 让这件事
// 无需额外状态即可成立：地区从 pathname 解析（region-context / region-selector 同源），
// 于是导航里的新闻、中学等继续跟随所选地区。
//
// 实现：与全局页共用同一份渲染（直接复用 app/universities/page.js 的默认导出与 metadata，
// 页面内据 params.region 派生 basePath 让筛选/翻页/排序留在本前缀下）。
// SEO：canonical 统一指向 /universities，地区副本不进 sitemap，避免 4 份重复收录。
import UniversitiesPage, { metadata as globalMetadata } from '../../universities/page';

export const metadata = globalMetadata;

export default UniversitiesPage;
