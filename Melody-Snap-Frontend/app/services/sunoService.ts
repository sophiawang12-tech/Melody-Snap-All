// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';

// 1. 定义常量 API_BASE_URL（从环境变量读取，支持 tunnel 模式）
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.128.10.236:8000';

// 2. 定义接口 TaskStatusResponse
export interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  music_url?: string;
  error?: string;
  message?: string;
  analysis_result?: any;
}

// 3. 实现 generateSongTask 函数
export const generateSongTask = async (imageUri: string): Promise<string> => {
  try {
    console.log(`[sunoService] Uploading image to ${API_BASE_URL}/api/generate-music`);
    
    const response = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/generate-music`,
      imageUri,
      {
        httpMethod: 'POST',
        // Use 1 for MULTIPART upload as FileSystemUploadType might not be exported on the default object
        uploadType: 1, 
        fieldName: 'image',
      }
    );

    console.log(`[sunoService] Upload response status: ${response.status}`);

    if (response.status !== 200) {
      throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
    }

    const data = JSON.parse(response.body);
    if (!data.task_id) {
      throw new Error('Response missing task_id');
    }

    return data.task_id;
  } catch (error) {
    console.error('[sunoService] generateSongTask error:', error);
    throw error;
  }
};

// 4. 实现 checkTaskStatus 函数
export const checkTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/task/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Check status failed with status ${response.status}`);
    }

    const data: TaskStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[sunoService] checkTaskStatus error:', error);
    throw error;
  }
};
