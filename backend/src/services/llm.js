/**
 * LLM API 服务模块
 * 支持多个 LLM 提供商: OpenAI, Google Gemini, Anthropic Claude
 */

// System Prompt for Survey Generation
const SURVEY_SYSTEM_PROMPT = `You are an expert in creating professional surveys. Your task is to generate a JSON object that strictly follows the SurveyJS JSON schema.

IMPORTANT REQUIREMENTS:
1. Do not output any text, explanation, or markdown formatting before or after the JSON object
2. The entire output must be a single, valid JSON object
3. Use Chinese for all text content (titles, descriptions, choices, etc.)
4. Include a variety of question types when appropriate: text, comment, radiogroup, checkbox, dropdown, rating, ranking
5. Ensure proper structure with pages array and elements array
6. Include proper validation rules when necessary
7. Use meaningful question names (e.g., "satisfaction", "feedback", "rating")

Example output structure:
{
  "title": "问卷标题",
  "description": "问卷描述",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "radiogroup",
          "name": "satisfaction",
          "title": "您对我们的服务满意度如何？",
          "choices": [
            { "value": "very_satisfied", "text": "非常满意" },
            { "value": "satisfied", "text": "满意" },
            { "value": "neutral", "text": "一般" },
            { "value": "dissatisfied", "text": "不满意" },
            { "value": "very_dissatisfied", "text": "非常不满意" }
          ],
          "isRequired": true
        }
      ]
    }
  ]
}`;

/**
 * OpenAI 兼容格式 API 调用（支持自定义 BASE_URL）
 * 兼容 OpenAI、DeepSeek、智谱、通义千问等使用 OpenAI 格式的厂商
 */
async function callOpenAI(prompt, apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-3.5-turbo') {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SURVEY_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI 兼容 API 调用失败: ${response.status} ${response.statusText} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Google Gemini API 调用
 */
async function callGemini(prompt, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SURVEY_SYSTEM_PROMPT + '\n\n' + prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API 调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * Anthropic Claude API 调用
 */
async function callClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      system: SURVEY_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API 调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * 主要的问卷生成函数
 * 根据环境变量中的配置选择合适的 LLM 提供商
 */
export async function generateSurveyFromPrompt(prompt, env) {
  // 检查可用的 API Keys
  const openaiKey = env.OPENAI_API_KEY;
  const openaiBaseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const openaiModel = env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const geminiKey = env.GEMINI_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY;

  let llmResponse;
  let provider;

  // 按优先级尝试不同的提供商
  try {
    if (openaiKey) {
      provider = `OpenAI (${openaiBaseUrl})`;
      console.log(`使用 OpenAI 兼容 API: ${openaiBaseUrl}, 模型: ${openaiModel}`);
      llmResponse = await callOpenAI(prompt, openaiKey, openaiBaseUrl, openaiModel);
    } else if (geminiKey) {
      provider = 'Gemini';
      llmResponse = await callGemini(prompt, geminiKey);
    } else if (claudeKey) {
      provider = 'Claude';
      llmResponse = await callClaude(prompt, claudeKey);
    } else {
      throw new Error('未配置任何 LLM API Key (需要 OPENAI_API_KEY, GEMINI_API_KEY 或 CLAUDE_API_KEY)');
    }

    // 尝试清理和解析 JSON（处理 markdown 代码块等格式）
    let cleanedResponse = llmResponse.trim();

    // 移除可能的 markdown 代码块标记
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    // 尝试解析 JSON
    const surveyJson = JSON.parse(cleanedResponse);

    // 基本验证
    if (!surveyJson.title || !surveyJson.pages || !Array.isArray(surveyJson.pages)) {
      throw new Error('生成的问卷 JSON 格式不正确');
    }

    console.log(`成功使用 ${provider} 生成问卷`);
    return surveyJson;

  } catch (error) {
    console.error(`LLM API 调用失败 (${provider}):`, error.message);

    // 如果当前提供商失败，尝试其他提供商
    if (provider && provider.startsWith('OpenAI') && (geminiKey || claudeKey)) {
      try {
        if (geminiKey) {
          provider = 'Gemini';
          llmResponse = await callGemini(prompt, geminiKey);
        } else {
          provider = 'Claude';
          llmResponse = await callClaude(prompt, claudeKey);
        }
        const surveyJson = JSON.parse(llmResponse);
        console.log(`备用提供商 ${provider} 生成问卷成功`);
        return surveyJson;
      } catch (backupError) {
        console.error(`备用提供商 ${provider} 也失败:`, backupError.message);
      }
    }

    // 如果所有提供商都失败，返回一个默认的问卷模板
    console.log('所有 LLM 提供商都失败，返回默认模板');
    return getFallbackSurvey(prompt);
  }
}

/**
 * 当 LLM 调用失败时的后备问卷模板
 */
function getFallbackSurvey(prompt) {
  return {
    title: "基于您的需求创建的问卷",
    description: `这是根据您的描述 "${prompt}" 创建的基础问卷模板。请根据需要进行修改。`,
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "radiogroup",
            name: "satisfaction",
            title: "总体满意度评价",
            choices: [
              { value: "5", text: "非常满意" },
              { value: "4", text: "满意" },
              { value: "3", text: "一般" },
              { value: "2", text: "不满意" },
              { value: "1", text: "非常不满意" }
            ],
            isRequired: true
          },
          {
            type: "comment",
            name: "feedback",
            title: "请提供您的详细反馈和建议",
            rows: 4
          },
          {
            type: "rating",
            name: "recommend",
            title: "您会向朋友推荐我们吗？",
            rateMin: 1,
            rateMax: 10,
            rateStep: 1,
            minRateDescription: "绝对不会",
            maxRateDescription: "肯定会推荐"
          }
        ]
      }
    ]
  };
}

/**
 * 验证生成的问卷 JSON 是否符合 SurveyJS 格式
 */
export function validateSurveyJson(surveyJson) {
  try {
    // 基本结构检查
    if (!surveyJson || typeof surveyJson !== 'object') {
      return { valid: false, error: '问卷数据不是有效的对象' };
    }

    if (!surveyJson.pages || !Array.isArray(surveyJson.pages)) {
      return { valid: false, error: '问卷必须包含 pages 数组' };
    }

    if (surveyJson.pages.length === 0) {
      return { valid: false, error: '问卷至少需要包含一个页面' };
    }

    // 检查每个页面
    for (const page of surveyJson.pages) {
      if (!page.elements || !Array.isArray(page.elements)) {
        return { valid: false, error: '每个页面必须包含 elements 数组' };
      }

      if (page.elements.length === 0) {
        return { valid: false, error: '每个页面至少需要包含一个问题' };
      }

      // 检查每个问题
      for (const element of page.elements) {
        if (!element.type || !element.name || !element.title) {
          return { valid: false, error: '每个问题必须包含 type, name, title 字段' };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `验证过程中发生错误: ${error.message}` };
  }
}