const fetch = globalThis.fetch;
import getFilePath from '../../utils/getFilePath';

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const REFERRER = process.env.REFERRER;
const referrerList = REFERRER ? REFERRER.split(',') : [];
const referrerListLength = referrerList.length;

export const config = {
  runtime: 'edge'
};

// 根据文件扩展名获取对应的 MIME 类型
function getMimeType(ext) {
  const mimeTypes = {
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // 视频
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'flac': 'audio/flac'
  };
  // return ext ? mimeTypes[ext.toLowerCase()] || 'application/octet-stream' :'';
  return ext ? mimeTypes[ext.toLowerCase()] :'';
}

export default async function handler(req) {
  const referer = req.headers?.get('referer');

  if (referer && referrerListLength > 0) {
    const refererUrl = new URL(referer);

    if (!referrerList.some(allowed => refererUrl.origin.includes(allowed))) {
      return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const [id, fileExt] = new URL(req.url).pathname.split('/').pop().split('.');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const {file_path,error_message} = await getFilePath(TG_BOT_TOKEN, id);

    if (!file_path) {
      return new Response(JSON.stringify({ error: error_message }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!fileExt || !getMimeType(fileExt)) {
      return new Response(JSON.stringify({ error: 'Invalid file extension' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const fileResponse = await fetch(file_path);
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file');
    }

    return new Response(await fileResponse.blob(), {
      status: 200,
      headers: {
        'Content-Type': getMimeType(fileExt),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}