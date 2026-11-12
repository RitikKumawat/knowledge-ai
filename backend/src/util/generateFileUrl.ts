import { Request } from 'express';
import { join } from 'node:path';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { FileUpload } from 'graphql-upload-ts';

export async function generateFileUrl(
  req: Request,
  file: FileUpload,
  directoryName: string,
  replaceExisting: boolean = false,
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  const currentDate = Date.now();
  const newFilename = replaceExisting
    ? file.filename
    : `${currentDate}_${file.filename}`;
  const cleanDir = directoryName.replace(/^\/+|\/+$/g, '');
  const dirPath = cleanDir
    ? join(process.cwd(), 'uploads', cleanDir)
    : join(process.cwd(), 'uploads');

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  const filePath = join(dirPath, newFilename);
  await new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    file
      .createReadStream()
      .on('error', reject)
      .pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });

  const host = req.get('host');
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol =
    forwardedProto || (host?.includes('localhost') ? 'http' : 'https');
  const urlPath = cleanDir
    ? `/uploads/${cleanDir}/${newFilename}`
    : `/uploads/${newFilename}`;
  return `${protocol}://${host}${urlPath}`;
}
