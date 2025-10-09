import { generateSurveyFromPrompt, validateSurveyJson } from './services/llm.js';
import {
  initializeDatabase,
  saveSurvey,
  getSurvey,
  saveResult,
  getResults,
  validateDatabase
} from './services/database.js';

// Cloudflare Worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 初始化数据库（仅在需要时）
    if (env.DB) {
      try {
        await initializeDatabase(env.DB);
      } catch (error) {
        console.error('数据库初始化失败:', error);
        // 不阻塞请求，但记录错误
      }
    }

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // Route handling
    if (url.pathname === "/api/test") {
      return new Response(JSON.stringify({ message: "API is working" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // AI 生成问卷
    if (url.pathname === "/api/surveys/generate" && request.method === "POST") {
      return handleGenerateSurvey(request, env, ctx);
    }

    // 保存/更新问卷
    if (url.pathname === "/api/surveys" && request.method === "POST") {
      return handleSaveSurvey(request, env, ctx);
    }

    // 获取指定问卷
    if (url.pathname.startsWith("/api/surveys/") && request.method === "GET") {
      const surveyId = url.pathname.split("/")[3];
      return handleGetSurvey(request, env, ctx, surveyId);
    }

    // 提交问卷答案
    if (url.pathname.startsWith("/api/results/") && request.method === "POST") {
      const surveyId = url.pathname.split("/")[3];
      return handleSubmitResult(request, env, ctx, surveyId);
    }

    // 获取问卷答案
    if (url.pathname.startsWith("/api/results/") && request.method === "GET") {
      const surveyId = url.pathname.split("/")[3];
      return handleGetResults(request, env, ctx, surveyId);
    }

    return new Response("Smart Survey Backend is running!");
  }
};

function handleOptions(request) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function handleGenerateSurvey(request, env, ctx) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim() === '') {
      return new Response(JSON.stringify({ error: "缺少问卷描述" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 调用 LLM API 生成问卷
    console.log(`开始生成问卷，用户输入: ${prompt}`);
    const surveyJson = await generateSurveyFromPrompt(prompt, env);

    // 验证生成的问卷
    const validation = validateSurveyJson(surveyJson);
    if (!validation.valid) {
      console.error('生成的问卷验证失败:', validation.error);
      return new Response(JSON.stringify({ error: `生成的问卷格式不正确: ${validation.error}` }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 生成唯一的问卷 ID
    const surveyId = generateSurveyId();

    // 如果配置了数据库，自动保存生成的问卷
    if (env.DB) {
      try {
        await saveSurvey(env.DB, surveyId, surveyJson);
        console.log(`问卷已自动保存到数据库，ID: ${surveyId}`);
      } catch (dbError) {
        console.error('自动保存问卷到数据库失败:', dbError);
        // 不阻塞响应，只记录错误
      }
    }

    const response = {
      id: surveyId,
      json: surveyJson
    };

    console.log(`问卷生成成功，ID: ${surveyId}`);
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('生成问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "生成问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

// 生成唯一的问卷 ID
function generateSurveyId() {
  return 'survey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function handleSaveSurvey(request, env, ctx) {
  try {
    const { id, json } = await request.json();

    if (!id || !json) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID 或 JSON 数据" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 验证问卷 JSON 格式
    const validation = validateSurveyJson(json);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: `问卷 JSON 格式不正确: ${validation.error}`
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 保存问卷到数据库
    await saveSurvey(env.DB, id, json);

    return new Response(JSON.stringify({ success: true, id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('保存问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "保存问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

async function handleGetSurvey(request, env, ctx, surveyId) {
  try {
    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 从数据库获取问卷
    const survey = await getSurvey(env.DB, surveyId);

    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    return new Response(JSON.stringify({
      json: survey.json,
      title: survey.title,
      createdAt: survey.createdAt
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('获取问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "获取问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

async function handleSubmitResult(request, env, ctx, surveyId) {
  try {
    const { data } = await request.json();

    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: "缺少或无效的问卷答案数据" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 验证问卷是否存在
    const survey = await getSurvey(env.DB, surveyId);
    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    // 保存问卷结果到数据库
    const result = await saveResult(env.DB, surveyId, data);

    return new Response(JSON.stringify({
      success: true,
      resultId: result.id
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('提交问卷结果时发生错误:', error);
    return new Response(JSON.stringify({
      error: "提交问卷结果失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

async function handleGetResults(request, env, ctx, surveyId) {
  try {
    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 验证问卷是否存在
    const survey = await getSurvey(env.DB, surveyId);
    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    // 从 URL 查询参数获取分页信息
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // 从数据库获取问卷结果
    const results = await getResults(env.DB, surveyId, limit, offset);

    return new Response(JSON.stringify({
      results,
      surveyTitle: survey.title,
      total: results.length,
      limit,
      offset
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('获取问卷结果时发生错误:', error);
    return new Response(JSON.stringify({
      error: "获取问卷结果失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}