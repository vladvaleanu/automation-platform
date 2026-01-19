
import { ModuleValidator } from '../services/module-validator.service.js';
import * as fs from 'fs';
import * as path from 'path';

const manifestPath = path.join(process.cwd(), '../../modules/documentation-manager/manifest.json');

try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const result = ModuleValidator.parseAndValidate(content);

    if (result.validation.valid) {
        console.log('Manifest is VALID');
    } else {
        console.error('Manifest is INVALID');
        console.error(JSON.stringify(result.validation.errors, null, 2));
    }
} catch (error) {
    console.error('Error reading manifest:', error);
}
