/**
 * Test Fixtures Factory - 保真度基准测试语料库
 *
 * 设计原则：
 * 1. 无损粘贴 - 所有测试用例模拟真实 Word 文档结构
 * 2. 覆盖核心语义 - 段落、表格、列表、图片、注释、修订
 * 3. 边界条件 - 空文档、超大表格、深度嵌套
 * 4. 跨语言 - 中英文混合、特殊字符
 */

import JSZip from "jszip";

// ==================== 类型定义 ====================

export interface FixtureConfig {
  name: string;
  description: string;
  category: "basic" | "table" | "list" | "image" | "annotation" | "revision" | "complex";
  expectedStats: {
    paragraphCount: number;
    tableCount?: number;
    imageCount?: number;
    listParagraphCount?: number;
  };
}

export interface DocxBuildOptions {
  documentXml: string;
  relsXml?: string;
  stylesXml?: string;
  numberingXml?: string;
  footnotesXml?: string;
  endnotesXml?: string;
  commentsXml?: string;
  mediaFiles?: Record<string, Uint8Array>;
  name?: string;
}

// ==================== 常量定义 ====================

const XML_HEADER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
const WORD_NS = `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"`;
const RELS_NS = `xmlns="http://schemas.openxmlformats.org/package/2006/relationships"`;

export const EMPTY_RELS = `${XML_HEADER}
<Relationships ${RELS_NS}></Relationships>`;

export const DEFAULT_STYLES = `${XML_HEADER}
<w:styles ${WORD_NS}>
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr><w:sz w:val="24"/></w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr><w:spacing w:after="200" w:line="276"/></w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:rPr><w:sz w:val="48"/><w:b/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:rPr><w:sz w:val="36"/><w:b/></w:rPr>
  </w:style>
</w:styles>`;

// ==================== 核心工厂函数 ====================

/**
 * 构建可解析的 DOCX File 对象
 */
export async function buildDocxFile(options: DocxBuildOptions): Promise<File> {
  const zip = new JSZip();

  // 必需文件
  zip.file("word/document.xml", options.documentXml);
  zip.file("word/_rels/document.xml.rels", options.relsXml ?? EMPTY_RELS);

  // 可选文件
  if (options.stylesXml) zip.file("word/styles.xml", options.stylesXml);
  if (options.numberingXml) zip.file("word/numbering.xml", options.numberingXml);
  if (options.footnotesXml) zip.file("word/footnotes.xml", options.footnotesXml);
  if (options.endnotesXml) zip.file("word/endnotes.xml", options.endnotesXml);
  if (options.commentsXml) zip.file("word/comments.xml", options.commentsXml);

  // 媒体文件
  for (const [path, bytes] of Object.entries(options.mediaFiles ?? {})) {
    zip.file(`word/${path}`, bytes);
  }

  const bytes = await zip.generateAsync({ type: "uint8array" });
  const start = bytes.byteOffset;
  const end = bytes.byteOffset + bytes.byteLength;

  return {
    name: options.name ?? "fixture.docx",
    arrayBuffer: async () => bytes.buffer.slice(start, end)
  } as unknown as File;
}

// ==================== 基础文档 Fixtures ====================

/**
 * 空文档 - 边界条件测试
 */
export async function createEmptyDocument(): Promise<File> {
  return buildDocxFile({
    name: "empty.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body></w:body>
      </w:document>`
  });
}

/**
 * 简单段落 - 基础文本提取
 */
export async function createSimpleParagraph(): Promise<File> {
  return buildDocxFile({
    name: "simple-paragraph.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p><w:r><w:t>Hello, World!</w:t></w:r></w:p>
        </w:body>
      </w:document>`
  });
}

/**
 * 多段落文档 - 段落结构测试
 */
