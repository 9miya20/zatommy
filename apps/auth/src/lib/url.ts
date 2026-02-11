/** 末尾スラッシュを除去して URI を正規化 */
export function normalizeUri(uri: string): string {
	return uri.replace(/\/+$/, '');
}
