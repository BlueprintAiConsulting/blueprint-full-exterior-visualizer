/**
 * api/_utils.ts — Shared server-side utilities for Vercel serverless functions.
 * Prefix with _ so Vercel does NOT treat this as a route handler.
 */

import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

/** Single, shared Gemini AI client — key never leaves the server side. */
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** Resend email client — null if RESEND_API_KEY is not configured. */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** Wrap a promise with a timeout to prevent hung Gemini API calls. */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
        ms,
      ),
    ),
  ]);

/**
 * Server-side validation for image payloads before hitting Gemini.
 * Throws on invalid input so callers can return a 400/500 accordingly.
 */
export function validateImagePayload(base64: string, mime: string = '') {
  if (!base64) throw new Error('Missing imageBase64 payload');
  const rawBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  if (rawBase64.length < 100)
    throw new Error('imageBase64 payload is too small to be a valid image');

  let activeMime = mime;
  if (!activeMime && base64.startsWith('data:image/')) {
    activeMime = base64.substring(5, base64.indexOf(';'));
  }

  const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (activeMime && !validMimes.includes(activeMime.toLowerCase())) {
    throw new Error(
      `Invalid image MIME type: ${activeMime}. Must be jpeg, png, webp, or heic.`,
    );
  }

  const roughSizeBytes = rawBase64.length * 0.75;
  if (roughSizeBytes > 20 * 1024 * 1024)
    throw new Error('Image exceeds 20MB safety limit');
}
