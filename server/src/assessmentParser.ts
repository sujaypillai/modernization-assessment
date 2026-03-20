import fs from 'fs';
import path from 'path';

export interface ParsedAssessment {
  name: string;
  language: string;
  framework: string;
  langVer: string;
  frameworkVer: string;
  buildTools: string;
  totalStoryPoints: number;
  reportFilename: string;
}

function extractH1(html: string): string {
  const match = html.match(/<h1>([^<]+)<\/h1>/);
  return match ? match[1].trim() : 'Unknown';
}

function extractAppInfo(html: string): Record<string, string> {
  const info: Record<string, string> = {};
  const start = html.indexOf('Application Information');
  if (start === -1) return info;

  const end = html.indexOf('</table>', start);
  const section = html.substring(start, end);
  const regex = /<td style="font-weight:600">([^<]+)<\/td><td>([^<]+)<\/td>/g;
  let match;
  while ((match = regex.exec(section)) !== null) {
    info[match[1].trim()] = match[2].trim();
  }
  return info;
}

function extractCloudReadinessStoryPoints(html: string): number {
  const start = html.indexOf('Cloud Readiness Issues');
  if (start === -1) return 0;

  // Find the next <h2> after Cloud Readiness to bound the section
  let end = html.indexOf('<h2>', start + 1);
  if (end === -1) end = html.length;
  const section = html.substring(start, end);

  const points = section.match(
    /<td style="border:none;border-bottom:1px solid #e5e7eb;">(\d+)<\/td>/g
  );
  if (!points) return 0;

  return points.reduce((sum, td) => {
    const num = td.match(/>(\d+)<\/td>/);
    return sum + (num ? parseInt(num[1], 10) : 0);
  }, 0);
}

export function parseAssessmentHtml(filePath: string): ParsedAssessment | null {
  const html = fs.readFileSync(filePath, 'utf-8');

  // Validate that this looks like an assessment report
  if (!html.includes('Application Information') || !html.includes('Cloud Readiness Issues')) {
    return null;
  }

  const name = extractH1(html);
  const appInfo = extractAppInfo(html);
  const totalStoryPoints = extractCloudReadinessStoryPoints(html);

  return {
    name,
    language: appInfo['Language'] || '',
    framework: appInfo['Frameworks'] === 'N/A' ? '' : (appInfo['Frameworks'] || ''),
    langVer: appInfo['JDK version'] || appInfo['Runtime version'] || '',
    frameworkVer: appInfo['Framework version'] || '',
    buildTools: appInfo['Build tools'] || '',
    totalStoryPoints,
    reportFilename: path.basename(filePath)
  };
}

export function getAssessmentFiles(dataDir: string): string[] {
  const assessmentsDir = path.join(dataDir, 'assessments');
  if (!fs.existsSync(assessmentsDir)) return [];
  return fs.readdirSync(assessmentsDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(assessmentsDir, f));
}
