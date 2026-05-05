import PDFDocument from 'pdfkit';

// TODO: Add Cyrillic support for EN→RU PDF output.
// PDFKit's default Helvetica is Latin-only and silently renders Cyrillic as
// missing glyphs. To support Russian output, bundle a Unicode TTF (e.g.
// DejaVuSans, Noto Sans, or PT Sans) under fonts/ and register it:
//
//   doc.registerFont('Body', new URL('../../fonts/DejaVuSans.ttf', import.meta.url));
//   doc.font('Body');
//
// Once that's in place, drop the `targetLang === 'ru' && outputFormat === 'pdf'`
// rejection in processor.js. For the MVP, that combination is refused upstream
// as a PermanentError, so this composer is only ever invoked for Latin output.

const FONT_SIZE = 11;
const LINE_GAP = 2;
const PARAGRAPH_GAP = 8;

export function composePdf(text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica').fontSize(FONT_SIZE);

    const paragraphs = text.split(/\n{2,}/);
    paragraphs.forEach((para, i) => {
      doc.text(para, { lineGap: LINE_GAP });
      if (i < paragraphs.length - 1) {
        doc.moveDown(PARAGRAPH_GAP / FONT_SIZE);
      }
    });

    doc.end();
  });
}
