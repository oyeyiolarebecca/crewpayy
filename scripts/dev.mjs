import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];

const isHealthy = async (url) => {
    try {
        const response = await fetch(url);
        return response.ok;
    } catch {
        return false;
    }
};

const start = (script) => {
    const child = spawn(npmCommand, ['run', script], { stdio: 'inherit' });
    children.push(child);
    return child;
};

const clearOrphanedClient = async () => {
    if (await isHealthy('http://localhost:3000/')) return;

    try {
        const processes = execFileSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8' })
            .split('\n')
            .filter((line) => line.includes('crewpayy/node_modules/.bin/vite'));
        for (const line of processes) {
            const match = line.trim().match(/^(\d+)\s+/);
            if (match) process.kill(Number(match[1]), 'SIGTERM');
        }
    } catch {
        // Let Vite report a clear port error when process inspection is unavailable.
    }
};

const main = async () => {
    if (await isHealthy('http://localhost:5000/api/health')) {
        console.log('CrewPay API already running on http://localhost:5000');
    } else {
        start('server');
    }

    await clearOrphanedClient();
    if (await isHealthy('http://localhost:3000/')) {
        console.log('CrewPay client already running on http://localhost:3000');
    } else {
        start('dev:client');
    }
};

let shuttingDown = false;
const shutdown = (signal = 'SIGTERM') => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) child.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((error) => {
    console.error('Unable to start CrewPay development services:', error);
    shutdown();
    process.exitCode = 1;
});

setInterval(() => { }, 60_000);