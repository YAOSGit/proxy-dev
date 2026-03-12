import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { CACert, CertPaths } from '../types/Certificate/index.js';

const LEAF_VALIDITY_DAYS = 365;

const ensureLeavesDir = (leavesDir: string): void => {
    fs.mkdirSync(leavesDir, { recursive: true });
};

const leafExists = (domain: string, leavesDir: string): boolean => {
    const certPath = path.join(leavesDir, `${domain}.crt`);
    const keyPath = path.join(leavesDir, `${domain}.key`);
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return false;

    // Check if cert is still valid (not expired)
    try {
        const result = execFileSync('openssl', [
            'x509', '-noout', '-checkend', '86400', '-in', certPath,
        ], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    } catch {
        return false;
    }
};

const generateLeaf = (
    domain: string,
    ca: CACert,
    leavesDir: string,
): CertPaths => {
    // Validate domain to prevent OpenSSL subject injection
    if (!/^[a-zA-Z0-9._\-]+$/.test(domain)) {
        throw new Error('Invalid domain: must contain only alphanumeric characters, dots, hyphens, and underscores');
    }

    ensureLeavesDir(leavesDir);

    const keyPath = path.join(leavesDir, `${domain}.key`);
    const certPath = path.join(leavesDir, `${domain}.crt`);
    const csrPath = path.join(leavesDir, `${domain}.csr`);

    if (leafExists(domain, leavesDir)) {
        return { key: keyPath, cert: certPath };
    }

    // Generate private key
    try {
        execFileSync('openssl', ['genrsa', '-out', keyPath, '2048']);
    } catch (err) {
        throw new Error('Failed to generate leaf private key for ' + domain + ': ' + (err instanceof Error ? err.message : String(err)) + '\nEnsure openssl is installed and available on your PATH.');
    }
    fs.chmodSync(keyPath, 0o600);

    // Generate CSR
    try {
        execFileSync('openssl', [
            'req', '-new',
            '-key', keyPath,
            '-out', csrPath,
            '-subj', `/CN=${domain}`,
        ]);
    } catch (err) {
        // Clean up partial artifacts
        if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
        throw new Error('Failed to generate CSR for ' + domain + ': ' + (err instanceof Error ? err.message : String(err)) + '\nEnsure openssl is installed and available on your PATH.');
    }

    // Create temporary config file for Leaf
    const configPath = path.join(leavesDir, `${domain}.conf`);
    const configContent = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${domain}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = DNS:${domain}
`;
    fs.writeFileSync(configPath, configContent);

    // Sign with CA
    try {
        execFileSync('openssl', [
            'x509', '-req',
            '-in', csrPath,
            '-CA', ca.certPath,
            '-CAkey', ca.keyPath,
            '-CAcreateserial',
            '-out', certPath,
            '-days', String(LEAF_VALIDITY_DAYS),
            '-extfile', configPath,
            '-extensions', 'v3_req',
        ]);
    } catch (err) {
        // Clean up partial artifacts
        for (const f of [keyPath, csrPath, configPath]) {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        }
        throw new Error('Failed to sign leaf certificate for ' + domain + ': ' + (err instanceof Error ? err.message : String(err)) + '\nEnsure openssl is installed and available on your PATH.');
    }

    // Cleanup temp files
    for (const f of [csrPath, configPath]) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    return { key: keyPath, cert: certPath };
};

const ensureLeafCert = (domain: string, ca: CACert, leavesDir: string): CertPaths => {
    return generateLeaf(domain, ca, leavesDir);
};

export { generateLeaf, ensureLeafCert };
