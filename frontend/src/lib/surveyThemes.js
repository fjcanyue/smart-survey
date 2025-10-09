import * as SurveyTheme from "survey-core/themes";

// 主题基础类型（不含 Light/Dark 后缀）
export const THEME_TYPES = [
  { id: "default", name: "默认" },
  { id: "borderless", name: "无边框" },
  { id: "flat", name: "扁平" },
  { id: "layered", name: "分层" },
  { id: "plain", name: "纯净" },
  { id: "sharp", name: "锐利" },
  { id: "solid", name: "实色" },
  { id: "contrast", name: "对比" }
];

// 获取主题对象（基于主题类型和模式）
export const getTheme = (themeType, mode = "light") => {
  const themeKey = `${themeType.charAt(0).toUpperCase() + themeType.slice(1)}${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  return SurveyTheme[themeKey];
};

// 所有可用的主题列表（包含 Light 和 Dark）
export const AVAILABLE_THEMES = [
  { id: "default-light", name: "默认 (浅色)", theme: SurveyTheme.DefaultLight },
  { id: "default-dark", name: "默认 (深色)", theme: SurveyTheme.DefaultDark },
  { id: "borderless-light", name: "无边框 (浅色)", theme: SurveyTheme.BorderlessLight },
  { id: "borderless-dark", name: "无边框 (深色)", theme: SurveyTheme.BorderlessDark },
  { id: "flat-light", name: "扁平 (浅色)", theme: SurveyTheme.FlatLight },
  { id: "flat-dark", name: "扁平 (深色)", theme: SurveyTheme.FlatDark },
  { id: "layered-light", name: "分层 (浅色)", theme: SurveyTheme.LayeredLight },
  { id: "layered-dark", name: "分层 (深色)", theme: SurveyTheme.LayeredDark },
  { id: "plain-light", name: "纯净 (浅色)", theme: SurveyTheme.PlainLight },
  { id: "plain-dark", name: "纯净 (深色)", theme: SurveyTheme.PlainDark },
  { id: "sharp-light", name: "锐利 (浅色)", theme: SurveyTheme.SharpLight },
  { id: "sharp-dark", name: "锐利 (深色)", theme: SurveyTheme.SharpDark },
  { id: "solid-light", name: "实色 (浅色)", theme: SurveyTheme.SolidLight },
  { id: "solid-dark", name: "实色 (深色)", theme: SurveyTheme.SolidDark },
  { id: "contrast-light", name: "对比 (浅色)", theme: SurveyTheme.ContrastLight },
  { id: "contrast-dark", name: "对比 (深色)", theme: SurveyTheme.ContrastDark }
];
