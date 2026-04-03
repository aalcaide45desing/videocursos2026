import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar variables de entorno
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function configureCors() {
  const { MEGA_S4_ACCESS_KEY, MEGA_S4_SECRET_KEY, MEGA_S4_ENDPOINT, MEGA_S4_BUCKET } = process.env;

  if (!MEGA_S4_ACCESS_KEY || !MEGA_S4_SECRET_KEY || !MEGA_S4_ENDPOINT || !MEGA_S4_BUCKET) {
    console.error("❌ Error: Faltan claves en tu archivo .env.local");
    console.log("Asegúrate de haber rellenado MEGA_S4_ACCESS_KEY, MEGA_S4_SECRET_KEY, MEGA_S4_ENDPOINT y MEGA_S4_BUCKET.");
    return;
  }

  const s3 = new S3Client({
    region: "us-east-1", // MEGA no usa regiones pero el SDK la pide
    endpoint: MEGA_S4_ENDPOINT,
    credentials: {
      accessKeyId: MEGA_S4_ACCESS_KEY,
      secretAccessKey: MEGA_S4_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  const corsRules = {
    Bucket: MEGA_S4_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: ["*"],
        },
      ],
    },
  };

  try {
    console.log(`⏳ Configurando CORS para el bucket: ${MEGA_S4_BUCKET}...`);
    await s3.send(new PutBucketCorsCommand(corsRules));
    console.log("✅ ¡ÉXITO! MEGA S4 ha sido configurado correctamente para tu academia.");
    console.log("Ya puedes probar el vídeo en la web.");
  } catch (error) {
    console.error("❌ Error al configurar MEGA:", error.message);
  }
}

configureCors();
