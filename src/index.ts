import { createWriteStream, readdirSync } from "fs";
import { parse, resolve } from "path";
import PDFDocument from "pdfkit";
import { loadImage } from "canvas";

let dirs = readdirSync("input").map((f) => parse(`input/${f}`));

async function createDocument(e: number) {
  let name = dirs[e];
  if (!name) return;
  if (name.ext) {
    createDocument(e + 1);
    return;
  }
  let dir = readdirSync(`${name.dir}/${name.name}`).map((f) =>
    parse(`${name.dir}/${name.name}/${f}`)
  );
  const doc = new PDFDocument({ margin: 0, autoFirstPage: false });
  doc.pipe(createWriteStream(`output/${name.name}.pdf`));

  async function nextPage(i: number) {
    let file = dir[i];
    if (!file) {
      doc.end();
      createDocument(e + 1);
      return;
    }
    if ([".jpg", ".png"].includes(file.ext)) {
      let path = `${resolve(file.dir)}\\${file.name}${file.ext}`;
      let image = await loadImage(path);
      let [width, height] = [image.width, image.height];

      doc.addPage({ size: [width, height], margin: 0 }).image(path, {
        fit: [width, height],
      });
    }
    nextPage(i + 1);
  }
  nextPage(0);
}
createDocument(0);
