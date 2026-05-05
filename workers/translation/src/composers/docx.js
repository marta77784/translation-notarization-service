import { Document, Packer, Paragraph, TextRun } from 'docx';

// TODO: Paragraphs render without visible spacing in Microsoft Word.
// Add `spacing: { after: 200 }` (twentieths of a point — ~10pt of trailing
// space) to each Paragraph so paragraph breaks are visually obvious:
//   new Paragraph({ children: [new TextRun(para)], spacing: { after: 200 } })

export async function composeDocx(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((para) => new Paragraph({ children: [new TextRun(para)] }));

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}
