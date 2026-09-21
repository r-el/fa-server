import dotenv from "dotenv";
dotenv.config();

// MongoDB Configuration
export const mongoConfig = {
  uri: process.env.MONGODB_URI || "",
  dbName: process.env.MONGODB_DB_NAME || "face_identity",
  collections: {
    events: "Event",
    photoStorage: "Photo_storage",
  },
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

// Supabase Configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || "",
  key: process.env.SUPABASE_KEY || "",
};

export const qdrantConfig = {
  url: (process.env.QDRANT_URL || "http://127.0.0.1:6333").replace(/\/$/, ""),
};

// MinIO Configuration
export const minioConfig = {
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucketName: process.env.MINIO_BUCKET_NAME || 'face-identity-photos',
  region: process.env.MINIO_REGION || 'us-east-1'
};
