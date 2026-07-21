import { FileUpload } from 'graphql-upload-ts';

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeInBytes?: number;
}

export const validateFile = async (
  file: FileUpload,
  options: FileValidationOptions,
): Promise<void> => {
  const { allowedMimeTypes, maxSizeInBytes } = options;

  if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
    );
  }

  if (maxSizeInBytes) {
    let size = 0;
    const stream = file.createReadStream();

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxSizeInBytes) {
          stream.destroy();
          reject(
            new Error(
              `File size exceeds the maximum limit of ${
                maxSizeInBytes / (1024 * 1024)
              } MB`,
            ),
          );
        }
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
};
