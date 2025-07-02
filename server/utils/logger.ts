export const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, err?: unknown) => {
    console.error(`[ERROR] ${message}`);
    if (err) console.error(err);
  },
};
