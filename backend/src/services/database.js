/**
 * 数据库操作服务模块
 * 基于 Cloudflare D1 数据库
 */

/**
 * 初始化数据库表
 */
export async function initializeDatabase(db) {
  try {
    // 创建 surveys 表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        title TEXT,
        json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_id TEXT
      )
    `).run();

    // 创建 results 表
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `).run();

    console.log('数据库表初始化成功');
    return { success: true };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 保存问卷
 */
export async function saveSurvey(db, surveyId, surveyJson, title = null) {
  try {
    // 从 JSON 中提取标题（如果没有提供）
    if (!title && surveyJson.title) {
      title = surveyJson.title;
    }

    const result = await db.prepare(`
      INSERT OR REPLACE INTO surveys (id, title, json, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(surveyId, title, JSON.stringify(surveyJson)).run();

    if (result.success) {
      console.log(`问卷保存成功，ID: ${surveyId}`);
      return { success: true, id: surveyId };
    } else {
      throw new Error('数据库保存操作失败');
    }
  } catch (error) {
    console.error('保存问卷失败:', error);
    throw error;
  }
}

/**
 * 获取问卷
 */
export async function getSurvey(db, surveyId) {
  try {
    const result = await db.prepare(`
      SELECT id, title, json, created_at, owner_id
      FROM surveys
      WHERE id = ?
    `).bind(surveyId).first();

    if (result) {
      return {
        id: result.id,
        title: result.title,
        json: JSON.parse(result.json),
        createdAt: result.created_at,
        ownerId: result.owner_id
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('获取问卷失败:', error);
    throw error;
  }
}

/**
 * 获取所有问卷列表（可选择性添加，用于管理页面）
 */
export async function listSurveys(db, limit = 50, offset = 0) {
  try {
    const results = await db.prepare(`
      SELECT id, title, created_at, owner_id
      FROM surveys
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return {
      surveys: results.results || [],
      total: results.results ? results.results.length : 0
    };
  } catch (error) {
    console.error('获取问卷列表失败:', error);
    throw error;
  }
}

/**
 * 保存问卷结果
 */
export async function saveResult(db, surveyId, resultData) {
  try {
    // 生成唯一的结果 ID
    const resultId = generateResultId();

    const result = await db.prepare(`
      INSERT INTO results (id, survey_id, data, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(resultId, surveyId, JSON.stringify(resultData)).run();

    if (result.success) {
      console.log(`问卷结果保存成功，ID: ${resultId}, Survey ID: ${surveyId}`);
      return { success: true, id: resultId };
    } else {
      throw new Error('数据库保存操作失败');
    }
  } catch (error) {
    console.error('保存问卷结果失败:', error);
    throw error;
  }
}

/**
 * 获取问卷的所有结果
 */
export async function getResults(db, surveyId, limit = 100, offset = 0) {
  try {
    const results = await db.prepare(`
      SELECT id, data, created_at
      FROM results
      WHERE survey_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(surveyId, limit, offset).all();

    if (results.results) {
      return results.results.map(result => ({
        id: result.id,
        data: JSON.parse(result.data),
        createdAt: result.created_at
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('获取问卷结果失败:', error);
    throw error;
  }
}

/**
 * 获取问卷结果统计信息
 */
export async function getResultStats(db, surveyId) {
  try {
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM results
      WHERE survey_id = ?
    `).bind(surveyId).first();

    const latestResult = await db.prepare(`
      SELECT created_at
      FROM results
      WHERE survey_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(surveyId).first();

    return {
      total: countResult?.total || 0,
      latestSubmission: latestResult?.created_at || null
    };
  } catch (error) {
    console.error('获取问卷统计失败:', error);
    throw error;
  }
}

/**
 * 删除问卷（可选）
 */
export async function deleteSurvey(db, surveyId) {
  try {
    // 首先删除相关的结果
    await db.prepare(`
      DELETE FROM results WHERE survey_id = ?
    `).bind(surveyId).run();

    // 然后删除问卷
    const result = await db.prepare(`
      DELETE FROM surveys WHERE id = ?
    `).bind(surveyId).run();

    if (result.success) {
      console.log(`问卷删除成功，ID: ${surveyId}`);
      return { success: true };
    } else {
      throw new Error('数据库删除操作失败');
    }
  } catch (error) {
    console.error('删除问卷失败:', error);
    throw error;
  }
}

/**
 * 生成唯一的结果 ID
 */
function generateResultId() {
  return 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 验证数据库连接
 */
export async function validateDatabase(db) {
  try {
    await db.prepare('SELECT 1').first();
    return true;
  } catch (error) {
    console.error('数据库连接验证失败:', error);
    return false;
  }
}