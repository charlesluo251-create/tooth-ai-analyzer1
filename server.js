const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const model = process.env.ARK_MODEL || 'doubao-seed-1-8-251228';

function extractTextFromResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textBlocks = [];

  for (const item of output) {
    if (!item || !Array.isArray(item.content)) continue;
    for (const block of item.content) {
      if (block?.type === 'output_text' && typeof block.text === 'string') {
        textBlocks.push(block.text);
      }
    }
  }

  return textBlocks.join('\n').trim();
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
}

async function handleAnalyze(req, res) {
  if (!process.env.ARK_API_KEY) {
    sendJson(res, 500, { error: 'Server API key is not configured.' });
    return;
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 10 * 1024 * 1024) {
      req.destroy();
    }
  });

  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}');
      const imageDataUrl = body?.imageDataUrl;

      if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        sendJson(res, 400, { error: 'Invalid image payload.' });
        return;
      }

      const prompt = [
        '请根据这张牙齿照片给出结构化分析，使用简体中文。',
        '请按以下格式回答：',
        '1) 观察到的问题（如果不确定请说明）',
        '2) 清洁和护理建议（可执行、日常化）',
        '3) 是否建议尽快就医，以及建议挂什么科',
        '4) 温馨提醒：你的回答不能替代专业诊断'
      ].join('\n');

      const arkResp = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ARK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_image', image_url: imageDataUrl },
                { type: 'input_text', text: prompt }
              ]
            }
          ]
        })
      });

      const data = await arkResp.json();
      if (!arkResp.ok) {
        sendJson(res, arkResp.status, { error: data?.error?.message || 'AI request failed.', details: data });
        return;
      }

      const result = extractTextFromResponse(data);
      if (!result) {
        sendJson(res, 502, { error: 'AI returned no readable text.', details: data });
        return;
      }

      sendJson(res, 200, { result });
    } catch (e) {
      sendJson(res, 500, { error: 'Server error while analyzing image.' });
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    return handleAnalyze(req, res);
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    return serveFile(res, path.join(__dirname, 'public', 'index.html'));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(port, () => {
  console.log(`Tooth analyzer running on http://localhost:${port}`);
});
