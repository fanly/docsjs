export interface DocxHtmlBaselineCase {
  name: string;
  documentXml: string;
  expects: string[];
}

export const DOCX_HTML_BASELINES: DocxHtmlBaselineCase[] = [
  {
    name: "paragraph-basic",
    documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body><w:p><w:r><w:t>Hello</w:t></w:r></w:p></w:body>
    </w:document>`,
    expects: ["<p", ">Hello</p>"]
  },
  {
    name: "heading-map",
    documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>H2</w:t></w:r></w:p></w:body>
    </w:document>`,
    expects: ["<h2", ">H2</h2>"]
  },
  {
    name: "table-basic",
    documentXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body>
    </w:document>`,
    expects: ["<table", ">A<"]
  }
];
