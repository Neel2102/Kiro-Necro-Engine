import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { scanRepository } from '../bonecore/scanner/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for scanning
app.post('/api/scan', async (req, res) => {
    try {
        const { repoPath, verbose = false } = req.body;
        
        if (!repoPath) {
            return res.status(400).json({ error: 'Repository path is required' });
        }

        // Run the scan
        const report = await scanRepository(repoPath);
        
        // Format the response
        const response = {
            success: true,
            report: {
                repository: report.repository,
                scannedAt: report.scannedAt,
                summary: report.summary || {
                    total: report.issues.length,
                    bySeverity: {
                        info: 0,
                        low: 0,
                        medium: 0,
                        high: 0,
                        critical: 0
                    }
                },
                issues: verbose ? report.issues : []
            }
        };

        // If no summary was provided, calculate it from issues
        if (!report.summary && report.issues) {
            report.issues.forEach(issue => {
                const severity = issue.severity?.toLowerCase() || 'info';
                if (response.report.summary.bySeverity[severity] !== undefined) {
                    response.report.summary.bySeverity[severity]++;
                }
            });
        }

        res.json(response);
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ 
            error: error.message || 'An error occurred during scanning',
            success: false
        });
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
