/**
 * 生成分享链接
 * 注意：需要后端提供 /share/{taskId} 路由
 */
export const generateShareUrl = (taskId: string): string => {
  // 开发环境：使用本地IP
  // 生产环境：替换为实际域名
  const isDev = __DEV__;
  const BASE_URL = isDev 
    ? (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.135.64.50:8000')
    : 'https://melodysnap.app';
  
  return `${BASE_URL}/share/${taskId}`;
};
