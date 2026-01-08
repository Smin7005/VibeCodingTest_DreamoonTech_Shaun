import requests
import json
import base64

# ============================================================================
# 配置部分 - API 连接信息
# ============================================================================

# DMXAPI 的 URL 地址
url = "https://www.dmxapi.cn/v1/responses"

# API 密钥 - 用于身份验证和访问控制
api_key = "sk-****************************************"  # ⚠️ 请替换为你的API密钥

# ============================================================================
# 文件输入配置 - 二选一（不使用的设为空字符串）
# ============================================================================

# 要处理的文件路径或 URL
FILE_PATH = "1.pdf"  # 本地文件路径（优先使用，会转为 base64）
# FILE_URL = "https://example.com/document.pdf"  # 或使用在线文件 URL

# ============================================================================
# 辅助函数
# ============================================================================

def get_input_content() -> str:
    """根据配置获取 input 内容：本地文件转 base64，URL 直接返回"""
    if FILE_PATH:
        with open(FILE_PATH, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    elif FILE_URL:
        return FILE_URL
    else:
        raise ValueError("请设置 FILE_PATH 或 FILE_URL")

# ============================================================================
# 请求头配置 - 设置内容类型和授权信息
# ============================================================================

headers = {
    "Content-Type": "application/json",      # 指定请求体为 JSON 格式
    "Authorization": f"Bearer {api_key}",    # Bearer token 认证方式
}

# ============================================================================
# 请求参数配置 - AI 模型与输入内容
# ============================================================================

data = {
    "model": "hehe-tywd",
    "input": get_input_content(),

    # PDF 相关参数
    "pdf_pwd": "",              # PDF 密码 (如果 PDF 加密)
    "page_start": 0,            # 起始页码 (从 0 开始)
    "page_count": 1000,         # 解析页数 (最大 1000 页)

    # 解析模式参数
    "parse_mode": "scan",       # 解析模式: auto(综合模式) / scan(纯图片OCR模式)
    "dpi": 144,                 # PDF 转图片 DPI: 72 / 144 / 216

    # 输出格式参数
    "apply_document_tree": 1,   # 生成标题层级: 0(不生成) / 1(生成)
    "table_flavor": "html",     # 表格格式: md / html / none(不识别表格)
    "get_image": "none",        # 获取图片: none / page(整页) / objects(子图) / both
    "image_output_type": "default",  # 图片输出: default(URL/ID) / base64str
    "paratext_mode": "annotation",   # 非正文模式: none / annotation(注释) / body(正文)

    # 识别功能参数
    "formula_level": 0,         # 公式识别: 0(全识别) / 1(仅行间) / 2(不识别)
    "underline_level": 0,       # 下划线识别: 0(不识别) / 1(无文字下划线) / 2(全部)
    "apply_merge": 1,           # 段落/表格合并: 0(不合并) / 1(合并)
    "apply_image_analysis": 0,  # 大模型图像分析: 0(关闭) / 1(开启)
    "apply_chart": 0,           # 图表识别: 0(关闭) / 1(开启)

    # 图像处理参数
    "crop_dewarp": 0,           # 切边矫正: 0(关闭) / 1(开启)
    "remove_watermark": 0,      # 去水印: 0(关闭) / 1(开启)

    # 返回结果控制参数
    "markdown_details": 1,      # 返回 detail 字段: 0(不返回) / 1(返回)
    "page_details": 1,          # 返回 pages 字段: 0(不返回) / 1(返回)
    "raw_ocr": 0,               # 返回原始 OCR 结果: 0(不返回) / 1(返回)
    "char_details": 0,          # 返回字符位置信息: 0(不返回) / 1(返回)
    "catalog_details": 0,       # 返回目录信息: 0(不返回) / 1(返回)
    "get_excel": 0,             # 返回 Excel base64: 0(不返回) / 1(返回)
}

# ============================================================================
# 发送请求并处理非流式响应
# ============================================================================

# 发送 POST 请求到 API 服务器
response = requests.post(url, headers=headers, json=data)

# 处理非流式响应 - 格式化打印原始 JSON 数据
try:
    response_data = response.json()
    # 格式化打印: indent=2 使用2个空格缩进, ensure_ascii=False 保留中文字符
    print(json.dumps(response_data, indent=2, ensure_ascii=False))

except KeyboardInterrupt:
    print("\n\n⚠️ 用户中断了请求")

except json.JSONDecodeError as e:
    print(f"❌ JSON 解析错误: {e}")
    print(f"原始响应内容: {response.text}")

except Exception as e:
    print(f"❌ 发生错误: {e}")