export async function createMultiParagraphDocument(): Promise<File> {
  return buildDocxFile({
    name: "multi-paragraph.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Document Title</w:t></w:r></w:p>
          <w:p><w:r><w:t>First paragraph with some text content.</w:t></w:r></w:p>
          <w:p><w:r><w:t>Second paragraph with more content.</w:t></w:r></w:p>
          <w:p><w:r><w:t>Third paragraph to test multiple paragraphs.</w:t></w:r></w:p>
        </w:body>
      </w:document>`,
    stylesXml: DEFAULT_STYLES
  });
}

/**
 * 中英文混合 - 跨语言测试
 */
export async function createMixedLanguageDocument(): Promise<File> {
  return buildDocxFile({
    name: "mixed-language.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p><w:r><w:t>这是一段中文内容。</w:t></w:r></w:p>
          <w:p><w:r><w:t>This is English content with 中文 mixed.</w:t></w:r></w:p>
          <w:p><w:r><w:t>特殊字符测试：© ® ™ € ¥ £ → ← ↑ ↓ ✓ ✗</w:t></w:r></w:p>
          <w:p><w:r><w:t>数字和日期：2024-01-15, 3.14159, 1,000,000</w:t></w:r></w:p>
        </w:body>
      </w:document>`
  });
}

/**
 * 富文本格式 - 样式测试
 */
export async function createFormattedTextDocument(): Promise<File> {
  return buildDocxFile({
    name: "formatted-text.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Bold text</w:t></w:r>
            <w:r><w:t> and </w:t></w:r>
            <w:r><w:rPr><w:i/></w:rPr><w:t>italic text</w:t></w:r>
            <w:r><w:t> and </w:t></w:r>
            <w:r><w:rPr><w:u/></w:rPr><w:t>underlined text</w:t></w:r>
          </w:p>
          <w:p>
            <w:r><w:rPr><w:strike/></w:rPr><w:t>Strikethrough</w:t></w:r>
            <w:r><w:t> </w:t></w:r>
            <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Red text</w:t></w:r>
            <w:r><w:t> </w:t></w:r>
            <w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Highlighted</w:t></w:r>
          </w:p>
          <w:p>
            <w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>Super</w:t></w:r>
            <w:r><w:t> and </w:t></w:r>
            <w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>Sub</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`
  });
}

// ==================== 表格 Fixtures ====================

/**
 * 简单表格 - 基础表格结构
 */
export async function createSimpleTable(): Promise<File> {
  return buildDocxFile({
    name: "simple-table.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblBorders>
                <w:top w:val="single" w:sz="4"/>
                <w:bottom w:val="single" w:sz="4"/>
                <w:left w:val="single" w:sz="4"/>
                <w:right w:val="single" w:sz="4"/>
              </w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>C1</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>A2</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>B2</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>C2</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`
  });
}

/**
 * 合并单元格表格 - gridSpan/vMerge 测试
 */
export async function createMergedCellTable(): Promise<File> {
  return buildDocxFile({
    name: "merged-cell-table.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:tbl>
            <w:tblGrid>
              <w:gridCol w:w="2400"/>
              <w:gridCol w:w="2400"/>
              <w:gridCol w:w="2400"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr><w:gridSpan w:val="3"/></w:tcPr>
                <w:p><w:r><w:t>Header spanning 3 columns</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge w:val="restart"/></w:tcPr>
                <w:p><w:r><w:t>Row 1-2 Col 1</w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>B2</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>C2</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc>
                <w:tcPr><w:vMerge/></w:tcPr>
                <w:p><w:r><w:t></w:t></w:r></w:p>
              </w:tc>
              <w:tc><w:p><w:r><w:t>B3</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>C3</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`
  });
}

/**
 * 嵌套表格 - 表格内嵌套表格
 */
export async function createNestedTable(): Promise<File> {
  return buildDocxFile({
    name: "nested-table.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p><w:r><w:t>Outer cell</w:t></w:r></w:p>
                <w:tbl>
                  <w:tr>
                    <w:tc><w:p><w:r><w:t>Inner cell 1</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:r><w:t>Inner cell 2</w:t></w:r></w:p></w:tc>
                  </w:tr>
                </w:tbl>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`
  });
}

// ==================== 列表 Fixtures ====================

/**
 * 简单编号列表
 */
export async function createSimpleNumberedList(): Promise<File> {
  return buildDocxFile({
    name: "simple-numbered-list.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p>
            <w:pPr>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>First item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Second item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Third item</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`,
    numberingXml: `${XML_HEADER}
      <w:numbering ${WORD_NS}>
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1">
          <w:abstractNumId w:val="0"/>
        </w:num>
      </w:numbering>`
  });
}

/**
 * 多级编号列表 - 深度嵌套测试
 */
export async function createMultiLevelList(): Promise<File> {
  return buildDocxFile({
    name: "multi-level-list.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Level 1 - Item 1</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Level 2 - Item 1.1</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Level 2 - Item 1.2</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="2"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Level 3 - Item 1.2.1</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Level 1 - Item 2</w:t></w:r></w:p>
        </w:body>
      </w:document>`,
    numberingXml: `${XML_HEADER}
      <w:numbering ${WORD_NS}>
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1"/>
          </w:lvl>
          <w:lvl w:ilvl="1">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1.%2"/>
          </w:lvl>
          <w:lvl w:ilvl="2">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1.%2.%3"/>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1">
          <w:abstractNumId w:val="0"/>
        </w:num>
      </w:numbering>`
  });
}

