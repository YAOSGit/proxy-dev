import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CACert } from '../types/Certificate/index.js';

const CA_KEY_FILENAME = 'ca.key';
const CA_CERT_FILENAME = 'ca.crt';
const CA_VALIDITY_DAYS = 3650; // 10 years

const generateCA = (certsDir: string): CACert => {
    fs.mkdirSync(certsDir, { recursive: true });

    const keyPath = path.join(certsDir, CA_KEY_FILENAME);
    const certPath = path.join(certsDir, CA_CERT_FILENAME);

    // Generate private key
    try {
        execFileSync('openssl', [
            'genrsa',
            '-out', keyPath,
            '2048',
        ]);
    } catch (err) {
        throw new Error('Failed to generate CA private key: ' + (err instanceof Error ? err.message : String(err)) + '\nEnsure openssl is installed and available on your PATH.');
    }
    fs.chmodSync(keyPath, 0o600);

    // Create temporary config file for CA
    const configPath = path.join(certsDir, 'ca.conf');
    const configContent = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
CN = proxy-dev CA
O = proxy-dev
C = US

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
`;
    fs.writeFileSync(configPath, configContent);

    // Generate self-signed CA certificate
    try {
        execFileSync('openssl', [
            'req',
            '-new',
            '-x509',
            '-key', keyPath,
            '-out', certPath,
            '-days', String(CA_VALIDITY_DAYS),
            '-config', configPath,
        ]);
    } catch (err) {
        // Clean up the key file since cert generation failed
        if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
        throw new Error('Failed to generate CA certificate: ' + (err instanceof Error ? err.message : String(err)) + '\nEnsure openssl is installed and available on your PATH.');
    }

    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);

    return { keyPath, certPath };
};

const loadCA = (certsDir: string): CACert | null => {
    const keyPath = path.join(certsDir, CA_KEY_FILENAME);
    const certPath = path.join(certsDir, CA_CERT_FILENAME);

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        return null;
    }

    return { keyPath, certPath };
};

export { generateCA, loadCA };
