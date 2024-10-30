const fetch = globalThis.fetch;

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const HOST = process.env.HOST;
const hostList = HOST ? HOST.split(',') : [];
const hostListLength = hostList.length;

export const config = {
  runtime: 'edge'
};

// CORS 配置
const CORS_HEADERS = (req={}) => {
  const origin = req.headers?.get('origin');
  const allowOrigin = hostListLength === 0 ? '*' : (origin && hostList.includes(origin) ? origin : '');

  return {
    ...(allowOrigin ? {'Access-Control-Allow-Origin': allowOrigin} : {}),
    ...{
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    }
  };
};

const createResponse = (data, status = 200, additionalHeaders = {}, req={}) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS(req),
      ...additionalHeaders
    }
  });
};

// 支持的文件扩展名列表
const VALID_EXTENSIONS = new Set([
  'jpeg', 'jpg', 'png', 'gif', 'webp',
  'mp4', 'webm', 'mov',
  'mp3','wav', 'flac', 'aac','ogg','m4a'
]);

// 文件类型映射
const FILE_TYPE_MAP = {
  // 特殊类型
  'image/png': {url: 'sendDocument', type: 'document'},
  'image/gif': {url: 'sendDocument', type: 'document'},
  'image/webp': {url: 'sendDocument', type: 'document'},

  // 常规类型
  'image/': {url: 'sendPhoto', type: 'photo'},
  'video/': {url: 'sendVideo', type: 'video'},
  'audio/': {url: 'sendAudio', type: 'audio'}
};

const DEFAULT_TYPE = {url: 'sendDocument', type: 'document'};

// 优先从文件名中获取扩展名，否则从文件类型中获取
const getFileExtension = (fileName, fileType) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return VALID_EXTENSIONS.has(ext) ? ext : VALID_EXTENSIONS.has(fileType.split('/')[1]) ? fileType.split('/')[1] : 'unknown';
};

// 获取发送函数配置
const getFileConfig = (fileType) => {
  const matchedType = Object.keys(FILE_TYPE_MAP).find(key => fileType.startsWith(key)); // 匹配第一个命中对象
  return matchedType ? FILE_TYPE_MAP[matchedType] : DEFAULT_TYPE;
};

// 处理特殊文件类型，否则在TG客户端会展示成贴纸
const processSpecialFileTypes = (file, fileName, fileType, fileExt) => {
  if (fileExt === 'gif' || fileExt === 'webp') {
    const newFileName = fileName.replace(new RegExp(`\\.${fileExt}$`), '.jpeg');
    return new File([file], newFileName, { type: fileType });
  }

  return file;
};

// 从 Telegram 响应中提取文件 ID
const extractFileId = (rawData) => {
  if (rawData.photo) {
    const file = rawData.photo.sort((a, b) => b.width - a.width)[0];
    return file.file_id;
  }

  const possibleTypes = ['video', 'audio', 'document', 'sticker', 'animation'];
  for (const type of possibleTypes) {
    if (rawData[type]) {
      return rawData[type].file_id;
    }
  }
  return null;
};

export default async function handler(req) {
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS(req)
    });
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405, {}, req);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return createResponse({ error: 'No file uploaded' }, 400, {}, req);
    }

    const fileType = file.type;
    const fileName = file.name;
    const fileExt = getFileExtension(fileName, fileType);

    const fileConfig = getFileConfig(fileType);
    const processedFile = processSpecialFileTypes(file, fileName, fileType, fileExt);

    const newFormData = new FormData();
    newFormData.append(fileConfig.type, processedFile);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/${fileConfig.url}?chat_id=${TG_CHAT_ID}`,
      {
        method: 'POST',
        body: newFormData
      }
    );

    if (!telegramResponse.ok) {
      throw new Error('Failed to upload file to Telegram');
    }

    const { result } = await telegramResponse.json();
    const fileId = extractFileId(result);

    if (!fileId) {
      return createResponse({ error: 'No File received from Telegram' }, 400, {}, req);
    }

    const responseData = {
      message: 'ok',
      url: `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}/api/file/${fileId}.${fileExt}`,
      code:0,
      // rawData: result // 调试用，生产模式请勿暴露，否则泄露token和id
    };

    return createResponse(responseData, 200, {}, req);

  } catch (error) {
    console.error('Error:', error);
    return createResponse({ error: error.message }, 500, {}, req);
  }
}