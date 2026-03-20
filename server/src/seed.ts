import { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getAssessmentFiles, parseAssessmentHtml } from './assessmentParser';

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      if (char === '"' && inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = !inQuotes;
        i++;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    return row;
  });
}

function getDataDir(): string {
  return process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..', '..', 'data');
}

function getSeedDir(): string {
  return path.join(__dirname, '..', 'data', 'seed');
}

export function seedDatabase(db: DatabaseType): void {
  const seedDir = getSeedDir();
  const appPropertiesFile = path.join(seedDir, 'AppProperties.csv');
  const modDriversFile = path.join(seedDir, 'ModernizationDrivers.csv');

  if (fs.existsSync(appPropertiesFile)) {
    const rows = parseCsv(appPropertiesFile);
    const insert = db.prepare(
      'INSERT INTO AppProperty (name, dataType, defaultValue) VALUES (?, ?, ?)'
    );
    for (const row of rows) {
      insert.run(row.name, row.type || 'VAR', row.defaultValue);
    }
    console.log(`Seeded ${rows.length} AppProperties from CSV`);
  }

  if (fs.existsSync(modDriversFile)) {
    const rows = parseCsv(modDriversFile);
    const insert = db.prepare(
      'INSERT INTO ModDriver (name, desc, score) VALUES (?, ?, ?)'
    );
    for (const row of rows) {
      insert.run(row.name, row.description, parseInt(row.score, 10) || 0);
    }
    console.log(`Seeded ${rows.length} ModDrivers from CSV`);
  }

  // Load applications: real assessments take priority over demo data
  loadApplications(db);
}

export function loadApplications(db: DatabaseType): { mode: string; count: number } {
  const dataDir = getDataDir();
  const assessmentFiles = getAssessmentFiles(dataDir);

  if (assessmentFiles.length > 0) {
    // Real assessments — upsert by reportFilename, preserving user data (drivers, include)
    const findByReport = db.prepare('SELECT id FROM Application WHERE reportFilename = ?');
    const findType = db.prepare(
      'SELECT id FROM AppType WHERE language = ? AND langVer = ? AND framework = ? AND frameworkVer = ?'
    );
    const insertType = db.prepare(
      'INSERT INTO AppType (language, langVer, framework, frameworkVer) VALUES (?, ?, ?, ?)'
    );
    const insert = db.prepare(
      'INSERT INTO Application (name, include, effort, target, reportFilename, typeId, properties) VALUES (?, 1, ?, ?, ?, ?, ?)'
    );
    const update = db.prepare(
      'UPDATE Application SET name = ?, effort = ?, typeId = ?, properties = ? WHERE reportFilename = ?'
    );

    // Remove any demo apps (those without a matching assessment file)
    const reportFilenames = assessmentFiles.map(f => path.basename(f));
    const existingApps = db.prepare('SELECT id, reportFilename FROM Application').all() as { id: number; reportFilename: string | null }[];
    for (const app of existingApps) {
      if (app.reportFilename && !reportFilenames.includes(app.reportFilename)) {
        // Check if it's a demo app (not from a real file) — remove it
        const filePath = path.join(dataDir, 'assessments', app.reportFilename);
        if (!fs.existsSync(filePath)) {
          db.prepare('DELETE FROM Application WHERE id = ?').run(app.id);
        }
      }
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    for (const file of assessmentFiles) {
      let parsed;
      try {
        parsed = parseAssessmentHtml(file);
      } catch (err) {
        console.warn(`Skipping ${path.basename(file)}: failed to parse (${err})`);
        skipped++;
        continue;
      }
      if (!parsed) {
        console.warn(`Skipping ${path.basename(file)}: not a valid assessment report`);
        skipped++;
        continue;
      }
      const properties: Record<string, unknown> = {};
      if (parsed.language) properties['Language'] = parsed.language;
      if (parsed.framework) properties['Framework'] = parsed.framework;
      if (parsed.langVer) properties['LanguageVersion'] = parsed.langVer;
      if (parsed.frameworkVer) properties['FrameworkVersion'] = parsed.frameworkVer;
      if (parsed.buildTools) properties['BuildTools'] = parsed.buildTools;
      properties['StoryPoints'] = parsed.totalStoryPoints;

      // Find or create AppType from assessment data
      let typeId: number | null = null;
      const lang = parsed.language || '';
      const langV = parsed.langVer || '';
      const fw = parsed.framework || '';
      const fwV = parsed.frameworkVer || '';
      if (lang || fw) {
        const existingType = findType.get(lang, langV, fw, fwV) as { id: number } | undefined;
        if (existingType) {
          typeId = existingType.id;
        } else {
          const typeResult = insertType.run(lang, langV, fw, fwV);
          typeId = Number(typeResult.lastInsertRowid);
        }
      }

      const existing = findByReport.get(parsed.reportFilename) as { id: number } | undefined;
      if (existing) {
        // Update extracted fields, keep drivers/include/target intact
        update.run(
          parsed.name,
          parsed.totalStoryPoints,
          typeId,
          JSON.stringify(properties),
          parsed.reportFilename
        );
        updated++;
      } else {
        insert.run(
          parsed.name,
          parsed.totalStoryPoints,
          'Unknown',
          parsed.reportFilename,
          typeId,
          JSON.stringify(properties)
        );
        added++;
      }
    }
    if (skipped > 0) {
      console.log(`Assessment refresh: ${skipped} file(s) skipped (not valid assessment reports)`);
    }
    console.log(`Assessment refresh: ${added} added, ${updated} updated`);
    return { mode: 'assessments', count: added + updated };
  } else {
    // No real assessments — replace with demo data
    db.prepare('DELETE FROM Application').run();

    const demoSeedDir = getSeedDir();
    const applicationsFile = path.join(demoSeedDir, 'DemoApplications.csv');
    if (fs.existsSync(applicationsFile)) {
      const rows = parseCsv(applicationsFile);
      const findType = db.prepare(
        'SELECT id FROM AppType WHERE language = ? AND langVer = ? AND framework = ? AND frameworkVer = ?'
      );
      const insertType = db.prepare(
        'INSERT INTO AppType (language, langVer, framework, frameworkVer) VALUES (?, ?, ?, ?)'
      );
      const insert = db.prepare(
        'INSERT INTO Application (name, include, effort, target, reportFilename, typeId, properties) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const row of rows) {
        let typeId: number | null = null;
        const lang = row.language || '';
        const langV = row.langVer || '';
        const fw = row.framework || '';
        const fwV = row.frameworkVer || '';
        if (lang || fw) {
          const existing = findType.get(lang, langV, fw, fwV) as { id: number } | undefined;
          if (existing) {
            typeId = existing.id;
          } else {
            typeId = Number(insertType.run(lang, langV, fw, fwV).lastInsertRowid);
          }
        }
        insert.run(
          row.name,
          parseInt(row.include, 10) || 0,
          parseInt(row.effort, 10) || 0,
          row.target,
          row.reportFilename,
          typeId,
          row.properties || '{}'
        );
      }
      console.log(`Loaded ${rows.length} demo applications from CSV`);
      return { mode: 'demo', count: rows.length };
    }
    return { mode: 'demo', count: 0 };
  }
}
