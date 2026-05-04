import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function composeDocx(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((para) => new Paragraph({ children: [new TextRun(para)] }));

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}
