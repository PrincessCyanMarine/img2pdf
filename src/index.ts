import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
} from "fs";
import { parse, ParsedPath, resolve } from "path";
import PDFDocument from "pdfkit";
import { loadImage } from "canvas";

let exit = false;

if (!existsSync("output")) mkdirSync("output");
if (!existsSync("input")) {
  mkdirSync("input");
  exit = true;
}

if (exit) process.exit(0);

{
  let dir = readdirSync("input").map((f) => parse(`input/${f}`));
  clearDir(dir);
  for (let i in dir) {
    let path = dir[i];
    if (!path.ext)
      clearDir(
        readdirSync(`${path.dir}/${path.name}`).map((f) =>
          parse(`${path.dir}/${path.name}/${f}`)
        )
      );
  }
}

let dirs = readdirSync("input").map((f) => parse(`input/${f}`));

let loose = dirs.filter((f) => !!f.ext);

if (loose.length > 0) {
  console.log("Creating pdf from loose files");
  nextPage(createDocument(`output/output.pdf`), loose, 0);
}

function clearDir(dir: ParsedPath[]) {
  for (const i in dir) {
    let path = dir[i];
    if (!path.ext || ![".png", ".jpg"].includes(path.ext)) continue;
    renameSync(
      `${path.dir}/${path.name}${path.ext}`,
      `${path.dir}/${i.padStart(dir.length.toString().length, "0")}${path.ext}`
    );
  }
}

function createDocument(path: string) {
  const doc = new PDFDocument({ margin: 0, autoFirstPage: false });
  doc.pipe(createWriteStream(path));
  return doc;
}

async function nextDocument(e: number) {
  let name = dirs[e];
  if (!name) return;
  if (name.ext) {
    nextDocument(e + 1);
    return;
  }
  let size = dirs.filter((f) => !f.ext).length;
  console.log(`Creating pdf ${e + 1 - (dirs.length - size)}/${size}`);
  let dir = readdirSync(`${name.dir}/${name.name}`).map((f) =>
    parse(`${name.dir}/${name.name}/${f}`)
  );
  const doc = createDocument(`output/${name.name}.pdf`);

  nextPage(doc, dir, 0, e);
}
nextDocument(0);

async function nextPage(
  doc: PDFKit.PDFDocument,
  dir: ParsedPath[],
  i: number,
  e?: number
) {
  let end = () => {
    doc.end();
    if (typeof e === "number") nextDocument(e + 1);
    return;
  };
  try {
    let file = dir[i];
    if (!file) return end();
    if ([".jpg", ".png"].includes(file.ext)) {
      let path = `${resolve(file.dir)}\\${file.name}${file.ext}`;
      let image = await loadImage(path);
      let [width, height] = [image.width, image.height];

      doc.addPage({ size: [width, height], margin: 0 }).image(path, {
        fit: [width, height],
      });
    }
    nextPage(doc, dir, i + 1, e);
  } catch (err) {
    console.error("failed");
    end();
  }
}
