import 'dotenv/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  endpoint: process.env.MEGA_S4_ENDPOINT,
  region: process.env.MEGA_S4_REGION,
  credentials: {
    accessKeyId: process.env.MEGA_S4_ACCESS_KEY,
    secretAccessKey: process.env.MEGA_S4_SECRET_KEY,
  },
  forcePathStyle: true,
});

const bucket = process.env.MEGA_S4_BUCKET;
const key = 'curso-prueba/leccion-1/master.m3u8';

// Generar URL presignada
const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
const presignedUrl = await getSignedUrl(client, cmd, { expiresIn: 3600 });
process.stdout.write('PRESIGNED_URL=' + presignedUrl + '\n');

// Leer el contenido del m3u8
const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
const text = await response.Body.transformToString('utf-8');
process.stdout.write('M3U8_CONTENT_START\n' + text + '\nM3U8_CONTENT_END\n');
