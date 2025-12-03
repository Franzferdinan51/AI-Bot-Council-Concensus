import fs from 'fs/promises';
import path from 'path';
import { CouncilSession } from '../types/index.js';
import { sqliteStorage } from '../services/sqliteStorageService.js';

async function migrate() {
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');

    try {
        await fs.access(sessionsDir);
    } catch {
        console.log('No sessions directory found. Skipping migration.');
        return;
    }

    console.log(`Scanning ${sessionsDir} for sessions...`);
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

    console.log(`Found ${sessionFiles.length} sessions to migrate.`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const file of sessionFiles) {
        try {
            const filePath = path.join(sessionsDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const session = JSON.parse(data) as CouncilSession;

            console.log(`Migrating session ${session.id}...`);
            await sqliteStorage.saveSession(session);
            migratedCount++;
        } catch (error: any) {
            console.error(`Failed to migrate ${file}:`, error.message);
            errorCount++;
        }
    }

    console.log('Migration complete.');
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Failed: ${errorCount}`);

    // Close DB connection
    await sqliteStorage.shutdown();
}

migrate().catch(console.error);
