import { Request } from 'express';
import { join } from 'node:path';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { FileUpload } from 'graphql-upload-ts';

export function generateFileUrl(
  req: Request,
  file: FileUpload,
  directoryName: string,
  replaceExisting: boolean = false,
): string {
  if (!file) {
    throw new Error('No file provided');
  }

  const currentDate = Date.now();
  const newFilename = replaceExisting
    ? file.filename
    : `${currentDate}_${file.filename}`;
  const dirPath = join(`./uploads/${directoryName}`);

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  file
    .createReadStream()
    .pipe(createWriteStream(`${dirPath}/${newFilename}`))
    .on('finish', () => {})
    .on('error', (error) => {
      console.error('File upload error:', error);
    });

  const host = req.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/uploads/${directoryName}/${newFilename}`;
}
