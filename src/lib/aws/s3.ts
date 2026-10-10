import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AWS_CONFIG, isAwsConfigured, getAwsClientConfig } from './config';

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client && isAwsConfigured()) {
    s3Client = new S3Client(getAwsClientConfig());
  }
  return s3Client;
}

const localS3Storage = new Map<string, { key: string; size: number; timestamp: string; data: any }>();

export async function uploadRouteSnapshot(routeId: string, data: Record<string, any>) {
  const key = `routes/${routeId}.json`;
  const body = JSON.stringify(data, null, 2);
  const size = Buffer.byteLength(body, 'utf-8');
  const timestamp = new Date().toISOString();

  localS3Storage.set(key, { key, size, timestamp, data });

  const client = getS3Client();
  if (!client) {
    return {
      success: true,
      mode: 'local',
      key,
      url: `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`,
      size,
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.s3.bucketName,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      Metadata: {
        'aqr-route-id': routeId,
        'aqr-created-at': timestamp,
      },
    });

    await client.send(command);
    return {
      success: true,
      mode: 'aws-s3',
      key,
      url: `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`,
      size,
    };
  } catch (err: any) {
    console.warn('[AWS S3] Upload fallback to local object store:', err.message);
    return {
      success: true,
      mode: 'fallback-local',
      key,
      url: `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`,
      size,
      error: err.message,
    };
  }
}

export function getLocalS3Objects() {
  return Array.from(localS3Storage.values()).slice(-10);
}
