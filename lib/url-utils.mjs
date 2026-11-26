// Next 动态路由的 params 在不同渲染路径下可能是已解码的中文，也可能是percent-encoded 原串。
// 统一先解码再编码，避免 canonical / og:url 出现 %25E5... 双重编码。
export function encodePathSegment(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const text = String(value ?? '');
  try {
    return encodeURIComponent(decodeURIComponent(text));
  } catch {
    // 含裸 % 但不是合法 percent-escape 时保持原样编码
    return encodeURIComponent(text);
  }
}