// ==================== 批注与修订 Fixtures ====================

/**
 * 带批注的文档
 */
export async function createDocumentWithComments(): Promise<File> {
  return buildDocxFile({
    name: "with-comments.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p>
            <w:commentRangeStart w:id="0"/>
            <w:r><w:t>Text with comment</w:t></w:r>
            <w:commentRangeEnd w:id="0"/>
            <w:r><w:commentReference w:id="0"/></w:r>
          </w:p>
        </w:body>
      </w:document>`,
    commentsXml: `${XML_HEADER}
      <w:comments ${WORD_NS}>
        <w:comment w:id="0" w:author="Test User" w:date="2024-01-15T10:00:00Z">
          <w:p><w:r><w:t>This is a test comment</w:t></w:r></w:p>
        </w:comment>
      </w:comments>`
  });
}

/**
 * 带修订的文档
 */
export async function createDocumentWithRevisions(): Promise<File> {
  return buildDocxFile({
    name: "with-revisions.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p>
            <w:r><w:t>Normal text </w:t></w:r>
            <w:ins w:id="0" w:author="Author" w:date="2024-01-15T10:00:00Z">
              <w:r><w:t>Inserted text</w:t></w:r>
            </w:ins>
            <w:del w:id="1" w:author="Author" w:date="2024-01-15T10:00:00Z">
              <w:r><w:delText>Deleted text</w:delText></w:r>
            </w:del>
          </w:p>
        </w:body>
      </w:document>`
  });
}

/**
 * 带脚注的文档
 */
