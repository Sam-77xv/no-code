/**
 * File utilities for ClipForge
 * Handles file operations, path management, and validation
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { existsSync, statSync } from 'fs';
import crypto from 'crypto';

/**
 * Ensure a directory exists, create if it doesn't
 * @param dirPath Path to the directory
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns true if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 * @param path Path to check
 * @returns true if path is a directory
 */
export function isDirectory(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 * @param path Path to check
 * @returns true if path is a file
 */
export function isFile(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param filePath Path to the file
 * @returns File size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Get file extension
 * @param filePath Path to the file
 * @returns File extension (lowercase, without dot)
 */
export function getFileExtension(filePath: string): string {
  const ext = extname(filePath);
  return ext.toLowerCase().replace(/^\./, '');
}

/**
 * Get file name without extension
 * @param filePath Path to the file
 * @returns File name without extension
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const base = basename(filePath);
  const ext = extname(filePath);
  return base.replace(new RegExp(`${ext}$`), '');
}

/**
 * Generate a unique filename with timestamp
 * @param prefix Optional prefix
 * @param extension File extension (without dot)
 * @returns Unique filename
 */
export function generateUniqueFilename(
  prefix: string = 'clipforge',
  extension: string = 'mp4'
): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Generate a temporary file path
 * @param dir Temporary directory
 * @param prefix Optional prefix
 * @param extension File extension
 * @returns Temporary file path
 */
export function generateTempFilePath(
  dir: string = '/tmp',
  prefix: string = 'clipforge',
  extension: string = 'tmp'
): string {
  return join(dir, generateUniqueFilename(prefix, extension));
}

/**
 * Read a file as text
 * @param filePath Path to the file
 * @returns File content as string
 */
export async function readFileText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write text to a file
 * @param filePath Path to the file
 * @param content Content to write
 */
export async function writeFileText(filePath: string, content: string): Promise<void> {
  await ensureDir(dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Read a file as JSON
 * @param filePath Path to the file
 * @returns Parsed JSON content
 */
export async function readFileJson<T = unknown>(filePath: string): Promise<T> {
  const content = await readFileText(filePath);
  return JSON.parse(content) as T;
}

/**
 * Write JSON to a file
 * @param filePath Path to the file
 * @param data Data to write
 * @param space Indentation spaces
 */
export async function writeFileJson<T>(
  filePath: string,
  data: T,
  space: number = 2
): Promise<void> {
  await ensureDir(dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, space), 'utf-8');
}

/**
 * Delete a file
 * @param filePath Path to the file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File might not exist, ignore error
  }
}

/**
 * Delete a directory and all its contents
 * @param dirPath Path to the directory
 */
export async function deleteDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Directory might not exist, ignore error
  }
}

/**
 * Copy a file
 * @param src Source file path
 * @param dest Destination file path
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest));
  await fs.copyFile(src, dest);
}

/**
 * Move a file
 * @param src Source file path
 * @param dest Destination file path
 */
export async function moveFile(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest));
  await fs.rename(src, dest);
}

/**
 * List files in a directory
 * @param dirPath Path to the directory
 * @param recursive Include subdirectories
 * @returns Array of file paths
 */
export async function listFiles(
  dirPath: string,
  recursive: boolean = false
): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isFile()) {
      files.push(fullPath);
    } else if (recursive && entry.isDirectory()) {
      const subFiles = await listFiles(fullPath, recursive);
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Get all files in a directory with a specific extension
 * @param dirPath Path to the directory
 * @param extension File extension (without dot)
 * @param recursive Include subdirectories
 * @returns Array of matching file paths
 */
export async function getFilesByExtension(
  dirPath: string,
  extension: string,
  recursive: boolean = false
): Promise<string[]> {
  const files = await listFiles(dirPath, recursive);
  const ext = extension.toLowerCase();
  return files.filter((file) => getFileExtension(file) === ext);
}

/**
 * Clean up a filename by removing invalid characters
 * @param filename Original filename
 * @returns Cleaned filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 255);
}

/**
 * Get the directory name from a path
 * @param path Path to extract directory from
 * @returns Directory name
 */
export function getDirName(path: string): string {
  return dirname(path);
}

/**
 * Join multiple path segments
 * @param segments Path segments to join
 * @returns Joined path
 */
export function joinPaths(...segments: string[]): string {
  return join(...segments);
}

/**
 * Check if a file is a video file based on extension
 * @param filePath Path to the file
 * @returns true if file is a video file
 */
export function isVideoFile(filePath: string): boolean {
  const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', '3gp'];
  const ext = getFileExtension(filePath);
  return videoExtensions.includes(ext);
}

/**
 * Check if a file is an image file based on extension
 * @param filePath Path to the file
 * @returns true if file is an image file
 */
export function isImageFile(filePath: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'];
  const ext = getFileExtension(filePath);
  return imageExtensions.includes(ext);
}

/**
 * Get file creation time
 * @param filePath Path to the file
 * @returns Creation time as Date
 */
export function getFileCreationTime(filePath: string): Date {
  try {
    const stats = statSync(filePath);
    return stats.birthtime;
  } catch {
    return new Date();
  }
}

/**
 * Get file modification time
 * @param filePath Path to the file
 * @returns Modification time as Date
 */
export function getFileModificationTime(filePath: string): Date {
  try {
    const stats = statSync(filePath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

/**
 * Calculate file age in milliseconds
 * @param filePath Path to the file
 * @returns Age in milliseconds
 */
export function getFileAge(filePath: string): number {
  const creationTime = getFileCreationTime(filePath);
  return Date.now() - creationTime.getTime();
}

/**
 * Check if a file is older than a certain age
 * @param filePath Path to the file
 * @param maxAge Maximum age in milliseconds
 * @returns true if file is older than maxAge
 */
export function isFileOlderThan(filePath: string, maxAge: number): boolean {
  return getFileAge(filePath) > maxAge;
}

/**
 * Create a symbolic link
 * @param target Target path
 * @param path Link path
 */
export async function createSymlink(target: string, path: string): Promise<void> {
  await ensureDir(dirname(path));
  await fs.symlink(target, path);
}

/**
 * Check if a path is a symbolic link
 * @param path Path to check
 * @returns true if path is a symbolic link
 */
export function isSymlink(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Read a symbolic link
 * @param path Path to the symbolic link
 * @returns Target path
 */
export async function readSymlink(path: string): Promise<string> {
  return fs.readlink(path);
}
