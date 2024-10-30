async function getFilePath(TG_Bot_Token, file_id) {
  const API_ROOT = 'https://api.telegram.org';
  const FILE_PREFIX = `${API_ROOT}/file/bot${TG_Bot_Token}/`;

  try {
    const url = `${API_ROOT}/bot${TG_Bot_Token}/getFile?file_id=${file_id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return data?.ok ? {
      file_path: `${FILE_PREFIX}${data.result.file_path}`
    } : {
      error_code: data.error_code,
      error_message: data.description
    };

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export default getFilePath;