export async function createDocumentWithFootnotes(): Promise<File> {
  return buildDocxFile({
    name: "with-footnotes.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p>
            <w:r><w:t>Main text</w:t></w:r>
            <w:r><w:footnoteReference w:id="1"/></w:r>
            <w:r><w:t> continues.</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`,
    footnotesXml: `${XML_HEADER}
      <w:footnotes ${WORD_NS}>
        <w:footnote w:id="-1"><w:p><w:r><w:t>Separator</w:t></w:r></w:p></w:footnote>
        <w:footnote w:id="1">
          <w:p><w:r><w:t>Footnote content here</w:t></w:r></w:p>
        </w:footnote>
      </w:footnotes>`
  });
}

// ==================== 复杂文档 Fixtures ====================

/**
 * 合同模板 - 复杂真实文档
 */
export async function createContractDocument(): Promise<File> {
  return buildDocxFile({
    name: "contract-template.docx",
    documentXml: `${XML_HEADER}
      <w:document ${WORD_NS}>
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>合同编号：CONTRACT-2024-001</w:t></w:r></w:p>
          <w:p><w:r><w:t/></w:r></w:p>
          <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>甲方（委托方）</w:t></w:r></w:p>
          <w:p><w:r><w:t>公司名称：__________________</w:t></w:r></w:p>
          <w:p><w:r><w:t>地址：__________________</w:t></w:r></w:p>
          <w:p><w:r><w:t/></w:r></w:p>
          <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>乙方（受托方）</w:t></w:r></w:p>
          <w:p><w:r><w:t>公司名称：__________________</w:t></w:r></w:p>
          <w:p><w:r><w:t/></w:r></w:p>
          <w:tbl>
            <w:tblPr>
              <w:tblBorders>
                <w:top w:val="single" w:sz="4"/>
                <w:bottom w:val="single" w:sz="4"/>
                <w:left w:val="single" w:sz="4"/>
                <w:right w:val="single" w:sz="4"/>
                <w:insideH w:val="single" w:sz="4"/>
                <w:insideV w:val="single" w:sz="4"/>
              </w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>条款</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>内容</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>服务范围</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>软件开发及维护</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>合同金额</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>¥100,000.00</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
          <w:p><w:r><w:t/></w:r></w:p>
          <w:p><w:r><w:t>签署日期：2024年1月15日</w:t></w:r></w:p>
        </w:body>
      </w:document>`,
    stylesXml: DEFAULT_STYLES
  });
}

// ==================== Fixture 注册表 ====================

export const FIXTURE_REGISTRY: Record<string, { factory: () => Promise<File>; config: FixtureConfig }> = {
  "empty": {
    factory: createEmptyDocument,
    config: {
      name: "empty",
      description: "Empty document for boundary testing",
      category: "basic",
      expectedStats: { paragraphCount: 0 }
    }
  },
  "simple-paragraph": {
    factory: createSimpleParagraph,
    config: {
      name: "simple-paragraph",
      description: "Single paragraph with plain text",
      category: "basic",
      expectedStats: { paragraphCount: 1 }
    }
  },
  "multi-paragraph": {
    factory: createMultiParagraphDocument,
    config: {
      name: "multi-paragraph",
      description: "Multiple paragraphs with heading (h1 is not counted as p)",
      category: "basic",
      expectedStats: { paragraphCount: 3 }
    }
  },
  "mixed-language": {
    factory: createMixedLanguageDocument,
    config: {
      name: "mixed-language",
      description: "Chinese and English mixed content",
      category: "basic",
      expectedStats: { paragraphCount: 4 }
    }
  },
  "formatted-text": {
    factory: createFormattedTextDocument,
    config: {
      name: "formatted-text",
      description: "Rich text formatting (bold, italic, etc.)",
      category: "basic",
      expectedStats: { paragraphCount: 3 }
    }
  },
  "simple-table": {
    factory: createSimpleTable,
    config: {
      name: "simple-table",
      description: "Basic 2x3 table",
      category: "table",
      expectedStats: { paragraphCount: 6, tableCount: 1 }
    }
  },
  "merged-cell-table": {
    factory: createMergedCellTable,
    config: {
      name: "merged-cell-table",
      description: "Table with colspan and rowspan",
      category: "table",
      expectedStats: { paragraphCount: 6, tableCount: 1 }
    }
  },
  "nested-table": {
    factory: createNestedTable,
    config: {
      name: "nested-table",
      description: "Table inside table cell",
      category: "table",
      expectedStats: { paragraphCount: 3, tableCount: 2 }
    }
  },
  "simple-numbered-list": {
    factory: createSimpleNumberedList,
    config: {
      name: "simple-numbered-list",
      description: "Basic numbered list (1, 2, 3) - list markers added during rendering",
      category: "list",
      expectedStats: { paragraphCount: 3, listParagraphCount: 0 }
    }
  },
  "multi-level-list": {
    factory: createMultiLevelList,
    config: {
      name: "multi-level-list",
      description: "Multi-level nested list (1, 1.1, 1.1.1) - list markers added during rendering",
      category: "list",
      expectedStats: { paragraphCount: 5, listParagraphCount: 0 }
    }
  },
  "with-comments": {
    factory: createDocumentWithComments,
    config: {
      name: "with-comments",
      description: "Document with comments",
      category: "annotation",
      expectedStats: { paragraphCount: 1 }
    }
  },
  "with-revisions": {
    factory: createDocumentWithRevisions,
    config: {
      name: "with-revisions",
      description: "Document with track changes (ins/del)",
      category: "revision",
      expectedStats: { paragraphCount: 1 }
    }
  },
  "with-footnotes": {
    factory: createDocumentWithFootnotes,
    config: {
      name: "with-footnotes",
      description: "Document with footnotes",
      category: "annotation",
      expectedStats: { paragraphCount: 1 }
    }
  },
  "contract-template": {
    factory: createContractDocument,
    config: {
      name: "contract-template",
      description: "Complex contract document",
      category: "complex",
      expectedStats: { paragraphCount: 14, tableCount: 1 }
    }
  }
};

/**
 * 获取所有 fixture 名称
 */
export function getAllFixtureNames(): string[] {
  return Object.keys(FIXTURE_REGISTRY);
}

/**
 * 获取 fixture 并验证配置
 */
export async function getFixture(name: string): Promise<{ file: File; config: FixtureConfig }> {
  const entry = FIXTURE_REGISTRY[name];
  if (!entry) {
    throw new Error(`Unknown fixture: ${name}. Available: ${getAllFixtureNames().join(", ")}`);
  }
  const file = await entry.factory();
  return { file, config: entry.config };
}
